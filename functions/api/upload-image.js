export async function onRequest(context) {
  if (context.request.method === 'POST') {
    return handleUpload(context);
  }

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

async function handleUpload(context) {
  try {
    const contentType = context.request.headers.get('content-type') || 'image/jpeg';
    const contentLength = parseInt(context.request.headers.get('content-length') || '0');

    if (!contentType.startsWith('image/')) {
      return jsonResponse({ error: 'Must be an image' }, 400);
    }

    if (contentLength > 5 * 1024 * 1024) {
      return jsonResponse({ error: 'File too large (max 5MB)' }, 400);
    }

    const arrayBuffer = await context.request.arrayBuffer();

    // Get R2 bucket from Cloudflare bindings
    const bucket = context.env.R2_BUCKET;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;

    if (!bucket) {
      return jsonResponse({ error: 'R2 bucket not configured' }, 500);
    }

    // Generate key
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `${defaultPrefix}/${year}/${timestamp}.${ext}`;

    try {
      // Upload using Cloudflare R2 binding
      await bucket.put(key, arrayBuffer, {
        httpMetadata: {
          contentType: contentType,
        },
      });

      return jsonResponse({
        success: true,
        publicUrl: `${publicDomain}/${key}`,
        key,
      }, 200);
    } catch (r2Error) {
      console.error('R2 put error:', r2Error.message);
      return jsonResponse({
        error: 'R2 upload failed: ' + r2Error.message
      }, 500);
    }

  } catch (error) {
    console.error('Upload error:', error.message);
    return jsonResponse({
      error: 'Error: ' + error.message
    }, 500);
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
