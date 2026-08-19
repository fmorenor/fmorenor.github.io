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
    const accountId = context.env.R2_ACCOUNT_ID || 'e883fcc90722d2b681a5282fe9581072';
    const bucket = context.env.R2_BUCKET_NAME;
    const accessKeyId = context.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = context.env.R2_SECRET_ACCESS_KEY;
    const publicDomain = context.env.R2_PUBLIC_DOMAIN;
    const defaultPrefix = context.env.R2_DEFAULT_PREFIX;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return jsonResponse({ error: 'Missing R2 config' }, 500);
    }

    const host = `${accountId}.r2.cloudflarestorage.com`;
    const path = `/${bucket}/`;
    const queryString = `list-type=2&max-keys=1000&prefix=${defaultPrefix}/`;

    // Build AWS SigV4 request
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
    const dateStamp = amzDate.substring(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/us-east-1/s3/aws4_request`;

    const canonicalRequest = [
      'GET',
      path,
      queryString,
      `host:${host}`,
      '',
      'host',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    ].join('\n');

    const canonicalHash = await sha256Hex(canonicalRequest);
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalHash
    ].join('\n');

    const signature = await calculateSignature(secretAccessKey, dateStamp, stringToSign);
    const authHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=host, Signature=${signature}`;

    const response = await fetch(`https://${host}${path}?${queryString}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'X-Amz-Date': amzDate,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return jsonResponse({ error: `R2 error ${response.status}` }, 500);
    }

    const xml = await response.text();
    const images = parseS3ListResponse(xml, publicDomain, defaultPrefix);

    return jsonResponse({ success: true, images }, 200);
  } catch (error) {
    console.error('List images error:', error.message);
    return jsonResponse({ error: error.message }, 500);
  }
}

function parseS3ListResponse(xml, publicDomain, prefix) {
  const images = [];
  const keyRegex = /<Key>([^<]+)<\/Key>/g;
  let match;

  while ((match = keyRegex.exec(xml)) !== null) {
    const key = match[1];
    if (key !== prefix + '/') { // Skip the prefix itself
      const fileName = key.split('/').pop();
      images.push({
        key: key,
        name: fileName,
        url: `${publicDomain}/${key}`
      });
    }
  }

  // Reverse to show newest first
  return images.reverse();
}

async function sha256Hex(data) {
  if (typeof data === 'string') {
    data = new TextEncoder().encode(data);
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
  const kRegion = await hmacSha256(kDate, 'us-east-1');
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
