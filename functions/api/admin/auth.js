/**
 * Helper para autenticación de admin
 */

export function validateAdminAuth(request, env) {
  const password = request.headers.get('X-Admin-Password');
  const adminPassword = env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD no configurado en wrangler.toml');
    return { valid: false, error: 'Server not configured' };
  }

  if (!password) {
    return { valid: false, error: 'No password provided' };
  }

  if (password !== adminPassword) {
    return { valid: false, error: 'Invalid password' };
  }

  return { valid: true };
}

export function createAuthError(message = 'Unauthorized', status = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
