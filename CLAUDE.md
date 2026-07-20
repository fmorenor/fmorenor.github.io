# CLAUDE.md — Guía para agentes en el repo CartoData

Guía operativa para trabajar en este sitio. Para la descripción completa del proyecto, ver `README.md`.

## Qué es

Sitio de CartoData: **frontend estático** (bundle React en `index.html` + páginas estáticas HTML) desplegado en **Cloudflare Pages** (https://cartodata-web.pages.dev). La única lógica de servidor son las **Pages Functions** de `functions/api/*` (backend del chatbot X-Ray).

## Cómo editar cada superficie

- **Home (`index.html`)**: es un **bundle de React compilado — NO editar el bundle**. Se modifica con **inyecciones JS** al final del `<body>` (IIFE tipo `inject…()` / `hook…()`). Para redirigir un ítem del nav a una página estática, añade una fila al arreglo `TARGETS` de `hookNavRedirects()`.
- **Páginas estáticas** (`procesos.html`, `ciudades.html`, …): HTML normal. Todas cargan `shared.js`, que inyecta nav, footer, modales, `site.css` y la fuente DM Sans.
- **`shared.js`**: nav/footer/modales compartidos por las páginas estáticas. Los modales (Privacidad, Términos, **Ubicaciones**) están **duplicados** aquí y en `index.html` (arquitectura sin build). Al editar texto legal o de ubicaciones, actualizar **ambos** lugares (y las páginas `privacidad.html`/`terminos.html`).
- **`assets/index-*.js` / `*.css`**: bundle React — **NO editar**.
- **`404.html`**: la sirve Pages automáticamente.

## Flujo de trabajo (importante)

1. **Commit + push después de CADA cambio.** Cloudflare Pages auto-despliega en cada push a `main`.
2. **Verificar por DOM**, no asumir. Usa el navegador del preview (`npx serve -p 3000 .`) y comprueba con `read_page` / JS que el cambio quedó (src, texto, estado del modal, etc.). El renderizador de **screenshots** del preview a veces falla o no refleja el scroll — cuando pase, apóyate en la verificación por DOM (es prueba suficiente para cambios de texto/CSS/atributos).
3. El **push a veces falla por red** (`SSL_ERROR_SYSCALL`): reintentar 2–3 veces.
4. Referenciar imágenes como **markdown links clicables** en las respuestas.

## Convenciones de código/estilo

- **Fotos en tarjetas**: `.has-photo` + `object-fit: cover`.
- **Documentos/escaneos** (no recortar): modificador `.doc` → `object-fit: contain` + fondo blanco.
- **Infográficos anchos con texto**: sacarlos a ancho completo (no en media columna) o dan ilegibles; añadir enlace "Ver en grande" al PNG.
- **Screenshots del preview NO decodifican AVIF** → para **fotos** usar **JPEG/PNG**.
- CSS: cada página estática **redefine sus propios componentes** y esas definiciones **divergen a propósito** entre páginas. **No** consolidarlas a ciegas en `site.css` (rompería overrides por orden de cascada). Ver `[[refactor-p3-css-declined]]` en memoria.

## Imágenes

- Las imágenes las **guarda el usuario en `images/`** (los mensajes con imágenes pegadas no se pueden volcar a disco desde aquí).
- Cuidado al borrar imágenes por script: hay nombres con **espacios/`%20`/sufijos `(N)`/mayúsculas** y copias en `images/` e `images/icons/`. La detección por `grep` de "huérfanas" es poco confiable → verificar bien o dejar el borrado al usuario.

## Local / verificación

- `npx serve -p 3000 .` (resuelve URLs limpias como Cloudflare). **No** usar `python3 -m http.server` para probar rutas limpias (solo resuelve `.html`).
- Las **Pages Functions** (`/api/*`) solo corren en Cloudflare (o `wrangler pages dev`); en local dan 404.

## X-Ray (chatbot)

- `xray.html` + `functions/api/chat.js` (modelo **`claude-haiku-4-5`**) + `functions/api/upload.js`. **Funcional en producción.**
- Tools del modelo: `enviar_lead_cartoflow`, `finalizar_conversacion`. Lead → CartoFlow/Supabase.
- 🔒 **Nunca** poner `ANTHROPIC_API_KEY` ni secretos en el repo (sitio público). Ya están como env vars en Cloudflare Pages: `ANTHROPIC_API_KEY`, `CARTOFLOW_PROJECT_ID`, `SOCIAL_WEBHOOK_SECRET`.

## Notas de git

- Remoto: `github.com/fmorenor/cartodata-web` (el push muestra un aviso de "repository moved" a `fmorenor.github.io` — es inofensivo, el push llega bien y Cloudflare despliega).
- La identidad de git no está configurada global (commits como `franciscomoreno@Carto-MacBook.local`) — inofensivo, no lo "arregles".
- `source-rebuild/` está en `.gitignore` (no es el sitio desplegado).
- ⚠️ **`manus-storage/` SÍ es parte del sitio desplegado.** El bundle de React (`assets/index-*.js`) referencia 12 archivos de ahí (videos e imágenes del hero del home) y `shared.js` usaba sus logos. Sacarlo del repo rompió la media del home en producción. **No lo ignores ni lo borres.**
- 🔒 **Antes de untrackear/borrar CUALQUIER carpeta o archivo**, grepear si el sitio lo referencia — incluyendo **`assets/*.js`** (el bundle minificado), no solo los `.html` y `shared.js`.
