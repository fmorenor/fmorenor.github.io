// Cloudflare Pages Function — sube archivos del chat X-Ray al lead en CartoFlow.
// Proxy seguro: el navegador manda el archivo; aquí añadimos el secreto compartido
// y el project_id, y reenviamos a la edge function upload-lead-file de Supabase.
//
// Variables de entorno (Cloudflare Pages → Settings → Environment variables):
//   SOCIAL_WEBHOOK_SECRET  (secret compartido, encriptado)
//   CARTOFLOW_PROJECT_ID   (uuid del proyecto destino)

const UPLOAD_URL =
  "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/upload-lead-file";
const MAX_BYTES = 20 * 1024 * 1024; // el endpoint rechaza > 20 MB

// Debe coincidir con ALLOWED_EXT de xray.html. Allí la comprobación es solo
// para dar feedback al usuario; la de verdad es esta, porque la del navegador
// se salta con un curl. Si se añade un tipo allí, añadirlo también aquí.
const ALLOWED_EXT = [
  "kml", "kmz", "shp", "zip", "geojson", "json",
  "dwg", "dxf", "pdf", "png", "jpg", "jpeg", "tif", "tiff", "csv",
];

// Subidas por IP. Más restrictivo que el chat: subir es caro en almacenamiento
// y nadie adjunta 30 archivos de forma legítima en una conversación.
const RATE_WINDOWS = [
  { label: "um", ms: 60 * 1000, max: 5 },
  { label: "uh", ms: 60 * 60 * 1000, max: 30 },
];

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SOCIAL_WEBHOOK_SECRET || !env.CARTOFLOW_PROJECT_ID) {
      return json({ success: false, error: "config_incompleta" }, 500);
    }
    if (!env.TURNSTILE_SECRET_KEY) {
      return json({ success: false, error: "config_incompleta" }, 500);
    }

    const form = await request.formData();
    const file = form.get("file");
    const leadId = form.get("lead_id");

    // Este endpoint estaba completamente abierto mientras /api/chat sí exigía
    // Turnstile. Conseguir un lead_id válido es trivial (basta con completar
    // una conversación con datos inventados), así que sin esto cualquiera
    // podía subir archivos de 20 MB sin límite.
    const verificado = await verifyTurnstile(env, request, form.get("turnstile_token"));
    if (!verificado) {
      return json({ success: false, error: "verificacion_fallida" }, 403);
    }

    const rl = await checkRateLimit(env, request);
    if (!rl.ok) return json({ success: false, error: "demasiadas_subidas" }, 429);

    if (!file || typeof file === "string") return json({ success: false, error: "archivo_faltante" }, 400);
    if (!leadId) return json({ success: false, error: "lead_id_faltante" }, 400);
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return json({ success: false, error: "archivo_muy_grande" }, 400);
    }

    // Validación de tipo en servidor. Sin esto se podía subir .html o .svg, que
    // servidos luego por URL firmada son XSS almacenado en el dominio de storage.
    const nombre = String(file.name || "");
    const ext = (nombre.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return json({ success: false, error: "tipo_no_permitido" }, 400);
    }

    const out = new FormData();
    out.append("lead_id", String(leadId));
    out.append("project_id", env.CARTOFLOW_PROJECT_ID);
    out.append("file", file, file.name || "archivo");

    const r = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "x-webhook-secret": env.SOCIAL_WEBHOOK_SECRET },
      body: out,
    });
    const data = await r.json().catch(() => ({}));

    if (r.ok && data.success) {
      return json({ success: true, file: data.file, signed_url: data.signed_url });
    }
    return json({ success: false, error: data.error || "HTTP " + r.status }, 400);
  } catch (e) {
    return json({ success: false, error: "server_error" }, 500);
  }
}

// ── Duplicado a propósito desde chat.js ──────────────────────────────────
// El sitio no tiene build, así que no hay módulos compartidos entre Functions
// (misma razón por la que los modales están duplicados; ver CLAUDE.md).
// Si se cambia la lógica de verificación aquí, cambiarla también en chat.js.
async function verifyTurnstile(env, request, token) {
  if (typeof token !== "string" || token === "") return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || undefined,
      }),
    });
    const data = await r.json().catch(() => ({}));
    return data.success === true;
  } catch (e) {
    return false; // fail closed: subir cuesta almacenamiento real
  }
}

// Mismo enfoque que en chat.js: ventana fija sobre KV, conteo aproximado, y
// fail open si falta el binding para no dejar el adjuntar inservible.
async function checkRateLimit(env, request) {
  if (!env.RATE_LIMIT) return { ok: true, skipped: true };
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return { ok: true, skipped: true };

  const now = Date.now();
  try {
    for (const w of RATE_WINDOWS) {
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
