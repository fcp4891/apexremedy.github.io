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
                const response = await api.register(userData);
                
                if (response.success) {
                    // NO guardar token ni usuario después del registro
                    // La cuenta debe ser aprobada primero
                    return { 
                        success: true, 
                        message: 'Tu cuenta ha sido creada exitosamente. Debes esperar la aprobación del administrador antes de iniciar sesión.'
                    };
                }
                
                return { success: false, message: response.message };
            } catch (error) {
                return { success: false, message: error.message };
            }
        }

        // Iniciar sesión - ACTUALIZADO CON REDIRECCIÓN SEGÚN ROL
        async login(email, password) {
            try {
                // Verificar si hay backend configurado
                if (!api.baseURL) {
                    if (typeof notify !== 'undefined') {
                        notify.error('El backend no está configurado. Por favor, configura la URL del backend en producción o usa el modo de desarrollo local.', 'Backend no disponible');
                    } else {
                        alert('⚠️ El backend no está configurado.\n\nPor favor:\n1. Configura la URL del backend en frontend/js/api/apiClient.js\n2. O ejecuta el backend localmente en http://localhost:3000');
                    }
                    return { success: false, message: 'Backend no configurado' };
                }
                
                const response = await api.login({ email, password });
                
                if (response.success) {
                    const { token, user } = response.data;
                    
                    // Guardar token y usuario
                    this.token = token;
                    this.currentUser = user;
                    this.saveToStorage();
                    
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
                        // Si no hay basePath (local), usar la ruta tal cual
                        return path;
                    };
                    
                    if (redirect) {
                        const redirectPath = redirect.startsWith('/') ? getFullPath(redirect) :
                                             redirect.startsWith('./') ? redirect :
                                             `./${redirect}`;
                        window.location.href = redirectPath;
                      } else if (user.role === 'admin') {
                        window.location.href = getFullPath('/admin/perfil.html');
                      } else {
                        window.location.href = getFullPath('/perfil.html');
                      }
                    
                    return { success: true, user };
                } else {
                    return { 
                        success: false, 
                        message: response.message || 'Credenciales inválidas',
                        account_status: response.account_status
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
            
            // Redirigir según tipo de usuario
            if (wasAdmin) {
                if (window.location.pathname.includes('admin')) {
                    window.location.href = getFullPath('../login.html');
                } else {
                    window.location.href = getFullPath('./login.html');
                }
            } else {
                if (window.location.pathname.includes('admin')) {
                    window.location.href = getFullPath('../index.html');
                } else {
                    window.location.href = getFullPath('./index.html');
                }
            }
        }

        // Verificar si está autenticado
        isAuthenticated() {
            // Verificar que existan ambos: token y usuario
            if (!this.token || !this.currentUser) {
                return false;
            }
            // Verificar que el usuario tenga estructura válida
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
            return this.token;
        }

        // Actualizar perfil
        async updateProfile(data) {
            try {
                const response = await api.updateProfile(data);
                
                if (response.success) {
                    this.currentUser = response.data.user;
                    this.saveToStorage();
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
                return false;
            } catch (error) {
                // Solo hacer logout si es específicamente un error de token inválido
                if (error.message.includes('Token') || 
                    error.message.includes('Usuario no encontrado') || 
                    error.message.includes('Unauthorized')) {
                    this.logout();
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