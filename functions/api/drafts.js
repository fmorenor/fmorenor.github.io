// Cloudflare Pages Function — gestión de borradores en KV
// GET: lista borradores del usuario
// POST: guarda borrador
// DELETE: elimina borrador
//
// Variables de entorno (Cloudflare Pages → Settings → Environment variables):
//   DRAFTS_KV                (KV namespace binding)
//   ALLOWED_EMAILS           (emails autorizados, separados por comas)

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function isEmailAllowed(env, email) {
  if (!env.ALLOWED_EMAILS) return true; // Sin restricción si no está configurado
  const allowed = env.ALLOWED_EMAILS.split(',').map(e => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

export async function onRequest({ request, env }) {
  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    if (!env.DRAFTS_KV) {
      return json({ error: "config_incompleta" }, 500);
    }

    // Extraer email del usuario de la query o header
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("email") || request.headers.get("x-user-email");

    if (!userEmail) {
      return json({ error: "email_requerido" }, 400);
    }

    // Validar que el email esté autorizado
    if (!isEmailAllowed(env, userEmail)) {
      return json({ error: "email_no_autorizado" }, 403);
    }

    if (request.method === "GET") {
      return handleGet(env, userEmail);
    }

    if (request.method === "POST") {
      return handlePost(env, userEmail, request);
    }

    if (request.method === "DELETE") {
      return handleDelete(env, userEmail, request);
    }

    return json({ error: "metodo_no_permitido" }, 405);
  } catch (error) {
    console.error("Error en /api/drafts:", error);
    return json({ error: "error_interno", details: error.message }, 500);
  }
}

async function handleGet(env, userEmail) {
  try {
    // Listar todos los borradores del usuario
    // Patrón de clave: draft:{email}:{timestamp}
    const prefix = `draft:${userEmail}:`;

    const list = await env.DRAFTS_KV.list({ prefix });

    const drafts = [];
    for (const item of list.keys) {
      const content = await env.DRAFTS_KV.get(item.name, "json");
      if (content) {
        drafts.push({
          id: item.name,
          ...content,
        });
      }
    }

    // Ordenar por fecha más reciente primero
    drafts.sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));

    // Limitar a últimos 10 borradores
    const recentDrafts = drafts.slice(0, 10);

    return json({ success: true, drafts: recentDrafts });
  } catch (error) {
    console.error("Error listando borradores:", error);
    return json({ error: "error_listando_borradores" }, 500);
  }
}

async function handlePost(env, userEmail, request) {
  try {
    const body = await request.json();

    const { title, category, date, description, imageUrl, content } = body;

    if (!title || !category || !date || !description || !content) {
      return json({ error: "campos_requeridos" }, 400);
    }

    // Generar ID único: timestamp
    const timestamp = Date.now();
    const draftId = `draft:${userEmail}:${timestamp}`;

    const draft = {
      title,
      category,
      date,
      description,
      imageUrl: imageUrl || "",
      content,
      lastSaved: new Date().toISOString(),
    };

    // Guardar en KV
    await env.DRAFTS_KV.put(draftId, JSON.stringify(draft), {
      expirationTtl: 30 * 24 * 60 * 60, // 30 días
    });

    return json({ success: true, draftId, draft });
  } catch (error) {
    console.error("Error guardando borrador:", error);
    return json({ error: "error_guardando_borrador" }, 500);
  }
}

async function handleDelete(env, userEmail, request) {
  try {
    const url = new URL(request.url);
    const draftId = url.searchParams.get("id");

    if (!draftId) {
      return json({ error: "id_requerido" }, 400);
    }

    // Verificar que el borrador pertenece al usuario
    if (!draftId.startsWith(`draft:${userEmail}:`)) {
      return json({ error: "no_autorizado" }, 403);
    }

    await env.DRAFTS_KV.delete(draftId);

    return json({ success: true, message: "Borrador eliminado" });
  } catch (error) {
    console.error("Error eliminando borrador:", error);
    return json({ error: "error_eliminando_borrador" }, 500);
  }
}
