export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  if (context.request.method !== 'GET') {
    return jsonResponse({ error: 'Only GET allowed' }, 405);
  }

  try {
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;

    if (!publicDomain) {
      return jsonResponse({ error: 'Missing R2_PUBLIC_DOMAIN' }, 500);
    }

    // Imágenes conocidas que se han subido
    // El cliente agregará automáticamente URLs cuando cargue fotos
    const knownImages = [
      {
        name: 'guillermoHernandezCD.jpg',
        url: `${publicDomain}/guillermoHernandezCD.jpg`
      },
      {
        name: 'sandraTovarCD.jpg',
        url: `${publicDomain}/sandraTovarCD.jpg`
      }
    ];

    return jsonResponse({ success: true, images: knownImages }, 200);
  } catch (error) {
    console.error('List images error:', error.message);
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
