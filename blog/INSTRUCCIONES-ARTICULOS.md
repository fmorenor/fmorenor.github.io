# 📝 Guía para agregar artículos al Blog de CartoData

## ⚠️ PROBLEMA: Artículos sin formato

Si un artículo se ve sin estilos CSS, es porque **le falta la sección `<head>` completa** con:
- Meta tags SEO (title, description, canonical, etc.)
- Meta tags de Open Graph para redes sociales
- Meta tags de Twitter Card
- Script para cargar `shared.js`
- Script para corregir la ruta del logo
- **Toda la sección `<style>` con los estilos CSS**

---

## ✅ SOLUCIÓN: Usa el TEMPLATE

### Paso 1️⃣: Abre el archivo template
```
blog/TEMPLATE-ARTICULO.html
```

### Paso 2️⃣: Personaliza TODOS estos campos en `<head>`:

```html
<!-- Cambiar TODOS estos valores -->
<title>TITULO DEL ARTICULO · Blog — CartoData</title>
<meta name="description" content="DESCRIPCION BREVE DEL ARTICULO (máx 160 caracteres)." />
<link rel="canonical" href="https://www.cartodata.com/blog/nombre-del-archivo.html" />

<!-- Open Graph -->
<meta property="og:url" content="https://www.cartodata.com/blog/nombre-del-archivo.html" />
<meta property="og:title" content="TITULO DEL ARTICULO · Blog — CartoData" />
<meta property="og:description" content="DESCRIPCION BREVE PARA REDES SOCIALES." />
<meta property="og:image" content="URL DE LA IMAGEN HERO" />

<!-- Twitter -->
<meta name="twitter:title" content="TITULO DEL ARTICULO · Blog — CartoData" />
<meta name="twitter:description" content="DESCRIPCION BREVE PARA TWITTER." />
<meta name="twitter:image" content="URL DE LA IMAGEN HERO" />

<!-- Fecha (formato ISO 8601) -->
<meta name="article:published_time" content="2026-09-08T00:00:00Z" />
<meta name="article:modified_time" content="2026-09-08T00:00:00Z" />
```

### Paso 3️⃣: Personaliza el HERO del artículo

```html
<section class="blog-hero" style="background-image: url('URL_DE_LA_IMAGEN_HERO');">
  <img src="URL_DE_LA_IMAGEN_HERO" alt="Hero" class="blog-hero-bg" />
  <!-- ... resto igual ... -->
  <div class="blog-hero-content">
    <div class="blog-eyebrow">
      <span class="blog-category">CATEGORIA</span>
      DD de MESES de YYYY
    </div>
    <h1 class="blog-h1">TITULO DEL ARTICULO</h1>
    <p class="blog-subtitle">DESCRIPCION EN 1-2 LINEAS</p>
  </div>
</section>
```

### Paso 4️⃣: Agrega el contenido en `.blog-content`

```html
<div class="blog-content">
  <p>Tu contenido aquí...</p>
  <h2>Títulos de sección</h2>
  <h3>Subtítulos</h3>
  <ul>
    <li>Listas</li>
    <li>con viñetas</li>
  </ul>
  
  <!-- Para insertar videos de YouTube -->
  <div class="video-container">
    <iframe src="https://www.youtube.com/embed/VIDEO_ID" allowfullscreen></iframe>
  </div>
</div>
```

### Paso 5️⃣: Guarda con el nombre correcto

✅ Nombre correcto:
```
blog/nombre-descriptivo-del-articulo.html
```

❌ Nombres incorrectos:
```
Artículo 1.html
post.html
Mi artículo sobre X.html
```

---

## 📋 CHECKLIST antes de subir

- [ ] ¿El archivo tiene **todos los meta tags** en `<head>`?
- [ ] ¿La sección `<style>` está **completa**?
- [ ] ¿El `<title>` tiene el formato correcto: "Título · Blog — CartoData"?
- [ ] ¿Las URLs en Open Graph están correctas (canonical, og:url)?
- [ ] ¿La fecha está en formato ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)?
- [ ] ¿El nombre del archivo es descriptivo y en minúsculas con guiones?
- [ ] ¿El hero tiene imagen URL correcta?
- [ ] ¿La categoría es válida (Gobierno, Ciudades, Minería, etc.)?

---

## 🔗 Agregar tarjeta al blog/index.html

Una vez que el archivo esté correcto, agrega la tarjeta:

```html
<a href="./nombre-del-archivo.html" class="blog-article-card" data-category="categoria">
  <img src="URL_IMAGEN" alt="Artículo" class="blog-article-image" />
  <div class="blog-article-content">
    <span class="blog-article-category">Categoría</span>
    <div class="blog-article-date">DD de mes de YYYY</div>
    <h3 class="blog-article-title">Título del artículo</h3>
    <p class="blog-article-excerpt">Descripción o resumen breve</p>
    <span class="blog-article-link">LEER MÁS</span>
  </div>
</a>
```

---

## ⚡ Categorías válidas

- `ciudades`
- `mineria`
- `gobierno`
- `infraestructura`
- `construccion`
- `lidar`
- `vision360`
- `ecarto`
- `podcast`

---

## 📝 Ejemplo: Dates formato ISO 8601

✅ Correcto:
```html
<meta name="article:published_time" content="2026-09-08T00:00:00Z" />
```

❌ Incorrecto:
```html
<meta name="article:published_time" content="2026-09-08T00:00:00.000Z" />
```

---

## 💡 Resumen rápido

1. **Copia** `TEMPLATE-ARTICULO.html`
2. **Personaliza** TODOS los meta tags
3. **Agrega** tu contenido en `.blog-content`
4. **Guarda** con nombre descriptivo
5. **Agrega tarjeta** a `blog/index.html`
6. **Push** a GitHub → Cloudflare despliega automáticamente
