// POST /api/wa/link — lo llama Twilio Studio (widget "Make HTTP Request").
// Genera un enlace único y temporal a /whatsapp-archivos vinculado al número de
// WhatsApp del contacto, y deja listo su lead en CartoFlow.
//
// Autenticación: secreto compartido WA_LINK_SECRET, en el campo "secret" del
// cuerpo (Studio lo envía como parámetro) o en "Authorization: Bearer <secreto>".
//
// Cuerpo (form-urlencoded o JSON):
//   secret   (obligatorio)
//   phone    (obligatorio) → {{trigger.message.From}}, p. ej. "whatsapp:+5213312345678"
//   name, company, email, project  (opcionales; se usan si hay que crear el lead)
//   lead_uuid (opcional) → si Studio ya creó el lead por otro camino
//
// Respuesta: { ok, url, expires_at, expires_in_hours, lead_status, lead_id }
//   lead_status: "existing" | "created" | "pending" (CartoFlow no respondió;
//   el lead se crea al subir el primer archivo con estos mismos datos).

import {
  json, normalizePhone, ttlHours, newToken, safeEqual, saveLink,
  getStoredLead, storeLead, ensureLead,
} from "../../utils/whatsapp-links.js";

export async function onRequestPost({ request, env }) {
  try {
    if (!env.WA_LINK_SECRET || !env.WA_LINKS) return json({ ok: false, error: "config_incompleta" }, 500);

    const body = await readBody(request);
    const auth = request.headers.get("authorization") || "";
    const given = auth.startsWith("Bearer ") ? auth.slice(7) : body.secret;
    if (!safeEqual(given, env.WA_LINK_SECRET)) return json({ ok: false, error: "no_autorizado" }, 401);

    const phone = normalizePhone(body.phone);
    if (!phone) return json({ ok: false, error: "telefono_invalido" }, 400);

    const contact = {
      name: clip(body.name, 120),
      company: clip(body.company, 160),
      email: clip(body.email, 160),
      project: clip(body.project, 2000),
    };

    // Lead: el que ya tengamos para este número; si Studio nos pasa uno y no
    // teníamos ninguno, adoptamos el suyo; si no, lo creamos ahora.
    let lead = null;
    let leadStatus = "pending";
    const studioLead = clip(body.lead_uuid, 64);
    if (studioLead && !(await getStoredLead(env, phone))) {
      await storeLead(env, phone, { lead_uuid: studioLead, lead_id: clip(body.lead_id, 64) || null });
    }
    const r = await ensureLead(env, phone, contact);
    if (r.ok) {
      lead = { lead_uuid: r.lead_uuid, lead_id: r.lead_id };
      leadStatus = r.status;
    }
    // Si CartoFlow falló, igual entregamos el enlace: el lead se crea en la
    // primera subida con los datos guardados en el registro.

    const now = Date.now();
    const hours = ttlHours(env);
    const token = newToken();
    await saveLink(env, token, {
      phone,
      contact,
      lead_uuid: lead ? lead.lead_uuid : null,
      lead_id: lead ? lead.lead_id : null,
      files: [],
      created_at: now,
      expires_at: now + hours * 3600 * 1000,
    });

    const base = (env.WA_PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/+$/, "");
    return json({
      ok: true,
      url: base + "/whatsapp-archivos#t=" + token,
      expires_at: new Date(now + hours * 3600 * 1000).toISOString(),
      expires_in_hours: hours,
      lead_status: leadStatus,
      lead_id: lead ? lead.lead_id : null,
    });
  } catch (e) {
    return json({ ok: false, error: "server_error" }, 500);
  }
}

async function readBody(request) {
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  try {
    if (ct.includes("application/json")) return (await request.json()) || {};
    if (ct.includes("form")) return Object.fromEntries((await request.formData()).entries());
  } catch (_) {}
  return {};
}

function clip(v, n) {
  return typeof v === "string" ? v.trim().slice(0, n) : "";
}
