/**
 * Helper para autenticación de admin
 */

export function validateAdminAuth(request, env) {
  // TODO: Implementar validación de contraseña con variables de entorno
  // Por ahora, permitimos sin contraseña para testing
  return { valid: true };
}

export function createAuthError(message = 'Unauthorized', status = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
