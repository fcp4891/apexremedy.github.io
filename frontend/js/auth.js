// frontend/js/auth.js
// Gestor de autenticación del frontend

// Log inmediato para verificar que el script se carga
try {
    console.log('📦 [AUTH] Script auth.js cargado');
    console.log('📦 [AUTH] Timestamp:', new Date().toISOString());
    console.log('📦 [AUTH] URL actual:', window.location.href);
} catch (e) {
    console.error('❌ [AUTH] Error en log inicial:', e);
}

// Prevenir doble declaración
if (typeof AuthManager === 'undefined') {
    console.log('📦 [AUTH] Creando clase AuthManager...');
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.sessionReady = false;
            this.sessionToken = null;
            this.bootstrapPromise = this.bootstrap();
        }

        async bootstrap() {
            // Si no hay API configurada, no hay sesión
            if (!api || typeof api.getProfile !== 'function' || !api.baseURL) {
                this.sessionReady = true;
                this.currentUser = null;
                this.clearSession();
                return;
            }

            try {
                // Verificar si hay cookies de autenticación antes de hacer la petición
                const hasAuthCookie = this.hasAuthCookie();
                
                if (!hasAuthCookie) {
                    // No hay cookies, no hay sesión
                    this.currentUser = null;
                    this.clearSession();
                    this.sessionReady = true;
                    this.updateUI();
                    return;
                }

                // Intentar obtener perfil del servidor
                const response = await api.getProfile();
                
                // Validar respuesta estrictamente
                if (response && response.success && response.data?.user) {
                    const user = response.data.user;
                    
                    // Validar que el usuario tenga datos mínimos requeridos
                    if (user.id && user.email) {
                        this.currentUser = user;
                    } else {
                        // Datos incompletos, limpiar sesión
                        this.currentUser = null;
                        this.clearSession();
                    }
                } else {
                    // Respuesta inválida, limpiar sesión
                    this.currentUser = null;
                    this.clearSession();
                }
            } catch (error) {
                // Cualquier error (401, 403, network, etc.) = no hay sesión válida
                console.log('🔒 No hay sesión válida o error al verificar:', error.message);
                this.currentUser = null;
                this.clearSession();
            } finally {
                this.sessionReady = true;
                this.updateUI();
            }
        }

        // Verificar si hay cookies de autenticación
        hasAuthCookie() {
            if (typeof document === 'undefined') {
                return false;
            }
            
            const cookies = document.cookie ? document.cookie.split('; ') : [];
            const hasAccessToken = cookies.some(cookie => cookie.startsWith('access_token='));
            const hasRefreshToken = cookies.some(cookie => cookie.startsWith('refresh_token='));
            
            return hasAccessToken || hasRefreshToken;
        }

        clearSession() {
            this.currentUser = null;
            this.sessionToken = null;
            this.sessionReady = true;
            
            // Limpiar localStorage también
            try {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                console.log('🧹 [AUTH] localStorage limpiado');
            } catch (e) {
                console.warn('⚠️ [AUTH] Error limpiando localStorage:', e);
            }
            
            // Limpiar cookies de autenticación del lado del cliente
            this.clearAuthCookies();
        }

        // Limpiar cookies de autenticación manualmente
        clearAuthCookies() {
            if (typeof document === 'undefined') {
                return;
            }

            // Lista de cookies a limpiar
            const cookiesToClear = [
                'access_token',
                'refresh_token',
                'csrf_token'
            ];

            // Limpiar cada cookie con diferentes configuraciones de path
            cookiesToClear.forEach(cookieName => {
                // Limpiar con path raíz
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                // Limpiar con path /api/auth (para refresh_token)
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api/auth;`;
                // Limpiar con path actual
                const currentPath = window.location.pathname;
                const pathParts = currentPath.split('/').filter(p => p);
                for (let i = pathParts.length; i >= 0; i--) {
                    const path = '/' + pathParts.slice(0, i).join('/');
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                }
            });
        }

        // Registrar nuevo usuario
        async register(userData) {
            try {
                const response = await api.register(userData);
                
                if (response.success) {
                    // NO guardar token ni usuario después del registro
                    // La cuenta debe ser aprobada primero
                    return { 
                        success: true, 
                        message: 'Tu cuenta ha sido creada exitosamente. Debes esperar la aprobación del administrador antes de iniciar sesión.'
                    };
                }
                
                return { 
                    success: false, 
                    message: response.message,
                    error_code: response.error_code,
                    field: response.field
                };
            } catch (error) {
                return { 
                    success: false, 
                    message: error.message || 'Error al registrar usuario',
                    error_code: error.error_code,
                    field: error.field
                };
            }
        }

        // Iniciar sesión - ACTUALIZADO CON REDIRECCIÓN SEGÚN ROL
        async login(email, password) {
            console.log('🔐 [AUTH] Iniciando login para:', email);
            try {
                // NO verificar baseURL aquí - api.login() manejará la autenticación estática si no hay backend
                // Llamar directamente a api.login() que decidirá usar loginStatic() si baseURL es null
                console.log('📡 [AUTH] Llamando a api.login()...');
                const response = await api.login({ email, password });
                console.log('📥 [AUTH] Respuesta de api.login():', response?.success ? '✅ Éxito' : '❌ Fallo', response);
                
                if (response.success) {
                    console.log('✅ [AUTH] Login exitoso, procesando respuesta...');
                    const { token = null, user } = response.data;
                    
                    // Verificar cookies recibidas (nota: httpOnly cookies no son visibles en document.cookie)
                    console.log('🍪 [AUTH] Verificando cookies después del login...');
                    const allCookies = document.cookie.split(';').map(c => c.trim());
                    console.log('🍪 [AUTH] Total de cookies visibles (no httpOnly):', allCookies.length);
                    const authCookies = allCookies.filter(c => 
                        c.startsWith('access_token') || 
                        c.startsWith('refresh_token') || 
                        c.startsWith('csrf_token')
                    );
                    console.log('🍪 [AUTH] Cookies de autenticación visibles:', authCookies.length);
                    if (authCookies.length > 0) {
                        authCookies.forEach(cookie => {
                            const [name] = cookie.split('=');
                            console.log('   -', name, '(visible)');
                        });
                    } else {
                        console.log('   ℹ️ Las cookies httpOnly (access_token, refresh_token) no son visibles en JavaScript');
                        console.log('   ℹ️ Esto es normal y esperado - las cookies se enviarán automáticamente en las peticiones');
                    }
                    
                    console.log('👤 [AUTH] Datos del usuario recibidos:', {
                        id: user?.id,
                        email: user?.email,
                        role: user?.role,
                        account_status: user?.account_status
                    });
                    
                    this.sessionToken = token;
                    this.currentUser = user;
                    this.sessionReady = true;
                    
                    // Guardar en localStorage para que el authManager del admin pueda acceder
                    if (token && user) {
                        try {
                            localStorage.setItem('auth_token', token);
                            localStorage.setItem('auth_user', JSON.stringify(user));
                            console.log('💾 [AUTH] Token y usuario guardados en localStorage');
                        } catch (e) {
                            console.warn('⚠️ [AUTH] Error guardando en localStorage:', e);
                        }
                    }
                    
                    console.log('✅ [AUTH] Estado actualizado - sessionReady:', this.sessionReady);
                    console.log('✅ [AUTH] currentUser establecido:', this.currentUser?.email);
                    
                    window.dispatchEvent(new Event('userLoggedIn'));
        
                    // Actualizar UI si la función existe
                    this.updateUI();
                    
                    // ============================================
                    // REDIRECCIÓN MEJORADA SEGÚN ROL Y ESTADO
                    // ============================================
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    
                    // Función helper para construir rutas con basePath
                    const getFullPath = (path) => {
                        // Si ya es una URL completa, devolverla tal cual
                        if (path.startsWith('http') || path.startsWith('//')) {
                            return path;
                        }
                        // Si tenemos basePath (GitHub Pages), usarlo
                        if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) {
                            // Si la ruta comienza con /, removerlo antes de agregar basePath
                            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
                            return window.BASE_PATH + cleanPath;
                        }
                        // Si no hay basePath (local), convertir rutas absolutas a relativas
                        if (path.startsWith('/')) {
                            // En desarrollo local, convertir /admin/perfil.html a ./admin/perfil.html
                            // o ../admin/perfil.html dependiendo de dónde estemos
                            const currentPath = window.location.pathname;
                            const isInAdmin = currentPath.includes('/admin/');
                            const isInRoot = !currentPath.includes('/admin/') && !currentPath.includes('/frontend/');
                            
                            // Si estamos en login.html (raíz), usar ./admin/perfil.html
                            if (isInRoot || currentPath.endsWith('login.html')) {
                                return '.' + path;
                            }
                            // Si estamos en admin, usar ./perfil.html o ../admin/perfil.html según corresponda
                            if (isInAdmin) {
                                // Si la ruta es /admin/..., usar ./
                                if (path.startsWith('/admin/')) {
                                    return '.' + path;
                                }
                                // Si la ruta es /perfil.html, usar ../perfil.html
                                return '..' + path;
                            }
                            // Por defecto, usar ./
                            return '.' + path;
                        }
                        // Si ya es relativa, devolverla tal cual
                        return path;
                    };
                    
                    console.log('🔄 [AUTH] Preparando redirección...');
                    console.log('🔄 [AUTH] Redirect param:', redirect);
                    console.log('🔄 [AUTH] User role:', user.role);
                    
                    if (redirect) {
                        // Manejar redirect con diferentes formatos
                        let redirectPath;
                        let processedRedirect = redirect; // Crear nueva variable para modificar
                        
                        console.log('🔄 [AUTH] Procesando redirect:', processedRedirect);
                        
                        if (redirect.startsWith('/')) {
                            // Ruta absoluta: /admin/perfil o /admin/perfil.html
                            // Agregar .html si no tiene extensión
                            if (!processedRedirect.includes('.html') && !processedRedirect.includes('.php') && !processedRedirect.endsWith('/')) {
                                processedRedirect = processedRedirect + '.html';
                            }
                            redirectPath = getFullPath(processedRedirect);
                        } else if (redirect.startsWith('./')) {
                            // Ya es relativa con ./
                            redirectPath = redirect;
                        } else {
                            // Ruta relativa sin ./: admin/perfil o admin/perfil.html
                            // Agregar .html si no tiene extensión y no termina en /
                            if (!processedRedirect.includes('.html') && !processedRedirect.includes('.php') && !processedRedirect.endsWith('/')) {
                                processedRedirect = processedRedirect + '.html';
                            }
                            redirectPath = `./${processedRedirect}`;
                        }
                        console.log('🔄 [AUTH] Redirigiendo a:', redirectPath);
                        console.log('🔄 [AUTH] URL completa será:', window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + redirectPath.replace(/^\./, ''));
                        console.log('🔄 [AUTH] Estado antes de redirección:');
                        console.log('   - sessionReady:', this.sessionReady);
                        console.log('   - currentUser:', this.currentUser?.email);
                        console.log('   - Cookies disponibles:', document.cookie.split(';').filter(c => c.includes('token')).length);
                        console.log('⏳ [AUTH] Ejecutando redirección en 100ms...');
                        setTimeout(() => {
                            console.log('🚀 [AUTH] Redirigiendo ahora a:', redirectPath);
                            window.location.href = redirectPath;
                        }, 100);
                    } else if (user.role === 'admin') {
                        const adminPath = getFullPath('/admin/perfil.html');
                        console.log('🔄 [AUTH] Admin detectado, redirigiendo a:', adminPath);
                        console.log('🔄 [AUTH] Estado antes de redirección:');
                        console.log('   - sessionReady:', this.sessionReady);
                        console.log('   - currentUser:', this.currentUser?.email);
                        console.log('   - Cookies disponibles:', document.cookie.split(';').filter(c => c.includes('token')).length);
                        console.log('⏳ [AUTH] Ejecutando redirección en 100ms...');
                        setTimeout(() => {
                            console.log('🚀 [AUTH] Redirigiendo ahora a:', adminPath);
                            window.location.href = adminPath;
                        }, 100);
                    } else {
                        const clientPath = getFullPath('/perfil.html');
                        console.log('🔄 [AUTH] Cliente detectado, redirigiendo a:', clientPath);
                        console.log('🔄 [AUTH] Estado antes de redirección:');
                        console.log('   - sessionReady:', this.sessionReady);
                        console.log('   - currentUser:', this.currentUser?.email);
                        console.log('   - Cookies disponibles:', document.cookie.split(';').filter(c => c.includes('token')).length);
                        console.log('⏳ [AUTH] Ejecutando redirección en 100ms...');
                        setTimeout(() => {
                            console.log('🚀 [AUTH] Redirigiendo ahora a:', clientPath);
                            window.location.href = clientPath;
                        }, 100);
                    }
                    
                    console.log('✅ [AUTH] Retornando success: true');
                    return { success: true, user };
                } else {
                    // Retornar account_status y rejection_reason si están disponibles
                    return { 
                        success: false, 
                        message: response.message || 'Credenciales inválidas',
                        account_status: response.account_status || null,
                        rejection_reason: response.rejection_reason || null
                    };
                }
            } catch (error) {
                
                // Manejar errores específicos de cuenta
                if (error.response && error.response.data) {
                    const { account_status, message, rejection_reason } = error.response.data;
                    
                    if (account_status === 'pending') {
                        return {
                            success: false,
                            message: message || 'Tu cuenta está pendiente de aprobación',
                            account_status: 'pending'
                        };
                    }
                    
                    if (account_status === 'rejected') {
                        return {
                            success: false,
                            message: message || 'Tu cuenta ha sido rechazada',
                            account_status: 'rejected',
                            rejection_reason: rejection_reason || null
                        };
                    }
                }
                
                // Si el error tiene account_status directamente
                if (error.account_status) {
                    return {
                        success: false,
                        message: error.message || 'Error al iniciar sesión',
                        account_status: error.account_status,
                        rejection_reason: error.rejection_reason || null
                    };
                }
                
                return { 
                    success: false, 
                    message: error.message || 'Error al iniciar sesión' 
                };
            }
        }

        // Cerrar sesión - MEJORADO Y SEGURO
        async logout() {
            console.log('👋 Iniciando proceso de cierre de sesión...');
            
            // Guardar información antes de limpiar
            const wasAdmin = this.currentUser?.role === 'admin';
            const currentPath = window.location.pathname;
            
            // ✅ Disparar evento para limpiar carrito y otros datos
            window.dispatchEvent(new Event('userLoggedOut'));
            
            // Limpiar datos locales primero
            this.clearSession();
            
            // Llamar a API logout si existe (pero no esperar si falla)
            if (typeof api !== 'undefined' && api.logout) {
                try {
                    await Promise.race([
                        api.logout(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
                    ]);
                } catch (error) {
                    // No importa si falla, ya limpiamos localmente
                    console.log('⚠️ Error al cerrar sesión en backend (continuando de todas formas):', error.message);
                }
            }
            
            // Asegurar que las cookies estén limpiadas
            this.clearAuthCookies();
            
            // Actualizar UI
            this.updateUI();
            
            // Función helper para construir rutas con basePath
            const getFullPath = (path) => {
                if (path.startsWith('http') || path.startsWith('//')) return path;
                if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) {
                    const cleanPath = path.startsWith('/') ? path.substring(1) : 
                                     path.startsWith('../') ? path.substring(3) : 
                                     path.startsWith('./') ? path.substring(2) : path;
                    return window.BASE_PATH + cleanPath;
                }
                return path;
            };
            
            // Pequeño delay para asegurar que todo se limpió
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Redirigir según tipo de usuario y ubicación actual
            // SIEMPRE redirigir a login o index, NUNCA a perfil
            if (wasAdmin) {
                // Admin siempre va a login
                const loginPath = currentPath.includes('admin') 
                    ? getFullPath('../login.html') 
                    : getFullPath('./login.html');
                console.log('🔄 Redirigiendo admin a login:', loginPath);
                window.location.href = loginPath;
            } else {
                // Cliente siempre va a index (nunca a perfil)
                const indexPath = currentPath.includes('admin') 
                    ? getFullPath('../index.html') 
                    : getFullPath('./index.html');
                console.log('🔄 Redirigiendo cliente a index:', indexPath);
                window.location.href = indexPath;
            }
        }

        // Verificar si está autenticado
        isAuthenticated() {
            if (!this.currentUser) {
                return false;
            }
            if (!this.currentUser.id || !this.currentUser.email) {
                return false;
            }
            return true;
        }

        // Verificar si es admin
        isAdmin() {
            if (!this.isAuthenticated() || !this.currentUser) {
                return false;
            }
            // Verificar explícitamente que el rol sea 'admin'
            return this.currentUser.role === 'admin';
        }

        // Obtener usuario actual
        getCurrentUser() {
            return this.currentUser;
        }

        // Obtener token
        getToken() {
            return this.sessionToken;
        }

        // Actualizar perfil
        async updateProfile(data) {
            try {
                const response = await api.updateProfile(data);
                
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.updateUI();
                    return { success: true, user: this.currentUser };
                }
                
                return { success: false, message: response.message };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }

        // Verificar token válido con el servidor
        async verifyToken() {
            if (!api || typeof api.getMe !== 'function' || !api.baseURL) {
                return !!this.sessionToken;
            }

            try {
                const response = await api.getMe();
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.sessionReady = true;
                    this.updateUI();
                    return true;
                }
                return false;
            } catch (error) {
                this.clearSession();
                this.updateUI();
                return false;
            }
        }

        // Actualizar UI según estado de autenticación
        updateUI() {
            const userMenuDesktop = document.getElementById('userMenuDesktop');
            const userMenuMobile = document.getElementById('userMenuMobile');
            const guestMenuDesktop = document.getElementById('guestMenuDesktop');
            const guestMenuMobile = document.getElementById('guestMenuMobile');
            const userNameDisplay = document.getElementById('userNameDisplay');
            const adminMenuItem = document.getElementById('adminMenuItem');

            // Verificar autenticación de forma más robusta
            const isAuth = this.isAuthenticated();
            const user = this.getCurrentUser();

            if (isAuth && user) {
                // Mostrar menú de usuario
                if (userMenuDesktop) {
                    userMenuDesktop.style.display = '';
                    userMenuDesktop.classList.remove('hidden');
                }
                if (userMenuMobile) {
                    userMenuMobile.style.display = '';
                    userMenuMobile.classList.remove('hidden');
                }
                if (guestMenuDesktop) {
                    guestMenuDesktop.style.display = 'none';
                    guestMenuDesktop.classList.add('hidden');
                }
                if (guestMenuMobile) {
                    guestMenuMobile.style.display = 'none';
                    guestMenuMobile.classList.add('hidden');
                }
                
                // Mostrar nombre de usuario (manejar diferentes formatos)
                if (userNameDisplay) {
                    const firstName = user.first_name || 
                                    (user.name ? user.name.split(' ')[0] : null) || 
                                    user.email?.split('@')[0] || 
                                    'Usuario';
                    userNameDisplay.textContent = firstName;
                }
                
                // Mostrar menú admin SOLO si realmente es admin
                if (adminMenuItem) {
                    const isAdminUser = user.role === 'admin';
                    if (isAdminUser) {
                        adminMenuItem.style.display = '';
                        adminMenuItem.classList.remove('hidden');
                        adminMenuItem.classList.add('admin-visible'); // Para CSS móvil
                    } else {
                        adminMenuItem.style.display = 'none';
                        adminMenuItem.classList.add('hidden');
                        adminMenuItem.classList.remove('admin-visible'); // Quitar clase CSS
                    }
                }
            } else {
                // No autenticado: mostrar menú de invitado y ocultar todo lo de usuario
                if (userMenuDesktop) {
                    userMenuDesktop.style.display = 'none';
                    userMenuDesktop.classList.add('hidden');
                }
                if (userMenuMobile) {
                    userMenuMobile.style.display = 'none';
                    userMenuMobile.classList.add('hidden');
                }
                if (guestMenuDesktop) {
                    guestMenuDesktop.style.display = '';
                    guestMenuDesktop.classList.remove('hidden');
                }
                if (guestMenuMobile) {
                    guestMenuMobile.style.display = '';
                    guestMenuMobile.classList.remove('hidden');
                }
                
                // Ocultar menú admin siempre cuando no hay usuario
                if (adminMenuItem) {
                    adminMenuItem.style.display = 'none';
                    adminMenuItem.classList.add('hidden');
                    adminMenuItem.classList.remove('admin-visible'); // Asegurar que no tenga la clase CSS
                }
            }
        }

        // Requerir autenticación (para páginas protegidas) - MEJORADO
        requireAuth(redirectPath = 'login.html') {
            if (!this.sessionReady) {
                if (this.bootstrapPromise) {
                    this.bootstrapPromise.finally(() => {
                        this.requireAuth(redirectPath);
                    });
                }
                return true;
            }

            if (!this.isAuthenticated()) {
                notify.warning('Debes iniciar sesión para acceder a esta página', 'Autenticación requerida');
                
                // Función helper para construir rutas con basePath
                const getFullPath = (path) => {
                    if (path.startsWith('http') || path.startsWith('//')) return path;
                    if (typeof window.BASE_PATH !== 'undefined' && window.BASE_PATH) {
                        const cleanPath = path.startsWith('/') ? path.substring(1) : 
                                         path.startsWith('../') ? path.substring(3) : 
                                         path.startsWith('./') ? path.substring(2) : path;
                        return window.BASE_PATH + cleanPath;
                    }
                    return path;
                };
                
                const currentPath = window.location.pathname;
                const currentPage = currentPath.split('/').pop();
                
                if (currentPath.includes('admin')) {
                    window.location.href = getFullPath(`../${redirectPath}?redirect=${currentPage}`);
                } else {
                    window.location.href = getFullPath(`./${redirectPath}?redirect=${currentPage}`);
                }
                return false;
            }
            
            return true;
        }

        // Requerir rol admin (para páginas admin) - MEJORADO
        requireAdmin() {
            if (!this.sessionReady) {
                if (this.bootstrapPromise) {
                    this.bootstrapPromise.finally(() => {
                        this.requireAdmin();
                    });
                }
                return true;
            }

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
            
            if (!this.isAuthenticated()) {
              notify.warning('Debes iniciar sesión para acceder al panel admin');
              window.location.href = getFullPath('../login.html?redirect=admin');
              return false;
            }
            const user = this.getCurrentUser();
            if (!user || user.role !== 'admin') {
              notify.error('Acceso denegado. Solo administradores.');
              window.location.href = getFullPath('../perfil.html');
              return false;
            }
            return true;
          }
    }

    // Crear instancia global solo si no existe
    if (typeof authManager === 'undefined') {
        window.authManager = new AuthManager();
    }

    // Inicializar UI cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    function initAuth() {
        if (window.authManager) {
            window.authManager.updateUI();
            
            // Configurar botón de logout si existe
            const logoutButtons = document.querySelectorAll('[data-logout]');
            logoutButtons.forEach(button => {
              button.addEventListener('click', (e) => {
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
                    window.authManager.logout();
                  } else {
                    notify.info("Operación cancelada");
                  }
                });
              });
            });            
        }
    }

}