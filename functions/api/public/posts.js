/**
 * Endpoint público para listar posts publicados
 * GET /api/public/posts?limit=50&offset=0
 */

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { results } = await env.DB.prepare(`
      SELECT * FROM articles
      WHERE status = ?
      ORDER BY published_at DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind('published', limit, offset).all();

    return new Response(JSON.stringify({ articles: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET public posts error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
