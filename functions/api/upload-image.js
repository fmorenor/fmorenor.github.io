export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No se envió archivo' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'El archivo debe ser una imagen' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'La imagen es muy grande (máx 5MB)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const year = new Date().getFullYear();
    const fileName = `${context.env.R2_DEFAULT_PREFIX}/${year}/${timestamp}.${ext}`;

    // Obtener buffer del archivo
    const buffer = await file.arrayBuffer();

    // Configurar S3 compatible con R2
    const endpoint = `https://${context.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const s3Url = `${endpoint}/${context.env.R2_BUCKET_NAME}/${fileName}`;

    // Generar firma AWS SigV4
    const headers = await generateS3Headers(
      s3Url,
      buffer,
      file.type,
      context.env.R2_ACCESS_KEY_ID,
      context.env.R2_SECRET_ACCESS_KEY,
      context.env.R2_ACCOUNT_ID
    );

    // Subir a R2
    const uploadResponse = await fetch(s3Url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': file.type,
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`S3 error: ${uploadResponse.status} - ${error}`);
    }

    // Generar URL pública
    const publicUrl = `${context.env.R2_PUBLIC_DOMAIN}/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      fileName: file.name
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    return new Response(JSON.stringify({
      error: 'Error al subir imagen: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Generar headers firmados con AWS SigV4
async function generateS3Headers(url, body, contentType, accessKeyId, secretAccessKey, accountId) {
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.substring(0, 8);

  const bodyHash = await hashSha256(new Uint8Array(body));

  const canonicalRequest = `PUT
/${url.split('/' + accountId + '/')[1]}

host:${accountId}.r2.cloudflarestorage.com
x-amz-content-sha256:${bodyHash}
x-amz-date:${amzDate}

host;x-amz-content-sha256;x-amz-date
${bodyHash}`;

  const canonicalRequestHash = await hashSha256(new TextEncoder().encode(canonicalRequest));

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256
${amzDate}
${credentialScope}
${canonicalRequestHash}`;

  const signature = await signMessage(
    `AWS4${secretAccessKey}`,
    stringToSign,
    dateStamp
  );

  return {
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': bodyHash,
  };
}

async function hashSha256(data) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signMessage(key, message, dateStamp) {
  const keyBuffer = new TextEncoder().encode(key);
  const msgBuffer = new TextEncoder().encode(message);

  const hmac = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', hmac, msgBuffer);

  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
