var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/chat.js
var MODEL = "claude-haiku-4-5";
var MAX_MSGS = 40;
var MAX_CHARS_PER_MSG = 4e3;
var MAX_CHARS_TOTAL = 2e4;
var CARTOFLOW_URL = "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/submit-landing-lead";
var LINKS = {
  calendly: "",
  // TODO: enlace de Calendly del equipo comercial
  tutoriales: "",
  // TODO: enlace a los videos tutoriales para generar KML/KMZ
  whatsapp: "https://wa.me/523336271552"
};
function buildOptions() {
  const opts = [];
  if (LINKS.calendly)
    opts.push(`Agendar una reuni\xF3n virtual con nuestro equipo comercial en el horario que te acomode: ${LINKS.calendly}`);
  if (LINKS.tutoriales)
    opts.push(`Ver nuestros videos tutoriales para generar tu archivo KML/KMZ; ah\xED tambi\xE9n explicamos especificaciones que otros clientes han pedido y que se convirtieron en casos de \xE9xito: ${LINKS.tutoriales}`);
  opts.push(`Que nuestro equipo te contacte por WhatsApp para acompa\xF1arte de forma m\xE1s personalizada: ${LINKS.whatsapp}`);
  return opts.map((o, i) => `${i + 1}. ${o}`).join("\n");
}
__name(buildOptions, "buildOptions");
var SYSTEM_PROMPT = `Eres el asistente virtual de CartoData, empresa con m\xE1s de 90 a\xF1os de experiencia en cartograf\xEDa y soluciones geoespaciales para Latinoam\xE9rica. Atiendes el diagn\xF3stico "X-Ray" en el sitio web y act\xFAas como un primer contacto comercial c\xE1lido y resolutivo.

Tu objetivo: dar la bienvenida, conocer a la persona y su proyecto, y dejar todo listo para una cotizaci\xF3n \xE1gil. Antes que nada eres un buen anfitri\xF3n: la conversaci\xF3n debe sentirse humana y cercana, nunca un formulario.

Servicios de CartoData (menciona solo lo pertinente al reto que describan):
- Planos cartogr\xE1ficos de alta precisi\xF3n (fotogrametr\xEDa, LiDAR).
- Fotograf\xEDa a\xE9rea y oblicua, Visi\xF3n 360\xB0, modelado 3D, seguimiento de obra con drones.
- An\xE1lisis catastral y modernizaci\xF3n del catastro (eCarto, eCatastro) para maximizar la recaudaci\xF3n predial.
- Atlas de Riesgos: identificaci\xF3n y cartograf\xEDa de amenazas naturales (inundaci\xF3n, ciclones, socavones, incendios).
- Geomarketing y mapas de calor para vocaciones territoriales.
- Planeaci\xF3n urbana: planes parciales, uso de suelo, densificaci\xF3n.
- Conversi\xF3n y auditor\xEDa de datos geoespaciales (SHP, DWG, GeoJSON, KML, GDB\u2026).
- Profesionalizaci\xF3n y capacitaci\xF3n de equipos t\xE9cnicos.

Tono e interacci\xF3n:
- Responde SIEMPRE en el idioma en que te escriba la persona: si escribe en ingl\xE9s, contesta en ingl\xE9s; si escribe en espa\xF1ol, en espa\xF1ol. Mant\xE9n ese idioma durante toda la conversaci\xF3n y no lo cambies salvo que la persona cambie.
- C\xE1lido, cercano y resolutivo, como una persona real del equipo comercial de CartoData. Usa el nombre de la persona en cuanto lo sepas. Un emoji ocasional est\xE1 bien, sin exagerar.
- Reacciona y valida con energ\xEDa positiva ("\xA1S\xFAper!", "\xA1Excelente, un gusto!", "\xA1Vamos muy bien!") antes de pasar a lo siguiente. Nada de interrogatorios: una sola idea o pregunta por mensaje, breve y humano.
- Nunca inventes datos, precios, plazos ni enlaces.

Flujo de la conversaci\xF3n (s\xEDguelo con naturalidad, sin que suene a checklist):
1) El saludo inicial ya dio la bienvenida y pidi\xF3 los datos de contacto (nombre, correo o tel\xE9fono, y empresa). Cuando la persona los comparta, agrad\xE9cele con calidez usando su nombre.
2) Preg\xFAntale por su proyecto: si tiene una necesidad espec\xEDfica o si prefiere que le compartas ejemplos de las soluciones que ofrecemos.
3) Cuando describa lo que necesita, reacciona con entusiasmo y conf\xEDrmale que s\xED podemos apoyarlo.
4) Preg\xFAntale si tiene definida su \xE1rea de inter\xE9s en alg\xFAn archivo (SHP, KMZ o KML) y si cuenta con especificaciones t\xE9cnicas, o si prefiere que las desarrollemos en conjunto.
5) Si NO tiene el archivo ni las especificaciones, tranquil\xEDzalo ("no te preocupes, s\xE9 que puede sonar complicado, pero no lo es; con gusto te acompa\xF1amos") y ofr\xE9cele estas opciones (comp\xE1rtelas con sus enlaces tal cual, sin modificarlos):
${buildOptions()}

Archivos adjuntos (importante, l\xE9elo bien):
- El chat tiene un bot\xF3n de clip con el que la persona puede adjuntar sus archivos (KML, KMZ, SHP, ZIP, PDF, im\xE1genes\u2026). Se guardan junto a su ficha para que el equipo t\xE9cnico los revise.
- T\xDA NO VES el contenido de esos archivos y no puedes analizarlos. Nunca digas que los est\xE1s leyendo, ni describas lo que contienen, ni saques conclusiones sobre ellos.
- Cuando un archivo se adjunta de verdad, recibir\xE1s un mensaje que empieza por "Adjunt\xE9:" seguido del nombre. Agrad\xE9celo con naturalidad y sigue la conversaci\xF3n; el equipo lo revisar\xE1.
- Si la persona te dice que subi\xF3 un archivo y todav\xEDa NO has recibido ese aviso, es porque a\xFAn no tenemos sus datos de contacto: los archivos quedan en espera y se adjuntan solos en cuanto se registra la ficha. Expl\xEDcaselo con tranquilidad y p\xEDdele amablemente el dato que falte.
- En ese caso NUNCA lo atribuyas a un fallo, a una incompatibilidad ni a un problema t\xE9cnico de la plataforma: no hay ning\xFAn error, es el funcionamiento normal.

Registro del lead:
- En cuanto tengas el nombre de la persona, su empresa y un correo o tel\xE9fono, registra el lead con la herramienta "enviar_lead_cartoflow" (incluye lo que sepas del proyecto en problem_statement/desired_deliverable; mapea urgencia si la menciona: sin prisa = Low, este trimestre = Medium, lo antes posible = High). Hazlo una sola vez, de forma transparente y sin frenar la conversaci\xF3n (no necesitas pedir permiso formal, pero s\xED puedes comentar que "as\xED tu asesor ya puede dar seguimiento").
- No vuelvas a llamar la herramienta despu\xE9s de registrarlo.

Nunca cierres la conversaci\xF3n de forma abrupta:
- Despu\xE9s de orientar a la persona, preg\xFAntale si tiene alguna duda o si quiere agregar algo m\xE1s a su proyecto. Qu\xE9date disponible y sigue respondiendo con gusto.
- Cierra \xFAnicamente cuando la persona indique que no necesita nada m\xE1s o se despida. Antes de cerrar, av\xEDsale amablemente que vas a finalizar la conversaci\xF3n y agrad\xE9cele por su tiempo. Solo entonces llama a la herramienta "finalizar_conversacion".
- Si no est\xE1s seguro de si ya termin\xF3, pregunta ("\xBFHay algo m\xE1s en lo que pueda ayudarte?") en vez de asumir.
- Si te preguntan algo que no sabes con certeza, s\xE9 honesto y ofrece que un especialista lo resolver\xE1, o comparte WhatsApp (${LINKS.whatsapp}) o el correo info@cartodata.com.`;
var LEAD_TOOL = {
  name: "enviar_lead_cartoflow",
  description: "Registra el lead en el CRM de CartoData (CartoFlow). Llama a esta herramienta \xDANICAMENTE cuando ya tienes, como m\xEDnimo: el nombre del contacto, la instituci\xF3n/empresa, y un medio de contacto (email O tel\xE9fono), y el usuario ha confirmado expl\xEDcitamente que quiere que el equipo lo contacte. No la llames antes de confirmar. No inventes datos que el usuario no haya proporcionado.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre de la persona (lead/contacto)." },
      institution: { type: "string", description: "Empresa, municipio u organizaci\xF3n del lead." },
      type: {
        type: "string",
        enum: ["Municipio", "Gobierno", "Empresa", "ONG", "Persona"],
        description: "Tipo de organizaci\xF3n."
      },
      contact_name: { type: "string", description: "Nombre de la persona de contacto (normalmente igual a name)." },
      contact_email: { type: "string", description: "Correo de contacto, si lo dio." },
      contact_phone: { type: "string", description: "Tel\xE9fono de contacto, si lo dio." },
      contact_role: { type: "string", description: "Cargo o rol del contacto, si lo mencion\xF3." },
      problem_statement: { type: "string", description: "Reto o necesidad geoespacial que busca resolver." },
      desired_deliverable: { type: "string", description: "Entregable deseado, si lo mencion\xF3 (dashboard, atlas, planos\u2026)." },
      urgency: { type: "string", enum: ["Low", "Medium", "High"], description: "Urgencia seg\xFAn la fecha objetivo." },
      location: { type: "string", description: "Ubicaci\xF3n (estado/ciudad), si la dio." },
      country: { type: "string", description: "Pa\xEDs, si lo dio." }
    },
    required: ["name", "institution"]
  }
};
var FINALIZE_TOOL = {
  name: "finalizar_conversacion",
  description: "Cierra la conversaci\xF3n de forma amable. Llama a esta herramienta SOLO cuando: (1) ya le preguntaste a la persona si tiene dudas o desea agregar algo, (2) la persona indic\xF3 que no necesita nada m\xE1s o se despidi\xF3, y (3) ya te despediste cordialmente en tu propio mensaje. Nunca la llames de forma abrupta ni sin haber avisado antes que vas a finalizar.",
  input_schema: { type: "object", properties: {} }
};
async function onRequestPost({ request, env }) {
  try {
    if (!env.ANTHROPIC_API_KEY) return json({ reply: "Configuraci\xF3n incompleta del servidor." }, 500);
    const body = await request.json().catch(() => ({}));
    if (!env.TURNSTILE_SECRET_KEY) {
      return json({ reply: "Configuraci\xF3n incompleta del servidor." }, 500);
    }
    const verified = await verifyTurnstile(env, request, body.turnstile_token);
    if (!verified) {
      return json(
        { reply: "No pudimos verificar que eres una persona. Recarga la p\xE1gina e int\xE9ntalo de nuevo." },
        403
      );
    }
    const rl = await checkRateLimit(env, request);
    if (!rl.ok) {
      return json(
        { reply: "Has enviado muchos mensajes seguidos. Espera un momento y vuelve a intentarlo." },
        429
      );
    }
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    if (incoming.length === 0) return json({ reply: "No recib\xED ning\xFAn mensaje." }, 400);
    let messages = incoming.slice(-MAX_MSGS).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: (typeof m.content === "string" ? m.content : String(m.content ?? "")).slice(
        0,
        MAX_CHARS_PER_MSG
      )
    })).filter((m) => m.content.trim() !== "");
    let budget = MAX_CHARS_TOTAL;
    const kept = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      budget -= messages[i].content.length;
      if (budget < 0) break;
      kept.unshift(messages[i]);
    }
    messages = kept;
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (messages.length === 0) return json({ reply: "No recib\xED ning\xFAn mensaje." }, 400);
    let leadSubmitted = false;
    let leadId = null;
    let leadUuid = null;
    let leadInfo = null;
    let conversationEnded = false;
    const replyParts = [];
    for (let i = 0; i < 5; i++) {
      const resp = await callClaude(env, messages);
      const turnText = (resp.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (resp.stop_reason === "tool_use") {
        if (turnText) replyParts.push(turnText);
        messages = messages.concat([{ role: "assistant", content: resp.content }]);
        const results = [];
        for (const block of resp.content) {
          if (block.type !== "tool_use") continue;
          if (block.name === "enviar_lead_cartoflow") {
            const r = await submitLead(env, block.input || {});
            if (r.ok) {
              leadSubmitted = true;
              leadId = r.lead_id;
              leadUuid = r.lead_uuid;
              leadInfo = block.input;
            }
            results.push({ type: "tool_result", tool_use_id: block.id, content: r.message, is_error: !r.ok });
          } else if (block.name === "finalizar_conversacion") {
            conversationEnded = true;
            results.push({ type: "tool_result", tool_use_id: block.id, content: "ok" });
          } else {
            results.push({ type: "tool_result", tool_use_id: block.id, content: "ok" });
          }
        }
        messages = messages.concat([{ role: "user", content: results }]);
        continue;
      }
      if (turnText) replyParts.push(turnText);
      break;
    }
    let reply = replyParts.join("\n\n").trim();
    if (!reply) reply = conversationEnded ? "\xA1Gracias por tu tiempo! Que tengas un excelente d\xEDa. \u{1F44B}" : "\u2026";
    return json({
      reply,
      lead_submitted: leadSubmitted,
      lead_id: leadId,
      lead_uuid: leadUuid,
      lead: leadInfo,
      conversation_ended: conversationEnded
    });
  } catch (e) {
    return json({ reply: "Ups, hubo un error del servidor. Intenta de nuevo en un momento." }, 500);
  }
}
__name(onRequestPost, "onRequestPost");
var RATE_WINDOWS = [
  { label: "m", ms: 60 * 1e3, max: 10 },
  { label: "h", ms: 60 * 60 * 1e3, max: 60 }
];
async function checkRateLimit(env, request) {
  if (!env.RATE_LIMIT) return { ok: true, skipped: true };
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return { ok: true, skipped: true };
  const now = Date.now();
  try {
    for (const w of RATE_WINDOWS) {
      const key = `rl:${ip}:${w.label}:${Math.floor(now / w.ms)}`;
      const count = parseInt(await env.RATE_LIMIT.get(key) || "0", 10) || 0;
      if (count >= w.max) return { ok: false, window: w.label };
      await env.RATE_LIMIT.put(key, String(count + 1), {
        expirationTtl: Math.max(60, Math.ceil(w.ms / 1e3 * 2))
      });
    }
  } catch (e) {
    return { ok: true, skipped: true };
  }
  return { ok: true };
}
__name(checkRateLimit, "checkRateLimit");
async function verifyTurnstile(env, request, token) {
  if (typeof token !== "string" || token === "") return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || void 0
      })
    });
    const data = await r.json().catch(() => ({}));
    return data.success === true;
  } catch (e) {
    return false;
  }
}
__name(verifyTurnstile, "verifyTurnstile");
async function callClaude(env, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [LEAD_TOOL, FINALIZE_TOOL],
      messages
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("anthropic " + r.status + " " + t);
  }
  return r.json();
}
__name(callClaude, "callClaude");
async function submitLead(env, input) {
  const payload = {
    project_id: env.CARTOFLOW_PROJECT_ID,
    source: "Web",
    name: input.name,
    institution: input.institution,
    type: input.type || "Empresa",
    contact_name: input.contact_name || input.name,
    contact_email: input.contact_email,
    contact_phone: input.contact_phone,
    contact_role: input.contact_role,
    problem_statement: input.problem_statement,
    desired_deliverable: input.desired_deliverable,
    urgency: input.urgency || "Medium",
    location: input.location,
    country: input.country
  };
  Object.keys(payload).forEach((k) => (payload[k] == null || payload[k] === "") && delete payload[k]);
  if (!env.CARTOFLOW_PROJECT_ID) {
    return { ok: false, message: "Falta CARTOFLOW_PROJECT_ID en el servidor." };
  }
  try {
    const r = await fetch(CARTOFLOW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success) {
      const lead0 = data.leads && data.leads[0] || {};
      return {
        ok: true,
        lead_id: lead0.lead_id,
        lead_uuid: lead0.id,
        message: "Lead registrado con \xE9xito. lead_id: " + (lead0.lead_id || "n/a")
      };
    }
    return { ok: false, message: "No se pudo registrar el lead: " + (data.error || "HTTP " + r.status) };
  } catch (e) {
    return { ok: false, message: "Error de red al registrar el lead." };
  }
}
__name(submitLead, "submitLead");
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json, "json");

