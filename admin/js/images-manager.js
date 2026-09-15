// Gestor de imágenes

class ImagesManager {
  constructor() {
    this.images = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    const uploadZone = document.getElementById('imageUploadZone');
    const fileInput = document.getElementById('fileInput');
    const browseLink = document.getElementById('browseFilesLink');
    const imageCategoryFilter = document.getElementById('imageCategoryFilter');

    // Drag & drop
    if (uploadZone) {
      uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
      uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
      uploadZone.addEventListener('click', () => fileInput?.click());
    }

    // File input
    if (browseLink) {
      browseLink.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput?.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    // Filter
    if (imageCategoryFilter) {
      imageCategoryFilter.addEventListener('change', () => this.filterAndRender());
    }
  }

  async loadImages() {
    try {
      showLoading(true);
      const token = authManager.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/images?limit=200`, {
        headers: API_CONFIG.getHeaders(token)
      });

      if (!response.ok) throw new Error('Error cargando imágenes');

      const data = await response.json();
      this.images = data.images || [];
      this.filterAndRender();
    } catch (error) {
      console.error('Error loading images:', error);
      showToast('Error cargando imágenes', 'error');
    } finally {
      showLoading(false);
    }
  }

  filterAndRender() {
    const categoryFilter = document.getElementById('imageCategoryFilter')?.value || '';

    let filtered = this.images;

    if (categoryFilter) {
      filtered = filtered.filter(img => img.category === categoryFilter);
    }

    this.renderImagesGrid(filtered);
  }

  renderImagesGrid(images) {
    const container = document.getElementById('imagesContainer');

    if (images.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay imágenes</p>';
      container.classList.remove('loading');
      return;
    }

    const html = `
      <div class="images-grid">
        ${images.map(img => this.renderImageCard(img)).join('')}
      </div>
    `;

    container.innerHTML = html;
    container.classList.remove('loading');

    // Listeners para botones
    container.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', () => this.copyToClipboard(btn.dataset.url));
    });

    container.querySelectorAll('.btn-delete-image').forEach(btn => {
      btn.addEventListener('click', () => this.deleteImage(btn.dataset.imageId));
    });
  }

  renderImageCard(image) {
    const date = new Date(image.uploaded_at).toLocaleDateString('es-ES');
    const sizeKB = (image.size / 1024).toFixed(1);

    return `
      <div class="image-card">
        <div class="image-preview">
          <img src="${this.escapeHtml(image.url)}" alt="${this.escapeHtml(image.filename)}" loading="lazy">
        </div>
        <div class="image-info">
          <p class="image-name">${this.escapeHtml(image.filename)}</p>
          <p class="image-meta">${sizeKB} KB · ${date}</p>
          ${image.category ? `<p class="image-category">${image.category}</p>` : ''}
        </div>
        <div class="image-actions">
          <button class="btn btn-small btn-copy-url" data-url="${this.escapeHtml(image.url)}">📋 Copiar URL</button>
          <button class="btn btn-small btn-danger btn-delete-image" data-image-id="${image.id}">🗑️ Eliminar</button>
        </div>
      </div>
    `;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
  }

  handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');

    const files = e.dataTransfer.files;
    this.uploadFiles(files);
  }

  handleFileSelect(e) {
    const files = e.target.files;
    this.uploadFiles(files);
    e.target.value = '';
  }

  async uploadFiles(files) {
    if (files.length === 0) return;

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} no es una imagen`, 'error');
        continue;
      }

      await this.uploadFile(file);
    }

    await this.loadImages();
  }

  async uploadFile(file) {
    try {
      showLoading(true);
      const token = authManager.getToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_CONFIG.BASE_URL}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Password': token
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error subiendo imagen');
      }

      showToast(`${file.name} subida correctamente`, 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async deleteImage(imageId) {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      showLoading(true);
      const token = authManager.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/images/${imageId}`, {
        method: 'DELETE',
        headers: API_CONFIG.getHeaders(token)
      });

      if (!response.ok) throw new Error('Error eliminando imagen');

      showToast('Imagen eliminada', 'success');
      await this.loadImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Error eliminando imagen', 'error');
    } finally {
      showLoading(false);
    }
  }

  copyToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('URL copiada al portapapeles', 'success');
    }).catch(() => {
      showToast('Error copiando URL', 'error');
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Instancia global
document.addEventListener('DOMContentLoaded', () => {
  window.imagesManager = new ImagesManager();
});
