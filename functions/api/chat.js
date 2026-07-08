// Cloudflare Pages Function — backend del chatbot X-Ray.
// Proxy seguro a la API de Claude + registro de leads en CartoFlow (Supabase).
//
// Variables de entorno (Cloudflare Pages → Settings → Environment variables):
//   ANTHROPIC_API_KEY     (secret, encriptada)
//   CARTOFLOW_PROJECT_ID  (uuid del proyecto destino en CartoFlow)
//
// La API key NUNCA llega al navegador: el HTML solo habla con /api/chat.

const MODEL = "claude-haiku-4-5";
const CARTOFLOW_URL =
  "https://nxzoiesnejqaofgwxlde.supabase.co/functions/v1/submit-landing-lead";

const SYSTEM_PROMPT = `Eres el asistente virtual de CartoData, empresa con más de 90 años de experiencia en cartografía y soluciones geoespaciales para Latinoamérica. Atiendes el diagnóstico "X-Ray" en el sitio web.

Tu objetivo: entender el reto geoespacial del visitante, orientarlo hacia la solución de CartoData adecuada, y capturar sus datos de contacto para que el equipo comercial lo contacte.

Servicios de CartoData que puedes mencionar cuando sean relevantes al reto que describa el usuario:
- Planos cartográficos de alta precisión (fotogrametría, LiDAR).
- Análisis catastral y modernización del catastro (eCarto, eCatastro) para maximizar la recaudación predial.
- Atlas de Riesgos: identificación y cartografía de amenazas naturales (inundación, ciclones, socavones, incendios).
- Geomarketing y mapas de calor para vocaciones territoriales.
- Planeación urbana: planes parciales, uso de suelo, densificación.
- Conversión y auditoría de datos geoespaciales (SHP, DWG, GeoJSON, KML, GDB…).
- Fotografía aérea/oblicua, Visión 360°, modelado 3D, seguimiento de obra con drones.
- Profesionalización y capacitación de equipos técnicos.

Cómo conversar:
- Español, cálido, profesional y CONCISO. Una sola pregunta a la vez.
- Empieza entendiendo la NECESIDAD (el reto). Luego, de forma natural, ve pidiendo: sector/tipo de organización, nombre de la empresa o institución, nombre de la persona, un correo o teléfono de contacto, y para cuándo lo necesita.
- No abrumes con listas largas de servicios; menciona solo lo pertinente al reto que describen.
- No inventes datos ni prometas precios o plazos específicos.

Cierre y captura del lead:
- Cuando ya tengas al menos: el nombre de la persona, la empresa/institución, y un correo O un teléfono, resume brevemente lo que entendiste y PIDE confirmación para enviar la información al equipo.
- SOLO cuando el usuario confirme, llama a la herramienta "enviar_lead_cartoflow" con los datos recolectados. Mapea la fecha objetivo a "urgency": sin prisa/sin fecha = Low, este trimestre = Medium, lo antes posible = High.
- Tras registrar el lead, agradece por su nombre y avisa que un especialista de CartoData lo contactará pronto. No vuelvas a llamar la herramienta.
- Si el usuario no quiere dar datos de contacto, respétalo y sugiérele escribir a info@cartodata.com.`;

const LEAD_TOOL = {
  name: "enviar_lead_cartoflow",
  description:
    "Registra el lead en el CRM de CartoData (CartoFlow). Llama a esta herramienta ÚNICAMENTE cuando ya tienes, como mínimo: el nombre del contacto, la institución/empresa, y un medio de contacto (email O teléfono), y el usuario ha confirmado explícitamente que quiere que el equipo lo contacte. No la llames antes de confirmar. No inventes datos que el usuario no haya proporcionado.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nombre de la persona (lead/contacto)." },
      institution: { type: "string", description: "Empresa, municipio u organización del lead." },
      type: {
        type: "string",
        enum: ["Municipio", "Gobierno", "Empresa", "ONG", "Persona"],
        description: "Tipo de organización.",
      },
      contact_name: { type: "string", description: "Nombre de la persona de contacto (normalmente igual a name)." },
      contact_email: { type: "string", description: "Correo de contacto, si lo dio." },
      contact_phone: { type: "string", description: "Teléfono de contacto, si lo dio." },
      contact_role: { type: "string", description: "Cargo o rol del contacto, si lo mencionó." },
      problem_statement: { type: "string", description: "Reto o necesidad geoespacial que busca resolver." },
      desired_deliverable: { type: "string", description: "Entregable deseado, si lo mencionó (dashboard, atlas, planos…)." },
      urgency: { type: "string", enum: ["Low", "Medium", "High"], description: "Urgencia según la fecha objetivo." },
      location: { type: "string", description: "Ubicación (estado/ciudad), si la dio." },
      country: { type: "string", description: "País, si lo dio." },
    },
    required: ["name", "institution"],
  },
};

export async function onRequestPost({ request, env }) {
  try {
    if (!env.ANTHROPIC_API_KEY) return json({ reply: "Configuración incompleta del servidor." }, 500);

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    if (incoming.length === 0) return json({ reply: "No recibí ningún mensaje." }, 400);

    // Normaliza y acota el historial que reenviamos a la API.
    let messages = incoming
      .slice(-40)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : String(m.content ?? ""),
      }))
      .filter((m) => m.content.trim() !== "");
    // La primera debe ser del usuario.
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (messages.length === 0) return json({ reply: "No recibí ningún mensaje." }, 400);

    let leadSubmitted = false;
    let leadId = null;
    let leadInfo = null;

    for (let i = 0; i < 4; i++) {
      const resp = await callClaude(env, messages);

      if (resp.stop_reason === "tool_use") {
        messages = messages.concat([{ role: "assistant", content: resp.content }]);
        const results = [];
        for (const block of resp.content) {
          if (block.type === "tool_use" && block.name === "enviar_lead_cartoflow") {
            const r = await submitLead(env, block.input || {});
            if (r.ok) {
              leadSubmitted = true;
              leadId = r.lead_id;
              leadInfo = block.input;
            }
            results.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: r.message,
              is_error: !r.ok,
            });
          }
        }
        messages = messages.concat([{ role: "user", content: results }]);
        continue;
      }

      const text = (resp.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return json({
        reply: text || "…",
        lead_submitted: leadSubmitted,
        lead_id: leadId,
        lead: leadInfo,
      });
    }

    return json({
      reply: "Perdona, tuve un problema procesando la conversación. ¿Puedes repetir tu último mensaje?",
      lead_submitted: leadSubmitted,
      lead_id: leadId,
      lead: leadInfo,
    });
  } catch (e) {
    return json({ reply: "Ups, hubo un error del servidor. Intenta de nuevo en un momento." }, 500);
  }
}

async function callClaude(env, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [LEAD_TOOL],
      messages,
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error("anthropic " + r.status + " " + t);
  }
  return r.json();
}

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
    country: input.country,
  };
  Object.keys(payload).forEach((k) => (payload[k] == null || payload[k] === "") && delete payload[k]);

  if (!env.CARTOFLOW_PROJECT_ID) {
    return { ok: false, message: "Falta CARTOFLOW_PROJECT_ID en el servidor." };
  }

  try {
    const r = await fetch(CARTOFLOW_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok && data.success) {
      const lead_id = data.leads && data.leads[0] && data.leads[0].lead_id;
      return { ok: true, lead_id, message: "Lead registrado con éxito. lead_id: " + (lead_id || "n/a") };
    }
    return { ok: false, message: "No se pudo registrar el lead: " + (data.error || ("HTTP " + r.status)) };
  } catch (e) {
    return { ok: false, message: "Error de red al registrar el lead." };
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
