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
    const fileName = `${context.env.R2_DEFAULT_PREFIX}/${new Date().getFullYear()}/${timestamp}.${ext}`;

    // Conectar a R2
    const s3 = new (await import('@aws-sdk/client-s3')).S3Client({
      region: 'auto',
      endpoint: `https://${context.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: context.env.R2_ACCESS_KEY_ID,
        secretAccessKey: context.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const buffer = await file.arrayBuffer();

    await s3.send(new PutObjectCommand({
      Bucket: context.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    }));

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
