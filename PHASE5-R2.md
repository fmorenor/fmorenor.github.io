# Fase 5: Integración R2 - Almacenamiento de Imágenes

## ¿Qué es R2?

**R2** es el almacenamiento de objetos de Cloudflare (similar a AWS S3). Vamos a:

1. **Subir imágenes** desde el dashboard → R2
2. **Guardar metadata** en D1 (nombre, URL, tamaño)
3. **Generar URLs públicas** para usar en artículos
4. **Eliminar imágenes** de R2 cuando se eliminen de D1

---

## Flujo de subida de imagen

```
Dashboard (Galería)
    ↓
Arrastra imagen (Drag & Drop)
    ↓
POST /api/admin/images
    ↓
Validar imagen (JPEG, PNG, WebP, GIF)
    ↓
Subir a R2: /blog/images/{timestamp}-{random}.jpg
    ↓
Guardar metadata en D1:
  - filename: nombre original
  - url: https://r2-domain.com/blog/images/...
  - size: 245600 bytes
  - category: 'blog'
    ↓
Retorna URL pública
    ↓
Usuario ve "Imagen subida ✓"
    ↓
Puede usar URL en artículos
```

---

## Componentes implementados

### 1. **r2-storage.js** - Servicio de almacenamiento

```javascript
uploadImage(buffer, filename, contentType, env)
  → Sube a R2 y guarda metadata en D1

validateImage(buffer)
  → Detecta tipo de archivo (magic numbers)
  → Valida formato

deleteImage(path, env)
  → Elimina de R2
```

**Validaciones:**
- ✓ Solo imágenes (JPEG, PNG, WebP, GIF)
- ✓ Máximo 10MB
- ✓ Detección por magic numbers (no por extension)

### 2. **images.js** (actualizado)

**POST - Subir imagen:**
```
Recibe: FormData con file + category
↓
Valida formato
↓
Sube a R2
↓
Guarda metadata en D1
↓
Retorna: { url, imageId, size }
```

### 3. **wrangler.toml** (actualizado)

Agregado:
```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "cartodata-images"
```

---

## Ejemplo de uso

### Desde el dashboard:

1. **Abre** `/admin/dashboard-simple.html`
2. **Tab "Galería"**
3. **Arrastra imagen** (o click "Seleccionar")
4. Sistema:
   - ✓ Valida (es imagen)
   - ✓ Sube a R2
   - ✓ Guarda metadata en D1
   - ✓ Te da URL pública

### Resultado:
```
https://r2-domain.com/blog/images/1694775600000-abc123.jpg
```

### Usar en artículo:
```
Crear artículo
↓
Pega URL en campo "Imagen destacada"
↓
Guarda como "Publicado"
↓
Fase 4 compila HTML con imagen
```

---

## Archivos públicos en R2

```
cartodata-images/
  └── blog/
      └── images/
          ├── 1694775600000-abc123.jpg     (245 KB)
          ├── 1694775601000-def456.png     (512 KB)
          └── 1694775602000-ghi789.webp    (180 KB)
```

URLs públicas:
```
https://r2.cartodata.com/blog/images/1694775600000-abc123.jpg
https://r2.cartodata.com/blog/images/1694775601000-def456.png
https://r2.cartodata.com/blog/images/1694775602000-ghi789.webp
```

---

## Flujo completo: Crear artículo con imagen

### Paso 1: Subir imagen
```
Dashboard → Galería → Arrastra foto.jpg
Sistema genera URL: https://r2.../blog/images/1694775600000-xyz.jpg
```

### Paso 2: Crear artículo
```
Dashboard → Artículos → "+ Nuevo Artículo"
- Título: "Mi ciudad"
- Content: "<p>...</p>"
- Imagen destacada: https://r2.../blog/images/1694775600000-xyz.jpg
- Status: "Publicado"
```

### Paso 3: Compilación (Fase 4)
```
Sistema compila HTML con:
  - Imagen desde R2 ✓
  - Todos los datos ✓
  - Estilos profesionales ✓
Guarda: /blog/mi-ciudad.html
```

### Paso 4: Resultado
```
https://cartodata-web.pages.dev/blog/mi-ciudad.html
Muestra imagen con <img src="https://r2...">
```

---

## Configuración necesaria

### En Cloudflare Pages:

1. **Crear bucket R2:**
   ```
   Dashboard → R2 → Create bucket
   Name: cartodata-images
   ```

2. **Configurar CORS** (para acceso público)

3. **Environment variables:**
   - `R2_PUBLIC_DOMAIN`: URL pública del bucket
   - Ej: `https://r2-abc123.cartodata.com`

---

## Validaciones de seguridad

✓ **Tipo de archivo**: Solo imágenes (JPEG, PNG, WebP, GIF)  
✓ **Magic numbers**: Detecta por contenido, no por extension  
✓ **Tamaño máximo**: 10MB  
✓ **Sandboxing**: En bucket aparte `/blog/images/`  
✓ **Auth**: Requiere contraseña admin  

---

## Próximas mejoras

- [ ] Optimización de imágenes (resize, WebP)
- [ ] Cache busting (versiones de URL)
- [ ] CDN global (ya en Cloudflare)
- [ ] Eliminación automática de huérfanas (imágenes no usadas)

---

## Resumen técnico

| Componente | Función |
|-----------|---------|
| **r2-storage.js** | Servicio de upload a R2 |
| **images.js** | Endpoint POST con validación |
| **wrangler.toml** | Binding de R2 |
| **D1** | Metadata de imágenes |

---

**Estado**: ✅ Implementado  
**Fecha**: 2026-09-15  
**Sistema completo**: ✅ Listo

Ahora tienes:
- ✅ Fase 1: D1 Database
- ✅ Fase 2: APIs CRUD
- ✅ Fase 3: Admin Dashboard
- ✅ Fase 4: Compilador HTML
- ✅ Fase 5: R2 Storage

**¡Sistema de blog completamente funcional!**
