/**
 * Template.js - Sistema unificado de navegación y templates
 * Inyecta header/footer y maneja autenticación UI
 */

(function() {
  'use strict';

  /**
   * Obtener path base para GitHub Pages (usa el global si existe)
   */
  function getBasePath() {
    // Usar el basePath global si está disponible
    if (typeof window.BASE_PATH !== 'undefined') {
      return window.BASE_PATH;
    }
    // Fallback: calcularlo manualmente
    if (window.location.hostname.includes('github.io')) {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      const repoName = 'apexremedy.github.io';
      const repoIndex = pathParts.indexOf(repoName);
      
      if (repoIndex !== -1) {
        const repoPath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
        // Verificar si necesitamos agregar /frontend/
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/frontend/') && !currentPath.endsWith('/frontend')) {
          return repoPath + 'frontend/';
        }
        return repoPath;
      }
    }
    return '';
  }

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

    // Ajustar URL para GitHub Pages
    // Si la URL ya es absoluta (comienza con /), no agregar basePath dos veces
    let fullUrl = url;
    const basePath = getBasePath();
    
    if (basePath) {
      // Si la URL ya comienza con el basePath, no duplicar
      if (url.startsWith(basePath)) {
        fullUrl = url;
      } else if (url.startsWith('/')) {
        // Si comienza con / pero no con basePath, agregar basePath al inicio
        fullUrl = basePath + url.substring(1);
      } else {
        // Si es relativa (./ o sin /), reemplazar ./ y agregar basePath
        fullUrl = basePath + url.replace('./', '');
      }
    }

    try {
      const response = await fetch(fullUrl, { cache: 'no-store' });
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
      // Toggle del menú - usar breakpoint consistente con CSS (767px)
      const isOpen = navMenu.style.display === 'flex' || navMenu.classList.contains('open');
      
      if (window.innerWidth <= 767) {
        if (isOpen) {
          navMenu.style.display = 'none';
          navMenu.classList.remove('open');
        } else {
          navMenu.style.display = 'flex';
          navMenu.classList.add('open');
        }
      }
      
      // Animar hamburguesa
      hamburger.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un link (móvil)
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 767) {
          navMenu.style.display = 'none';
          navMenu.classList.remove('open');
          hamburger.classList.remove('active');
        }
      });
    });

    // Manejar resize de ventana - usar breakpoint consistente (767px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 767) {
        // Desktop: mostrar menú siempre
        navMenu.style.display = 'flex';
        navMenu.classList.remove('open');
        hamburger.classList.remove('active');
      } else {
        // Móvil: ocultar menú si no está abierto
        if (!navMenu.classList.contains('open')) {
          navMenu.style.display = 'none';
        }
        hamburger.classList.remove('active');
      }
    });
    
    // Asegurar estado inicial correcto - usar breakpoint consistente (767px)
    // NO establecer estilo inline en desktop - dejar que CSS lo maneje
    if (window.innerWidth <= 767) {
      navMenu.style.display = 'none';
      navMenu.classList.remove('open');
    }
    // En desktop, no establecer estilo inline - CSS manejará display:flex por defecto
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
        cartOverlay.style.visibility = 'visible';
        cartOverlay.style.opacity = '1';
        // Prevenir scroll del body cuando el carrito está abierto
        document.body.style.overflow = 'hidden';
        return;
      }
    }

    function closeCartFn(e) {
      e?.preventDefault();
      if (cartSidebar) {
        cartSidebar.classList.remove('open');
      }
      if (cartOverlay) {
        cartOverlay.style.display = 'none';
        cartOverlay.style.visibility = 'hidden';
        cartOverlay.style.opacity = '0';
      }
      // Restaurar scroll del body
      document.body.style.overflow = '';
    }
    
    // Asegurar que el carrito esté oculto por defecto
    if (cartSidebar) {
      cartSidebar.classList.remove('open');
      cartSidebar.style.visibility = 'hidden';
      cartSidebar.style.opacity = '0';
    }
    if (cartOverlay) {
      cartOverlay.style.display = 'none';
      cartOverlay.style.visibility = 'hidden';
      cartOverlay.style.opacity = '0';
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
  
  // 2. Construir path de componentes (loadTemplate manejará el basePath)
  const headerFile = isAdminArea ? 'header.html' : 'header-customer.html';
  const footerFile = isAdminArea ? 'footer.html' : 'footer-customer.html';
  const componentsPath = './components';

  // 3. Cargar header y footer correctos (loadTemplate ajustará las rutas automáticamente)
  const headerLoaded = await loadTemplate('#header-container', `${componentsPath}/${headerFile}`);
  const footerLoaded = await loadTemplate('#footer-container', `${componentsPath}/${footerFile}`);

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