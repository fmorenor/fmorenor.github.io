const galleryStore = new Map();

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  if (context.request.method === 'GET') {
    try {
      const publicDomain = context.env.R2_PUBLIC_DOMAIN;

      if (!publicDomain) {
        return jsonResponse({ error: 'Missing R2_PUBLIC_DOMAIN' }, 500);
      }

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

      // Agregar imágenes del store en memoria
      const stored = Array.from(galleryStore.values());
      const allImages = [...stored, ...knownImages];

      // Remover duplicados
      const unique = Array.from(new Map(allImages.map(img => [img.url, img])).values());

      return jsonResponse({ success: true, images: unique }, 200);
    } catch (error) {
      console.error('List images error:', error.message);
      return jsonResponse({ error: error.message }, 500);
    }
  }

  if (context.request.method === 'POST') {
    try {
      const data = await context.request.json();
      const { url, name } = data;

      if (!url || !name) {
        return jsonResponse({ error: 'Missing url or name' }, 400);
      }

      galleryStore.set(url, { name, url });

      return jsonResponse({ success: true, message: 'Image added to gallery' }, 200);
    } catch (error) {
      console.error('Add image error:', error.message);
      return jsonResponse({ error: error.message }, 500);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
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
