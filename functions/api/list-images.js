export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    // Obtener el Durable Object binding
    const galleryDO = context.env.GALLERY;
    if (!galleryDO) {
      return jsonResponse({ error: 'Gallery service unavailable' }, 503);
    }

    // Crear un ID único para la galería (siempre el mismo)
    const id = context.env.GALLERY.idFromName('default');
    const gallery = galleryDO.get(id);

    // Proxear la solicitud al DO
    const response = await gallery.fetch(new Request(context.request.url, {
      method: context.request.method,
      body: context.request.method === 'POST' ? await context.request.text() : undefined,
      headers: { 'Content-Type': 'application/json' }
    }));

    // Asegurar CORS en la respuesta
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;
  } catch (error) {
    console.error('Gallery API error:', error.message);
    return jsonResponse({ error: error.message }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
