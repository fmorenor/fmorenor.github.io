const SITE = 'https://www.cartodata.com';
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatDate = (value) => {
  const d = new Date(value);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
};

export async function onRequest({ request, env, params }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const slug = decodeURIComponent(params.slug);
  if (slug.includes('.')) {
    return env.ASSETS.fetch(request);
  }

  const article = await env.DB.prepare("SELECT * FROM articles WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first();

  if (!article) {
    const legacy = await env.ASSETS.fetch(new URL(`/blog/${slug}.html`, request.url));
    if (legacy.ok) return legacy;

    const notFound = await env.ASSETS.fetch(new URL('/404.html', request.url));
    return new Response(notFound.body, { status: 404, headers: notFound.headers });
  }

  const page = await env.ASSETS.fetch(new URL('/blog/post.html', request.url));
  const title = `${article.title} · Blog — CartoData`;
  const description = article.excerpt || article.title;
  const canonical = `${SITE}/blog/${encodeURIComponent(article.slug)}`;
  const date = formatDate(article.published_at || article.created_at);
  const heroStyle = article.image_url
    ? `background-image: url('${escapeHtml(article.image_url)}'); background-size: cover; background-position: center;`
    : 'background: linear-gradient(135deg, #1a3a52 0%, #0f2a3d 100%);';
  const heroImage = article.image_url
    ? `<img src="${escapeHtml(article.image_url)}" alt="${escapeHtml(article.title)}" class="blog-hero-bg" />`
    : '';

  const body = `
    <section class="blog-hero" style="${heroStyle}">
      ${heroImage}
      <div class="blog-hero-overlay"></div>
      <div class="blog-hero-content">
        <div class="blog-eyebrow">
          <span class="blog-category">${escapeHtml(article.category)}</span>
          <div style="margin-top: 8px;">${date}</div>
        </div>
        <h1 class="blog-h1">${escapeHtml(article.title)}</h1>
      </div>
    </section>
    <article class="blog-container">
      <div class="blog-content">${article.content}</div>
    </article>`;

  const head = `
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:site_name" content="CartoData" />
    ${article.image_url ? `<meta property="og:image" content="${escapeHtml(article.image_url)}" />` : ''}`;

  return new HTMLRewriter()
    .on('html', { element(el) { el.setAttribute('lang', 'es'); } })
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', description); } })
    .on('head', { element(el) { el.append(head, { html: true }); } })
    .on('body', { element(el) { el.setAttribute('class', 'blog-page'); } })
    .on('#postContainer', { element(el) { el.setInnerContent(body, { html: true }); } })
    .transform(page);
}
