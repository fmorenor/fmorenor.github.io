export async function onRequest(context) {
  // POST: Recibir archivo y subirlo a R2
  if (context.request.method === 'POST') {
    return handleUpload(context);
  }

  // OPTIONS: CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  return jsonResponse({ error: 'Método no permitido' }, 405);
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

    // Acceder a variables de entorno
    const bucket = context.env.R2_BUCKET_NAME;
    const accountId = context.env.R2_ACCOUNT_ID || 'e883fcc90722d2b681a5282fe9581072';
    const accessKeyId = context.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = context.env.R2_SECRET_ACCESS_KEY;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;

    console.log('Env check:', { bucket: !!bucket, accountId: !!accountId, accessKeyId: !!accessKeyId, secretAccessKey: !!secretAccessKey });

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return jsonResponse({
        error: 'Missing R2 config: bucket=' + !!bucket + ' key=' + !!accessKeyId + ' secret=' + !!secretAccessKey
      }, 500);
    }

    // Generar nombre único
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `${defaultPrefix}/${year}/${timestamp}.${ext}`;

    const presignedUrl = await generatePresignedUrl(
      accountId,
      bucket,
      key,
      accessKeyId,
      secretAccessKey,
      contentType
    );

    // Hacer PUT a R2 desde el servidor
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload failed:', uploadResponse.status, errorText);
      return jsonResponse({
        error: `Upload failed: ${uploadResponse.status}`
      }, 500);
    }

    return jsonResponse({
      success: true,
      publicUrl: `${publicDomain}/${key}`,
      key,
    }, 200);

  } catch (error) {
    console.error('Upload error:', error.message, error.stack);
    return jsonResponse({
      error: 'Error: ' + (error.message || 'Unknown')
    }, 500);
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
  const expiresIn = 3600;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;

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

  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalRequestHash
  ].join('\n');

  const signature = await calculateSignature(
    secretAccessKey,
    dateStamp,
    stringToSign
  );

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