// api/upload.js
var UPLOAD_URL = "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/upload-lead-file";
var MAX_BYTES = 20 * 1024 * 1024;
var ALLOWED_EXT = [
  "kml",
  "kmz",
  "shp",
  "zip",
  "geojson",
  "json",
  "dwg",
  "dxf",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "csv",
  "md"
];
var RATE_WINDOWS2 = [
  { label: "um", ms: 60 * 1e3, max: 5 },
  { label: "uh", ms: 60 * 60 * 1e3, max: 30 }
];
async function onRequestPost2({ request, env }) {
  try {
    if (!env.SOCIAL_WEBHOOK_SECRET || !env.CARTOFLOW_PROJECT_ID) {
      return json2({ success: false, error: "config_incompleta" }, 500);
    }
    if (!env.TURNSTILE_SECRET_KEY) {
      return json2({ success: false, error: "config_incompleta" }, 500);
    }
    const form = await request.formData();
    const file = form.get("file");
    const leadId = form.get("lead_id");
    const verificado = await verifyTurnstile2(env, request, form.get("turnstile_token"));
    if (!verificado) {
      return json2({ success: false, error: "verificacion_fallida" }, 403);
    }
    const rl = await checkRateLimit2(env, request);
    if (!rl.ok) return json2({ success: false, error: "demasiadas_subidas" }, 429);
    if (!file || typeof file === "string") return json2({ success: false, error: "archivo_faltante" }, 400);
    if (!leadId) return json2({ success: false, error: "lead_id_faltante" }, 400);
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return json2({ success: false, error: "archivo_muy_grande" }, 400);
    }
    const nombre = String(file.name || "");
    const ext = (nombre.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return json2({ success: false, error: "tipo_no_permitido" }, 400);
    }
    const out = new FormData();
    out.append("lead_id", String(leadId));
    out.append("project_id", env.CARTOFLOW_PROJECT_ID);
    out.append("file", file, file.name || "archivo");
    const r = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "x-webhook-secret": env.SOCIAL_WEBHOOK_SECRET },
      body: out
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success) {
      return json2({ success: true, file: data.file, signed_url: data.signed_url });
    }
    return json2({ success: false, error: data.error || "HTTP " + r.status }, 400);
  } catch (e) {
    return json2({ success: false, error: "server_error" }, 500);
  }
}
__name(onRequestPost2, "onRequestPost");
async function verifyTurnstile2(env, request, token) {
  if (typeof token !== "string" || token === "") return false;
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get("CF-Connecting-IP") || void 0
      })
    });
    const data = await r.json().catch(() => ({}));
    return data.success === true;
  } catch (e) {
    return false;
  }
}
__name(verifyTurnstile2, "verifyTurnstile");
async function checkRateLimit2(env, request) {
  if (!env.RATE_LIMIT) return { ok: true, skipped: true };
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) return { ok: true, skipped: true };
  const now = Date.now();
  try {
    for (const w of RATE_WINDOWS2) {
      const key = `rl:${ip}:${w.label}:${Math.floor(now / w.ms)}`;
      const count = parseInt(await env.RATE_LIMIT.get(key) || "0", 10) || 0;
      if (count >= w.max) return { ok: false, window: w.label };
      await env.RATE_LIMIT.put(key, String(count + 1), {
        expirationTtl: Math.max(60, Math.ceil(w.ms / 1e3 * 2))
      });
    }
  } catch (e) {
    return { ok: true, skipped: true };
  }
  return { ok: true };
}
__name(checkRateLimit2, "checkRateLimit");
function json2(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json2, "json");

