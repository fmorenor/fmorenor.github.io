/**
 * Helper para autenticación de admin
 */

export function validateAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  const password = request.headers.get('X-Admin-Password');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const token = authHeader.slice(7);

  if (token !== env.PUBLISH_PASSWORD) {
    return { valid: false, error: 'Invalid token' };
  }

  if (password !== env.PUBLISH_PASSWORD) {
    return { valid: false, error: 'Invalid password header' };
  }

  return { valid: true };
}

export function createAuthError(message = 'Unauthorized', status = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
