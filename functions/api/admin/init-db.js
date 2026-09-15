/**
 * Endpoint para inicializar las tablas de D1
 * Solo ejecutable por admin con password correcto
 * POST /api/admin/init-db
 */

export async function onRequest({ request, env }) {
  // Solo POST
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Verificar contraseña
  const { password } = await request.json().catch(() => ({}));
  if (password !== env.PUBLISH_PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Crear tabla articles
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS articles (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        author TEXT NOT NULL DEFAULT 'CartoData',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
        published_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Crear tabla images
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        category TEXT,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Crear índices
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)',
      'CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)',
      'CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)',
      'CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_images_category ON images(category)',
    ];

    for (const indexSql of indexes) {
      await env.DB.prepare(indexSql).run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database initialized successfully',
        tables: ['articles', 'images']
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('DB init error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
