# Fase 1: Infraestructura D1 - Instrucciones

## ✅ Completado

- [x] Actualizado `wrangler.toml` con binding D1
- [x] Creado archivo de migración SQL: `functions/migrations/001_create_schema.sql`
- [x] Creado endpoint de inicialización: `functions/api/admin/init-db.js`

## 📋 Pasos para completar Fase 1

### Paso 1: Crear BD D1 en Cloudflare

Ejecuta en tu terminal:

```bash
wrangler d1 create cartodata
```

Este comando te dará output como:

```
✅ Successfully created D1 database 'cartodata'.

Binding is available in your Worker on:
export const DB = env.DB;

Connection details:
Database ID: abc123def456...
Preview Database ID: preview_abc123def456...
```

### Paso 2: Actualizar `wrangler.toml`

Copia los IDs que obtuviste en Paso 1 y actualiza estos campos en `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cartodata"
database_id = "AQUI_TU_DATABASE_ID"
preview_database_id = "AQUI_TU_PREVIEW_DATABASE_ID"
```

### Paso 3: Aplicar migraciones

Opción A - Ejecutar migración con wrangler CLI:

```bash
wrangler d1 execute cartodata --file functions/migrations/001_create_schema.sql
```

Opción B - Ejecutar desde tu admin dashboard (después de Fase 3):

1. Ir a `http://localhost:3000/admin/dashboard.html`
2. Autenticarse
3. Hacer POST a `/api/admin/init-db` con tu `PUBLISH_PASSWORD`

### Paso 4: Verificar

Puedes listar las tablas con:

```bash
wrangler d1 execute cartodata --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Deberías ver:
- `articles`
- `images`

## 🔧 Variables de entorno

Verifica que estas variables existan en Cloudflare Pages (ya deberían estar):

- `PUBLISH_PASSWORD` ✅ (ya existe)
- `ANTHROPIC_API_KEY` ✅ (ya existe)

## 📊 Esquema de tablas

### `articles`
- `id` (TEXT, PK): UUID generado
- `slug` (TEXT, UNIQUE): URL-friendly identifier
- `title` (TEXT): Título del artículo
- `excerpt` (TEXT): Descripción corta
- `content` (TEXT): Contenido completo (HTML)
- `category` (TEXT): Categoría (gobierno, ciudades, infraestructura, etc.)
- `image_url` (TEXT): URL de imagen destacada
- `author` (TEXT): Autor
- `status` (TEXT): 'draft' | 'published'
- `published_at` (DATETIME): Fecha de publicación
- `created_at` (DATETIME): Fecha de creación
- `updated_at` (DATETIME): Última actualización

### `images`
- `id` (TEXT, PK): UUID generado
- `filename` (TEXT): Nombre del archivo
- `url` (TEXT): URL en R2
- `size` (INTEGER): Tamaño en bytes
- `category` (TEXT): Categoría (opcional)
- `uploaded_at` (DATETIME): Fecha de carga

## 🎯 Siguiente: Fase 2

Cuando completes estos pasos, estaremos listos para Fase 2:
- Implementar `/api/admin/posts` (CRUD)
- Implementar `/api/admin/images` (CRUD)

---

**Estado**: En Progreso ⏳
**Fecha**: 2026-09-15
