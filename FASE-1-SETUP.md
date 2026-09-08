# Fase 1: Setup del Sistema de Publicación Automática

## Estado: ✅ COMPLETO

Todos los archivos backend han sido creados. Ahora necesitas configurar las variables de entorno.

## Archivos Creados

- ✅ `functions/api/publish-article.js` — Endpoint principal para publicar artículos
- ✅ `functions/api/drafts.js` — Gestión de borradores en KV
- ✅ `functions/utils/github-api.js` — Utilidades para GitHub API
- ✅ `wrangler.toml` — Bindings de KV actualizados

## Variables de Entorno Requeridas

### Local (`.env` — gitignored)

Crea un archivo `.env` en la raíz del proyecto:

```bash
# GitHub API
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_USERNAME=fmorenor
GITHUB_REPO=cartodata-web

# Contraseña (MVP: texto plano; TODO: cambiar a Argon2)
PUBLISH_PASSWORD=tu_contraseña_aqui

# Turnstile (usa la misma que existe en Cloudflare)
TURNSTILE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Cloudflare Pages Dashboard

Ve a **Settings → Environment variables** y configura como **Secrets**:

1. **Production** (main branch):
   ```
   GITHUB_TOKEN = github_pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   PUBLISH_PASSWORD = tu_contraseña_aqui
   TURNSTILE_SECRET_KEY = (copiar de donde está ahora)
   GITHUB_USERNAME = fmorenor
   GITHUB_REPO = cartodata-web
   ```

2. **Preview** (draft branches):
   - Las mismas variables anteriores

**IMPORTANTE**: 
- `GITHUB_TOKEN` debe ser un **Personal Access Token** (fine-grained)
- Permisos mínimos: `contents:read/write` solo en repo `cartodata-web`
- Permisos especiales: `Commit statuses` (read/write)
- Nunca subir el token al repo

## KV Namespaces

Ya configurados en `wrangler.toml`:
- `GALLERY_KV` (existente)
- `DRAFTS_KV` (nueva)
- `RATE_LIMIT` (nueva)

En Cloudflare Pages dashboard:
1. Ve a **Settings → Functions → KV Namespace Bindings**
2. Verifica que existan:
   - `gallery_kv_namespace`
   - `drafts_kv_namespace`
   - `rate_limit_namespace`
3. Si no existen, créalos en Cloudflare KV dashboard primero

## Pruebas Locales

```bash
# Verificar que wrangler está instalado
npx wrangler --version

# Ejecutar dev server local (funciona sin Cloudflare)
npx wrangler pages dev .

# En otra terminal, prueba el endpoint:
curl -X POST http://localhost:8788/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "title": "Test Article",
    "category": "ciudades",
    "date": "2026-09-08",
    "description": "Test description",
    "content": "<p>Test content</p>"
  }'

# Debería responder:
# {"success": true, "draftId": "draft:test@example.com:1234567890", ...}
```

## Pasos Siguientes (Phase 2: Frontend)

Una vez que Phase 1 esté configurado:

1. **Actualizar `blog/builder-wysiwyg.html`**:
   - Agregar campo de contraseña
   - Reemplazar botón "Copiar tarjeta" con "Publicar"
   - Agregar panel "Mis Borradores"
   - Implementar llamadas a `/api/drafts` y `/api/publish-article`

2. **Testing end-to-end**:
   - Crear borrador en el builder
   - Guardar a KV
   - Publicar con contraseña correcta
   - Verificar que artículo aparece en GitHub
   - Verificar que `blog/index.html` se actualizó

## Notas de Implementación

### Limpieza Necesaria

El código actual de `publish-article.js` tiene un **TODO**:
```javascript
// Para MVP, comparación simple de contraseña
// TODO: Implementar Argon2 hash verification cuando sea posible en Workers
return password === env.PUBLISH_PASSWORD;
```

Para producción, cambiar a:
1. Usar `argon2` en Node.js para generar hash inicial
2. Almacenar hash en Cloudflare KV (o env var)
3. Usar módulos WASM de Argon2 en Workers (cuando esté disponible)

### Patrón de Commits Automáticos

El sistema crea commits con:
```
feat: Agregar artículo "Título" al blog

- Nuevo archivo: blog/nombre-del-archivo.html
- Actualizado: blog/index.html con tarjeta del artículo

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

GitHub auto-despliega en Cloudflare Pages inmediatamente.

### Rate Limiting

3 intentos de publicación por IP cada 5 minutos, usando KV.
- Clave: `rl:publish:IP_ADDRESS:EPOCH_MINUTO`
- Si se alcanza el límite: error 429 (Too Many Requests)

### Validación de Bot (Turnstile)

Requerido en cada publicación.
- Si falla: error 403 (Forbidden)
- Usa el mismo `TURNSTILE_SECRET_KEY` del chatbot X-Ray

## Checklist de Completitud

- [ ] Crear `.env` con `GITHUB_TOKEN`, `PUBLISH_PASSWORD`, etc.
- [ ] Verificar que `wrangler.toml` tiene los 3 KV namespaces
- [ ] Configurar secrets en Cloudflare Pages dashboard
- [ ] Crear KV namespaces en Cloudflare si no existen
- [ ] Prueba local: `npx wrangler pages dev .`
- [ ] Prueba `/api/drafts` (POST/GET/DELETE)
- [ ] Actualizar `blog/builder-wysiwyg.html` (Phase 2)
- [ ] Prueba end-to-end: publicar artículo desde builder
- [ ] Verificar commit en GitHub
- [ ] Verificar despliegue en Cloudflare Pages

## Preguntas Frecuentes

### ¿Cómo genero un GitHub Personal Access Token?

1. GitHub → Settings → Developer settings → Personal access tokens (fine-grained)
2. Clic en "Generate new token"
3. Nombre: "CartoData Publisher"
4. Expiration: 90 días (recomendado revisar regularmente)
5. Repository access: `fmorenor/cartodata-web`
6. Permissions:
   - `Contents` → read & write
   - `Commit statuses` → read & write
7. Clic "Generate token" y copiar (solo se muestra una vez)

### ¿Puedo probar sin GitHub token?

No. El token es necesario para crear commits. Pero puedes:
1. Generar un token temporal
2. Ejecutar pruebas locales
3. Verificar que los endpoints responden

### ¿Dónde guardo el password?

Para MVP, está en texto plano en Cloudflare. Para producción:
1. Generar hash Argon2: `npx argon2 "mi_contraseña"`
2. Guardar hash en KV
3. En `publish-article.js`, verificar contra hash

### ¿Puedo cambiar el password después?

Sí. Solo actualiza la env var en Cloudflare Pages dashboard.
El nuevo password aplica inmediatamente en el siguiente deploy.

---

**Última actualización**: 2026-09-08
**Estado**: Phase 1 Backend Completo, Esperando Configuración
