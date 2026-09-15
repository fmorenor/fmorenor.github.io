/**
 * Endpoint para obtener un artículo específico por ID
 * GET /api/admin/posts/:id
 */

import { validateAdminAuth, createAuthError } from '../auth.js';

export async function onRequest({ request, env, params }) {
  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  const postId = params.id;

  switch (request.method) {
    case 'GET':
      return handleGET(env, postId);
    case 'PUT':
      return handlePUT(request, env, postId);
    case 'DELETE':
      return handleDELETE(env, postId);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

async function handleGET(env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ article }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET post error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePUT(request, env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, content, category, excerpt, image_url, author, status } = body;

    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newTitle = title || article.title || '';
    const newContent = content || article.content || '';
    const newCategory = category || article.category || '';
    const newExcerpt = excerpt ?? article.excerpt ?? '';
    const newImageUrl = image_url ?? article.image_url ?? '';
    const newAuthor = author || article.author || '';
    const newStatus = status || article.status || 'draft';
    const newUpdatedAt = new Date().toISOString();

    let newPublishedAt = article.published_at;
    if (newStatus === 'published' && article.status !== 'published') {
      newPublishedAt = new Date().toISOString();
    }

    const { success } = await env.DB.prepare(`
      UPDATE articles
      SET title = ?, content = ?, category = ?, excerpt = ?, image_url = ?, author = ?, status = ?, published_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      newTitle, newContent, newCategory, newExcerpt, newImageUrl, newAuthor, newStatus, newPublishedAt, newUpdatedAt, postId
    ).run();

    if (!success) {
      throw new Error('Failed to update article');
    }

    const updated = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    return new Response(JSON.stringify({ article: updated, success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT post error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleDELETE(env, postId) {
  try {
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const article = await env.DB.prepare('SELECT id FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Article not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
