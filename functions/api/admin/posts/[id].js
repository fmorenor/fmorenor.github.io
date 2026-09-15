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

  if (request.method === 'GET') {
    return handleGET(env, postId);
  }

  return new Response('Method not allowed', { status: 405 });
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
