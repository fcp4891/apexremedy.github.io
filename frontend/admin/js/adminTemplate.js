/**
 * ============================================
 * ADMIN TEMPLATE LOADER - Apexremedy
 * Archivo: admin/js/adminTemplate.js
 * ============================================
 */

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURACIÓN
    // ============================================
    
    const PAGE_TITLES = {
        'index.html': 'Panel Principal',
        'dashboard.html': 'Dashboard',
        'users.html': 'Usuarios',
        'products.html': 'Productos',
        'orders.html': 'Pedidos',
        'perfil.html': 'Mi Perfil'
    };
    
    // ============================================
    // DETERMINAR QUÉ HEADER CARGAR
    // ============================================
    
    /**
     * Determinar si el usuario es admin o cliente
     */
    function getUserRole() {
        if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
            return 'admin'; // Por defecto admin en esta sección
        }
        
        const user = authManager.getCurrentUser();
        return user ? user.role : 'admin';
    }
    
    /**
     * Obtener path base para GitHub Pages (usa el global si existe)
     */
    function getBasePath() {
        // Usar el basePath global si está disponible (de basePath.js)
        if (typeof window.BASE_PATH !== 'undefined') {
            return window.BASE_PATH;
        }
        // Fallback: calcularlo manualmente usando la misma lógica que basePath.js
        if (window.location.hostname.includes('github.io')) {
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const repoName = 'apexremedy.github.io';
            const repoIndex = pathParts.indexOf(repoName);
            
            let repoPath = '';
            // El pathname ya incluye el repo completo: /apexremedy.github.io/frontend/admin/index.html
            // NO necesitamos agregar el usuario porque las rutas absolutas son relativas al dominio actual
            if (repoIndex !== -1) {
                // Usar solo el repoName desde el pathname (sin el usuario)
                repoPath = '/' + repoName + '/';
            } else {
                repoPath = '/' + repoName + '/';
            }
            
            // Verificar si la URL actual incluye /frontend/
            const currentPath = window.location.pathname;
            const hasFrontendInPath = currentPath.includes('/frontend/') || currentPath.endsWith('/frontend');
            
            if (repoPath) {
                if (hasFrontendInPath) {
                    // Si la URL incluye /frontend/, agregarlo al basePath
                    return repoPath + 'frontend/';
                } else {
                    // Si NO incluye /frontend/, GitHub Pages está sirviendo desde la raíz
                    return repoPath;
                }
            }
        }
        return '';
    }
    
    /**
     * Obtener la ruta del header según el rol
     */
    function getHeaderPath() {
        // Usar ruta relativa desde admin/, necesitamos ir a ../components/
        return '../components/header.html'; // Siempre admin header en esta sección
    }
    
    // ============================================
    // FUNCIONES DE CARGA DE COMPONENTES
    // ============================================
    
    /**
     * Cargar el header apropiado según el rol
     */
    async function loadAdminHeader() {
        const container = document.getElementById('header-container');
        if (!container) {
            console.warn('⚠️ No se encontró el contenedor #header-container');
            return;
        }
        
        let headerPath = getHeaderPath();
        
        // Ajustar URL para GitHub Pages si es necesario
        const basePath = getBasePath();
        if (basePath) {
            // Si la URL ya comienza con el basePath, no duplicar
            if (headerPath.startsWith(basePath)) {
                // Ya está ajustado
            } else if (headerPath.startsWith('/')) {
                // Si comienza con / pero no con basePath, agregar basePath al inicio
                headerPath = basePath + headerPath.substring(1);
            } else {
                // Si es relativa (../ o ./), procesar correctamente
                if (headerPath.startsWith('../')) {
                    // Para rutas ../ desde admin/, necesitamos construir correctamente
                    // ../components/header.html desde admin/ = components/header.html en frontend/
                    headerPath = basePath + headerPath.substring(3); // Remover ../
                } else if (headerPath.startsWith('./')) {
                    headerPath = basePath + headerPath.substring(2); // Remover ./
                } else {
                    headerPath = basePath + headerPath;
                }
            }
        }
        
        try {
            console.log(`📥 Cargando header: ${headerPath}`);
            const response = await fetch(headerPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let html = await response.text();
            
            // Actualizar rutas relativas en el contenido cargado si estamos en GitHub Pages
            if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH && window.location.hostname.includes('github.io')) {
                // Crear un parser temporal para actualizar rutas
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Actualizar rutas en links e imágenes (./ significa desde admin/, ../ sale de admin/)
                tempDiv.querySelectorAll('a[href], img[src], link[href]').forEach(element => {
                    const attr = element.hasAttribute('href') ? 'href' : 'src';
                    const path = element.getAttribute(attr);
                    if (path && !path.startsWith('http') && !path.startsWith('//') && !path.startsWith('#') && !path.startsWith('mailto:') && !path.startsWith('data:')) {
                        if (path.startsWith('./')) {
                            // Ruta relativa desde admin/, mantener admin/ en la ruta
                            const cleanPath = path.substring(2);
                            element.setAttribute(attr, window.BASE_PATH + 'admin/' + cleanPath);
                        } else if (path.startsWith('../')) {
                            // Ruta relativa que sale de admin/, remover admin/ del path
                            const cleanPath = path.substring(3);
                            element.setAttribute(attr, window.BASE_PATH + cleanPath);
                        }
                    }
                });
                
                html = tempDiv.innerHTML;
            }
            
            container.innerHTML = html;
            
            console.log('✅ Header cargado correctamente');
            
            // Inicializar después de cargar
            setTimeout(initializeHeader, 100);
            
        } catch (error) {
            console.error('❌ Error al cargar header:', error);
            console.log('🔄 Cargando header de fallback...');
            
            container.innerHTML = createFallbackHeader();
            setTimeout(initializeHeader, 100);
        }
    }
    
    /**
     * Crear un header de fallback si falla la carga
     */
    function createFallbackHeader() {
        return `
            <nav class="admin-nav">
                <div class="admin-container">
                    <div class="admin-nav-container">
                        <a href="./index.html" class="admin-nav-logo">
                            <i class="fas fa-shield-alt"></i>
                            <span>Apexremedy Admin</span>
                        </a>
                        <div class="admin-nav-menu">
                            <a href="./index.html" class="admin-nav-link">Inicio</a>
                            <a href="./dashboard.html" class="admin-nav-link">Dashboard</a>
                            <a href="./users.html" class="admin-nav-link">Usuarios</a>
                            <a href="./products.html" class="admin-nav-link">Productos</a>
                            <a href="./orders.html" class="admin-nav-link">Pedidos</a>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
    
    /**
     * Cargar el footer del admin
     */
    async function loadAdminFooter() {
        const container = document.getElementById('footer-container');
        if (!container) {
            return;
        }
        
        let footerPath = '../components/footer.html';
        
        // Ajustar URL para GitHub Pages si es necesario
        const basePath = getBasePath();
        if (basePath) {
            // Si la URL ya comienza con el basePath, no duplicar
            if (footerPath.startsWith(basePath)) {
                // Ya está ajustado
            } else if (footerPath.startsWith('/')) {
                // Si comienza con / pero no con basePath, agregar basePath al inicio
                footerPath = basePath + footerPath.substring(1);
            } else {
                // Si es relativa (../ o ./), procesar correctamente
                if (footerPath.startsWith('../')) {
                    // Para rutas ../ desde admin/, necesitamos construir correctamente
                    // ../components/footer.html desde admin/ = components/footer.html en frontend/
                    footerPath = basePath + footerPath.substring(3); // Remover ../
                } else if (footerPath.startsWith('./')) {
                    footerPath = basePath + footerPath.substring(2); // Remover ./
                } else {
                    footerPath = basePath + footerPath;
                }
            }
        }
        
        try {
            console.log(`📥 Cargando footer: ${footerPath}`);
            const response = await fetch(footerPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            let html = await response.text();
            
            // Actualizar rutas relativas en el contenido cargado si estamos en GitHub Pages
            if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH && window.location.hostname.includes('github.io')) {
                // Crear un parser temporal para actualizar rutas
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                // Actualizar rutas en links e imágenes (./ significa desde admin/, ../ sale de admin/)
                tempDiv.querySelectorAll('a[href], img[src], link[href]').forEach(element => {
                    const attr = element.hasAttribute('href') ? 'href' : 'src';
                    const path = element.getAttribute(attr);
                    if (path && !path.startsWith('http') && !path.startsWith('//') && !path.startsWith('#') && !path.startsWith('mailto:') && !path.startsWith('data:')) {
                        if (path.startsWith('./')) {
                            // Ruta relativa desde admin/, mantener admin/ en la ruta
                            const cleanPath = path.substring(2);
                            element.setAttribute(attr, window.BASE_PATH + 'admin/' + cleanPath);
                        } else if (path.startsWith('../')) {
                            // Ruta relativa que sale de admin/, remover admin/ del path
                            const cleanPath = path.substring(3);
                            element.setAttribute(attr, window.BASE_PATH + cleanPath);
                        }
                    }
                });
                
                html = tempDiv.innerHTML;
            }
            
            container.innerHTML = html;
            console.log('✅ Footer cargado correctamente');
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar footer:', error.message);
            
            // Footer básico de fallback
            container.innerHTML = `
                <footer class="admin-footer">
                    <div class="admin-container">
                        <p>&copy; ${new Date().getFullYear()} Apexremedy. Panel de Administración.</p>
                    </div>
                </footer>
            `;
        }
    }
    
    // ============================================
    // FUNCIONES DE INICIALIZACIÓN
    // ============================================
    
    /**
     * Inicializar el header después de cargarlo
     */
    function initializeHeader() {
        console.log('🔧 Inicializando header...');
        
        setCurrentPageTitle();
        markActiveLink();
        loadUserInfo();
        
        console.log('✅ Header inicializado');
    }
    
    /**
     * Establecer el título de la página actual
     */
    function setCurrentPageTitle() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        const pageTitle = document.getElementById('currentPageTitle');
        
        if (pageTitle) {
            const title = PAGE_TITLES[currentPage] || '';
            pageTitle.textContent = title;
            console.log(`📄 Página actual: ${title}`);
        }
    }
    
    /**
     * Marcar el enlace activo en la navegación
     */
    function markActiveLink() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        const pageKey = currentPage.replace('.html', '');
        
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(pageKey)) {
                link.classList.add('active');
                console.log(`🎯 Enlace activo: ${pageKey}`);
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    /**
     * Cargar información del usuario desde authManager
     */
    function loadUserInfo() {
        if (typeof authManager === 'undefined') {
            console.warn('⏳ authManager no disponible aún, reintentando...');
            setTimeout(loadUserInfo, 100);
            return;
        }
        
        if (!authManager.isAuthenticated()) {
            console.warn('⚠️ Usuario no autenticado');
            return;
        }
        
        try {
            const user = authManager.getCurrentUser();
            
            console.log(`👤 Usuario cargado: ${user.name || user.first_name || 'Usuario'} (${user.role})`);
            
            const firstName = (user.name || user.first_name || 'Usuario').split(' ')[0];
            
            // Actualizar elementos del header
            const adminUserName = document.getElementById('adminUserName');
            const dropdownUserName = document.getElementById('dropdownUserName');
            const dropdownUserEmail = document.getElementById('dropdownUserEmail');
            
            if (adminUserName) adminUserName.textContent = firstName;
            if (dropdownUserName) dropdownUserName.textContent = user.name || `${user.first_name} ${user.last_name}`;
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            
            console.log('✅ Información del usuario actualizada');
            
        } catch (error) {
            console.error('❌ Error al cargar info del usuario:', error);
        }
    }
    
    // ============================================
    // FUNCIONES GLOBALES
    // ============================================
    
    /**
     * Función global para logout
     */
    window.handleAdminLogout = async function() {
        if (typeof notify !== 'undefined' && notify.confirmLogout) {
            const confirmed = await notify.confirmLogout();
            if (!confirmed) return;
        } else {
            if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                return;
            }
        }
        
        console.log('👋 Cerrando sesión...');
        
        if (typeof authManager !== 'undefined') {
            authManager.logout();
        } else {
            localStorage.clear();
            sessionStorage.clear();
            // Función helper para construir rutas con basePath
            const getFullPath = (path) => {
                if (path.startsWith('http') || path.startsWith('//')) return path;
                if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) {
                    const cleanPath = path.startsWith('/') ? path.substring(1) : 
                                     path.startsWith('../') ? path.substring(3) : path;
                    return window.BASE_PATH + cleanPath;
                }
                return path;
            };
            window.location.href = getFullPath('../login.html');
        }
    };
    
    // ============================================
    // INICIALIZACIÓN AUTOMÁTICA
    // ============================================
    
    /**
     * Inicializar todo el sistema de templates
     */
    function initialize() {
        console.log('🚀 Iniciando sistema de templates admin...');
        
        loadAdminHeader();
        loadAdminFooter();
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // ============================================
    // API PÚBLICA
    // ============================================
    
    window.adminTemplate = {
        reload: function() {
            console.log('🔄 Recargando templates...');
            initialize();
        },
        
        updateUserInfo: function() {
            console.log('🔄 Actualizando info del usuario...');
            loadUserInfo();
        },
        
        setPageTitle: function(title) {
            const pageTitleEl = document.getElementById('currentPageTitle');
            if (pageTitleEl) {
                pageTitleEl.textContent = title;
                console.log(`📝 Título actualizado: ${title}`);
            }
        },
        
        isLoaded: function() {
            return document.getElementById('header-container') !== null;
        }
    };
    
    console.log('✅ Sistema de templates admin listo');
    
})();

