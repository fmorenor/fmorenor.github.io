/**
 * CRUD endpoint para imágenes del blog
 * GET /api/admin/images - listar imágenes
 * POST /api/admin/images - subir imagen a R2
 * DELETE /api/admin/images/:id - eliminar imagen
 */

import { validateAdminAuth, createAuthError } from './auth.js';
import { uploadImage, validateImage } from '../../utils/r2-storage.js';

export async function onRequest({ request, env, params }) {
  // Validar autenticación
  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const imageId = pathParts[pathParts.length - 1];

  switch (request.method) {
    case 'GET':
      return handleGET(request, env);
    case 'POST':
      return handlePOST(request, env);
    case 'DELETE':
      return handleDELETE(request, env, imageId);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function handleGET(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM images WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY uploaded_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ images: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET images error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handlePOST(request, env) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = formData.get('category') || 'blog';

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Leer archivo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir a R2 directamente (sin validación complicada)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const r2Filename = `${timestamp}-${randomStr}.${ext}`;
    const r2Path = `blog/images/${r2Filename}`;

    await env.IMAGES.put(r2Path, buffer, {
      httpMetadata: { contentType: file.type }
    });

    // Guardar en D1
    const domain = 'pub-0b66dd4321604e288d1651690d880dc2.r2.dev';
    const publicUrl = `https://${domain}/blog/images/${r2Filename}`;

    const result = await env.DB.prepare(`
      INSERT INTO images (filename, url, size, category)
      VALUES (?, ?, ?, ?)
    `).bind(file.name, publicUrl, buffer.length, category).run();

    if (!result.success) {
      throw new Error('Failed to save image metadata');
    }

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      filename: r2Filename
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST images error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Upload failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleDELETE(request, env, imageId) {
  try {
    if (!imageId) {
      return new Response(JSON.stringify({ error: 'Image ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verificar que existe
    const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?')
      .bind(imageId)
      .first();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // TODO: Eliminar de R2 también

    const { success } = await env.DB.prepare('DELETE FROM images WHERE id = ?')
      .bind(imageId)
      .run();

    if (!success) {
      throw new Error('Failed to delete image');
    }

    return new Response(JSON.stringify({ success: true, id: imageId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DELETE images error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
