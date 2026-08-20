export class GalleryStore {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    if (request.method === 'GET') {
      return await this.getImages();
    }
    if (request.method === 'POST') {
      const data = await request.json();
      return await this.addImage(data);
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        },
      });
    }
    return new Response('Method not allowed', { status: 405 });
  }

  async getImages() {
    const stored = (await this.state.get('images')) || [];
    const publicDomain = 'https://pub-0b66dd4321604e288d1651690d880dc2.r2.dev';

    const knownImages = [
      { name: 'guillermoHernandezCD.jpg', url: `${publicDomain}/guillermoHernandezCD.jpg` },
      { name: 'sandraTovarCD.jpg', url: `${publicDomain}/sandraTovarCD.jpg` },
      { name: 'rodolfoGonzalezCD.jpg', url: `${publicDomain}/rodolfoGonzalezCD.jpg` },
      { name: 'martinpenaCD.jpg', url: `${publicDomain}/martinpenaCD.jpg` }
    ];

    const allImages = [...stored, ...knownImages];
    const unique = Array.from(new Map(allImages.map(img => [img.url, img])).values());

    return new Response(JSON.stringify({ success: true, images: unique }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }

  async addImage(data) {
    const { url, name } = data;

    if (!url || !name) {
      return new Response(JSON.stringify({ error: 'Missing url or name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const stored = (await this.state.get('images')) || [];
    const exists = stored.some(img => img.url === url);

    if (!exists) {
      stored.push({ name, url });
      await this.state.put('images', stored);
    }

    return new Response(JSON.stringify({ success: true, message: 'Image added to gallery' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
