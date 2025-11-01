// frontend/js/auth.js
// Gestor de autenticación del frontend

// Prevenir doble declaración
if (typeof AuthManager === 'undefined') {
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.token = null;
            this.loadFromStorage();
        }

        // Cargar datos de localStorage
        loadFromStorage() {
            const token = localStorage.getItem('authToken');
            const user = localStorage.getItem('currentUser');
            
            if (token && user) {
                this.token = token;
                try {
                    this.currentUser = JSON.parse(user);
                } catch (e) {
                    console.error('Error al parsear usuario:', e);
                    this.clearStorage();
                }
            }
        }

        // Guardar en localStorage
        saveToStorage() {
            if (this.token && this.currentUser) {
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        }

        // Limpiar localStorage
        clearStorage() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            this.token = null;
            this.currentUser = null;
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
                    const { token, user } = response.data;
                    
                    // Guardar token y usuario
                    this.token = token;
                    this.currentUser = user;
                    this.saveToStorage();
                    
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
                        const redirectPath = redirect.startsWith('/') ? redirect :
                                             redirect.startsWith('./') ? redirect :
                                             `./${redirect}`;
                        window.location.href = redirectPath;
                      } else if (user.role === 'admin') {
                        console.log('👨‍💼 Usuario admin detectado, redirigiendo a perfil admin');
                        window.location.href = '/admin/perfil.html';
                      } else {
                        console.log('👤 Usuario cliente detectado, redirigiendo a perfil cliente');
                        window.location.href = '/perfil.html';
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

        // Cerrar sesión - MEJORADO
        logout() {
            console.log('👋 Cerrando sesión...');
            
            const wasAdmin = this.currentUser?.role === 'admin';
            
            // ✅ AGREGAR: Disparar evento para limpiar carrito
            window.dispatchEvent(new Event('userLoggedOut'));
            
            // Limpiar datos
            this.clearStorage();
            
            // Llamar a API logout si existe
            if (typeof api !== 'undefined' && api.logout) {
                api.logout();
            }
            
            // Actualizar UI
            this.updateUI();
            
            // Redirigir según tipo de usuario
            if (wasAdmin) {
                console.log('🔄 Redirigiendo admin a login');
                if (window.location.pathname.includes('admin')) {
                    window.location.href = '../login.html';
                } else {
                    window.location.href = './login.html';
                }
            } else {
                console.log('🔄 Redirigiendo cliente a home');
                if (window.location.pathname.includes('admin')) {
                    window.location.href = '../index.html';
                } else {
                    window.location.href = './index.html';
                }
            }
        }

        // Verificar si está autenticado
        isAuthenticated() {
            return this.token !== null && this.currentUser !== null;
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
            return this.token;
        }

        // Actualizar perfil
        async updateProfile(data) {
            try {
                console.log('📝 Actualizando perfil...');
                const response = await api.updateProfile(data);
                
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.saveToStorage();
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
            if (!this.token) {
                return false;
            }
            
            try {
                const response = await api.getMe();
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.saveToStorage();
                    return true;
                }
                console.warn('Token podría ser inválido, respuesta no exitosa');
                return false;
            } catch (error) {
                // Solo hacer logout si es específicamente un error de token inválido
                if (error.message.includes('Token') || 
                    error.message.includes('Usuario no encontrado') || 
                    error.message.includes('Unauthorized')) {
                    console.warn('Token inválido o expirado:', error.message);
                    this.logout();
                } else {
                    console.warn('Error de conexión al verificar token:', error.message);
                }
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