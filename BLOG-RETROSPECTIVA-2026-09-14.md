# Retrospectiva: Sistema de Publicación de Blog — 14 de Septiembre 2026

## Qué sucedió hoy

Intentamos publicar artículos del blog usando el builder (`/blog/builder-wysiwyg.html`) conectado a GitHub API. El flujo fallaba consistentemente con error **403 Forbidden** al intentar crear commits en el repositorio.

### Problemas encontrados:

1. **Autenticación de tokens**: Múltiples tokens de GitHub generados retornaban `401 Bad credentials` en llamadas a la API REST, aunque funcionaban correctamente con `git clone`.

2. **Complejidad de permisos**: La configuración de permisos del token no era clara en la UI de GitHub. Requería múltiples intentos y regeneraciones.

3. **Falta de visibilidad**: El código de Cloudflare Pages Functions no proporcionaba logs detallados de por qué fallaba la autenticación con GitHub.

4. **Flujo manual**: Terminamos creando manualmente el archivo HTML del artículo y la tarjeta del índice, luego haciendo push directo con `git`.

## Solución temporal implementada

- **Archivo HTML**: `blog/ahualulco-atendia-los-reportes-pero-el-problema-seguia.html` (creado manualmente)
- **Tarjeta en índice**: Agregada a `blog/index.html` (actualizado manualmente)
- **Método de publicación**: Push directo a GitHub usando token en URL: `git push "https://usuario:token@github.com/..."`

**Resultado**: El artículo está publicado y visible en el blog. Cloudflare Pages lo despliega automáticamente.

---

## Propuesta para el futuro: Arquitectura sin GitHub

El problema fundamental es depender de GitHub como almacenamiento y versioning. Planteo dos alternativas:

### Opción A: Base de datos + Cloudflare KV + Workers

**Flujo:**
```
Builder HTML → JSON → Cloudflare KV (almacenamiento)
                   ↓
              Cloudflare Worker (API)
                   ↓
              Genera HTML + actualiza index.html
                   ↓
              Publica en Cloudflare Pages (/blog/)
```

**Ventajas:**
- ✅ Sin dependencia de GitHub
- ✅ Almacenamiento directamente en Cloudflare (KV)
- ✅ Publicación automática sin commits
- ✅ Respuestas más rápidas (sin latencia de GitHub API)
- ✅ Backups pueden guardarse en D1 (Cloudflare SQL)

**Desventajas:**
- ❌ Sin historial de versiones (no es git)
- ❌ Requiere replicar la lógica de generación de HTML
- ❌ Menor control sobre cambios

### Opción B: Base de datos + S3/R2 + Metadata API

**Flujo:**
```
Builder → JSON → Cloudflare D1 (base de datos)
                   ↓
          Worker genera HTML
                   ↓
          Publica en R2 (/blog/*.html)
          Actualiza index.html en R2
```

**Ventajas:**
- ✅ Base de datos relacional (búsquedas, filtros)
- ✅ Metadatos persistentes (vistas, likes, comentarios futuros)
- ✅ Historial de cambios dentro de la DB
- ✅ Sin commits a GitHub
- ✅ Más escalable para futuras features

**Desventajas:**
- ❌ Costos de D1 (aunque mínimos para blog)
- ❌ Menos integrado con git

### Opción C: Híbrida (Recomendada)

**Flujo:**
```
Builder → JSON → Cloudflare D1 (metadata + contenido)
                   ↓
          Worker genera HTML + tarjeta
                   ↓
          Publica en R2 (/blog/)
          Actualiza index.html
                   ↓
          [OPCIONAL] Sync a GitHub (via Worker) para backup
```

**Ventajas:**
- ✅ Base de datos para queries
- ✅ Almacenamiento independiente (R2)
- ✅ GitHub como backup solamente
- ✅ Publicación instantánea
- ✅ Preparado para features futuras (comentarios, analytics, etc.)

---

## Implementación sugerida (próximas iteraciones)

### Fase 1: Database + KV
```javascript
// functions/api/publish-article-v2.js
export async function onRequestPost({ request, env }) {
  // 1. Validar y parsear el JSON del builder
  const article = await request.json();
  
  // 2. Guardar en Cloudflare KV
  await env.BLOG_KV.put(`article:${article.id}`, JSON.stringify(article));
  
  // 3. Generar HTML
  const html = generateArticleHTML(article);
  
  // 4. Generar tarjeta
  const card = generateCardHTML(article);
  
  // 5. Actualizar index.html en KV
  const index = await env.BLOG_KV.get('index.html');
  const updatedIndex = insertCard(index, card);
  await env.BLOG_KV.put('index.html', updatedIndex);
  
  return json({ success: true, url: `/blog/${article.slug}.html` });
}
```

### Fase 2: Migrar a D1 (opcional)
- Schema: `articles(id, title, slug, content, category, date, image, excerpt, author)`
- Índices para búsqueda y filtrado

### Fase 3: Sincronización con GitHub (opcional)
- Worker cron que haga push automático de cambios a GitHub como backup

---

## Decisión recomendada

**Usar Opción C (Híbrida)** porque:
1. **Separa responsabilidades**: DB para datos, R2 para archivos, GitHub como backup
2. **Escalable**: Fácil agregar comentarios, analytics, búsqueda después
3. **Resiliente**: No depende de GitHub API
4. **Instantáneo**: Publicación sin latencia
5. **Mantenible**: GitHub sigue siendo source of truth para código, no para contenido

---

## Próximos pasos

- [ ] Investigar costos de Cloudflare D1 para caso de uso de blog
- [ ] Diseñar schema de base de datos para artículos
- [ ] Crear migration script de artículos existentes (si es necesario)
- [ ] Implementar v2 del publish-article sin GitHub dependency
- [ ] Actualizar builder-wysiwyg.html para usar nueva API

---

**Nota**: Este documento es una reflexión sobre la arquitectura actual y opciones para mejorar el flujo de publicación. La solución temporal (push manual) es viable para ahora, pero arquitectura escalable es recomendable para futuro.
