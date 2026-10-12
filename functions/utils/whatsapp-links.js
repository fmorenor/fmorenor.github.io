// Lógica compartida de la carga de archivos desde WhatsApp (Twilio Studio).
// La usan functions/api/wa/{link,session,upload}.js. X-Ray web NO la usa.
//
// Modelo de datos en KV (binding WA_LINKS):
//   wa:tok:<sha256(token)>  → enlace temporal. Guardamos el HASH del token, no el
//                             token: quien lea el KV no puede reconstruir enlaces.
//                             Caduca solo (expiration absoluta).
//   wa:lead:<+telefono>     → { lead_uuid, lead_id } del lead en CartoFlow. Sin
//                             caducidad: es lo que hace que cada número tenga UN
//                             solo lead aunque Studio genere varios enlaces.
//
// El número de teléfono sale SIEMPRE del registro del servidor, nunca de lo que
// mande el navegador: la página solo conoce el token.

export const CARTOFLOW_LEAD_URL =
  "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/submit-landing-lead";
export const CARTOFLOW_UPLOAD_URL =
  "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/upload-lead-file";

export const MAX_BYTES = 20 * 1024 * 1024;
export const ALLOWED_EXT = ["kml", "kmz", "shp", "zip"];
export const MAX_UPLOADS_PER_LINK = 20;
const DEFAULT_TTL_HOURS = 24;

// ── Utilidades ───────────────────────────────────────────────────────────
export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

// "whatsapp:+52 1 33 1234 5678" → "+5213312345678". null si no parece teléfono.
export function normalizePhone(raw) {
  const s = String(raw || "").replace(/^whatsapp:/i, "").trim();
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return "+" + digits;
}

// Solo como referencia visual: "+52 ••• ••• 5678".
export function maskPhone(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 6) return "••••";
  const cc = d.length > 10 ? d.slice(0, d.length - 10) : "";
  return (cc ? "+" + cc + " " : "") + "••• ••• " + d.slice(-4);
}

export function ttlHours(env) {
  const h = parseInt(env.WA_LINK_TTL_HOURS || "", 10);
  return h > 0 && h <= 24 * 30 ? h : DEFAULT_TTL_HOURS;
}

export function newToken() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Comparación en tiempo constante para el secreto de Studio.
export function safeEqual(a, b) {
  const x = new TextEncoder().encode(String(a || ""));
  const y = new TextEncoder().encode(String(b || ""));
  if (x.length !== y.length || x.length === 0) return false;
  let r = 0;
  for (let i = 0; i < x.length; i++) r |= x[i] ^ y[i];
  return r === 0;
}

// ── Registro del enlace ──────────────────────────────────────────────────
const tokKey = async (token) => "wa:tok:" + (await sha256(token));
const leadKey = (phone) => "wa:lead:" + phone;

export async function saveLink(env, token, record) {
  await env.WA_LINKS.put(await tokKey(token), JSON.stringify(record), {
    expiration: Math.floor(record.expires_at / 1000),
  });
}

// Devuelve el registro vigente o null (inexistente, caducado o token malformado).
export async function loadLink(env, token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  const raw = await env.WA_LINKS.get(await tokKey(token));
  if (!raw) return null;
  let rec;
  try { rec = JSON.parse(raw); } catch (_) { return null; }
  if (!rec || !rec.phone || Date.now() > rec.expires_at) return null;
  return rec;
}

// ── Lead en CartoFlow ────────────────────────────────────────────────────
export async function getStoredLead(env, phone) {
  const raw = await env.WA_LINKS.get(leadKey(phone));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && v.lead_uuid ? v : null;
  } catch (_) {
    return null;
  }
}

export async function storeLead(env, phone, lead) {
  await env.WA_LINKS.put(
    leadKey(phone),
    JSON.stringify({ lead_uuid: lead.lead_uuid, lead_id: lead.lead_id || null, created_at: Date.now() })
  );
}

