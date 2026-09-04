# Blog CartoData

Sección de blog del sitio de CartoData. Cada artículo es una página HTML estática con SEO individual.

## Cómo crear un nuevo artículo

### 1. Copiar el template

```bash
cp articulo-template.html mi-nuevo-articulo.html
```

### 2. Editar los metadatos SEO

En el `<head>`, personaliza estos valores:

```html
<title>Tu Título · Blog — CartoData</title>
<meta name="description" content="Descripción breve (160 caracteres)..." />
<link rel="canonical" href="https://www.cartodata.com/blog/mi-nuevo-articulo.html" />

<meta property="og:url" content="https://www.cartodata.com/blog/mi-nuevo-articulo.html" />
<meta property="og:title" content="Tu Título · Blog — CartoData" />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://www.cartodata.com/images/mi-imagen-og.jpg" />

<meta name="article:published_time" content="YYYY-MM-DDTHH:00:00Z" />
```

### 3. Llenar el contenido

- **Hero (sección superior):** Imagen de portada, título, descripción corta, categoría, fecha
- **Contenido:** Usa `<h2>` para secciones, `<h3>` para subsecciones, `<p>` para párrafos
- **Imágenes:** Envuelve en `<figure class="blog-figure">` con `<figcaption>`
- **Destaque:** Usa `<div class="blog-highlight">` para estadísticas o insights clave
- **Enlaces:** Automáticamente estilizados con color azul y subrayado

### 4. Artículos relacionados

En la sección de pie ("Artículos relacionados"), reemplaza los 3 ejemplos con otros artículos del blog.

### 5. Guardar imágenes

Guarda las imágenes en `/images/` del proyecto. El template carga desde `../images/`.

### 6. Commit y push

```bash
git add blog/mi-nuevo-articulo.html
git commit -m "Agrega artículo: Tu Título"
git push origin main
```

Cloudflare despliega automáticamente.

## Verificación

### Local (preview)

```bash
npx serve -p 3000 .
# Abre http://localhost:3000/blog/mi-nuevo-articulo.html
```

### En el navegador

- ✅ Verificar que la imagen hero aparezca
- ✅ Meta tags en DevTools: `view-source` / `<head>` o Inspector > Network > tipo Document > Ctrl+L (resp headers)
- ✅ Links externos funcionan
- ✅ Responsive (redimensiona a mobile)

### SEO

- **Google Search Console:** Sumita la URL cuando publiques
- **og:image:** Asegúrate de que sea 1200×630px (redes sociales)
- **Canonical:** Siempre apunta a HTTPS con dominio completo

## Estructura del template

```
blog-hero          → Imagen grande + título + descripción
blog-content       → Cuerpo principal del artículo
  h2, h3           → Secciones y subsecciones
  p                → Párrafos
  blog-figure      → Imágenes con pie de foto
  blog-highlight   → Bloques destacados (estadísticas)
  a                → Enlaces (estilizados automáticamente)

blog-footer        → Autor + artículos relacionados
  blog-author      → Info del autor
  blog-related     → Cards de 3 artículos relacionados
```

## Tips

- **Títulos:** Claros, no más de 70 caracteres para SEO
- **Párrafos:** 2-3 oraciones max para legibilidad en mobile
- **Imágenes:** JPEG o PNG (no AVIF en preview screenshots)
- **Enlaces:** Usa URLs completas con HTTPS
- **Categorías:** Usa tags simples como "Drones & Geomática", "Construcción", "Geosoftware", etc.

## Problemas comunes

**P: La imagen hero no aparece**  
R: Verifica que la URL sea HTTPS y que la imagen exista. El navegador debe poder accederla.

**P: Los links no se ven azules**  
R: Los estilos están en el `<style>` del template. Si no funciona, verifica que no haya un CSS que lo sobrescriba en `shared.js`.

**P: ¿Cómo agrego más de 3 artículos relacionados?**  
R: Copia más bloques `.blog-card` y ajusta `grid-template-columns` en el CSS si es necesario.

---

**Preguntas?** Contacta al equipo de CartoData.
