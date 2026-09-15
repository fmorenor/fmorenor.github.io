/**
 * CRUD endpoint para artículos del blog
 * GET /api/admin/posts - listar artículos
 * POST /api/admin/posts - crear artículo
 * PUT /api/admin/posts/:id - editar artículo
 * DELETE /api/admin/posts/:id - eliminar artículo
 */

import { validateAdminAuth, createAuthError } from './auth.js';
import { compileArticle, validateArticle } from '../../utils/article-compiler.js';

export async function onRequest({ request, env, params }) {
  // Validar autenticación
  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const postId = pathParts[pathParts.length - 1];
  const isDetailRoute = postId && postId !== 'posts' && !isNaN(Date.parse(postId));

  switch (request.method) {
    case 'GET':
      return handleGET(request, env, postId);
    case 'POST':
      return handlePOST(request, env);
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
    // Si se solicita un artículo específico (cuando postId no es 'posts')
    if (postId && postId !== 'posts' && postId.length > 0) {
      console.log('Getting single post:', postId);
      const article = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
        .bind(postId)
        .first();

      if (!article) {
        return new Response(JSON.stringify({ error: 'Article not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ article }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Listar todos los artículos
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = 'SELECT * FROM articles WHERE 1=1';
    const params = [];

    // Si status="" (Todos) → no filtrar
    // Si status="draft" o "published" → filtrar
    // Si status=null (no enviado) → por defecto "published"
    if (status === '') {
      // Mostrar todos, sin filtro de status
    } else if (status && status !== '') {
      query += ' AND status = ?';
      params.push(status);
    } else {
      // null o no enviado → por defecto publicados
      query += ' AND status = ?';
      params.push('published');
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({ articles: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('GET posts error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handlePOST(request, env) {
  try {
    const body = await request.json();
    const { slug, title, content, category, excerpt, image_url, author, status } = body;

    // Validar campos requeridos
    if (!slug || !title || !content || !category) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slug, title, content, category' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que slug sea único
    const existing = await env.DB.prepare('SELECT id FROM articles WHERE slug = ?')
      .bind(slug)
      .first();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Slug already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const published_at = status === 'published' ? new Date().toISOString() : null;

    const { success } = await env.DB.prepare(`
      INSERT INTO articles (slug, title, content, category, excerpt, image_url, author, status, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(slug, title, content, category, excerpt || '', image_url || '', author || 'CartoData', status || 'draft', published_at).run();

    if (!success) {
      throw new Error('Failed to insert article');
    }

    // Obtener el artículo insertado
    const article = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?')
      .bind(slug)
      .first();

    return new Response(JSON.stringify({ article, success: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('POST posts error:', error);
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

    // Preparar valores por defecto si no vienen en el request
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

    console.log('UPDATE params:', { newTitle, newContent, newCategory, newExcerpt, newImageUrl, newAuthor, newStatus, newPublishedAt, newUpdatedAt, postId });

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

    // Obtener el artículo actualizado
    const updated = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
      .bind(postId)
      .first();

    return new Response(JSON.stringify({ article: updated, success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PUT posts error:', error);
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
    console.error('DELETE posts error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
