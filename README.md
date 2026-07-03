# CartoData — Sitio Web

Sitio web de [CartoData](https://www.cartodata.mx) — soluciones geoespaciales para ciudades, infraestructura, minería e instituciones.

Publicado en GitHub Pages: **https://fmorenor.github.io/cartodata-web/**

---

## Estructura del proyecto

```
CartoData/
├── index.html            # Página principal (bundle React compilado + inyecciones JS)
├── shared.js             # Nav + Footer + CSS base compartidos para páginas estáticas
├── site.css              # Design tokens: variables CSS, tipografía, colores, reset
│
│   ── Páginas estáticas (Impacto) ──
├── ciudades.html         # Ciudades y Municipios · Cartomorfosis
├── infraestructura.html  # Infraestructura · Obra 4D (seguimiento con drones)
├── mineria.html          # Minería · Geointeligencia para la industria extractiva
├── instituciones.html    # Instituciones · Modernización catastral y registral
│
│   ── Páginas estáticas (Tecnología) ──
├── procesos.html         # Procesos geoespaciales
├── cartografica.html     # Cartografía (fotogrametría, LiDAR, OBLIX, Visión 360)
├── geosoftware.html      # GeoSoftware (AU4 y eCarto)
│
│   ── Páginas estáticas (Cultura) ──
├── historia.html         # 90 años de historia (1930–hoy)
├── equipo.html           # Equipo · valores FLOW
│
│   ── X-Ray ──
├── xray.html             # Chat conversacional de captura de leads (PROTOTIPO, modo demo)
│
├── assets/
│   ├── index-*.js        # Bundle React compilado (NO editar)
│   └── index-*.css       # CSS del bundle React (NO editar)
├── images/               # Imágenes de todas las páginas estáticas
│   └── icons/            # Iconos PNG de sistemas (eSellos, GDB, Oblix, mineria…)
└── manus-storage/        # Videos y assets fuente (logos, videos hero originales)
```

---

## Arquitectura

El sitio combina **un bundle React** (index.html) con **páginas estáticas HTML** que comparten nav/footer vía `shared.js`. Todo se sirve como archivos estáticos en GitHub Pages — **no hay backend**.

### index.html — Página principal (bundle React)

El bundle React compilado **no se edita directamente**. Todas las modificaciones se hacen mediante **inyección de scripts** al final del `<body>`.

**Inyecciones de contenido:**

| Función | Qué hace |
|---|---|
| `injectCostCharts()` | Gráfica SVG animada en la sección de costos comparativos |
| `injectCasesHero()` | Sección Casos de éxito con videos YouTube y tarjetas interactivas |
| `fixStepNumbers()` | Círculos azules con números en la sección de proceso |
| `injectTeamCarousel()` | Carrusel de fotos del equipo con timer automático |
| `injectToolsHero()` | Sección Herramientas con hero de 3 slides (Procesos, Datos, Software) |
| `injectHistoria()` | Contenido de la sección Historia |
| `initPrivacyModal()` / `initTermsModal()` | Modales de Aviso de privacidad y Términos |
| `patchInfraText()` | Reemplaza "Puertos" → "Líneas eléctricas" en el hero de Infraestructura |
| `patchMineriaHref()` | Parcha el href `#minas` heredado del bundle |
| `reorderTechMenu()` | Reordena dropdown Tecnología: Procesos → Cartográfica → GeoSoftware |

**Hooks de navegación** — el nav lo renderiza React; sus items del dropdown son `<button>`/`<a>` sin ruta a la página estática. Cada hook intercepta el click (por texto del botón o por `href` ancla) y navega a la página correspondiente:

| Hook | Destino |
|---|---|
| `hookCiudadesNav()` | `ciudades.html` |
| `hookInfraestructuraNav()` | `infraestructura.html` |
| `hookMineriaNav()` | `mineria.html` |
| `hookInstitucionesNav()` | `instituciones.html` |
| `hookProcesosNav()` | `procesos.html` |
| `hookCartograficaNav()` | `cartografica.html` |
| `hookGeoSoftwareNav()` | `geosoftware.html` |
| `hookHistoriaNav()` | `historia.html` |
| `hookEquipoNav()` | `equipo.html` |
| `styleXRayNav()` | Estiliza X-Ray (blanco/bold) y navega a `xray.html` |

> **Patrón de hook:** `MutationObserver` sobre `document.body` + varios `setTimeout` de respaldo (500/2000/4000 ms), porque el nav de React se re-renderiza. Se marca cada elemento con un `dataset` (`cdMinHooked`, etc.) para no enganchar dos veces.

### shared.js — Nav y Footer compartidos

Se carga en **todas** las páginas estáticas con una línea al final del `<body>`:

```html
<script src="./shared.js" defer></script>
```

Inyecta automáticamente:

1. **`site.css`** — design tokens y tipografía, y la fuente DM Sans de Google Fonts
2. **Nav fijo** con logo, dropdowns (Impacto / Tecnología / Cultura / Noticias / X-Ray), toggle idioma ES/EN y toggle tema claro/oscuro
3. **Footer** con logo, grid de navegación, contacto y links legales

Los enlaces del nav (`NAV_LINKS`) apuntan a las páginas estáticas — p. ej. Impacto → {ciudades, infraestructura, mineria, instituciones}, Tecnología → {procesos, cartografica, geosoftware}, X-Ray → `xray.html`.

Estado persistente entre páginas vía `localStorage` (mismas claves que el bundle React):
- `localStorage["theme"]` → `"dark"` / `"light"`
- `localStorage["cartodata-lang"]` → `"es"` / `"en"`

### site.css — Design system

| Token | Dark | Light |
|---|---|---|
| `--font-sans` | `"DM Sans", "Inter", system-ui` | ← igual |
| `--blue` | `#3b5bdb` | ← igual |
| `--blue-light` | `#7b9cff` | ← igual |
| `--bg` | `#050816` | `#f8fafc` |
| `--text` | `#f8fafc` | `#0f172a` |

Las páginas estáticas comparten estos tokens: fondo oscuro `#050816` / `#0b1022` / `#0f172a`, azul de marca `#3b5bdb` (hover `#2d4bbd`), fuente **DM Sans**, botones `border-radius: 999px`.

---

## Páginas

### Impacto
- **ciudades.html** — Hero (izquierda) → Dolor → Metodología Cartomorfosis (imagen + 3 pilares) → CTA
- **infraestructura.html** — Hero video → 3 tarjetas de servicio con imagen (video / fotogramétrico / 3D) → Características (iconos) → Demos (ComparaDrone + Vimeo) → CTA
- **mineria.html** — Hero video → Intro (video drone) → 5 secciones alternas (Impacto Ambiental · Cálculo de Volúmenes · Topografía · LiDAR · Reportes) → **Video divisor YouTube full-screen** (play/pausa según viewport) → CTA
- **instituciones.html** — Hero video → Caso de éxito Los Cabos (YouTube) → Métricas animadas → Constelación de sistemas (Info & Tecnologías, Gestión con cards oscuras, Sistemas de gestión) con divisores full-width → CTA

### Tecnología
- **procesos.html** — Hero parallax → Catálogo de análisis → Profesionalización de equipos → CTA
- **cartografica.html** / **geosoftware.html** — Fotogrametría, LiDAR, OBLIX, Visión 360, AU4, eCarto

### Cultura
- **historia.html** — Hero (`legacy.jpg`) → Timeline 1930–hoy → Valores → CTA
- **equipo.html** — Hero carrusel → Sección **FLOW** (la letra grande se ilumina según el valor seleccionado) → equipos por oficina

### X-Ray
- **xray.html** — **Prototipo** de asistente conversacional para captura de leads. Ver sección abajo.

---

## X-Ray — Asistente de captura de leads (prototipo)

`xray.html` es un chat que conversa con el visitante, reúne los datos de un lead (necesidad, sector, institución, contacto, fecha) y muestra un resumen + confirmación.

**Estado actual: PROTOTIPO en modo demo.** Las respuestas del bot son **simuladas** (guion lineal en JS); `submitLead()` solo hace `console.log`. **No hay ninguna API key ni webhook embebidos en el HTML.**

**Plan de producción (pendiente, al migrar a Cloudflare):**
- Un **Cloudflare Worker** guarda la `ANTHROPIC_API_KEY` del lado servidor y conduce la conversación con **Claude** (tool-use para extraer los campos de forma estructurada).
- Al completar el lead, se envía a **CartoFlow** mediante el edge function `submit-landing-lead` (Supabase) o el Worker, que agrega el `x-webhook-secret` del lado servidor.
- ⚠️ **Regla de seguridad:** el `x-webhook-secret` y las API keys **nunca** van en el HTML público — siempre del lado servidor.
- En el código, el comentario `// AQUÍ irá la llamada real al Worker → webhook CartoFlow` marca el punto de integración.

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

`shared.js` inyecta nav + dropdowns + footer + tipografía + colores + tema + idioma.

Si la página debe abrirse desde el nav del **index** (bundle React), agrega también un hook de navegación en `index.html` siguiendo el patrón de `hookMineriaNav()`.

---

## Servidor local

```bash
# Sin flag -s para servir múltiples archivos HTML estáticos
npx serve -p 3000 /ruta/a/CartoData
```

- `http://localhost:3000/` — index.html
- `http://localhost:3000/mineria.html` — cualquier página estática

> No usar `-s` (SPA mode) — redirige todo a index.html y las páginas estáticas dan 404.

---

## Deploy a GitHub Pages

El sitio se publica en cada push a `main`:

```bash
git add <archivos>
git commit -m "Descripción del cambio"
git push
```

Publicado en: **https://fmorenor.github.io/cartodata-web/**
