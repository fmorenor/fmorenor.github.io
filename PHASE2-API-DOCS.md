# Fase 2: APIs Backend - Documentación

## Endpoints CRUD Implementados

### Autenticación

**Todos los endpoints requieren:**

```
Authorization: Bearer <PUBLISH_PASSWORD>
X-Admin-Password: <PUBLISH_PASSWORD>
```

Ejemplo:
```bash
curl -X GET http://localhost:3000/api/admin/posts \
  -H "Authorization: Bearer mi-password-secreto" \
  -H "X-Admin-Password: mi-password-secreto"
```

---

## Posts CRUD

### GET /api/admin/posts - Listar artículos

**Parámetros de query:**
- `status` (opcional): `draft` | `published` (default: `published`)
- `category` (opcional): filtrar por categoría
- `limit` (opcional, default: 50)
- `offset` (opcional, default: 0)

**Response:**
```json
{
  "articles": [
    {
      "id": "abc123...",
      "slug": "mi-articulo",
      "title": "Mi Artículo",
      "excerpt": "Descripción corta",
      "content": "<h1>Contenido HTML</h1>",
      "category": "gobierno",
      "image_url": "https://...",
      "author": "CartoData",
      "status": "published",
      "published_at": "2026-09-15T10:00:00Z",
      "created_at": "2026-09-15T10:00:00Z",
      "updated_at": "2026-09-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/posts - Crear artículo

**Body (JSON):**
```json
{
  "slug": "mi-nuevo-articulo",
  "title": "Mi Nuevo Artículo",
  "content": "<h1>Contenido</h1><p>Lorem ipsum...</p>",
  "category": "ciudades",
  "excerpt": "Descripción corta",
  "image_url": "https://...",
  "author": "Francisco",
  "status": "draft"
}
```

**Campos requeridos:** `slug`, `title`, `content`, `category`  
**Campos opcionales:** `excerpt`, `image_url`, `author` (default: "CartoData"), `status` (default: "draft")

**Response (201):**
```json
{
  "success": true,
  "article": { ... }
}
```

---

### PUT /api/admin/posts/{id} - Editar artículo

**Parámetro de ruta:**
- `id`: ID del artículo

**Body (JSON):** Cualquier campo que quieras actualizar
```json
{
  "title": "Título actualizado",
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "article": { ... }
}
```

---

### DELETE /api/admin/posts/{id} - Eliminar artículo

**Parámetro de ruta:**
- `id`: ID del artículo

**Response:**
```json
{
  "success": true,
  "id": "abc123..."
}
```

---

## Images CRUD

### GET /api/admin/images - Listar imágenes

**Parámetros de query:**
- `category` (opcional): filtrar por categoría
- `limit` (opcional, default: 100)
- `offset` (opcional, default: 0)

**Response:**
```json
{
  "images": [
    {
      "id": "xyz789...",
      "filename": "1694775600000-photo.jpg",
      "url": "/images/1694775600000-photo.jpg",
      "size": 245600,
      "category": "ciudades",
      "uploaded_at": "2026-09-15T10:00:00Z"
    }
  ]
}
```

---

### POST /api/admin/images - Subir imagen

**Content-Type:** `multipart/form-data`

**Campos:**
- `file` (requerido): archivo de imagen
- `category` (opcional): categoría de imagen

**Ejemplo con curl:**
```bash
curl -X POST http://localhost:3000/api/admin/images \
  -H "Authorization: Bearer mi-password" \
  -H "X-Admin-Password: mi-password" \
  -F "file=@photo.jpg" \
  -F "category=ciudades"
```

**Response (201):**
```json
{
  "success": true,
  "image": { ... }
}
```

---

### DELETE /api/admin/images/{id} - Eliminar imagen

**Parámetro de ruta:**
- `id`: ID de la imagen

**Response:**
```json
{
  "success": true,
  "id": "xyz789..."
}
```

---

## Códigos de error

| Código | Descripción |
|--------|-------------|
| 400 | Solicitud inválida (campos faltantes) |
| 401 | No autenticado |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: slug duplicado) |
| 405 | Método no permitido |
| 500 | Error interno del servidor |

---

## Ejemplo de uso con JavaScript

```javascript
const API_BASE = '/api/admin';
const PASSWORD = 'mi-password-secreto';

const headers = {
  'Authorization': `Bearer ${PASSWORD}`,
  'X-Admin-Password': PASSWORD,
  'Content-Type': 'application/json'
};

// Crear artículo
const response = await fetch(`${API_BASE}/posts`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    slug: 'mi-articulo',
    title: 'Mi Artículo',
    content: '<h1>Contenido</h1>',
    category: 'gobierno'
  })
});

const { article, success } = await response.json();
console.log(success ? 'Creado!' : 'Error');
```

---

## TODO - Integraciones pendientes

- [ ] Subida real a R2 (actualmente solo guarda metadata en D1)
- [ ] Compilador de artículos (generar HTML estático)
- [ ] Actualizar índice de blog automáticamente
- [ ] Validación de slug format
- [ ] Rate limiting por IP
- [ ] Logs de auditoría

---

**Estado**: ✅ Implementado  
**Fecha**: 2026-09-15
