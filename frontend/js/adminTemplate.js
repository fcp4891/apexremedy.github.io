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
        'index.html': '',
        'dashboard.html': '',
        'users.html': '',
        'products.html': '',
        'orders.html': '',
        'perfil.html': ''
    };
    
    // ============================================
    // DETERMINAR QUÉ HEADER CARGAR
    // ============================================
    
    /**
     * Determinar si el usuario es admin o cliente
     */
    function getUserRole() {
        if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
            return null;
        }
        
        const user = authManager.getCurrentUser();
        return user ? user.role : null;
    }
    
    /**
     * Obtener la ruta del header según el rol
     */
    function getHeaderPath() {
        const role = getUserRole();
        
        if (role === 'admin') {
            return './components/header.html';
        } else if (role === 'customer') {
            return './components/header-customer.html';
        }
        
        // Fallback: intentar detectar después
        return null;
    }
    
    // ============================================
    // FUNCIONES DE CARGA DE COMPONENTES
    // ============================================
    
    /**
     * Cargar el header apropiado según el rol
     */
    async function loadAdminHeader() {
        const container = document.getElementById('admin-header-container');
        if (!container) {
            console.warn('⚠️ No se encontró el contenedor #admin-header-container');
            return;
        }
        
        // Esperar a que authManager esté disponible
        if (typeof authManager === 'undefined') {
            console.log('⏳ Esperando authManager...');
            setTimeout(loadAdminHeader, 50);
            return;
        }
        
        const headerPath = getHeaderPath();
        
        if (!headerPath) {
            console.warn('⚠️ No se pudo determinar el rol del usuario');
            container.innerHTML = createFallbackHeader();
            setTimeout(initializeHeader, 100);
            return;
        }
        
        try {
            console.log(`📥 Cargando header: ${headerPath}`);
            const response = await fetch(headerPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
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
        const role = getUserRole();
        const isAdmin = role === 'admin';
        
        return `
            <nav class="bg-gradient-to-r from-green-700 to-green-800 shadow-xl sticky top-0 z-50">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between h-16">
                        <a href="${isAdmin ? './index.html' : '../index.html'}" class="text-white text-xl font-bold flex items-center gap-2">
                            <i class="fas fa-${isAdmin ? 'shield-alt' : 'user-circle'}"></i>
                            <span>${isAdmin ? 'Apexremedy Admin' : 'Mi Cuenta'}</span>
                        </a>
                        <div class="flex items-center gap-4">
                            ${isAdmin ? `
                                <a href="./index.html" class="text-white hover:text-green-200 hidden md:inline">
                                    <i class="fas fa-home mr-1"></i>Inicio
                                </a>
                                <a href="./dashboard.html" class="text-white hover:text-green-200 hidden md:inline">
                                    <i class="fas fa-chart-line mr-1"></i>Dashboard
                                </a>
                            ` : `
                                <a href="../index.html" class="text-white hover:text-green-200 hidden md:inline">
                                    <i class="fas fa-home mr-1"></i>Inicio
                                </a>
                                <a href="../tienda.html" class="text-white hover:text-green-200 hidden md:inline">
                                    <i class="fas fa-store mr-1"></i>Tienda
                                </a>
                            `}
                            <a href="./perfil.html" class="text-white hover:text-green-200">
                                <i class="fas fa-user mr-1"></i>Mi Perfil
                            </a>
                            <button onclick="handleAdminLogout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                                <i class="fas fa-sign-out-alt mr-2"></i>Salir
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }
    
    /**
     * Cargar el footer del admin (opcional)
     */
    async function loadAdminFooter() {
        const container = document.getElementById('admin-footer-container');
        if (!container) {
            return;
        }
        
        // Esperar a que authManager esté disponible
        if (typeof authManager === 'undefined') {
            console.log('⏳ Esperando authManager para footer...');
            setTimeout(loadAdminFooter, 50);
            return;
        }
        
        // Determinar qué footer cargar
        const role = getUserRole();
        const footerPath = role === 'admin' 
            ? './components/footer.html' 
            : './components/footer-customer.html';
        
        try {
            console.log(`📥 Cargando footer: ${footerPath}`);
            const response = await fetch(footerPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            console.log('✅ Footer cargado correctamente');
            
        } catch (error) {
            console.warn('⚠️ No se pudo cargar footer (es opcional):', error.message);
            
            // Footer básico de fallback
            const isAdmin = role === 'admin';
            container.innerHTML = `
                <footer class="bg-white shadow-lg mt-12 py-6 border-t">
                    <div class="container mx-auto px-4 text-center text-gray-600">
                        <p>&copy; ${new Date().getFullYear()} Apexremedy. ${isAdmin ? 'Panel de Administración' : 'Tienda Online'}.</p>
                        <p class="text-sm mt-2">
                            <i class="fas fa-circle text-green-500 text-xs mr-1"></i>
                            Sistema activo
                        </p>
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
        
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkPage = link.getAttribute('data-page');
            if (linkPage === pageKey) {
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
            const isAdmin = user.role === 'admin';
            
            console.log(`👤 Usuario cargado: ${user.name} (${user.role})`);
            
            const firstName = user.name ? user.name.split(' ')[0] : 'Usuario';
            
            // IDs para ADMIN
            const adminUserName = document.getElementById('adminUserName');
            const dropdownUserName = document.getElementById('dropdownUserName');
            const dropdownUserEmail = document.getElementById('dropdownUserEmail');
            
            // IDs para CLIENTE
            const customerUserName = document.getElementById('customerUserName');
            const dropdownCustomerName = document.getElementById('dropdownCustomerName');
            const dropdownCustomerEmail = document.getElementById('dropdownCustomerEmail');
            
            if (isAdmin) {
                if (adminUserName) adminUserName.textContent = firstName;
                if (dropdownUserName) dropdownUserName.textContent = user.name;
                if (dropdownUserEmail) dropdownUserEmail.textContent = user.email;
            } else {
                if (customerUserName) customerUserName.textContent = firstName;
                if (dropdownCustomerName) dropdownCustomerName.textContent = user.name;
                if (dropdownCustomerEmail) dropdownCustomerEmail.textContent = user.email;
            }
            
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
        const confirmed = await notify.confirmLogout();
        if (confirmed) {
            console.log('👋 Cerrando sesión...');
            
            if (typeof authManager !== 'undefined') {
                authManager.logout();
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '../login.html';
            }
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
            return document.getElementById('admin-header-container') !== null;
        }
    };
    
    console.log('✅ Sistema de templates admin listo');
    
})();