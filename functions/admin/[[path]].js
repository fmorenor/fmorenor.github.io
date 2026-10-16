export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (url.hostname === 'www.cartodata.com') {
    return Response.redirect(`https://cartodata-web.pages.dev${url.pathname}${url.search}`, 301);
  }

  const asset = await env.ASSETS.fetch(new URL(`${url.pathname}.html`, url));
  return asset.ok ? asset : env.ASSETS.fetch(request);
}
