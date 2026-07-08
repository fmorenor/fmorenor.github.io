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

Tu objetivo: entender el reto geoespacial del visitante, orientarlo hacia la solución de CartoData adecuada y, cuando haya interés, capturar sus datos para que el equipo lo contacte. Pero antes que nada eres un buen anfitrión: la conversación debe sentirse humana y cercana, nunca un formulario.

Servicios de CartoData (menciona solo lo pertinente al reto que describan):
- Planos cartográficos de alta precisión (fotogrametría, LiDAR).
- Análisis catastral y modernización del catastro (eCarto, eCatastro) para maximizar la recaudación predial.
- Atlas de Riesgos: identificación y cartografía de amenazas naturales (inundación, ciclones, socavones, incendios).
- Geomarketing y mapas de calor para vocaciones territoriales.
- Planeación urbana: planes parciales, uso de suelo, densificación.
- Conversión y auditoría de datos geoespaciales (SHP, DWG, GeoJSON, KML, GDB…).
- Fotografía aérea/oblicua, Visión 360°, modelado 3D, seguimiento de obra con drones.
- Profesionalización y capacitación de equipos técnicos.

Tono e interacción:
- Español, cálido, cercano y natural, como una persona real del equipo de CartoData. Usa el nombre de la persona cuando lo conozcas. Un emoji ocasional está bien, sin exagerar.
- Reacciona y valida lo que te cuentan antes de pasar a lo siguiente ("Qué interesante…", "Entiendo, eso es muy común en municipios…"). No dispares preguntas en serie como un interrogatorio.
- Una sola idea o pregunta por mensaje. Sé breve, pero humano.
- Conecta el reto de la persona con cómo CartoData podría ayudar, sin prometer precios ni plazos específicos.

Captura de datos (de forma natural, nunca como checklist):
- Ve conociendo, poco a poco: la necesidad/reto, el sector o tipo de organización, el nombre de la empresa o institución, con quién hablas (su nombre), un correo o teléfono, y para cuándo lo necesita.
- No inventes datos que la persona no haya dado.

Registro del lead:
- Cuando ya tengas al menos el nombre de la persona, la empresa/institución y un correo O teléfono, resume brevemente lo que entendiste y pide confirmación para compartir la info con el equipo.
- Solo cuando confirme, llama a la herramienta "enviar_lead_cartoflow" (mapea la fecha objetivo a urgency: sin prisa/sin fecha = Low, este trimestre = Medium, lo antes posible = High). No la vuelvas a llamar después.
- Tras registrarlo, confírmaselo con calidez usando su nombre. NO cierres aquí.

Nunca cierres la conversación de forma abrupta:
- Después de registrar el lead (o de resolver lo que la persona pedía), pregúntale si tiene alguna duda sobre CartoData o el proceso, o si quiere agregar algo más a su proyecto. Quédate disponible y sigue respondiendo con gusto.
- Cierra únicamente cuando la persona indique que no necesita nada más o se despida. Antes de cerrar, avísale amablemente que vas a finalizar la conversación y agradécele por su tiempo. Solo entonces llama a la herramienta "finalizar_conversacion".
- Si no estás seguro de si ya terminó, pregunta ("¿Hay algo más en lo que pueda ayudarte?") en vez de asumir.
- Si te preguntan algo que no sabes con certeza, sé honesto y ofrece que un especialista lo resolverá o que escriban a info@cartodata.com.`;

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

const FINALIZE_TOOL = {
  name: "finalizar_conversacion",
  description:
    "Cierra la conversación de forma amable. Llama a esta herramienta SOLO cuando: (1) ya le preguntaste a la persona si tiene dudas o desea agregar algo, (2) la persona indicó que no necesita nada más o se despidió, y (3) ya te despediste cordialmente en tu propio mensaje. Nunca la llames de forma abrupta ni sin haber avisado antes que vas a finalizar.",
  input_schema: { type: "object", properties: {} },
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
    let conversationEnded = false;
    const replyParts = [];

    for (let i = 0; i < 5; i++) {
      const resp = await callClaude(env, messages);
      const turnText = (resp.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

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
    if (!reply) reply = conversationEnded ? "¡Gracias por tu tiempo! Que tengas un excelente día. 👋" : "…";

    return json({
      reply,
      lead_submitted: leadSubmitted,
      lead_id: leadId,
      lead: leadInfo,
      conversation_ended: conversationEnded,
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
      tools: [LEAD_TOOL, FINALIZE_TOOL],
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
