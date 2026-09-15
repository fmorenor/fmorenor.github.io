/**
 * Endpoint temporal para migrar URLs de imágenes
 * POST /api/admin/migrate - actualizar URLs incorrectas en D1
 */

import { validateAdminAuth, createAuthError } from './auth.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const auth = validateAdminAuth(request, env);
  if (!auth.valid) {
    return createAuthError(auth.error);
  }

  try {
    const result = await env.DB.prepare(`
      UPDATE images
      SET url = REPLACE(url, 'https://e883fcc90722d2b681a5282fe9581072.r2.cloudflarestorage.com', 'https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev')
      WHERE url LIKE '%e883fcc90722d2b681a5282fe9581072%'
    `).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'URLs actualizadas',
      result
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
