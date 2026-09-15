/**
 * Endpoint para obtener, actualizar o eliminar un artículo específico
 * GET /api/admin/posts/:id - obtener artículo
 * PUT /api/admin/posts/:id - editar artículo
 * DELETE /api/admin/posts/:id - eliminar artículo
 */

import { validateAdminAuth, createAuthError } from '../auth.js';

export async function onRequest({ request, env, params }) {
  // Validar autenticación
  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  const postId = params.id;

  switch (request.method) {
    case 'GET':
      return handleGET(request, env, postId);
    case 'PUT':
      return handlePUT(request, env, postId);
    case 'DELETE':
      return handleDELETE(request, env, postId);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function handleGET(request, env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ article }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handlePUT(request, env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const { title, content, category, excerpt, image_url, author, status } = body;

    // Obtener el artículo actual
    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Preparar campos para actualizar
    const updates = {
      title: title !== undefined ? title : article.title,
      content: content !== undefined ? content : article.content,
      category: category !== undefined ? category : article.category,
      excerpt: excerpt !== undefined ? excerpt : article.excerpt,
      image_url: image_url !== undefined ? image_url : article.image_url,
      author: author !== undefined ? author : article.author,
      status: status !== undefined ? status : article.status,
      updated_at: new Date().toISOString(),
    };

    // Si cambia a publicado, agregar fecha
    if (status === 'published' && article.status !== 'published') {
      updates.published_at = new Date().toISOString();
    }

    const { success } = await env.DB.prepare(`
      UPDATE articles SET
        title = ?, content = ?, category = ?, excerpt = ?,
        image_url = ?, author = ?, status = ?, published_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      updates.title, updates.content, updates.category, updates.excerpt,
      updates.image_url, updates.author, updates.status, updates.published_at, updates.updated_at,
      postId
    ).run();

    if (!success) {
      throw new Error('Failed to update article');
    }

    // Obtener el artículo actualizado
    const updated = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    return new Response(JSON.stringify({ article: updated, success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleDELETE(request, env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Verificar que existe
    const article = await env.DB.prepare('SELECT id FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const { success } = await env.DB.prepare('DELETE FROM articles WHERE id = ?')
      .bind(postId)
      .run();

    if (!success) {
      throw new Error('Failed to delete article');
    }

    return new Response(JSON.stringify({ success: true, id: postId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DELETE post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
