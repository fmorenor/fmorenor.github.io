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
    const publicDomain = 'https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev';
    const kvNamespace = context.env.GALLERY_KV;

    if (!kvNamespace) {
      return jsonResponse({ error: 'Gallery storage unavailable' }, 503);
    }

    const knownImages = [
      { name: 'guillermoHernandezCD.jpg', url: `${publicDomain}/guillermoHernandezCD.jpg` },
      { name: 'sandraTovarCD.jpg', url: `${publicDomain}/sandraTovarCD.jpg` },
      { name: 'rodolfoGonzalezCD.jpg', url: `${publicDomain}/rodolfoGonzalezCD.jpg` },
      { name: 'martinpenaCD.jpg', url: `${publicDomain}/martinpenaCD.jpg` }
    ];

    if (context.request.method === 'GET') {
      // Obtener imágenes del KV
      const stored = await kvNamespace.get('gallery_images', 'json') || [];
      const allImages = [...stored, ...knownImages];
      const unique = Array.from(new Map(allImages.map(img => [img.url, img])).values());

      return jsonResponse({ success: true, images: unique }, 200);
    }

    if (context.request.method === 'POST') {
      const data = await context.request.json();
      const { url, name } = data;

      if (!url || !name) {
        return jsonResponse({ error: 'Missing url or name' }, 400);
      }

      // Obtener imágenes actuales
      const stored = await kvNamespace.get('gallery_images', 'json') || [];

      // Evitar duplicados
      if (!stored.some(img => img.url === url)) {
        stored.push({ name, url });
        await kvNamespace.put('gallery_images', JSON.stringify(stored));
      }

      return jsonResponse({ success: true, message: 'Image added to gallery' }, 200);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);
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
