// Gestor de posts (CRUD)

class PostsManager {
  constructor() {
    this.posts = [];
    this.currentPostId = null;
    this.currentEditMode = 'create';
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botón nuevo artículo
    document.getElementById('newPostBtn')?.addEventListener('click', () => this.openNewPostForm());

    // Form
    document.getElementById('postForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    document.getElementById('cancelPostBtn')?.addEventListener('click', () => this.closeEditor());
    document.getElementById('closeEditorBtn')?.addEventListener('click', () => this.closeEditor());

    // Filtros
    document.getElementById('statusFilter')?.addEventListener('change', () => this.filterAndRender());
    document.getElementById('categoryFilter')?.addEventListener('change', () => this.filterAndRender());

    // Auto-generar slug
    document.getElementById('postTitle')?.addEventListener('input', (e) => this.generateSlug(e.target.value));
  }

  async loadPosts() {
    try {
      showLoading(true);
      const token = authManager.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/posts?status=&limit=100`, {
        headers: API_CONFIG.getHeaders(token)
      });

      if (!response.ok) throw new Error('Error cargando posts');

      const data = await response.json();
      this.posts = data.articles || [];
      this.filterAndRender();
    } catch (error) {
      console.error('Error loading posts:', error);
      showToast('Error cargando artículos', 'error');
    } finally {
      showLoading(false);
    }
  }

  filterAndRender() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    let filtered = this.posts;

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    this.renderPostsTable(filtered);
  }

  renderPostsTable(posts) {
    const container = document.getElementById('postsContainer');

    if (posts.length === 0) {
      container.innerHTML = '<p class="empty-state">No hay artículos</p>';
      container.classList.remove('loading');
      return;
    }

    const html = `
      <table class="posts-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Slug</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${posts.map(post => this.renderPostRow(post)).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = html;
    container.classList.remove('loading');

    // Agregar listeners a botones
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => this.openEditPostForm(btn.dataset.postId));
    });

    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => this.deletePost(btn.dataset.postId));
    });
  }

  renderPostRow(post) {
    const date = new Date(post.published_at || post.created_at).toLocaleDateString('es-ES');
    const statusLabel = STATUS_LABELS[post.status] || post.status;
    const categoryLabel = CATEGORIES.find(c => c.value === post.category)?.label || post.category;

    return `
      <tr class="post-row">
        <td class="title-cell">${this.escapeHtml(post.title)}</td>
        <td class="slug-cell">${this.escapeHtml(post.slug)}</td>
        <td>${categoryLabel}</td>
        <td>
          <span class="status-badge" style="background-color: ${STATUS_COLORS[post.status]};">
            ${statusLabel}
          </span>
        </td>
        <td>${date}</td>
        <td class="actions-cell">
          <button class="btn btn-small btn-edit" data-post-id="${post.id}">Editar</button>
          <button class="btn btn-small btn-danger btn-delete" data-post-id="${post.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }

  openNewPostForm() {
    this.currentEditMode = 'create';
    this.currentPostId = null;
    document.getElementById('editorTitle').textContent = 'Nuevo Artículo';
    document.getElementById('postForm').reset();
    this.showEditor();
  }

  async openEditPostForm(postId) {
    this.currentEditMode = 'edit';
    this.currentPostId = postId;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    document.getElementById('editorTitle').textContent = `Editar: ${post.title}`;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postSlug').value = post.slug;
    document.getElementById('postCategory').value = post.category;
    document.getElementById('postExcerpt').value = post.excerpt || '';
    document.getElementById('postContent').value = post.content;
    document.getElementById('postImageUrl').value = post.image_url || '';
    document.getElementById('postAuthor').value = post.author;
    document.getElementById('postStatus').value = post.status;

    this.showEditor();
  }

  showEditor() {
    document.getElementById('postEditorModal').classList.add('active');
  }

  closeEditor() {
    document.getElementById('postEditorModal').classList.remove('active');
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
      slug: document.getElementById('postSlug').value,
      title: document.getElementById('postTitle').value,
      content: document.getElementById('postContent').value,
      category: document.getElementById('postCategory').value,
      excerpt: document.getElementById('postExcerpt').value,
      image_url: document.getElementById('postImageUrl').value,
      author: document.getElementById('postAuthor').value,
      status: document.getElementById('postStatus').value
    };

    try {
      showLoading(true);
      const token = authManager.getToken();
      const method = this.currentEditMode === 'create' ? 'POST' : 'PUT';
      const url = this.currentEditMode === 'create'
        ? `${API_CONFIG.BASE_URL}/posts`
        : `${API_CONFIG.BASE_URL}/posts/${this.currentPostId}`;

      const response = await fetch(url, {
        method,
        headers: API_CONFIG.getHeaders(token),
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error guardando artículo');
      }

      const data = await response.json();
      showToast(this.currentEditMode === 'create' ? 'Artículo creado' : 'Artículo actualizado', 'success');

      this.closeEditor();
      await this.loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      showToast(error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async deletePost(postId) {
    if (!confirm('¿Eliminar este artículo?')) return;

    try {
      showLoading(true);
      const token = authManager.getToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: API_CONFIG.getHeaders(token)
      });

      if (!response.ok) throw new Error('Error eliminando artículo');

      showToast('Artículo eliminado', 'success');
      await this.loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Error eliminando artículo', 'error');
    } finally {
      showLoading(false);
    }
  }

  generateSlug(title) {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    document.getElementById('postSlug').value = slug;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Instancia global
document.addEventListener('DOMContentLoaded', () => {
  window.postsManager = new PostsManager();
});
