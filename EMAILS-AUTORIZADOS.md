# Configuración de Emails Autorizados

## ¿Cómo funciona?

El sistema ahora valida que el email que intenta acceder al builder esté en una **whitelist de emails autorizados**.

- Los usuarios con emails en la lista pueden:
  - ✅ Guardar borradores
  - ✅ Cargar borradores
  - ✅ Publicar artículos

- Los usuarios con emails NO autorizados reciben:
  - ❌ "Email no autorizado para publicar" en publicación
  - ❌ "Email no autorizado" en operaciones de borradores

## Dónde configurar

### Cloudflare Pages Dashboard

1. Ve a **Settings → Environment variables**
2. Crea/Edita la variable `ALLOWED_EMAILS`
3. Valor: `email1@example.com,email2@example.com,email3@example.com`
   - Separados por comas
   - Sin espacios después de las comas (se trimean automáticamente)
   - Case-insensitive (mayúsculas/minúsculas no importan)

### Ejemplo

```
ALLOWED_EMAILS = francisco@cartodata.com,maria@cartodata.com,carlos@cartodata.com
```

### Local (.env)

Para pruebas locales con `wrangler pages dev`:

```bash
ALLOWED_EMAILS=francisco@cartodata.com,maria@cartodata.com
```

## Comportamiento

- **Si `ALLOWED_EMAILS` NO está configurada**: El sistema funciona sin restricciones (solo requiere contraseña)
- **Si `ALLOWED_EMAILS` está vacía** (`""`): Ningún email se autoriza (bloquea a todos)
- **Si `ALLOWED_EMAILS` tiene valores**: Solo esos emails pueden acceder

## Agregar/Quitar emails

Para agregar un nuevo usuario:

1. Ve a Cloudflare Pages → Settings → Environment variables
2. Edita `ALLOWED_EMAILS`
3. Agrega el nuevo email: `francisco@cartodata.com,maria@cartodata.com,nuevo@cartodata.com`
4. Los cambios aplican inmediatamente en el siguiente deploy (unos segundos)

## Notas de seguridad

- **El email NO es para autenticación**, solo para identificar borradores
- La **contraseña** es lo que valida que puedas publicar
- El email es visible en borradores (para que otros no sobreescriban los tuyos)
- Puedes compartir el builder URL con otros, pero si su email no está en la whitelist, no podrán publicar

## Ejemplo de flujo bloqueado

```
1. Usuario ingresa: juan@example.com
2. Escribe un artículo
3. Clica "Guardar en Nube"
   → ❌ Error: "Email no autorizado"
4. Intenta publicar
   → ❌ Error: "Email no autorizado para publicar"
```

---

**Última actualización**: 2026-09-08
**Documentación**: Validación de whitelist de emails autorizados
