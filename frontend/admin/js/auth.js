// frontend/admin/js/auth.js
// Gestor de autenticación del frontend ADMIN

// Log inmediato para verificar que el script se carga
try {
    console.log('📦 [ADMIN AUTH] Script auth.js cargado');
    console.log('📦 [ADMIN AUTH] Timestamp:', new Date().toISOString());
    console.log('📦 [ADMIN AUTH] URL actual:', window.location.href);
} catch (e) {
    console.error('❌ [ADMIN AUTH] Error en log inicial:', e);
}

// Prevenir doble declaración
if (typeof AuthManager === 'undefined') {
    console.log('📦 [ADMIN AUTH] Creando clase AuthManager...');
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.sessionToken = null;
            this.sessionReady = false;
            this.bootstrapPromise = this.bootstrap();
        }

        async bootstrap() {
            console.log('🚀 [auth.js] Iniciando bootstrap...');
            
            // Si no hay API configurada, no hay sesión
            if (!api || typeof api.getProfile !== 'function' || !api.baseURL) {
                console.log('⚠️ [auth.js] No hay API configurada');
                this.sessionReady = true;
                this.currentUser = null;
                this.clearSession();
                return;
            }

            try {
                // NOTA: No podemos verificar cookies httpOnly desde JavaScript
                // Las cookies access_token y refresh_token son httpOnly y no son visibles en document.cookie
                // Simplemente intentamos obtener el perfil - si las cookies están presentes,
                // el navegador las enviará automáticamente. Si no, el servidor responderá con 401.
                console.log('📡 [auth.js] Verificando sesión con el servidor...');
                console.log('ℹ️ [auth.js] Las cookies httpOnly se envían automáticamente si están presentes');
                
                // Intentar obtener perfil del servidor
                const response = await api.getProfile();
                console.log('📥 [auth.js] Respuesta del servidor:', response?.success ? '✅ Éxito' : '❌ Fallo');
                
                // Validar respuesta estrictamente
                if (response && response.success && response.data?.user) {
                    const user = response.data.user;
                    console.log('👤 [auth.js] Usuario recibido:', user.email, 'Rol:', user.role);
                    
                    // Validar que el usuario tenga datos mínimos requeridos
                    if (user.id && user.email) {
                        this.currentUser = user;
                        console.log('✅ [auth.js] Usuario establecido correctamente');
                    } else {
                        // Datos incompletos, limpiar sesión
                        console.log('❌ [auth.js] Usuario sin datos completos (id o email faltante)');
                        this.currentUser = null;
                        this.clearSession();
                    }
                } else {
                    // Respuesta inválida, limpiar sesión
                    console.log('❌ [auth.js] Respuesta inválida del servidor');
                    this.currentUser = null;
                    this.clearSession();
                }
            } catch (error) {
                // Cualquier error (401, 403, network, etc.) = no hay sesión válida
                console.log('❌ [auth.js] Error al verificar sesión:', error.message);
                this.currentUser = null;
                this.clearSession();
            } finally {
                this.sessionReady = true;
                this.updateUI();
                console.log('✅ [auth.js] Bootstrap completado. Sesión lista:', this.sessionReady, 'Usuario:', this.currentUser ? this.currentUser.email : 'null');
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
                console.log('📝 Intentando registrar usuario...');
                const response = await api.register(userData);
                
                if (response.success) {
                    // NO guardar token ni usuario después del registro
                    // La cuenta debe ser aprobada primero
                    console.log('✅ Registro exitoso - Esperando aprobación del administrador');
                    return { 
                        success: true, 
                        message: 'Tu cuenta ha sido creada exitosamente. Debes esperar la aprobación del administrador antes de iniciar sesión.'
                    };
                }
                
                console.error('❌ Registro fallido:', response.message);
                return { success: false, message: response.message };
            } catch (error) {
                console.error('❌ Error en registro:', error);
                return { success: false, message: error.message };
            }
        }

        // Iniciar sesión - ACTUALIZADO CON REDIRECCIÓN SEGÚN ROL
        async login(email, password) {
            try {
                console.log('🔐 Intentando login...');
                
                const response = await api.login({ email, password });
                
                if (response.success) {
                    const { token = null, user } = response.data;
                    
                    this.sessionToken = token;
                    this.currentUser = user;
                    this.sessionReady = true;
                    
                    window.dispatchEvent(new Event('userLoggedIn'));
        
                    console.log('✅ Login exitoso:', user);
                    
                    // Actualizar UI si la función existe
                    this.updateUI();
                    
                    // ============================================
                    // REDIRECCIÓN MEJORADA SEGÚN ROL Y ESTADO
                    // ============================================
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirect = urlParams.get('redirect');
                    
                    if (redirect) {
                        console.log('🔄 Redirigiendo a:', redirect);
                        // Manejar redirect con diferentes formatos
                        let redirectPath;
                        let processedRedirect = redirect; // Crear nueva variable para modificar
                        
                        if (redirect.startsWith('/')) {
                            // Ruta absoluta: /admin/perfil o /admin/perfil.html
                            // Agregar .html si no tiene extensión
                            if (!processedRedirect.includes('.html') && !processedRedirect.includes('.php') && !processedRedirect.endsWith('/')) {
                                processedRedirect = processedRedirect + '.html';
                            }
                            // Convertir a relativa para desarrollo local
                            redirectPath = processedRedirect.startsWith('/admin/') ? '.' + processedRedirect : './admin' + processedRedirect;
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
                        console.log('🔄 Redirigiendo a:', redirectPath);
                        window.location.replace(redirectPath);
                    } else if (user.role === 'admin') {
                        console.log('👨‍💼 Usuario admin detectado, redirigiendo a perfil admin');
                        window.location.replace('./admin/perfil.html'); 
                    } else {
                        console.log('👤 Usuario cliente detectado, redirigiendo a perfil cliente');
                        window.location.replace('./perfil.html');
                    }
                    
                    return { success: true, user };
                } else {
                    console.error('❌ Login fallido:', response.message);
                    return { 
                        success: false, 
                        message: response.message || 'Credenciales inválidas',
                        account_status: response.account_status
                    };
                }
            } catch (error) {
                console.error('❌ Error en login:', error);
                
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
                            rejection_reason
                        };
                    }
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

        // Verificar si está autenticado - MEJORADO: Más logging
        isAuthenticated() {
            const hasUser = !!this.currentUser;
            const hasValidData = hasUser && this.currentUser.id && this.currentUser.email;
            
            if (!hasUser) {
                console.log('🔒 isAuthenticated: No hay currentUser');
                return false;
            }
            if (!hasValidData) {
                console.log('🔒 isAuthenticated: Usuario sin datos válidos (id o email faltante)');
                return false;
            }
            
            console.log('✅ isAuthenticated: Usuario válido', {
                id: this.currentUser.id,
                email: this.currentUser.email,
                role: this.currentUser.role
            });
            return true;
        }

        // Verificar si es admin
        isAdmin() {
            return this.isAuthenticated() && this.currentUser.role === 'admin';
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
                console.log('📝 Actualizando perfil...');
                const response = await api.updateProfile(data);
                
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.updateUI();
                    console.log('✅ Perfil actualizado');
                    return { success: true, user: this.currentUser };
                }
                
                console.error('❌ Error al actualizar perfil:', response.message);
                return { success: false, message: response.message };
            } catch (error) {
                console.error('❌ Error al actualizar perfil:', error);
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
                console.warn('Token podría ser inválido, respuesta no exitosa');
                return false;
            } catch (error) {
                console.warn('Error al verificar sesión:', error.message);
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

            if (this.isAuthenticated()) {
                // Mostrar menú de usuario
                if (userMenuDesktop) userMenuDesktop.classList.remove('hidden');
                if (userMenuMobile) userMenuMobile.classList.remove('hidden');
                if (guestMenuDesktop) guestMenuDesktop.classList.add('hidden');
                if (guestMenuMobile) guestMenuMobile.classList.add('hidden');
                
                // Mostrar nombre de usuario
                if (userNameDisplay) {
                    userNameDisplay.textContent = this.currentUser.name.split(' ')[0];
                }
                
                // Mostrar menú admin si es admin
                if (adminMenuItem) {
                    if (this.isAdmin()) {
                        adminMenuItem.classList.remove('hidden');
                    } else {
                        adminMenuItem.classList.add('hidden');
                    }
                }
            } else {
                // Mostrar menú de invitado
                if (userMenuDesktop) userMenuDesktop.classList.add('hidden');
                if (userMenuMobile) userMenuMobile.classList.add('hidden');
                if (guestMenuDesktop) guestMenuDesktop.classList.remove('hidden');
                if (guestMenuMobile) guestMenuMobile.classList.remove('hidden');
                
                if (adminMenuItem) adminMenuItem.classList.add('hidden');
            }
        }

        // Requerir autenticación (para páginas protegidas) - MEJORADO
        requireAuth(redirectPath = 'login.html') {
            console.log('🔒 Verificando autenticación...');

            if (!this.sessionReady) {
                if (this.bootstrapPromise) {
                    this.bootstrapPromise.finally(() => {
                        this.requireAuth(redirectPath);
                    });
                }
                return true;
            }
            
            if (!this.isAuthenticated()) {
                console.log('❌ No autenticado');
                notify.warning('Debes iniciar sesión para acceder a esta página', 'Autenticación requerida');
                
                const currentPath = window.location.pathname;
                const currentPage = currentPath.split('/').pop();
                
                if (currentPath.includes('admin')) {
                    window.location.href = `../${redirectPath}?redirect=${currentPage}`;
                } else {
                    window.location.href = `./${redirectPath}?redirect=${currentPage}`;
                }
                return false;
            }
            
            console.log('✅ Usuario autenticado');
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

            if (!this.isAuthenticated()) {
              notify.warning('Debes iniciar sesión para acceder al panel admin');
              window.location.href = '../login.html?redirect=admin';
              return false;
            }
            const user = this.getCurrentUser();
            if (!user || user.role !== 'admin') {
              notify.error('Acceso denegado. Solo administradores.');
              window.location.href = '../perfil.html';
              return false;
            }
            return true;
          }
    }

    // Crear instancia global solo si no existe
    console.log('📦 [ADMIN AUTH] Verificando si authManager existe...', typeof authManager);
    if (typeof authManager === 'undefined') {
        console.log('📦 [ADMIN AUTH] Creando instancia de AuthManager...');
        window.authManager = new AuthManager();
        console.log('✅ [ADMIN AUTH] Instancia creada:', window.authManager);
    } else {
        console.log('⚠️ [ADMIN AUTH] authManager ya existe, usando existente');
    }

    // Inicializar UI cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    function initAuth() {
        console.log('🚀 [ADMIN AUTH] initAuth() ejecutado');
        if (window.authManager) {
            console.log('✅ [ADMIN AUTH] authManager disponible, actualizando UI...');
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

    /**
     * 🩺 DIAGNÓSTICO DE ACCESO A PRODUCTOS MEDICINALES
     * Función para diagnosticar problemas con usuarios aprobados
     */
    async function diagnosticMedicinalAccess() {
        console.log('🩺 === DIAGNÓSTICO DE ACCESO MEDICINAL ===');
        console.log('📅 Fecha:', new Date().toLocaleString('es-CL'));
        
        try {
            // 1. Verificar autenticación
            const isLoggedIn = window.authManager && window.authManager.isLoggedIn();
            console.log('🔐 Estado de login:', isLoggedIn);
            
            if (!isLoggedIn) {
                console.log('❌ PROBLEMA: Usuario no logueado');
                console.log('💡 SOLUCIÓN: Inicia sesión para acceder a productos medicinales');
                return;
            }
            
            // 2. Verificar datos del usuario actual
            const currentUser = window.authManager.currentUser;
            console.log('👤 Usuario actual:', {
                id: currentUser?.id,
                email: currentUser?.email,
                name: `${currentUser?.first_name} ${currentUser?.last_name}`,
                role: currentUser?.role,
                account_status: currentUser?.account_status,
                is_active: currentUser?.is_active,
                is_verified: currentUser?.is_verified
            });
            
            // 3. Verificar si debería tener acceso
            const shouldHaveAccess = currentUser?.role === 'admin' || currentUser?.account_status === 'approved';
            console.log('🎯 ¿Debería tener acceso?', shouldHaveAccess);
            
            if (!shouldHaveAccess) {
                console.log('⚠️ PROBLEMA: Usuario no aprobado para productos medicinales');
                console.log('📋 Estado actual:', currentUser?.account_status || 'sin estado');
                console.log('💡 SOLUCIÓN: Contacta al administrador para aprobar tu cuenta');
                
                if (currentUser?.account_status === 'pending') {
                    console.log('⏳ Tu cuenta está pendiente de aprobación');
                } else if (currentUser?.account_status === 'rejected') {
                    console.log('❌ Tu cuenta fue rechazada - contacta soporte');
                } else {
                    console.log('❓ Estado desconocido - verifica con administrador');
                }
                return;
            }
            
            // 4. Probar acceso a productos
            console.log('🧪 Probando acceso a productos...');
            
            try {
                const productsResponse = await window.api.getAllProducts();
                console.log('📦 Productos cargados:', productsResponse.success);
                
                if (productsResponse.success) {
                    const products = productsResponse.data.products || productsResponse.data;
                    const medicinalProducts = products.filter(p => 
                        p.requires_prescription || 
                        p.is_medicinal || 
                        (p.category && p.category.toLowerCase().includes('medicinal'))
                    );
                    
                    console.log('💊 Total productos medicinales encontrados:', medicinalProducts.length);
                    
                    if (medicinalProducts.length > 0) {
                        console.log('✅ ACCESO CORRECTO: Productos medicinales visibles');
                        console.log('📋 Ejemplos:', medicinalProducts.slice(0, 3).map(p => ({
                            id: p.id,
                            name: p.name,
                            category: p.category,
                            requires_prescription: p.requires_prescription
                        })));
                    } else {
                        console.log('⚠️ ADVERTENCIA: No se encontraron productos medicinales');
                        console.log('💡 Esto puede ser normal si no hay productos medicinales en la base de datos');
                    }
                } else {
                    throw new Error(productsResponse.message);
                }
            } catch (apiError) {
                console.log('❌ ERROR EN API:', apiError.message);
                
                if (apiError.message.includes('401') || apiError.message.includes('unauthorized')) {
                    console.log('🔑 PROBLEMA DE TOKEN: Tu sesión puede estar expirada');
                    console.log('💡 SOLUCIÓN: Cierra sesión e inicia sesión nuevamente');
                } else {
                    console.log('💡 SOLUCIÓN: Verifica la conexión al servidor');
                }
            }
            
            // 5. Verificar token JWT
            const token = window.authManager.token;
            if (token) {
                try {
                    // Decodificar token JWT (parte del payload)
                    const tokenParts = token.split('.');
                    const payload = JSON.parse(atob(tokenParts[1]));
                    
                    console.log('🎫 Token JWT:', {
                        userId: payload.userId,
                        role: payload.role,
                        account_status: payload.account_status,
                        exp: new Date(payload.exp * 1000).toLocaleString('es-CL'),
                        expirado: Date.now() > payload.exp * 1000
                    });
                    
                    if (Date.now() > payload.exp * 1000) {
                        console.log('⚠️ PROBLEMA: Token expirado');
                        console.log('💡 SOLUCIÓN: Cierra sesión e inicia sesión nuevamente');
                    }
                    
                    // Verificar si los datos del token coinciden con los del usuario
                    if (payload.account_status !== currentUser?.account_status) {
                        console.log('⚠️ PROBLEMA: Datos del token desactualizados');
                        console.log('💡 SOLUCIÓN: Cierra sesión e inicia sesión nuevamente para actualizar el token');
                    }
                } catch (tokenError) {
                    console.log('❌ Error decodificando token:', tokenError);
                }
            }
            
            console.log('🏁 === FIN DEL DIAGNÓSTICO ===');
            
        } catch (error) {
            console.error('❌ Error en diagnóstico:', error);
        }
    }
    
    // Exportar función de diagnóstico al scope global
    window.diagnosticMedicinalAccess = diagnosticMedicinalAccess;
}