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

export async function onRequestPost({ request, env }) {
  try {
    if (!env.SOCIAL_WEBHOOK_SECRET || !env.CARTOFLOW_PROJECT_ID) {
      return json({ success: false, error: "config_incompleta" }, 500);
    }

    const form = await request.formData();
    const file = form.get("file");
    const leadId = form.get("lead_id");

    if (!file || typeof file === "string") return json({ success: false, error: "archivo_faltante" }, 400);
    if (!leadId) return json({ success: false, error: "lead_id_faltante" }, 400);
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return json({ success: false, error: "archivo_muy_grande" }, 400);
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
