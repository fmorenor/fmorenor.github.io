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
├── infraestructura.html  # Infraestructura · Obra 4D (seguimiento con drones)
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
