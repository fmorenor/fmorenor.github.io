/**
 * Endpoint público para obtener posts publicados
 * GET /api/public/posts/[id]
 */

export async function onRequest({ request, env, params }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const postId = params.id;

    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ? AND status = ?')
      .bind(postId, 'published')
      .first();

    if (!article) {
      return new Response(JSON.stringify({ error: 'Post not found or not published' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ article }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET public post error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
