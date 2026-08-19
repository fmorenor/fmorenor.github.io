export async function onRequest(context) {
  // GET: Generar presigned URL
  if (context.request.method === 'GET') {
    return handleGetPresignedUrl(context);
  }

  // POST: Recibir confirmación de upload (opcional)
  if (context.request.method === 'POST') {
    return handleUploadConfirmation(context);
  }

  // OPTIONS: CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return jsonResponse({ error: 'Método no permitido' }, 405);
}

async function handleGetPresignedUrl(context) {
  try {
    // Verificar variables de entorno
    if (!context.env.R2_ACCOUNT_ID || !context.env.R2_BUCKET_NAME || !context.env.R2_ACCESS_KEY_ID || !context.env.R2_SECRET_ACCESS_KEY) {
      return jsonResponse({
        error: 'Faltan variables de entorno R2'
      }, 500);
    }

    const url = new URL(context.request.url);
    const fileName = url.searchParams.get('filename');
    const fileType = url.searchParams.get('type');

    if (!fileName || !fileType) {
      return jsonResponse({ error: 'Falta filename o type' }, 400);
    }

    // Validar tipo
    if (!fileType.startsWith('image/')) {
      return jsonResponse({ error: 'Debe ser una imagen' }, 400);
    }

    // Generar nombre único
    const ext = fileName.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const key = `${context.env.R2_DEFAULT_PREFIX}/${year}/${timestamp}.${ext}`;

    // Generar presigned URL
    const presignedUrl = await generatePresignedUrl(
      context.env.R2_ACCOUNT_ID,
      context.env.R2_BUCKET_NAME,
      key,
      context.env.R2_ACCESS_KEY_ID,
      context.env.R2_SECRET_ACCESS_KEY,
      fileType
    );

    return jsonResponse({
      success: true,
      presignedUrl,
      publicUrl: `${context.env.R2_PUBLIC_DOMAIN}/${key}`,
      key,
    }, 200);

  } catch (error) {
    console.error('Error en presigned URL:', error.message, error.stack);
    return jsonResponse({
      error: 'Error: ' + (error.message || 'Desconocido')
    }, 500);
  }
}

async function handleUploadConfirmation(context) {
  // Endpoint opcional para confirmar upload
  try {
    const data = await context.request.json();
    console.log('Upload confirmado:', data.key);
    return jsonResponse({ success: true }, 200);
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

async function generatePresignedUrl(
  accountId,
  bucket,
  key,
  accessKeyId,
  secretAccessKey,
  contentType
) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.substring(0, 8);
  const expiresIn = 3600; // 1 hora

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;

  // Construir canonical request
  const canonicalRequest = [
    'PUT',
    `/${bucket}/${key}`,
    `X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(accessKeyId)}%2F${credentialScope}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host%3Bx-amz-content-type`,
    `host:${host}`,
    `x-amz-content-type:${contentType}`,
    '',
    'host;x-amz-content-type',
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const canonicalRequestHash = await sha256(canonicalRequest);

  // String to sign
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  // Calcular signature
  const signature = await calculateSignature(
    secretAccessKey,
    dateStamp,
    stringToSign
  );

  // Construir presigned URL
  const presignedUrl = `https://${host}/${bucket}/${key}?X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(accessKeyId)}%2F${credentialScope}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host%3Bx-amz-content-type&X-Amz-Signature=${signature}`;

  return presignedUrl;
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key, message) {
  const keyBuffer = new TextEncoder().encode(key);
  const msgBuffer = new TextEncoder().encode(message);
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', hmacKey, msgBuffer);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function calculateSignature(secretAccessKey, dateStamp, stringToSign) {
  const kDate = await hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmacSha256(kDate, 'auto');
  const kService = await hmacSha256(kRegion, 's3');
  const kSigning = await hmacSha256(kService, 'aws4_request');
  return await hmacSha256(kSigning, stringToSign);
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
