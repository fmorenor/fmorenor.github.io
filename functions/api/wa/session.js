// GET /api/wa/session — la página /whatsapp-archivos pide aquí los datos del
// enlace. El token viaja en la cabecera x-wa-token (en la URL va tras "#", así
// que nunca llega a logs ni a cabeceras Referer).
// Solo devuelve lo necesario para mostrar: el número enmascarado y el nombre.

import { json, loadLink, maskPhone, MAX_UPLOADS_PER_LINK } from "../../utils/whatsapp-links.js";

export async function onRequestGet({ request, env }) {
  try {
    if (!env.WA_LINKS) return json({ ok: false, error: "config_incompleta" }, 500);
    const rec = await loadLink(env, request.headers.get("x-wa-token"));
    if (!rec) return json({ ok: false, error: "enlace_invalido" }, 404);

    return json({
      ok: true,
      phone_masked: maskPhone(rec.phone),
      first_name: ((rec.contact && rec.contact.name) || "").split(/\s+/)[0] || "",
      expires_at: new Date(rec.expires_at).toISOString(),
      files: (rec.files || []).map((f) => ({ name: f.name, at: f.at })),
      lead_id: rec.lead_id || null,
      uploads_left: Math.max(0, MAX_UPLOADS_PER_LINK - (rec.files || []).length),
    });
  } catch (e) {
    return json({ ok: false, error: "server_error" }, 500);
  }
}
