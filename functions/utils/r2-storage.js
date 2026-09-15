/**
 * Servicio de almacenamiento en Cloudflare R2
 * Maneja subida de imágenes y metadata
 */

/**
 * Sube una imagen a R2 y guarda metadata en D1
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} filename - Nombre original del archivo
 * @param {string} contentType - MIME type (ej: image/jpeg)
 * @param {Object} env - Variables de entorno (DB, IMAGES)
 * @returns {Object} - {success, imageId, url, error}
 */
export async function uploadImage(fileBuffer, filename, contentType, env) {
  try {
    // Validar archivo
    if (!fileBuffer || fileBuffer.length === 0) {
      return { success: false, error: 'Archivo vacío' };
    }

    if (fileBuffer.length > 10 * 1024 * 1024) {
      return { success: false, error: 'Archivo demasiado grande (máx 10MB)' };
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(contentType)) {
      return { success: false, error: 'Tipo de archivo no permitido' };
    }

    // Generar nombre único en R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = filename.split('.').pop();
    const r2Filename = `${timestamp}-${randomStr}.${ext}`;
    const r2Path = `blog/images/${r2Filename}`;

    // Subir a R2
    await env.IMAGES.put(r2Path, fileBuffer, {
      httpMetadata: {
        contentType: contentType,
      },
    });

    // Guardar metadata en D1
    const imageId = `${timestamp}-${randomStr}`;
    const domain = 'pub-0b66dd4321604e288d1651690d880dc2.r2.dev';
    const publicUrl = `https://${domain}/blog/images/${r2Filename}`;

    const { success } = await env.DB.prepare(`
      INSERT INTO images (filename, url, size, category)
      VALUES (?, ?, ?, ?)
    `).bind(filename, publicUrl, fileBuffer.length, 'blog').run();

    if (!success) {
      throw new Error('Error guardando metadata en D1');
    }

    return {
      success: true,
      imageId,
      url: publicUrl,
      size: fileBuffer.length,
      filename: r2Filename
    };
  } catch (error) {
    console.error('R2 upload error:', error);
    return {
      success: false,
      error: error.message || 'Error al subir imagen'
    };
  }
}

/**
 * Obtiene URL pública de una imagen en R2
 * @param {string} path - Ruta en R2
 * @param {string} domain - Dominio público
 * @returns {string} - URL pública
 */
export function getPublicUrl(path, domain) {
  return `https://${domain}/${path}`;
}

/**
 * Valida que el archivo sea una imagen válida
 * @param {Buffer} buffer - Contenido del archivo
 * @returns {Object} - {valid, type, error}
 */
export function validateImage(buffer) {
  if (!buffer || buffer.length < 4) {
    return { valid: false, error: 'Archivo demasiado pequeño' };
  }

  // Detectar tipo por magic numbers
  const hex = buffer.slice(0, 4).toString('hex');

  if (hex.startsWith('ffd8ff')) {
    return { valid: true, type: 'image/jpeg' };
  }
  if (hex.startsWith('89504e47')) {
    return { valid: true, type: 'image/png' };
  }
  if (hex.startsWith('52494646') && buffer[8] === 0x57) {
    return { valid: true, type: 'image/webp' };
  }
  if (hex.startsWith('47494638')) {
    return { valid: true, type: 'image/gif' };
  }

  return { valid: false, error: 'Formato no detectado' };
}

/**
 * Elimina una imagen de R2
 * @param {string} path - Ruta en R2
 * @param {Object} env - Variables (IMAGES)
 * @returns {Promise<boolean>}
 */
export async function deleteImage(path, env) {
  try {
    await env.IMAGES.delete(path);
    return true;
  } catch (error) {
    console.error('R2 delete error:', error);
    return false;
  }
}
