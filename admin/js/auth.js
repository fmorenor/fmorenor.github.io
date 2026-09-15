// Manejo de autenticación

class AuthManager {
  constructor() {
    this.token = localStorage.getItem('adminToken');
    this.isAuthenticated = !!this.token;
  }

  login(password) {
    // Validar que la contraseña no esté vacía
    if (!password || password.trim().length === 0) {
      return { success: false, error: 'La contraseña es requerida' };
    }

    // Guardar el token (la contraseña actúa como token)
    this.token = password;
    this.isAuthenticated = true;
    localStorage.setItem('adminToken', password);

    return { success: true };
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    localStorage.removeItem('adminToken');
  }

  getToken() {
    return this.token;
  }

  isLoggedIn() {
    return this.isAuthenticated && !!this.token;
  }
}

// Instancia global
const authManager = new AuthManager();

// Manejadores de UI de login
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('loginError');
  const loginScreen = document.getElementById('loginScreen');
  const dashboardScreen = document.getElementById('dashboardScreen');
  const logoutBtn = document.getElementById('logoutBtn');

  // Si ya está autenticado, mostrar dashboard
  if (authManager.isLoggedIn()) {
    showDashboard();
  }

  // Login form
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = passwordInput.value;

      const result = authManager.login(password);
      if (result.success) {
        loginError.textContent = '';
        showDashboard();
      } else {
        loginError.textContent = result.error;
      }
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authManager.logout();
      showLoginScreen();
    });
  }

  function showLoginScreen() {
    loginScreen.classList.add('active');
    dashboardScreen.classList.remove('active');
    if (passwordInput) passwordInput.value = '';
    if (loginError) loginError.textContent = '';
  }

  function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');

    // Recargar datos del dashboard
    if (window.postsManager) {
      window.postsManager.loadPosts();
    }
    if (window.imagesManager) {
      window.imagesManager.loadImages();
    }
  }

  // Exponer funciones globales
  window.showLoginScreen = showLoginScreen;
  window.showDashboard = showDashboard;
});