// api/upload-image.js
async function onRequest(context) {
  if (context.request.method === "POST") {
    return handleUpload(context);
  }
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return jsonResponse({ error: "Method not allowed" }, 405);
}
__name(onRequest, "onRequest");
async function handleUpload(context) {
  try {
    const contentType = context.request.headers.get("Content-Type") || "image/jpeg";
    const fileName = context.request.headers.get("X-File-Name") || "image";
    if (!contentType.startsWith("image/")) {
      return jsonResponse({ error: "Must be an image" }, 400);
    }
    const accountId = context.env.R2_ACCOUNT_ID || "e883fcc90722d2b681a5282fe9581072";
    const bucket = context.env.R2_BUCKET_NAME;
    const accessKeyId = context.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = context.env.R2_SECRET_ACCESS_KEY;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;
    if (!bucket || !accessKeyId || !secretAccessKey) {
      return jsonResponse({
        error: `Missing config: bucket=${!!bucket} key=${!!accessKeyId} secret=${!!secretAccessKey}`
      }, 500);
    }
    const timestamp = Date.now();
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const ext = contentType.split("/")[1] || "jpg";
    const key = `${defaultPrefix}/${year}/${timestamp}.${ext}`;
    const fileBuffer = await context.request.arrayBuffer();
    const uploadResult = await uploadToR2(
      accountId,
      bucket,
      key,
      fileBuffer,
      contentType,
      accessKeyId,
      secretAccessKey
    );
    if (!uploadResult.success) {
      return jsonResponse({ error: uploadResult.error }, 500);
    }
    return jsonResponse({
      success: true,
      publicUrl: `${publicDomain}/${key}`,
      key
    }, 200);
  } catch (error) {
    console.error("Upload error:", error.message);
    return jsonResponse({ error: "Error: " + error.message }, 500);
  }
}
__name(handleUpload, "handleUpload");
async function uploadToR2(accountId, bucket, key, fileBuffer, contentType, accessKeyId, secretAccessKey) {
  try {
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = "PUT";
    const path = `/${bucket}/${key}`;
    const payloadHash = "UNSIGNED-PAYLOAD";
    const now = /* @__PURE__ */ new Date();
    const amzDate = now.toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
    const dateStamp = amzDate.substring(0, 8);
    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/us-east-1/s3/aws4_request`;
    const headers = {
      "host": host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    };
    const headerKeys = Object.keys(headers).sort();
    const canonicalHeadersStr = headerKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";
    const signedHeadersStr = headerKeys.join(";");
    const canonicalRequest = [
      method,
      path,
      "",
      canonicalHeadersStr,
      signedHeadersStr,
      payloadHash
    ].join("\n");
    const canonicalHash = await sha256Hex(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalHash
    ].join("\n");
    const signature = await calculateSignature(secretAccessKey, dateStamp, stringToSign);
    const authHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;
    const response = await fetch(`https://${host}${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Authorization": authHeader,
        "X-Amz-Date": amzDate,
        "X-Amz-Content-Sha256": payloadHash
      },
      body: fileBuffer
    });
    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `R2 error ${response.status}: ${text.substring(0, 200)}` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
__name(uploadToR2, "uploadToR2");
async function sha256Hex(data) {
  if (typeof data === "string") {
    data = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function hmacSha256(key, message) {
  const keyBuffer = new TextEncoder().encode(key);
  const msgBuffer = new TextEncoder().encode(message);
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, msgBuffer);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacSha256, "hmacSha256");
async function calculateSignature(secretAccessKey, dateStamp, stringToSign) {
  const kDate = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, "auto");
  const kService = await hmacSha256(kRegion, "s3");
  const kSigning = await hmacSha256(kService, "aws4_request");
  return await hmacSha256(kSigning, stringToSign);
}
__name(calculateSignature, "calculateSignature");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(jsonResponse, "jsonResponse");

// ../.wrangler/tmp/pages-1ZglqX/functionsRoutes-0.5434184409050906.mjs
var routes = [
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/upload-image",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-XXlHMA/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-XXlHMA/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.3277986999345084.mjs.map
