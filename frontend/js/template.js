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
  const templateCache = new Map(); // Cache de templates cargados
  const loadingTemplates = new Set(); // Set para prevenir cargas simultáneas del mismo template
  
  async function loadTemplate(selector, url) {
    const container = document.querySelector(selector);
    if (!container) {
      return false;
    }

    // Verificar si estamos en file:// protocol
    if (location.protocol === 'file:') {
      return false;
    }

    // Verificar si este template ya se está cargando
    const cacheKey = `${selector}:${url}`;
    if (loadingTemplates.has(cacheKey)) {
      console.log('⚠️ Template ya se está cargando, esperando...', cacheKey);
      // Esperar a que termine la carga anterior
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!loadingTemplates.has(cacheKey)) {
            clearInterval(checkInterval);
            resolve(templateCache.get(cacheKey) || false);
          }
        }, 50);
      });
    }

    // Verificar si ya está en cache y el contenedor ya tiene contenido
    if (templateCache.has(cacheKey) && container.innerHTML.trim().length > 0) {
      const cachedContent = templateCache.get(cacheKey);
      if (container.innerHTML.trim() === cachedContent.trim()) {
        console.log('✅ Template ya cargado y contenido coincide:', cacheKey);
        return true;
      }
    }

    // Marcar como cargando
    loadingTemplates.add(cacheKey);

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
      
      // Prevenir actualizar si el contenido es el mismo (evita re-renderizado)
      const trimmedHtml = html.trim();
      const trimmedInner = container.innerHTML.trim();
      
      if (trimmedInner === trimmedHtml) {
        console.log('✅ Template contenido idéntico, no actualizando:', cacheKey);
        templateCache.set(cacheKey, trimmedHtml);
        loadingTemplates.delete(cacheKey);
        return true;
      }
      
      // Solo actualizar si realmente es diferente
      container.innerHTML = trimmedHtml;
      templateCache.set(cacheKey, trimmedHtml);
      loadingTemplates.delete(cacheKey);
      console.log('✅ Template cargado y actualizado:', cacheKey);
      return true;
    } catch (error) {
      console.warn('⚠️ Error cargando template:', cacheKey, error.message);
      loadingTemplates.delete(cacheKey);
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
  // Flag para prevenir múltiples configuraciones
  let mobileMenuSetup = false;

  function setupMobileMenu() {
    // Prevenir múltiples configuraciones
    if (mobileMenuSetup) {
      return;
    }
    mobileMenuSetup = true;
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
  // Flag para prevenir múltiples configuraciones del carrito
  let cartSidebarSetup = false;
  let cartEscHandler = null;

  function setupCartSidebar() {
    // Prevenir múltiples configuraciones
    if (cartSidebarSetup) {
      return;
    }
    cartSidebarSetup = true;

    const cartToggle = document.getElementById('cartToggle');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    function openCart(e) {
      if (cartSidebar && cartOverlay) {
        e?.preventDefault();
        
        // Actualizar el sidebar con los items actuales del carrito
        if (typeof cart !== 'undefined') {
          if (typeof cart.updateCartSidebar === 'function') {
            cart.updateCartSidebar();
          } else if (typeof cart.refreshSidebar === 'function') {
            cart.refreshSidebar();
          }
        }
        
        cartSidebar.classList.add('open');
        cartOverlay.style.display = 'block';
        cartOverlay.style.visibility = 'visible';
        cartOverlay.style.opacity = '1';
        // Prevenir scroll del body cuando el carrito está abierto
        document.body.style.overflow = 'hidden';
        return;
      } else {
        // Si no existe el sidebar, redirigir a la página del carrito
        window.location.href = './carrito.html';
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
      // NO establecer estilos inline que sobrescriban CSS
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

    // Cerrar con ESC (solo una vez)
    if (!cartEscHandler) {
      cartEscHandler = (e) => {
        if (e.key === 'Escape' && cartSidebar && cartSidebar.classList.contains('open')) {
          closeCartFn();
        }
      };
      document.addEventListener('keydown', cartEscHandler);
    }
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
  let authUIUpdated = false;
  let authUIAttempts = 0;
  const MAX_AUTH_ATTEMPTS = 50; // Máximo 5 segundos (50 * 100ms)
  
  function updateAuthUI() {
    // Prevenir ejecuciones múltiples
    if (authUIUpdated) return;
    
    // Esperar a que authManager esté disponible, pero con límite
    if (typeof authManager === 'undefined') {
      authUIAttempts++;
      if (authUIAttempts < MAX_AUTH_ATTEMPTS) {
        setTimeout(updateAuthUI, 100);
      }
      return;
    }
    
    // Marcar como actualizado para prevenir re-ejecuciones
    authUIUpdated = true;

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
      if (isAdmin) {
        adminMenuItem.style.display = 'block';
        adminMenuItem.classList.add('admin-visible'); // Para CSS móvil
        adminMenuItem.classList.remove('hidden');
      } else {
        adminMenuItem.style.display = 'none';
        adminMenuItem.classList.remove('admin-visible'); // Quitar clase CSS
        adminMenuItem.classList.add('hidden');
      }
    }

    // Actualizar nombre de usuario
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay && isAuth) {
      const user = authManager.getCurrentUser();
      if (user) {
        const firstName = user.first_name || 
                         (user.name ? user.name.split(' ')[0] : null) || 
                         user.email?.split('@')[0] || 
                         'Usuario';
        userNameDisplay.textContent = firstName;
      }
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
  let initCalled = false;
  let initInProgress = false;
  let initListenerAdded = false;
  let initPromise = null; // Cachear la promesa de init para evitar múltiples ejecuciones
  
  async function init() {
    // Prevenir múltiples inicializaciones
    if (initCalled) {
      console.log('⚠️ Init ya fue completado, ignorando...');
      return;
    }
    
    if (initInProgress) {
      console.log('⚠️ Init ya está en progreso, esperando promesa existente...');
      // Esperar a que termine la inicialización en progreso
      if (initPromise) {
        return await initPromise;
      }
      return;
    }
    
    initInProgress = true;
    console.log('🚀 Inicializando template.js...');
    
    // Crear promesa para cachear
    initPromise = (async () => {
      try {
        return await doInit();
      } finally {
        initInProgress = false;
      }
    })();
    
    return await initPromise;
  }
  
  async function doInit() {
    try {
    // 1. Determinar si estamos en el área admin o customer
    const isAdminArea = location.pathname.toLowerCase().includes('/admin/');
    
    // 2. Construir path de componentes (loadTemplate manejará el basePath)
    const headerFile = isAdminArea ? 'header.html' : 'header-customer.html';
    const footerFile = isAdminArea ? 'footer.html' : 'footer-customer.html';
    const componentsPath = './components';

    // 3. Cargar header y footer correctos (loadTemplate ajustará las rutas automáticamente)
    // Usar Promise.all para cargar ambos en paralelo pero esperar que ambos terminen
    const [headerLoaded, footerLoaded] = await Promise.all([
      loadTemplate('#header-container', `${componentsPath}/${headerFile}`),
      loadTemplate('#footer-container', `${componentsPath}/${footerFile}`)
    ]);

    // 4. Solo configurar UI si los templates se cargaron correctamente
    if (headerLoaded || footerLoaded) {
      // Pequeño delay para asegurar que el DOM se ha actualizado
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 5. Configurar navegación y UI (solo si no se ha hecho antes)
      if (!window.templateUIInitialized) {
        setActiveNavLink();
        setupMobileMenu();
        setupCartSidebar();
        window.templateUIInitialized = true;
      } else {
        // Si ya se inicializó, solo configurar el carrito si no está configurado
        if (!cartSidebarSetup) {
          setupCartSidebar();
        }
      }

      // 6. Esperar a que DOM se estabilice antes de actualizar el carrito
      setTimeout(updateCartCount, 150);

      // 7. Actualizar UI de autenticación (solo una vez)
      updateAuthUI();

      // 8. Escuchar actualizaciones del carrito (solo una vez)
      if (!window.cartUpdatedListenerAdded) {
        window.addEventListener('cartUpdated', updateCartCount);
        window.cartUpdatedListenerAdded = true;
      }
    }
    
      initCalled = true;
      console.log('✅ Template.js inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar template.js:', error);
      throw error;
    }
  }

    // Ejecutar cuando el DOM esté listo (solo una vez)
    // Asegurar que solo agregamos el listener una vez
    if (!initListenerAdded) {
      initListenerAdded = true;
      
      const executeInit = () => {
        // Protección doble: verificar tanto initCalled como templateInitializationLock
        if (!initCalled && !initInProgress && !templateInitializationLock) {
          init().catch(error => {
            console.error('❌ Error en init():', error);
            // En caso de error, permitir reintento solo si es crítico
            if (error.message && !error.message.includes('critical')) {
              templateInitializationLock = true; // Mantener lock para prevenir loops
            }
          });
        } else {
          console.log('⚠️ Template init ya fue ejecutado o está en progreso, saltando...');
        }
      };
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeInit, { once: true });
      } else {
        // Si ya está listo, ejecutar inmediatamente pero solo una vez
        if (!templateInitializationLock && !initCalled && !initInProgress) {
          executeInit();
        }
      }
    }

  // Exportar funciones útiles
  window.templateSystem = {
    updateCartCount,
    updateAuthUI,
    setActiveNavLink
  };

})();