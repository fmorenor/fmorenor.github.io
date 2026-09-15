# Fase 4: Compilador de Artículos

## ¿Qué hace?

Cuando **creas o actualizas un artículo con estado "Publicado"**, el sistema automáticamente:

1. **Toma los datos de D1** (título, contenido, imagen, etc.)
2. **Valida el artículo** (título, contenido, categoría requeridos)
3. **Genera HTML estático** profesional
4. **Guarda el archivo** en `/blog/{slug}.html`

Así el artículo es **accesible directamente** como página estática.

---

## Flujo visual

```
Admin Dashboard
    ↓
Completas form + "Publicar"
    ↓
POST /api/admin/posts
    ↓
D1 inserta artículo (status = "published")
    ↓
article-compiler.js compila HTML
    ↓
Genera /blog/mi-articulo.html
    ↓
Usuario accede a http://cartodata.com/blog/mi-articulo.html
    ↓
Ve página HTML estática con estilos
```

---

## Ejemplo de artículo compilado

### Input (datos en D1):
```json
{
  "id": "abc123",
  "slug": "mi-primer-articulo",
  "title": "Mi Primer Artículo",
  "excerpt": "Una descripción breve",
  "content": "<h2>Introducción</h2><p>Lorem ipsum...</p>",
  "category": "ciudades",
  "image_url": "https://r2.ejemplo.com/foto.jpg",
  "author": "Francisco",
  "status": "published",
  "published_at": "2026-09-15T10:00:00Z"
}
```

### Output (archivo generado):
```
/blog/mi-primer-articulo.html
```

El HTML incluye:
- ✅ Título, descripción, imagen destacada
- ✅ Categoría y autor
- ✅ Fecha de publicación
- ✅ Contenido completo (HTML renderizado)
- ✅ Estilos profesionales
- ✅ Navegación al blog
- ✅ Links responsivos

---

## Componentes

### `article-compiler.js`

**Funciones:**

| Función | Qué hace |
|---------|----------|
| `compileArticle(article)` | Genera HTML a partir de datos D1 |
| `generateSlug(title)` | Auto-genera slug desde título |
| `validateArticle(article)` | Valida campos requeridos |

**Validaciones:**
- ✓ Título requerido
- ✓ Slug requerido  
- ✓ Contenido requerido
- ✓ Categoría requerida

### `posts.js` (actualizado)

**Auto-compilación:**

Cuando haces:
```
POST /api/admin/posts
{
  "slug": "articulo-nuevo",
  "title": "Artículo Nuevo",
  "content": "<p>Contenido...</p>",
  "category": "ciudades",
  "status": "published"  ← CLAVE
}
```

El sistema automáticamente:
1. ✅ Inserta en D1
2. ✅ Detecta `status === "published"`
3. ✅ Compila HTML
4. ✅ Genera `/blog/articulo-nuevo.html`

---

## Template HTML

El compilador genera una página con:

- **Header** con título, categoría, autor, fecha
- **Imagen destacada** (si existe)
- **Contenido completo** renderizado
- **Footer** con link al blog
- **Estilos profesionales** (tipografía DM Sans, colores, espaciado)
- **Responsive** (funciona en móvil)

---

## Ejemplo de uso desde dashboard

1. **Abre** `/admin/dashboard-simple.html`
2. **Login** con tu contraseña
3. **Click** "+ Nuevo Artículo"
4. **Completa**:
   - Título: "Cómo mapear ciudades"
   - Slug: "como-mapear-ciudades" (auto-generado)
   - Categoría: "ciudades"
   - Contenido: "Lorem ipsum..."
   - Status: **"Publicado"** ← IMPORTANTE
5. **Click** "Guardar"
6. Sistema compila → Genera HTML → Listo

**Resultado:**
```
/blog/como-mapear-ciudades.html
```

Accesible en producción:
```
https://cartodata-web.pages.dev/blog/como-mapear-ciudades.html
```

---

## Próximas mejoras

- [ ] Compilador de índice de blog `/blog/index.html`
- [ ] Integración con R2 para imágenes
- [ ] Regeneración automática al editar
- [ ] Preview antes de publicar

---

## Notas técnicas

- **Compilación:** Sínchrona (ocurre inmediatamente)
- **Ubicación:** `/blog/{slug}.html` en filesystem
- **Template:** Reutiliza estilos de sitio
- **Validación:** Antes de compilar
- **Slug:** Auto-generado de título o manual

---

**Estado**: ✅ Implementado  
**Fecha**: 2026-09-15  
**Próxima**: Fase 5 - Integración R2
