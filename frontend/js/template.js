/**
 * Template.js - Sistema unificado de navegación y templates
 * Inyecta header/footer y maneja autenticación UI
 */

(function() {
  'use strict';

  /**
   * Cargar template HTML en un contenedor
   */
  async function loadTemplate(selector, url) {
    const container = document.querySelector(selector);
    if (!container) {
      return false;
    }

    // Verificar si estamos en file:// protocol
    if (location.protocol === 'file:') {
      return false;
    }

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      container.innerHTML = html;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Marcar enlace de navegación activo
   */
  function setActiveNavLink() {
    const currentPage = location.pathname.split('/').pop().toLowerCase() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link[data-nav]');
    
    navLinks.forEach(link => {
      const navKey = link.getAttribute('data-nav');
      link.classList.remove('active');
      
      // Marcar como activo si coincide
      if (currentPage.includes(navKey) || 
          (currentPage === '' && navKey === 'index') ||
          (currentPage === 'index.html' && navKey === 'index')) {
        link.classList.add('active');
      }
    });
  }

  /**
   * Configurar menú hamburguesa (móvil)
   */
  function setupMobileMenu() {
    const hamburger = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    
    if (!hamburger || !navMenu) return;

    hamburger.addEventListener('click', () => {
      // Toggle del menú
      const isOpen = navMenu.style.display === 'flex';
      
      if (window.innerWidth <= 900) {
        navMenu.style.display = isOpen ? 'none' : 'flex';
      }
      
      // Animar hamburguesa
      hamburger.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un link (móvil)
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) {
          navMenu.style.display = 'none';
          hamburger.classList.remove('active');
        }
      });
    });

    // Manejar resize de ventana
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        navMenu.style.display = 'flex';
        hamburger.classList.remove('active');
      } else {
        navMenu.style.display = 'none';
        hamburger.classList.remove('active');
      }
    });
    
    // Asegurar estado inicial correcto
    if (window.innerWidth > 900) {
      navMenu.style.display = 'flex';
    } else {
      navMenu.style.display = 'none';
    }
  }

  /**
   * Configurar sidebar del carrito
   */
  function setupCartSidebar() {
    const cartToggle = document.getElementById('cartToggle');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    function openCart(e) {
      if (cartSidebar && cartOverlay) {
        e?.preventDefault();
        cartSidebar.classList.add('open');
        cartOverlay.style.display = 'block';
        return;
      }
    }

    function closeCartFn(e) {
      e?.preventDefault();
      if (cartSidebar) cartSidebar.classList.remove('open');
      if (cartOverlay) cartOverlay.style.display = 'none';
    }

    if (cartToggle) {
      cartToggle.addEventListener('click', openCart);
    }
    if (closeCart) {
      closeCart.addEventListener('click', closeCartFn);
    }
    if (cartOverlay) {
      cartOverlay.addEventListener('click', closeCartFn);
    }

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCartFn();
    });
  }

  /**
   * Actualizar contador del carrito
   */
  function updateCartCount() {
    // Buscar TODOS los posibles badges del carrito
    const badges = document.querySelectorAll('#cartCount, .cart-badge, #cartBadge, [data-cart-badge]');
    
    if (badges.length === 0) {
        return;
    }

    // Obtener items del carrito (si existe la instancia global)
    if (typeof cart !== 'undefined') {
        const count = cart.getItemCount();
        
        badges.forEach(badge => {
            badge.textContent = count;
            if (count > 0) {
                badge.style.display = 'flex';
                badge.classList.remove('hidden');
            } else {
                badge.style.display = 'none';
                badge.classList.add('hidden');
            }
        });
    }
}

  /**
   * Actualizar UI de autenticación
   */
  function updateAuthUI() {
    // Esperar a que authManager esté disponible
    if (typeof authManager === 'undefined') {
      setTimeout(updateAuthUI, 100);
      return;
    }

    const guestMenuDesktop = document.getElementById('guestMenuDesktop');
    const guestMenuDesktop2 = document.getElementById('guestMenuDesktop2');
    const userMenuDesktop = document.getElementById('userMenuDesktop');
    const adminMenuItem = document.getElementById('adminMenuItem');

    const isAuth = authManager.isAuthenticated();
    const isAdmin = authManager.isAdmin();

// Ajustar enlace de perfil según rol
const profileLink = document.getElementById('profileLink');
if (profileLink) {
  if (isAdmin) {
    profileLink.href = './admin/perfil.html';
  } else {
    profileLink.href = './perfil.html';
  }
}


    // Mostrar/ocultar menús según autenticación
    if (guestMenuDesktop) {
      guestMenuDesktop.style.display = isAuth ? 'none' : 'block';
    }
    if (guestMenuDesktop2) {
      guestMenuDesktop2.style.display = isAuth ? 'none' : 'block';
    }
    if (userMenuDesktop) {
      userMenuDesktop.style.display = isAuth ? 'flex' : 'none';
    }
    if (adminMenuItem) {
      adminMenuItem.style.display = isAdmin ? 'block' : 'none';
    }

    // Actualizar nombre de usuario
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay && isAuth) {
      const user = authManager.getCurrentUser();
      userNameDisplay.textContent = user?.name?.split(' ')[0] || 'Usuario';
    }

    // Configurar botón de logout
    const logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        notify.confirm({
          title: "¿Cerrar sesión?",
          message: "Tu sesión actual se cerrará y volverás al inicio.",
          type: "warning",
          icon: "logout",
          confirmText: "Cerrar sesión",
          cancelText: "Cancelar",
          confirmClass: "danger"
        }).then((confirmed) => {
          if (confirmed) {
            notify.info("Cerrando sesión...");
            authManager.logout();
          } else {
            notify.info("Operación cancelada");
          }
        });
      });
    });    
  }

/**
 * Inicialización principal con detección de área (admin/customer)
 */
async function init() {
  // 1. Determinar si estamos en el área admin o customer
  const isAdminArea = location.pathname.toLowerCase().includes('/admin/');
  const basePath = isAdminArea ? './components' : './components';
  const headerFile = isAdminArea ? 'header.html' : 'header-customer.html';
  const footerFile = isAdminArea ? 'footer.html' : 'footer-customer.html';

  // 2. Cargar header y footer correctos
  const headerLoaded = await loadTemplate('#header-container', `${basePath}/${headerFile}`);
  const footerLoaded = await loadTemplate('#footer-container', `${basePath}/${footerFile}`);

  // 3. Configurar navegación y UI
  setActiveNavLink();
  setupMobileMenu();
  setupCartSidebar();

  // 4. Esperar a que DOM se estabilice antes de actualizar el carrito
  setTimeout(updateCartCount, 150);

  // 5. Actualizar UI de autenticación
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAuthUI);
  } else {
    updateAuthUI();
  }

  // 6. Escuchar actualizaciones del carrito
  window.addEventListener('cartUpdated', updateCartCount);
}

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exportar funciones útiles
  window.templateSystem = {
    updateCartCount,
    updateAuthUI,
    setActiveNavLink
  };

})();