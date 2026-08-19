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
    const publicDomain = context.env.R2_PUBLIC_DOMAIN || 'https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev';

    // Hardcoded list of images — actualizar según subas fotos
    const images = [
      {
        name: 'sandraTovarCD.jpg',
        url: `${publicDomain}/blog/2026/1724081953462.jpg`
      },
      {
        name: 'guillermoHernandezCD.jpg',
        url: `${publicDomain}/blog/2026/1722822159436.jpg`
      }
    ];

    // Sort by newest first (try to parse date from filename)
    images.sort((a, b) => {
      const aNum = parseInt(a.url.match(/\/(\d+)\./)?.[1] || 0);
      const bNum = parseInt(b.url.match(/\/(\d+)\./)?.[1] || 0);
      return bNum - aNum;
    });

    return jsonResponse({ success: true, images }, 200);
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
