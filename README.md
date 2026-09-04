# CartoData — Sitio Web

Sitio web de [CartoData](https://www.cartodata.com) — soluciones geoespaciales para ciudades, infraestructura, minería e instituciones.

**En vivo (Cloudflare Pages):** https://cartodata-web.pages.dev

---

## Estructura del proyecto

```
CartoData/
├── index.html            # Página principal (bundle React compilado + inyecciones JS)
├── shared.js             # Nav + Footer + modales + CSS base para páginas estáticas
├── site.css              # Design tokens: variables CSS, tipografía, colores, reset
├── 404.html              # Página 404 con branding (la sirve Pages automáticamente)
│
│   ── Páginas estáticas (Impacto) ──
├── ciudades.html         # Ciudades y Municipios · Cartomorfosis
├── construccion.html     # Construcción · Obra 4D (seguimiento con drones)
├── mineria.html          # Minería · Geointeligencia para la industria extractiva
├── instituciones.html    # Instituciones · Modernización catastral (oculta del menú; se rehará)
│
│   ── Páginas estáticas (Tecnología) ──
├── procesos.html         # Procesos geoespaciales
├── cartografica.html     # Cartografía (fotogrametría, LiDAR, OBLIX, Visión 360) — nav: "Datos"
├── geosoftware.html      # GeoSoftware (AU4 y eCarto)
│
│   ── Páginas estáticas (Cultura) ──
├── historia.html         # 90 años de historia (1930–hoy)
├── equipo.html           # Equipo · valores FLOW
│
│   ── X-Ray (chatbot con IA, funcional en producción) ──
├── xray.html             # Chat de captura de leads con Claude
│
│   ── Legal ──
├── privacidad.html       # Aviso de Privacidad (URL: /privacidad)
├── terminos.html         # Términos y Condiciones (URL: /terminos)
│
├── functions/            # Cloudflare Pages Functions (backend de X-Ray)
│   └── api/
│       ├── chat.js       # Proxy seguro a la API de Claude + tools (lead / cierre)
│       └── upload.js     # Subida de archivos del lead a CartoFlow
│
├── assets/
│   ├── index-*.js        # Bundle React compilado (NO editar)
│   └── index-*.css       # CSS del bundle React (NO editar)
├── images/               # Imágenes de todas las páginas estáticas
│   └── icons/            # Iconos PNG de sistemas (eSellos, GDB, Oblix, mineria…)
├── manus-storage/        # ⚠️ SÍ se despliega: videos e imágenes del hero que
│                         #    referencia el bundle de React (12 archivos)
└── .gitignore            # Ignora .DS_Store, source-rebuild/, logs
```

> `source-rebuild/` **no** forma parte del sitio desplegado (está en `.gitignore`).
> **`manus-storage/` sí forma parte del sitio**: el bundle `assets/index-*.js` referencia 12 archivos de ahí (videos e imágenes del hero del home). No borrarlo ni ignorarlo.

---

## Arquitectura

El sitio combina **un bundle React** (`index.html`) con **páginas estáticas HTML** que comparten nav/footer/modales vía `shared.js`. El frontend es 100 % estático; la única lógica de servidor son las **Cloudflare Pages Functions** de `functions/api/*` que dan servicio al chatbot X-Ray.

### index.html — Página principal (bundle React)

El bundle React compilado **no se edita directamente**. Todas las modificaciones se hacen mediante **inyección de scripts** al final del `<body>` (IIFE tipo `inject…()` / `hook…()`).

**Inyecciones de contenido (selección):** `injectCostCharts()`, `injectCasesHero()`, `injectTeamCarousel()`, `injectToolsHero()`, `injectNoticias()`, `reorderTechMenu()` (renombra "Cartográfica" → "Datos"), `fixTradicionStat()` (etiqueta de estadística ES/EN), modales de Privacidad / Términos / Ubicaciones.

**Navegación (React → páginas estáticas):** el nav lo renderiza React y sus items no apuntan a las páginas estáticas. Se interceptan con una única función data-driven:

| Función | Qué hace |
|---|---|
| `hookNavRedirects()` | **Unifica** la redirección de 8 destinos (Historia, Ciudades, Minería, Infraestructura, Procesos, Cartográfica, GeoSoftware, Equipo). Cada destino se matchea por `href` ancla (`#x`/`/x`) o por texto/`h3` de la tarjeta. Config en el arreglo `TARGETS` — agregar una página nueva es una línea. |
| `hookInstitucionesNav()` | **Oculta** "Instituciones" de los menús (fuera de `<main>`) sin tocar la sección de contenido del hero. Temporal, mientras se rehace la página. |
| `styleXRayNav()` | Estiliza X-Ray (blanco/bold) y navega a `xray.html`. |

> **Patrón de hook:** `MutationObserver` sobre `document.body` + `setTimeout` de respaldo (500/2000/4000 ms), porque el nav de React se re-renderiza. Cada elemento se marca con un `dataset` (`cdNavHooked`, etc.) para no enganchar dos veces.

### shared.js — Nav, Footer y modales compartidos

Se carga en **todas** las páginas estáticas con una línea al final del `<body>`:

```html
<script src="./shared.js" defer></script>
```

Inyecta automáticamente:

1. **`site.css`** + la fuente **DM Sans**.
2. **Nav fijo** con dropdowns (Impacto / Tecnología / Cultura / Noticias / X-Ray), toggle idioma ES/EN y toggle tema claro/oscuro.
3. **Footer** con grid de navegación, contacto y links legales.
4. **Modales**: Aviso de Privacidad, Términos y Condiciones, y **Ubicaciones** (data-driven, arreglo `CD_LOCATIONS`).

Los enlaces del nav viven en `NAV_LINKS`. Estado persistente entre páginas vía `localStorage` (mismas claves que el bundle): `localStorage["theme"]` (`dark`/`light`) y `localStorage["cartodata-lang"]` (`es`/`en`).

### site.css — Design system

Tokens principales (dark = default; `.light` en `<html>` conmuta a claro):

| Token | Dark | Light |
|---|---|---|
| `--blue` | `#3b5bdb` (hover `#2d4bbd`) | ← igual |
| `--blue-light` | `#7b9cff` | ← igual |
| `--bg` | `#0d0d0d` | `#f8fafc` |
| `--text` | `#f8fafc` | `#0f172a` |
| `--font-sans` | `"DM Sans", "Inter", system-ui` | ← igual |

> ⚠️ Cada página estática **redefine sus propios componentes** (`.btn-primary`, `.section-eyebrow`, `.hero`…) en su `<style>` inline, y esas definiciones **divergen intencionalmente** entre páginas. No consolidarlas a ciegas en `site.css` (rompería overrides por orden de cascada).

---

## X-Ray — Chatbot de captura de leads (funcional en producción)

`xray.html` es un chat que conversa con el visitante, reúne los datos de un lead y los registra en el CRM. **Ya está en producción**, no es un prototipo.

- **Modelo:** Claude **Haiku 4.5** (`claude-haiku-4-5`) vía `functions/api/chat.js` (proxy seguro; la API key nunca toca el navegador).
- **Flujo comercial guiado:** bienvenida → datos de contacto → proyecto → área de interés (SHP/KMZ/KML) → si no hay archivos, ofrece reunión / tutoriales / WhatsApp. Cierra suave con la tool `finalizar_conversacion`.
- **Tools del modelo:** `enviar_lead_cartoflow`, `finalizar_conversacion`.
- **Adjuntos:** botón 📎 → `functions/api/upload.js` → CartoFlow (buffer si el lead aún no existe).
- **Conversación completa:** al cerrar, se sube como `conversacion-xray-*.md` a la pestaña Archivos del lead.

### CRM — CartoFlow / Supabase

- Crear lead (público): `POST …/functions/v1/submit-landing-lead` (`project_id`, `name`, `institution`).
- Subir archivo (requiere `x-webhook-secret`): `POST …/functions/v1/upload-lead-file`.

### Variables de entorno (Cloudflare Pages, ya configuradas)

`ANTHROPIC_API_KEY`, `CARTOFLOW_PROJECT_ID`, `SOCIAL_WEBHOOK_SECRET`.

> 🔒 **Nunca** poner API keys ni secretos en archivos del repo (sitio público).
> ⚠️ Cloudflare aplica las variables solo a despliegues creados **después** de agregarlas — redesplegar si se cambian.

---

## Blog — Historias de Cartomorfosis

Sección de contenido editorial con artículos sobre transformación digital en ciudades y municipios. Todos los artículos son **páginas estáticas HTML** que comparten nav/footer/estilos vía `shared.js`.

### Estructura

```
blog/
├── index.html                                    # Índice del blog (grid filtrable)
├── historias-de-cartomorfosis-e02t01-*.html    # Artículos (HTML estático)
├── historias-de-cartomorfosis-e03t01-*.html
├── historias-de-cartomorfosis-e04t01-*.html
├── historias-de-cartomorfosis-e05t01-*.html
├── historias-de-cartomorfosis-e06t01-*.html
├── builder.html                                 # Herramienta interna: builder de artículos
├── gallery.html                                 # Galería de imágenes (noindex, uso interno)
└── ...
```

### Crear un artículo nuevo

**Template base:**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Historias de cartomorfosis [EXTY01] – NOMBRE · Blog — CartoData</title>
  <meta name="description" content="Resumen breve del artículo (160 caracteres aprox)" />
  <meta name="article:published_time" content="YYYY-MM-DDTHH:MM:SS.000Z" />
  <meta name="author" content="CartoData" />
  <link rel="canonical" href="https://www.cartodata.com/blog/historias-de-cartomorfosis-exty01--nombre-url.html" />
  <meta property="og:title" content="Historias de cartomorfosis [EXTY01] – NOMBRE" />
  <meta property="og:description" content="Resumen breve del artículo" />
  <meta property="og:image" content="https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev/FOTO.jpg" />
  <meta property="og:url" content="https://www.cartodata.com/blog/historias-de-cartomorfosis-exty01--nombre-url.html" />
  <meta property="og:type" content="article" />
  
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
    /* Copiar estilos completos de un artículo existente (E04T01, E05T01, E06T01) */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
    body { background: #050816; color: #f8fafc; font-family: 'DM Sans', system-ui, sans-serif; }
    /* ... [copiar desde .blog-hero hasta media queries] ... */
  </style>
</head>
<body>
  <!-- Hero section con imagen de fondo -->
  <section class="blog-hero" style="background-image: url('https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev/FOTO.jpg');">
    <img src="https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev/FOTO.jpg" alt="Hero" class="blog-hero-bg" />
    <div class="blog-hero-overlay"></div>
    <div class="blog-hero-content">
      <div class="blog-eyebrow">
        <span class="blog-category">Podcast</span>
        DD de MESES de YYYY
      </div>
      <h1 class="blog-h1">Historias de cartomorfosis [EXTY01] – NOMBRE COMPLETO PERSONA</h1>
      <p class="blog-subtitle">Resumen/descripción del artículo</p>
    </div>
  </section>

  <!-- Contenido del artículo -->
  <article class="blog-container">
    <div class="blog-content">
      <!-- Video YouTube (opcional) -->
      <div style="position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1.5rem 0; border-radius: 8px;">
        <iframe src="https://www.youtube.com/embed/VIDEO_ID" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>
      </div>

      <h2>Entrevista</h2>
      <p>Contenido transcripción...</p>
    </div>
  </article>
</body>
</html>
```

**Pasos:**

1. Crear archivo: `blog/historias-de-cartomorfosis-exty01--nombre-url.html`
2. Copiar template arriba (con CSS completo de artículo existente)
3. **Reemplazar:**
   - `EXTY01` → número del episodio (E07T01, E08T01…)
   - `NOMBRE` → nombre de la persona entrevistada
   - `FOTO.jpg` → nombre de la imagen en R2
   - Fecha, descripción, contenido
4. **Agregar tarjeta al índice** (`blog/index.html`) en orden cronológico (más reciente primero):

```html
<!-- ARTÍCULO: CARTOMORFOSIS EXTY01 NOMBRE -->
<a href="/blog/historias-de-cartomorfosis-exty01--nombre-url.html" class="blog-article-card" data-category="podcast">
  <img src="https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev/FOTO.jpg" alt="Artículo" class="blog-article-image" />
  <div class="blog-article-content">
    <span class="blog-article-category">Podcast</span>
    <div class="blog-article-date">DD de MESES de YYYY</div>
    <h3 class="blog-article-title">Historias de cartomorfosis [EXTY01] – NOMBRE COMPLETO</h3>
    <p class="blog-article-excerpt">Descripción/resumen del artículo (máx 2 líneas)</p>
    <span class="blog-article-link">LEER MÁS</span>
  </div>
</a>
```

5. **Actualizar SEO:**
   - Agregar URL a `sitemap.xml` (ver sección **SEO** abajo)

### Galería de imágenes

**Ubicación:** `blog/gallery.html` (noindex, uso interno)

**Flujo:**
1. Subir imagen manualmente a R2 (Cloudflare) con URL: `https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev/nombre.jpg`
2. Ir a `blog/builder.html` → pegar URL completa en input de prueba
3. La galería se actualiza automáticamente (recarga cada 2 segundos)
4. Copiar URL desde galería para pegarla en el artículo

**API interna** (`functions/api/list-images.js`):
- `GET /api/list-images` — devuelve lista de imágenes (conocidas + agregadas)
- `POST /api/list-images` — agrega nueva imagen al store en memoria

**Imágenes conocidas** (hardcodeadas, persistentes):
```javascript
const knownImages = [
  { name: 'guillermoHernandezCD.jpg', url: `${publicDomain}/guillermoHernandezCD.jpg` },
  { name: 'sandraTovarCD.jpg', url: `${publicDomain}/sandraTovarCD.jpg` },
  { name: 'rodolfoGonzalezCD.jpg', url: `${publicDomain}/rodolfoGonzalezCD.jpg` },
  { name: 'martinpenaCD.jpg', url: `${publicDomain}/martinpenaCD.jpg` },
];
```

### SEO — Sitemap y meta tags

**Meta tags obligatorios en cada artículo:**

```html
<meta name="description" content="Resumen (150-160 caracteres)" />
<meta name="author" content="CartoData" />
<link rel="canonical" href="https://www.cartodata.com/blog/url-completa.html" />
<meta property="og:title" content="Título del artículo" />
<meta property="og:description" content="Resumen" />
<meta property="og:image" content="URL_FOTO" />
<meta property="og:url" content="https://www.cartodata.com/blog/url-completa.html" />
<meta property="og:type" content="article" />
```

**Sitemap:** Agregar entrada en `sitemap.xml`

```xml
<url>
  <loc>https://www.cartodata.com/blog/historias-de-cartomorfosis-exty01--nombre-url.html</loc>
  <lastmod>YYYY-MM-DD</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

---

## Desarrollo local

```bash
npx serve -p 3000 .     # resuelve URLs limpias (/procesos), como Cloudflare Pages
# o:  python3 -m http.server 3000   ← NO resuelve URLs limpias (solo rutas .html)
```

- `http://localhost:3000/` — index.html
- `http://localhost:3000/mineria` o `/mineria.html` — páginas estáticas

> ⚠️ Las **Pages Functions** (`/api/*`) solo corren en Cloudflare (o con `wrangler pages dev`); en un server estático dan 404. Se prueban en producción o con fetch mockeado.

---

## Crear una página nueva

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mi página — CartoData</title>
</head>
<body>
  <!-- Tu contenido aquí (usa los tokens de site.css) -->
  <script src="./shared.js" defer></script>
</body>
</html>
```

`shared.js` inyecta nav + dropdowns + footer + modales + tipografía + tema + idioma.
Si la página debe abrirse desde el nav del **index** (bundle React), añade una fila al arreglo `TARGETS` de `hookNavRedirects()` en `index.html`.

---

## Convenciones

- **Fotos en tarjetas:** clase `.has-photo` + `object-fit: cover`.
- **Documentos/escaneos** (no recortar): modificador `.doc` → `object-fit: contain` + fondo blanco.
- **Screenshots del preview no decodifican AVIF** → para **fotos** usar **JPEG/PNG**, no AVIF.
- **Límite Cloudflare:** 25 MiB por archivo.

---

## Deploy — Cloudflare Pages

Proyecto Pages **`cartodata-web`**. **Auto-despliega en cada push a `main`.** Sitio estático, sin build, output dir `/`. Las URLs limpias (`/procesos`, `/ciudades`…) las resuelve Pages solo.

```bash
git add <archivos>
git commit -m "Descripción del cambio"
git push origin main
```

**En vivo:** https://cartodata-web.pages.dev
