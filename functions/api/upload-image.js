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
    const contentType = context.request.headers.get('Content-Type') || 'image/jpeg';
    const fileName = context.request.headers.get('X-File-Name') || 'image';

    if (!contentType.startsWith('image/')) {
      return jsonResponse({ error: 'Must be an image' }, 400);
    }

    // R2 credentials from environment
    const accountId = context.env.R2_ACCOUNT_ID || 'e883fcc90722d2b681a5282fe9581072';
    const bucket = context.env.R2_BUCKET_NAME;
    const accessKeyId = context.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = context.env.R2_SECRET_ACCESS_KEY;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return jsonResponse({
        error: `Missing config: bucket=${!!bucket} key=${!!accessKeyId} secret=${!!secretAccessKey}`
      }, 500);
    }

    // Generate key
    const timestamp = Date.now();
    const year = new Date().getFullYear();
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `${defaultPrefix}/${year}/${timestamp}.${ext}`;

    // Read file body
    const fileBuffer = await context.request.arrayBuffer();

    // Upload to R2 from server (no CORS issues this way)
    const uploadResult = await uploadToR2(
      accountId,
      bucket,
      key,
      fileBuffer,
      contentType,
      accessKeyId,
      secretAccessKey
    );

    if (!uploadResult.success) {
      return jsonResponse({ error: uploadResult.error }, 500);
    }

    return jsonResponse({
      success: true,
      publicUrl: `${publicDomain}/${key}`,
      key,
    }, 200);

  } catch (error) {
    console.error('Upload error:', error.message);
    return jsonResponse({ error: 'Error: ' + error.message }, 500);
  }
}

async function uploadToR2(accountId, bucket, key, fileBuffer, contentType, accessKeyId, secretAccessKey) {
  try {
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const method = 'PUT';
    const path = `/${bucket}/${key}`;
    const payloadHash = 'UNSIGNED-PAYLOAD';

    // Build AWS SigV4 headers
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const dateStamp = amzDate.substring(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

    // Headers in alphabetical order (only the ones to sign)
    const headers = {
      'host': host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    };

    const headerKeys = Object.keys(headers).sort();
    const canonicalHeadersStr = headerKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
    const signedHeadersStr = headerKeys.join(';');

    const canonicalRequest = [
      method,
      path,
      '',
      canonicalHeadersStr,
      signedHeadersStr,
      payloadHash
    ].join('\n');

    const canonicalHash = await sha256Hex(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalHash
    ].join('\n');

    const signature = await calculateSignature(secretAccessKey, dateStamp, stringToSign);

    const authHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

    const response = await fetch(`https://${host}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Authorization': authHeader,
        'X-Amz-Date': amzDate,
        'X-Amz-Content-Sha256': payloadHash,
      },
      body: fileBuffer
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `R2 error ${response.status}: ${text.substring(0, 200)}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function generatePresignedUrl(accountId, bucket, key, accessKeyId, secretAccessKey, contentType) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  const dateStamp = amzDate.substring(0, 8);
  const expiresIn = 3600;
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const host = `${accountId}.r2.cloudflarestorage.com`;

  // Encode credential properly
  const encodedCredential = `${accessKeyId}/${credentialScope}`;

  // Build query string with properly ordered parameters
  const queryParams = new URLSearchParams();
  queryParams.set('X-Amz-Algorithm', algorithm);
  queryParams.set('X-Amz-Credential', encodedCredential);
  queryParams.set('X-Amz-Date', amzDate);
  queryParams.set('X-Amz-Expires', String(expiresIn));
  queryParams.set('X-Amz-SignedHeaders', 'host');

  const canonicalQuerystring = queryParams.toString();

  const canonicalRequest = [
    'PUT',
    `/${bucket}/${key}`,
    canonicalQuerystring,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const canonicalHash = await sha256Hex(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    canonicalHash
  ].join('\n');

  const signature = await calculateSignature(secretAccessKey, dateStamp, stringToSign);

  const presignedUrl = `https://${host}/${bucket}/${key}?${canonicalQuerystring}&X-Amz-Signature=${signature}`;
  return presignedUrl;
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
