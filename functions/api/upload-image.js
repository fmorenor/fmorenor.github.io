export async function onRequest(context) {
  // OPTIONS para CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method === 'POST') {
    return handleUpload(context);
  }

  return new Response(JSON.stringify({ error: 'Método no permitido' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleUpload(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return jsonResponse({ error: 'No se envió archivo' }, 400);
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return jsonResponse({ error: 'El archivo debe ser una imagen' }, 400);
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return jsonResponse({ error: 'La imagen es muy grande (máx 5MB)' }, 400);
    }

    // Generar nombre único
    const timestamp = Date.now();
    const ext = file.name.split('.').pop().toLowerCase();
    const year = new Date().getFullYear();
    const key = `${context.env.R2_DEFAULT_PREFIX}/${year}/${timestamp}.${ext}`;

    // Obtener buffer del archivo
    const buffer = await file.arrayBuffer();

    // Hacer request directo a R2 con autenticación básica
    const s3Url = `https://${context.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${context.env.R2_BUCKET_NAME}/${key}`;

    // Headers de autorización básicos para R2
    const auth = btoa(`${context.env.R2_ACCESS_KEY_ID}:${context.env.R2_SECRET_ACCESS_KEY}`);

    const uploadResponse = await fetch(s3Url, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('R2 Error:', uploadResponse.status, error);
      return jsonResponse({
        error: `Error al subir a R2: ${uploadResponse.status}`
      }, 500);
    }

    // Generar URL pública
    const publicUrl = `${context.env.R2_PUBLIC_DOMAIN}/${key}`;

    return jsonResponse({
      success: true,
      url: publicUrl,
      fileName: file.name
    }, 200);

  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({
      error: 'Error al subir imagen: ' + error.message
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
