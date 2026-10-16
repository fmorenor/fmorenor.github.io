export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.cartodata.com') {
    return new Response('Not found', { status: 404 });
  }
  return context.next();
}
