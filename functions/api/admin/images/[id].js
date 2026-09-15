/**
 * Endpoint para editar y eliminar una imagen específica
 * PUT /api/admin/images/:id - actualizar nombre
 * DELETE /api/admin/images/:id - eliminar imagen
 */

import { validateAdminAuth, createAuthError } from '../auth.js';

export async function onRequest({ request, env, params }) {
  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  const imageId = params.id;

  switch (request.method) {
    case 'PUT':
      return handlePUT(request, env, imageId);
    case 'DELETE':
      return handleDELETE(env, imageId);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function handlePUT(request, env, imageId) {
  try {
    if (!imageId) {
      return new Response(JSON.stringify({ error: 'Image ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return new Response(JSON.stringify({ error: 'Filename required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?')
      .bind(imageId)
      .first();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { success } = await env.DB.prepare('UPDATE images SET filename = ? WHERE id = ?')
      .bind(filename, imageId)
      .run();

    if (!success) {
      throw new Error('Failed to update image');
    }

    const updated = await env.DB.prepare('SELECT * FROM images WHERE id = ?')
      .bind(imageId)
      .first();

    return new Response(JSON.stringify({ image: updated, success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT image error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleDELETE(env, imageId) {
  try {
    if (!imageId) {
      return new Response(JSON.stringify({ error: 'Image ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const image = await env.DB.prepare('SELECT * FROM images WHERE id = ?')
      .bind(imageId)
      .first();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    console.error('DELETE image error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
