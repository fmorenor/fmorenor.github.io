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

    // R2 config
    const bucket = context.env.R2_BUCKET_NAME;
    const accountId = context.env.R2_ACCOUNT_ID || 'e883fcc90722d2b681a5282fe9581072';
    const accessKeyId = context.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = context.env.R2_SECRET_ACCESS_KEY;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return jsonResponse({
        error: 'R2 config missing'
      }, 500);
    }

    // Generate key
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `${defaultPrefix}/${year}/${timestamp}.${ext}`;

    // Upload to R2 using AWS SigV4
    const uploadResult = await uploadToR2(
      accountId,
      bucket,
      key,
      arrayBuffer,
      contentType,
      accessKeyId,
      secretAccessKey
    );

    if (!uploadResult.success) {
      return jsonResponse({
        error: uploadResult.error
      }, 500);
    }

    return jsonResponse({
      success: true,
      publicUrl: `${publicDomain}/${key}`,
      key,
    }, 200);

  } catch (error) {
    console.error('Upload error:', error.message);
    return jsonResponse({
      error: 'Error: ' + error.message
    }, 500);
  }
}

async function uploadToR2(accountId, bucket, key, body, contentType, accessKeyId, secretAccessKey) {
  try {
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${bucket}/${key}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const dateStamp = amzDate.substring(0, 8);

    // Create canonical request
    const bodyHash = await sha256Hex(body);
    const canonicalRequest = [
      'PUT',
      `/${bucket}/${key}`,
      '',
      `content-type:${contentType}`,
      `host:${host}`,
      `x-amz-content-sha256:${bodyHash}`,
      `x-amz-date:${amzDate}`,
      '',
      'content-type;host;x-amz-content-sha256;x-amz-date',
      bodyHash
    ].join('\n');

    const canonicalHash = await sha256Hex(new TextEncoder().encode(canonicalRequest));

    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalHash
    ].join('\n');

    const signature = await calculateSignature(secretAccessKey, dateStamp, stringToSign);

    const authHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=${signature}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': contentType,
        'X-Amz-Content-Sha256': bodyHash,
        'X-Amz-Date': amzDate,
      },
      body: body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('R2 error:', response.status, text);
      return { success: false, error: `R2 error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error('uploadToR2 error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sha256Hex(data) {
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    data = new Uint8Array(data);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
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
