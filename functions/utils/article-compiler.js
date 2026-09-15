/**
 * Compilador de artículos - Genera HTML estático a partir de datos en D1
 */

const ARTICLE_TEMPLATE = (article) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(article.title)} - CartoData</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { margin-bottom: 40px; border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; }
    h1 { font-size: 36px; margin-bottom: 10px; }
    .meta { color: #666; font-size: 14px; display: flex; gap: 20px; }
    .meta span { display: flex; align-items: center; gap: 5px; }
    .category {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-right: 10px;
    }
    .featured-image {
      width: 100%;
      max-height: 400px;
      object-fit: cover;
      border-radius: 8px;
      margin: 30px 0;
    }
    article { margin: 30px 0; }
    article h2 { font-size: 24px; margin: 30px 0 15px 0; }
    article h3 { font-size: 20px; margin: 25px 0 10px 0; }
    article p { margin-bottom: 15px; }
    article li { margin-left: 20px; margin-bottom: 10px; }
    article a { color: #0066cc; text-decoration: none; }
    article a:hover { text-decoration: underline; }
    article blockquote {
      border-left: 4px solid #0066cc;
      padding-left: 20px;
      margin: 20px 0;
      color: #666;
      font-style: italic;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 15px 0;
    }
    pre code { background: none; padding: 0; }
    footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    nav { max-width: 800px; margin: 0 auto; padding: 20px; text-align: center; }
    nav a { color: #0066cc; text-decoration: none; margin: 0 15px; }
  </style>
</head>
<body>
  <nav>
    <a href="/">← CartoData</a>
    <a href="/blog/">Blog</a>
  </nav>

  <div class="container">
    <header>
      <div>
        <span class="category">${escapeHtml(article.category)}</span>
        <span class="meta">
          <span>📅 ${formatDate(article.published_at || article.created_at)}</span>
          <span>✍️ ${escapeHtml(article.author)}</span>
        </span>
      </div>
      <h1>${escapeHtml(article.title)}</h1>
      ${article.excerpt ? `<p style="color: #666; font-size: 18px; margin-top: 15px;">${escapeHtml(article.excerpt)}</p>` : ''}
    </header>

    ${article.image_url ? `<img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.title)}" class="featured-image">` : ''}

    <article>
      ${article.content}
    </article>

    <footer>
      <p>Artículo publicado en CartoData • ${formatDate(article.published_at)}</p>
      <p><a href="/blog/">← Volver al blog</a></p>
    </footer>
  </div>
</body>
</html>`;

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Compila un artículo de D1 y genera HTML estático
 * @param {Object} article - Datos del artículo de D1
 * @returns {string} - HTML compilado
 */
export function compileArticle(article) {
  // Validar que el artículo tenga datos necesarios
  if (!article.title || !article.content) {
    throw new Error('Artículo inválido: falta título o contenido');
  }

  return ARTICLE_TEMPLATE(article);
}

/**
 * Genera el slug a partir del título
 * @param {string} title - Título del artículo
 * @returns {string} - Slug generado
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Valida un artículo antes de compilar
 * @param {Object} article - Datos del artículo
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateArticle(article) {
  const errors = [];

  if (!article.title || article.title.trim().length === 0) {
    errors.push('Título requerido');
  }

  if (!article.slug || article.slug.trim().length === 0) {
    errors.push('Slug requerido');
  }

  if (!article.content || article.content.trim().length === 0) {
    errors.push('Contenido requerido');
  }

  if (!article.category) {
    errors.push('Categoría requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