// Crea el lead con los datos que Studio ya recopiló. Mismo endpoint y payload
// que submitLead() en functions/api/chat.js (duplicado a propósito: X-Ray no
// debe cambiar por esto).
async function createLead(env, phone, contact) {
  if (!env.CARTOFLOW_PROJECT_ID) return { ok: false, error: "falta CARTOFLOW_PROJECT_ID" };
  const name = (contact.name || "").trim() || "Contacto WhatsApp " + phone.slice(-4);
  const project = (contact.project || "").trim();
  const base = {
    project_id: env.CARTOFLOW_PROJECT_ID,
    name,
    institution: (contact.company || "").trim() || name,
    type: "Empresa",
    contact_name: name,
    contact_email: (contact.email || "").trim(),
    contact_phone: phone,
    problem_statement: "[WhatsApp] " + (project || "Proyecto por definir (llegó por WhatsApp)."),
    urgency: "Medium",
  };
  Object.keys(base).forEach((k) => base[k] === "" && delete base[k]);

  // No sabemos si CartoFlow acepta "WhatsApp" como source; si lo rechaza por
  // validación (4xx) reintentamos con "Web", que es el valor que ya usa X-Ray.
  // El origen queda igualmente marcado con "[WhatsApp]" en problem_statement.
  const sources = [...new Set([env.WA_LEAD_SOURCE || "WhatsApp", "Web"])];
  let last = "";
  for (const source of sources) {
    try {
      const r = await fetch(CARTOFLOW_LEAD_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...base, source }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.success) {
        const l = (data.leads && data.leads[0]) || {};
        if (l.id) return { ok: true, lead_uuid: l.id, lead_id: l.lead_id || null };
        return { ok: false, error: "CartoFlow no devolvió el id del lead" };
      }
      last = data.error || "HTTP " + r.status;
      if (r.status < 400 || r.status >= 500) break; // solo reintenta errores de validación
    } catch (e) {
      last = "error de red";
      break;
    }
  }
  return { ok: false, error: last };
}

// Busca el lead del número; si no existe lo crea UNA vez y lo guarda.
// Devuelve { ok, lead_uuid, lead_id, status: "existing" | "created" } o { ok:false, error }.
export async function ensureLead(env, phone, contact) {
  const found = await getStoredLead(env, phone);
  if (found) return { ok: true, lead_uuid: found.lead_uuid, lead_id: found.lead_id, status: "existing" };
  const c = await createLead(env, phone, contact || {});
  if (!c.ok) return c;
  await storeLead(env, phone, c);
  return { ok: true, lead_uuid: c.lead_uuid, lead_id: c.lead_id, status: "created" };
}

// ── Validación de archivos ───────────────────────────────────────────────
// La extensión sola se falsifica renombrando; miramos también la firma del
// archivo para que no se cuele, p. ej., un .html renombrado a .kml.
export async function checkFile(file) {
  if (!file || typeof file === "string") return "archivo_faltante";
  const name = String(file.name || "");
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return "tipo_no_permitido";
  if (!file.size) return "archivo_vacio";
  if (file.size > MAX_BYTES) return "archivo_muy_grande";

  const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
  if (ext === "zip" || ext === "kmz") {
    // Local file header de ZIP: PK\x03\x04
    if (!(head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04)) return "contenido_no_valido";
  } else if (ext === "shp") {
    // Cabecera ESRI Shapefile: file code 9994 big-endian.
    if (!(head[0] === 0x00 && head[1] === 0x00 && head[2] === 0x27 && head[3] === 0x0a)) return "contenido_no_valido";
  } else if (ext === "kml") {
    // XML cuya raíz sea <kml> (la etiqueta debe aparecer en los primeros 4 KB).
    const txt = new TextDecoder().decode(head).replace(/^﻿/, "").trimStart().toLowerCase();
    const isXml = txt.startsWith("<?xml") || txt.startsWith("<kml");
    if (!isXml || !txt.includes("<kml")) return "contenido_no_valido";
  }
  return null;
}

// Ventana fija por IP sobre KV (RATE_LIMIT), igual que chat.js/upload.js:
// conteo aproximado y fail open si falta el binding.
export async function checkRateLimit(env, request, windows) {
  if (!env.RATE_LIMIT) return { ok: true, skipped: true };
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return { ok: true, skipped: true };
  const now = Date.now();
  try {
    for (const w of windows) {
      const key = `rl:${ip}:${w.label}:${Math.floor(now / w.ms)}`;
      const count = parseInt((await env.RATE_LIMIT.get(key)) || "0", 10) || 0;
      if (count >= w.max) return { ok: false, window: w.label };
      await env.RATE_LIMIT.put(key, String(count + 1), {
        expirationTtl: Math.max(60, Math.ceil((w.ms / 1000) * 2)),
      });
    }
  } catch (e) {
    return { ok: true, skipped: true };
  }
  return { ok: true };
}
