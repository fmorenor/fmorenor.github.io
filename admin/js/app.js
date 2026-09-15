// App principal - coordina tabs y utilidades globales

// Utilidades globales
function showLoading(visible) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = visible ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-remove después de 3 segundos
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Manejo de tabs
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-content');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const tabName = link.dataset.tab;

      // Actualizar links activos
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Actualizar contenido de tabs
      tabContents.forEach(content => {
        content.classList.remove('active');
      });

      const activeTab = document.getElementById(`${tabName}Tab`);
      if (activeTab) {
        activeTab.classList.add('active');

        // Cargar datos cuando se cambie a tab de imágenes
        if (tabName === 'images' && window.imagesManager) {
          window.imagesManager.loadImages();
        }
      }
    });
  });

  // Cargar posts inicialmente
  if (authManager.isLoggedIn() && window.postsManager) {
    window.postsManager.loadPosts();
  }
});
