// POST /api/wa/upload — sube UN archivo desde /whatsapp-archivos al lead del
// número vinculado al enlace. Ruta nueva e independiente de /api/upload (X-Ray):
// aquí no hay Turnstile porque el token del enlace ya identifica y autoriza.
//
// El lead_id NUNCA viene del navegador: sale del registro del token (servidor).

import {
  json, loadLink, saveLink, ensureLead, checkFile, checkRateLimit,
  CARTOFLOW_UPLOAD_URL, MAX_BYTES, MAX_UPLOADS_PER_LINK,
} from "../../utils/whatsapp-links.js";

const RATE_WINDOWS = [
  { label: "wum", ms: 60 * 1000, max: 10 },
  { label: "wuh", ms: 60 * 60 * 1000, max: 40 },
];

export async function onRequestPost({ request, env }) {
  try {
    if (!env.WA_LINKS || !env.SOCIAL_WEBHOOK_SECRET || !env.CARTOFLOW_PROJECT_ID) {
      return json({ success: false, error: "config_incompleta" }, 500);
    }

    // Corta antes de leer el cuerpo si ya viene demasiado grande.
    const len = parseInt(request.headers.get("content-length") || "0", 10);
    if (len > MAX_BYTES + 64 * 1024) return json({ success: false, error: "archivo_muy_grande" }, 413);

    const token = request.headers.get("x-wa-token");
    const rec = await loadLink(env, token);
    if (!rec) return json({ success: false, error: "enlace_invalido" }, 404);
    if ((rec.files || []).length >= MAX_UPLOADS_PER_LINK) {
      return json({ success: false, error: "limite_de_archivos" }, 429);
    }

    const rl = await checkRateLimit(env, request, RATE_WINDOWS);
    if (!rl.ok) return json({ success: false, error: "demasiadas_subidas" }, 429);

    const form = await request.formData();
    const file = form.get("file");
    const bad = await checkFile(file);
    if (bad) return json({ success: false, error: bad }, 400);

    // Lead: si al generar el enlace CartoFlow no respondió, se crea ahora (una
    // sola vez por número; ensureLead consulta primero el mapa teléfono→lead).
    if (!rec.lead_uuid) {
      const r = await ensureLead(env, rec.phone, rec.contact);
      if (!r.ok) return json({ success: false, error: "lead_no_disponible" }, 502);
      rec.lead_uuid = r.lead_uuid;
      rec.lead_id = r.lead_id;
      await saveLink(env, token, rec);
    }

    const out = new FormData();
    out.append("lead_id", rec.lead_uuid);
    out.append("project_id", env.CARTOFLOW_PROJECT_ID);
    out.append("file", file, file.name);

    const r = await fetch(CARTOFLOW_UPLOAD_URL, {
      method: "POST",
      headers: { "x-webhook-secret": env.SOCIAL_WEBHOOK_SECRET },
      body: out,
    });
    const data = await r.json().catch(() => ({}));
    if (!(r.ok && data.success)) {
      return json({ success: false, error: "cartoflow_rechazo" }, 502);
    }

    rec.files = (rec.files || []).concat([{ name: file.name, size: file.size, at: new Date().toISOString() }]);
    await saveLink(env, token, rec);

    return json({ success: true, file: file.name, lead_id: rec.lead_id || null });
  } catch (e) {
    return json({ success: false, error: "server_error" }, 500);
  }
}
