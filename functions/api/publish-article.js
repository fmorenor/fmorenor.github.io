// Cloudflare Pages Function — publica artículos del blog automáticamente a GitHub
// POST: valida email, contraseña, genera HTML, commitea a GitHub, actualiza index.html
//
// Variables de entorno (Cloudflare Pages → Settings → Environment variables):
//   GITHUB_TOKEN              (Personal Access Token, secret)
//   PUBLISH_PASSWORD          (contraseña en texto plano, MVP; TODO: Argon2)
//   GITHUB_USERNAME           (ej: fmorenor)
//   GITHUB_REPO               (ej: cartodata-web)
//   TURNSTILE_SECRET_KEY      (para verificar bot)
//   ALLOWED_EMAILS            (emails autorizados, separados por comas)

import { createCommit, getFileContent, insertArticleCard } from "../utils/github-api.js";

// Template base para nuevos artículos
const ARTICLE_TEMPLATE = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- SEO -->
  <title>{{TITLE}} · Blog — CartoData</title>
  <meta name="description" content="{{DESCRIPTION}}" />
  <link rel="canonical" href="https://www.cartodata.com/blog/{{FILENAME}}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://www.cartodata.com/blog/{{FILENAME}}" />
  <meta property="og:title" content="{{TITLE}} · Blog — CartoData" />
  <meta property="og:description" content="{{DESCRIPTION}}" />
  <meta property="og:locale" content="es_MX" />
  <meta property="og:site_name" content="CartoData" />
  <meta property="og:image" content="{{IMAGE_URL}}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{{TITLE}} · Blog — CartoData" />
  <meta name="twitter:description" content="{{DESCRIPTION}}" />
  <meta name="twitter:image" content="{{IMAGE_URL}}" />

  <!-- Autor y fecha -->
  <meta name="author" content="CartoData" />
  <meta name="article:published_time" content="{{PUBLISHED_TIME}}" />
  <meta name="article:modified_time" content="{{PUBLISHED_TIME}}" />

  <script src="../shared.js" defer></script>
  <script defer>
    document.addEventListener('DOMContentLoaded', () => {
      const logo = document.getElementById('cd-nav-logo');
      if (logo && !logo.src.includes('manus-storage')) {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        logo.src = isDark
          ? '../manus-storage/logo-white-h-proper_641226e9.png'
          : '../manus-storage/logo-black-h-proper_e8a1da9d.png';
      }
    });
  </script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
    body { background: #050816; color: #f8fafc; font-family: 'DM Sans', system-ui, sans-serif; }
    img { display: block; max-width: 100%; }

    .blog-hero {
      position: relative;
      width: 100%;
      min-height: 60vh;
      display: flex;
      align-items: flex-end;
      overflow: hidden;
      padding-bottom: 3rem;
    }
    .blog-hero-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
    .blog-hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(5,8,22,0) 0%, rgba(5,8,22,0.95) 100%);
    }
    .blog-hero-content {
      position: relative;
      z-index: 2;
      max-width: 860px;
      padding: 0 clamp(1.5rem, 6vw, 4rem);
      width: 100%;
    }
    .blog-eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 1rem;
    }
    .blog-category {
      display: inline-block;
      padding: 0.4rem 1rem;
      background: rgba(59, 91, 219, 0.2);
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #7dd3fc;
      margin-right: 0.8rem;
    }
    .blog-h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 300;
      line-height: 1.2;
      color: #fff;
      margin-bottom: 1rem;
    }
    .blog-subtitle {
      font-size: clamp(1rem, 2vw, 1.2rem);
      font-weight: 300;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      max-width: 600px;
    }

    .blog-container {
      max-width: 900px;
      margin: 0 auto;
      padding: clamp(3rem, 8vw, 5rem) clamp(1.5rem, 6vw, 4rem);
    }

    .blog-content {
      line-height: 1.8;
      font-size: 1.05rem;
      color: rgba(255, 255, 255, 0.9);
    }
    .blog-content h2 { font-size: 2rem; font-weight: 600; color: #fff; margin: 2.5rem 0 1.5rem; }
    .blog-content h3 { font-size: 1.4rem; font-weight: 600; color: #fff; margin: 2rem 0 1rem; }
    .blog-content p { margin-bottom: 1.5rem; }
    .blog-content strong { color: #fff; font-weight: 600; }
    .blog-content em { font-style: italic; color: rgba(255,255,255,0.9); }
    .blog-content a { color: #7dd3fc; text-decoration: none; border-bottom: 1px solid rgba(125,211,252,0.3); transition: border-color 250ms; }
    .blog-content a:hover { border-bottom-color: rgba(125,211,252,0.8); }
    .blog-content ul, .blog-content ol { margin: 1.5rem 0 1.5rem 2rem; }
    .blog-content li { margin-bottom: 0.8rem; }
    .blog-content blockquote { border-left: 4px solid #7dd3fc; padding-left: 1.5rem; margin: 2rem 0; color: rgba(255,255,255,0.8); font-style: italic; }
    .blog-content pre { background: rgba(0,0,0,0.3); border: 1px solid rgba(125,211,252,0.2); border-radius: 6px; padding: 1.5rem; overflow-x: auto; margin: 2rem 0; font-family: 'Courier New', monospace; }
    .blog-content code { font-family: 'Courier New', monospace; font-size: 0.9em; color: #7dd3fc; }
    .blog-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }

    .blog-content .video-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      margin: 2rem 0;
      border-radius: 8px;
    }
    .blog-content .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 8px;
    }

    @media (max-width: 768px) {
      .blog-hero { min-height: 50vh; }
      .blog-content { font-size: 1rem; }
      .blog-content h2 { font-size: 1.6rem; }
      .blog-content h3 { font-size: 1.2rem; }
    }
  </style>
</head>

<body>
  <section class="blog-hero" style="background-image: url('{{IMAGE_URL}}');">
    <img src="{{IMAGE_URL}}" alt="Hero" class="blog-hero-bg" />
    <div class="blog-hero-overlay"></div>
    <div class="blog-hero-content">
      <div class="blog-eyebrow">
        <span class="blog-category">{{CATEGORY_LABEL}}</span>
        {{FORMATTED_DATE}}
      </div>
      <h1 class="blog-h1">{{TITLE}}</h1>
      <p class="blog-subtitle">{{DESCRIPTION}}</p>
    </div>
  </section>

  <article class="blog-container">
    <div class="blog-content">
      {{CONTENT}}
    </div>
  </article>
</body>
</html>`;

const CATEGORY_LABELS = {
  ciudades: "Ciudades",
  mineria: "Minería",
  gobierno: "Gobierno",
  infraestructura: "Infraestructura",
  construccion: "Construcción",
  lidar: "Lidar",
  vision360: "Visión 360",
  ecarto: "eCarto",
  podcast: "Podcast",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function isEmailAllowed(env, email) {
  if (!env.ALLOWED_EMAILS) return true; // Sin restricción si no está configurado
  const allowed = env.ALLOWED_EMAILS.split(',').map(e => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

function getFilenameFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/[áéíóú]/g, (c) => ({ á: "a", é: "e", í: "i", ó: "o", ú: "u" }[c]))
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .substring(0, 50) + ".html";
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

async function verifyTurnstile(env, request, token) {
  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const data = await res.json();
  return data.success === true;
}

// Verificar contraseña usando crypto subtle
async function verifyPassword(env, password) {
  // Para MVP, comparación simple de hashes
  // TODO: Implementar Argon2 hash verification cuando sea posible en Workers
  return password === env.PUBLISH_PASSWORD;
}

async function getRateLimit(env, request, ip) {
  const key = `rl:publish:${ip}:${Math.floor(Date.now() / 60000)}`;
  const count = await env.RATE_LIMIT?.get(key) || "0";
  const current = parseInt(count) + 1;

  if (current <= 3) {
    await env.RATE_LIMIT?.put(key, String(current), { expirationTtl: 300 });
    return true;
  }
  return false;
}

export async function onRequestPost({ request, env }) {
  try {
    // Validar configuración
    if (
      !env.GITHUB_TOKEN ||
      !env.PUBLISH_PASSWORD ||
      !env.GITHUB_USERNAME ||
      !env.GITHUB_REPO
    ) {
      return json({ error: "config_incompleta" }, 500);
    }

    // Rate limiting
    const ip =
      request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for");
    const rlOk = await getRateLimit(env, request, ip);
    if (!rlOk) {
      return json({ error: "demasiados_intentos" }, 429);
    }

    // Turnstile
    const body = await request.json();
    const verified = await verifyTurnstile(env, request, body.turnstile_token);
    if (!verified) {
      return json({ error: "verificacion_fallida" }, 403);
    }

    // Validar campos requeridos
    const { title, category, date, description, imageUrl, content, password, email } = body;

    if (!email) {
      return json({ error: "email_requerido" }, 400);
    }

    if (!title || !category || !date || !description || !content || !password) {
      return json({ error: "campos_requeridos" }, 400);
    }

    // Validar que el email esté autorizado
    if (!isEmailAllowed(env, email)) {
      return json({ error: "email_no_autorizado" }, 403);
    }

    // Verificar contraseña
    const passwordOk = await verifyPassword(env, password);
    if (!passwordOk) {
      return json({ error: "contraseña_incorrecta" }, 403);
    }

    // Generar nombre de archivo
    const filename = getFilenameFromTitle(title);
    const categoryLabel = CATEGORY_LABELS[category] || category;
    const formattedDate = formatDate(date);
    const publishedTime = new Date(date).toISOString();

    // Generar HTML del artículo
    let articleHtml = ARTICLE_TEMPLATE.replace(/\{\{TITLE\}\}/g, title.replace(/"/g, "&quot;"))
      .replace(/\{\{DESCRIPTION\}\}/g, description.replace(/"/g, "&quot;"))
      .replace(/\{\{FILENAME\}\}/g, filename)
      .replace(/\{\{IMAGE_URL\}\}/g, imageUrl || "")
      .replace(/\{\{CATEGORY_LABEL\}\}/g, categoryLabel)
      .replace(/\{\{FORMATTED_DATE\}\}/g, formattedDate)
      .replace(/\{\{PUBLISHED_TIME\}\}/g, publishedTime)
      .replace(/\{\{CONTENT\}\}/g, content);

    // Obtener index.html actual
    const indexContent = await getFileContent(env, "blog/index.html");
    if (!indexContent) {
      return json({ error: "index_no_encontrado" }, 500);
    }

    // Generar tarjeta de artículo
    const cardHtml = `<!-- ARTÍCULO: ${title} -->
      <a href="./${filename}" class="blog-article-card" data-category="${category}">
  <img src="${imageUrl || ""}" alt="Artículo" class="blog-article-image" />
  <div class="blog-article-content">
    <span class="blog-article-category">${categoryLabel}</span>
    <div class="blog-article-date">${formattedDate}</div>
    <h3 class="blog-article-title">${title}</h3>
    <p class="blog-article-excerpt">${description}</p>
    <span class="blog-article-link">LEER MÁS</span>
  </div>
      </a>`;

    // Actualizar index.html
    const updatedIndex = insertArticleCard(indexContent.content, cardHtml);

    // Crear commits
    const commitSHA = await createCommit(
      env,
      [
        { path: `blog/${filename}`, content: articleHtml },
        { path: "blog/index.html", content: updatedIndex },
      ],
      `feat: Agregar artículo "${title}" al blog

- Nuevo archivo: blog/${filename}
- Actualizado: blog/index.html con tarjeta del artículo

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>`
    );

    return json({
      success: true,
      message: "Artículo publicado exitosamente",
      url: `https://www.cartodata.com/blog/${filename}`,
      commitSHA: commitSHA,
      filename: filename,
    });
  } catch (error) {
    console.error("Error publicando artículo:", error);
    return json(
      {
        error: "error_publicando",
        details: error.message,
      },
      500
    );
  }
}
