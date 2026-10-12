// Las <loc> deben coincidir con la canónica de cada página. Las legales usan canónica sin extensión.
// instituciones.html y 404.html se excluyen a propósito.
const SITE = 'https://www.cartodata.com';

const STATIC_PAGES = [
  { path: '/', changefreq: 'monthly', priority: '1.0', lastmod: '2026-07-21' },
  { path: '/ciudades.html', changefreq: 'monthly', priority: '0.9', lastmod: '2026-07-21' },
  { path: '/infraestructura.html', changefreq: 'monthly', priority: '0.9', lastmod: '2026-07-21' },
  { path: '/mineria.html', changefreq: 'monthly', priority: '0.9', lastmod: '2026-07-21' },
  { path: '/cartografica.html', changefreq: 'monthly', priority: '0.9', lastmod: '2026-07-21' },
  { path: '/geosoftware.html', changefreq: 'monthly', priority: '0.9', lastmod: '2026-07-21' },
  { path: '/procesos.html', changefreq: 'monthly', priority: '0.8', lastmod: '2026-07-21' },
  { path: '/xray.html', changefreq: 'monthly', priority: '0.7', lastmod: '2026-07-21' },
  { path: '/historia.html', changefreq: 'yearly', priority: '0.6', lastmod: '2026-07-21' },
  { path: '/equipo.html', changefreq: 'yearly', priority: '0.6', lastmod: '2026-07-21' },
  { path: '/privacidad', changefreq: 'yearly', priority: '0.3', lastmod: '2026-07-13' },
  { path: '/terminos', changefreq: 'yearly', priority: '0.3', lastmod: '2026-07-13' },
];

const LEGACY_POSTS = [
  { path: '/blog/ahualulco-atendia-los-reportes-pero-el-problema-seguia.html' },
  { path: '/blog/una-actualizacion-catastral-vale-mas-cuando-cada-p.html' },
  { path: '/blog/que-cambia-cuando-un-municipio-sabe-que-uso-tiene-.html' },
  { path: '/blog/que-cambia-cuando-un-municipio-puede-ver-cada-toma.html' },
  { path: '/blog/por-que-hacer-dos-filas-para-resolver-un-solo-tram.html' },
  { path: '/blog/por-que-se-disparo-21-la-recaudacion-predial-en-el.html' },
  { path: '/blog/historias-de-cartomorfosis--e02t01-transformacion-.html' },
  { path: '/blog/historias-de-cartomorfosis--e03t01--guillermo-hern.html' },
  { path: '/blog/historias-de-cartomorfosis-e04t01--sandra-tovar-te.html', lastmod: '2021-11-05' },
  { path: '/blog/historias-de-cartomorfosis-e05t01--rodolfo-gonzale.html', lastmod: '2021-11-19' },
  { path: '/blog/historias-de-cartomorfosis-e06t01--martin-guzman-p.html', lastmod: '2021-11-27' },
];

const urlEntry = ({ loc, lastmod, changefreq = 'monthly', priority = '0.7' }) => `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

export async function onRequest({ request, env }) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  let posts = [];
  try {
    const { results } = await env.DB.prepare(`
      SELECT slug, COALESCE(updated_at, published_at, created_at) AS lastmod
      FROM articles
      WHERE status = 'published' AND slug IS NOT NULL AND slug != ''
      ORDER BY published_at DESC
    `).all();
    posts = results;
  } catch (error) {
    console.error('sitemap: no se pudieron leer los posts de D1', error);
  }

  const entries = [
    ...STATIC_PAGES.map(p => urlEntry({ loc: SITE + p.path, lastmod: p.lastmod, changefreq: p.changefreq, priority: p.priority })),
    ...LEGACY_POSTS.map(p => urlEntry({ loc: SITE + p.path, lastmod: p.lastmod })),
    ...posts.map(p => urlEntry({
      loc: `${SITE}/blog/${encodeURIComponent(p.slug)}`,
      lastmod: p.lastmod ? String(p.lastmod).slice(0, 10) : undefined,
      priority: '0.8',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
