// Configuración de API y constantes

const API_CONFIG = {
  BASE_URL: '/api/admin',

  // Headers requeridos para autenticación
  getHeaders(token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Admin-Password': token
    };
  },

  // Endpoints
  ENDPOINTS: {
    POSTS: '/posts',
    IMAGES: '/images'
  }
};

const CATEGORIES = [
  { value: 'gobierno', label: 'Gobierno' },
  { value: 'ciudades', label: 'Ciudades' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'actualidad', label: 'Actualidad' }
];

const STATUS_LABELS = {
  'draft': 'Borrador',
  'published': 'Publicado'
};

const STATUS_COLORS = {
  'draft': '#ff9500',
  'published': '#34c759'
};
