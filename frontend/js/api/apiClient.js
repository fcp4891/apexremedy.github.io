// frontend/js/api/apiClient.js
// Cliente API para comunicación con el backend
// ✅ ACTUALIZADO CON SOPORTE MEDICINAL

// Prevenir doble declaración
if (typeof APIClient === 'undefined') {
    class APIClient {
        constructor() {
            // Detectar entorno y configurar URL de API
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // ⚠️ IMPORTANTE: Configurar la URL de tu backend en producción
            // Si tu backend está en Heroku/Railway/Render/etc, reemplaza la URL abajo
            // Ejemplo: 'https://apexremedy-api.herokuapp.com/api'
            // Ejemplo: 'https://api.apexremedy.com/api'
            // Si no tienes backend en producción, déjalo como null para usar solo API estática
            const PRODUCTION_API_URL = null; // ⚠️ Configurar URL real del backend o null para solo API estática
            
            // Si no hay URL de producción configurada, usar localhost como fallback o solo API estática
            if (isProduction && !PRODUCTION_API_URL) {
                console.warn('⚠️ No hay backend configurado en producción. Se usará solo API estática.');
                this.baseURL = null; // null indica que solo se usará API estática
            } else {
                this.baseURL = isProduction 
                    ? PRODUCTION_API_URL
                    : 'http://localhost:3000/api';
            }
            
            // Sincronizar token con localStorage al inicializar
            this.token = localStorage.getItem('authToken');
            
            // Log para debug
            if (isProduction) {
                console.log('🌐 Modo producción detectado');
                console.log('🔗 API URL:', this.baseURL);
            } else {
                console.log('💻 Modo desarrollo detectado');
                console.log('🔗 API URL:', this.baseURL);
            }
        }
        
        // Método para sincronizar token desde localStorage
        syncToken() {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken !== this.token) {
                this.token = storedToken;
            }
        }

        // Método auxiliar para hacer peticiones
        async request(endpoint, options = {}) {
            // Verificar si hay backend configurado
            if (!this.baseURL) {
                const error = new Error('Backend no configurado. Por favor, configura la URL del backend en producción o usa el modo de desarrollo.');
                error.code = 'NO_BACKEND_CONFIGURED';
                throw error;
            }
            
            // Sincronizar token antes de cada petición
            this.syncToken();
            
            const url = `${this.baseURL}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            // Agregar token si existe (sincronizado desde localStorage)
            if (this.token) {
                headers['Authorization'] = `Bearer ${this.token}`;
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                const data = await response.json();

                if (!response.ok) {
                    // Si es error 401, limpiar token y redirigir
                    if (response.status === 401) {
                        this.token = null;
                        localStorage.removeItem('authToken');
                        if (typeof authManager !== 'undefined') {
                            authManager.logout();
                        }
                    }
                    throw new Error(data.message || 'Error en la petición');
                }

                return data;
            } catch (error) {
                // Si es un error de red (backend no disponible), proporcionar mensaje más claro
                if (error.message.includes('Failed to fetch') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
                    const friendlyError = new Error('No se pudo conectar con el servidor. Verifica que el backend esté configurado y disponible.');
                    friendlyError.code = 'NETWORK_ERROR';
                    friendlyError.originalError = error;
                    throw friendlyError;
                }
                console.error('Error en petición:', error);
                throw error;
            }
        }

        // Métodos de autenticación
        async register(userData) {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.success && response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        }

        async login(credentials) {
            // Si no hay backend configurado, usar autenticación estática
            if (!this.baseURL) {
                return await this.loginStatic(credentials);
            }
            
            const response = await this.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.success && response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        }
        
        // 🆕 Login usando JSON estático
        async loginStatic(credentials) {
            try {
                const { email, password } = credentials;
                
                if (!email || !password) {
                    return {
                        success: false,
                        message: 'Email y contraseña son requeridos'
                    };
                }
                
                // Cargar usuarios desde JSON estático
                const usersData = await this.loadStaticJSON('users.json');
                
                if (!usersData || !usersData.success || !usersData.data || !usersData.data.users) {
                    return {
                        success: false,
                        message: 'No se pudo cargar la información de usuarios'
                    };
                }
                
                const users = usersData.data.users;
                
                // Buscar usuario por email
                const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                
                if (!user) {
                    return {
                        success: false,
                        message: 'Credenciales incorrectas'
                    };
                }
                
                // Verificar si el usuario está activo
                if (!user.is_active) {
                    return {
                        success: false,
                        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
                    };
                }
                
                // Comparar contraseña usando SHA-256 (mismo método que seed_users.js)
                const passwordHash = await this.hashPassword(password);
                
                if (user.password_hash !== passwordHash) {
                    return {
                        success: false,
                        message: 'Credenciales incorrectas'
                    };
                }
                
                // Generar token simple (simulado)
                const token = this.generateSimpleToken(user);
                
                // Preparar datos del usuario (sin password_hash)
                const { password_hash, ...userData } = user;
                
                return {
                    success: true,
                    message: 'Login exitoso',
                    data: {
                        token: token,
                        user: userData
                    }
                };
                
            } catch (error) {
                console.error('Error en login estático:', error);
                return {
                    success: false,
                    message: error.message || 'Error al iniciar sesión'
                };
            }
        }
        
        // 🆕 Hash de contraseña usando SHA-256 (compatible con seed_users.js)
        async hashPassword(password) {
            // Usar Web Crypto API para SHA-256
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }
        
        // 🆕 Generar token simple para autenticación estática
        generateSimpleToken(user) {
            // Crear un token simple usando base64
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
                exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
            };
            
            // Simular JWT con base64 (no es seguro, pero funciona para estático)
            const payloadBase64 = btoa(JSON.stringify(payload));
            return `static.${payloadBase64}.${Date.now()}`;
        }

        async getProfile() {
            return await this.request('/auth/profile');
        }

        async updateProfile(data) {
            return await this.request('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        }

        async verifyToken() {
            try {
                return await this.request('/auth/verify');
            } catch (error) {
                this.clearToken();
                return null;
            }
        }

        logout() {
            this.clearToken();
            localStorage.removeItem('currentUser');
            localStorage.removeItem('cart');
        }

        setToken(token) {
            this.token = token;
            localStorage.setItem('authToken', token);
        }

        clearToken() {
            this.token = null;
            localStorage.removeItem('authToken');
        }

        // Método auxiliar para cargar JSON estático (fallback en producción)
        async loadStaticJSON(filename) {
            try {
                // Usar getBasePath si está disponible (de basePath.js)
                let apiPath;
                if (typeof window.getBasePath === 'function') {
                    // Construir ruta usando getBasePath
                    apiPath = window.getBasePath('api/' + filename);
                } else if (window.BASE_PATH) {
                    // Usar BASE_PATH global si existe
                    apiPath = window.BASE_PATH + 'api/' + filename;
                } else {
                    // Fallback: detectar manualmente
                    const isGitHubPages = window.location.hostname.includes('github.io');
                    if (isGitHubPages) {
                        // En GitHub Pages, construir ruta absoluta
                        const pathParts = window.location.pathname.split('/').filter(p => p);
                        const repoName = 'apexremedy.github.io';
                        const repoIndex = pathParts.indexOf(repoName);
                        
                        if (repoIndex !== -1) {
                            const repoPath = '/' + pathParts.slice(0, repoIndex + 1).join('/');
                            const hasFrontend = window.location.pathname.includes('/frontend/');
                            apiPath = repoPath + (hasFrontend ? '/frontend/api/' : '/api/') + filename;
                        } else {
                            // Fallback simple
                            apiPath = window.location.pathname.includes('/frontend/') 
                                ? './api/' + filename 
                                : './frontend/api/' + filename;
                        }
                    } else {
                        // Desarrollo local
                        apiPath = window.location.pathname.includes('/frontend/') 
                            ? './api/' + filename 
                            : './frontend/api/' + filename;
                    }
                }
                
                // Asegurar que la ruta comience con / si es absoluta en GitHub Pages
                if (window.location.hostname.includes('github.io') && !apiPath.startsWith('http') && !apiPath.startsWith('/')) {
                    apiPath = '/' + apiPath;
                }
                
                console.log('📂 Intentando cargar JSON estático desde:', apiPath);
                const response = await fetch(apiPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('✅ JSON estático cargado exitosamente:', filename);
                return data;
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar ${filename} estático:`, error.message);
                return null;
            }
        }

        // Métodos de productos con fallback a JSON estático
        async getProducts(filters = {}) {
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // En producción, intentar primero con JSON estático
            if (isProduction) {
                try {
                    const staticData = await this.loadStaticJSON('products.json');
                    console.log('🔍 JSON estático cargado:', staticData);
                    if (staticData && staticData.success && staticData.data && staticData.data.products) {
                        // Aplicar filtros localmente si existen
                        let products = staticData.data.products;
                        console.log('📦 Productos extraídos del JSON:', products.length);
                        
                        // Filtrar por búsqueda
                        if (filters.search) {
                            const searchLower = filters.search.toLowerCase();
                            products = products.filter(p => 
                                p.name.toLowerCase().includes(searchLower) ||
                                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                                (p.sku && p.sku.toLowerCase().includes(searchLower))
                            );
                        }
                        
                        // Filtrar por categoría
                        if (filters.category && filters.category !== 'all') {
                            products = products.filter(p => 
                                p.category_slug === filters.category || 
                                p.category_id === parseInt(filters.category)
                            );
                        }
                        
                        // Filtrar por precio mínimo
                        if (filters.minPrice) {
                            products = products.filter(p => p.price >= parseFloat(filters.minPrice));
                        }
                        
                        // Filtrar por precio máximo
                        if (filters.maxPrice) {
                            products = products.filter(p => p.price <= parseFloat(filters.maxPrice));
                        }
                        
                        // Filtrar por stock
                        if (filters.inStock) {
                            products = products.filter(p => p.stock > 0);
                        }
                        
                        // Filtrar por destacados
                        if (filters.featured) {
                            products = products.filter(p => p.featured === true);
                        }
                        
                        // Limitar resultados
                        if (filters.limit) {
                            products = products.slice(0, parseInt(filters.limit));
                        }
                        
                        console.log('✅ Productos cargados desde JSON estático:', products.length);
                        console.log('📊 Primeros productos:', products.slice(0, 3).map(p => ({ id: p.id, name: p.name })));
                        return {
                            success: true,
                            data: { products },
                            message: 'Productos cargados desde API estática'
                        };
                    }
                } catch (error) {
                    console.warn('⚠️ Error al cargar JSON estático, intentando API dinámica...', error);
                }
            }
            
            // Si no es producción o falló el JSON estático, usar API dinámica
            try {
                const queryParams = new URLSearchParams();
                
                Object.keys(filters).forEach(key => {
                    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                        queryParams.append(key, filters[key]);
                    }
                });

                const queryString = queryParams.toString();
                const endpoint = queryString ? `/products?${queryString}` : '/products';
                
                return await this.request(endpoint);
            } catch (error) {
                // Si la API dinámica también falla y estamos en producción, devolver JSON estático sin filtros
                if (isProduction) {
                    const staticData = await this.loadStaticJSON('products.json');
                    if (staticData && staticData.success) {
                        console.warn('⚠️ API dinámica no disponible, usando JSON estático sin filtros');
                        return staticData;
                    }
                }
                throw error;
            }
        }

        async getProductById(id) {
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // En producción, intentar primero con JSON estático
            if (isProduction) {
                try {
                    const staticData = await this.loadStaticJSON('products.json');
                    if (staticData && staticData.success && staticData.data.products) {
                        const product = staticData.data.products.find(p => p.id === parseInt(id));
                        if (product) {
                            console.log('✅ Producto cargado desde JSON estático:', product.name);
                            return {
                                success: true,
                                data: { product },
                                message: 'Producto cargado desde API estática'
                            };
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Error al cargar JSON estático, intentando API dinámica...', error);
                }
            }
            
            // Si no es producción o falló el JSON estático, usar API dinámica
            return await this.request(`/products/${id}`);
        }

        async searchProducts(query) {
            // Para búsqueda, usar getProducts con filtro search
            return await this.getProducts({ search: query });
        }

        async getFeaturedProducts() {
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // En producción, intentar primero con JSON estático
            if (isProduction) {
                try {
                    const staticData = await this.loadStaticJSON('products-featured.json');
                    if (staticData && staticData.success && staticData.data.products) {
                        console.log('✅ Productos destacados cargados desde JSON estático:', staticData.data.products.length);
                        return staticData;
                    }
                } catch (error) {
                    console.warn('⚠️ Error al cargar JSON estático, intentando API dinámica...', error);
                }
            }
            
            // Si no es producción o falló el JSON estático, usar API dinámica
            try {
                return await this.request('/products/featured');
            } catch (error) {
                // Si la API dinámica también falla y estamos en producción, usar JSON estático
                if (isProduction) {
                    const staticData = await this.loadStaticJSON('products-featured.json');
                    if (staticData && staticData.success) {
                        console.warn('⚠️ API dinámica no disponible, usando JSON estático');
                        return staticData;
                    }
                }
                throw error;
            }
        }

        async getCategories() {
            return await this.request('/products/categories');
        }

        async getBestSellers(limit = 10) {
            return await this.request(`/products/bestsellers?limit=${limit}`);
        }

        // 🆕 NUEVO: Obtener productos medicinales (requiere autenticación y aprobación)
        async getMedicinalProducts(limit = 50) {
            return await this.request(`/products/medicinal/all?limit=${limit}`);
        }

        // Métodos de productos (ADMIN)
        async createProduct(productData) {
            return await this.request('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
        }

        async updateProduct(id, productData) {
            return await this.request(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
        }

        async deleteProduct(id) {
            return await this.request(`/products/${id}`, {
                method: 'DELETE'
            });
        }

        async updateProductStock(id, quantity) {
            return await this.request(`/products/${id}/stock`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity })
            });
        }

        async getProductStats() {
            return await this.request('/products/stats');
        }

        // Métodos de pedidos
        async createOrder(orderData) {
            return await this.request('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
        }

        async getMyOrders(limit) {
            const endpoint = limit ? `/orders/my-orders?limit=${limit}` : '/orders/my-orders';
            return await this.request(endpoint);
        }

        async getOrderById(id) {
            return await this.request(`/orders/${id}`);
        }

        async cancelOrder(id) {
            return await this.request(`/orders/${id}/cancel`, {
                method: 'POST'
            });
        }

        // Métodos de pedidos (ADMIN)
        async getAllOrders(filters = {}) {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = queryString ? `/orders?${queryString}` : '/orders';
            
            return await this.request(endpoint);
        }

        async updateOrderStatus(id, status) {
            return await this.request(`/orders/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
        }

        async getOrderStats() {
            return await this.request('/orders/admin/stats');
        }

        async getSalesSummary(period = 'day') {
            return await this.request(`/orders/admin/sales-summary?period=${period}`);
        }

        // Verificar salud de la API
        async checkHealth() {
            try {
                return await this.request('/health');
            } catch (error) {
                return { success: false, message: 'API no disponible' };
            }
        }

        // ============================================
        // MÉTODOS DE USUARIOS (ADMIN)
        // ============================================
        
        async getUsers(filters = {}) {
            const queryParams = new URLSearchParams();
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    queryParams.append(key, filters[key]);
                }
            });

            const queryString = queryParams.toString();
            const endpoint = queryString ? `/users?${queryString}` : '/users';
            
            return await this.request(endpoint);
        }

        async getUserById(id) {
            return await this.request(`/users/${id}`);
        }

        async getUserDocuments(id) {
            return await this.request(`/users/${id}/documents`);
        }

        async saveUserDocuments(userId, documents) {
            return await this.request(`/users/${userId}/documents`, {
                method: 'POST',
                body: JSON.stringify({ documents })
            });
        }

        async approveUser(id, notes = '') {
            return await this.request(`/users/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ admin_notes: notes })
            });
        }

        async rejectUser(id, reason, notes = '') {
            return await this.request(`/users/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ 
                    rejection_reason: reason,
                    admin_notes: notes 
                })
            });
        }

        async updateUser(id, userData) {
            return await this.request(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
        }

        async deleteUser(id) {
            return await this.request(`/users/${id}`, {
                method: 'DELETE'
            });
        }

        async getPendingUsers() {
            return await this.request('/users/pending');
        }

// Subir comprobante de pago
async uploadPaymentProof(orderId, file) {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('orderId', orderId);

    const url = `${this.baseURL}/orders/${orderId}/payment-proof`;
    const headers = {};

    // Agregar token si existe
    if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData // No incluir Content-Type, el navegador lo manejará
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error al subir comprobante');
        }

        return data;
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        throw error;
    }
}

// Verificar estado de pago
async checkPaymentStatus(orderId) {
    return await this.request(`/orders/${orderId}/payment-status`);
}

// Confirmar pago (ADMIN)
async confirmPayment(orderId, notes = '') {
    return await this.request(`/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: notes })
    });
}

// Rechazar pago (ADMIN)
async rejectPayment(orderId, reason) {
    return await this.request(`/orders/${orderId}/reject-payment`, {
        method: 'POST',
        body: JSON.stringify({ rejection_reason: reason })
    });
}

// Obtener órdenes pendientes de pago (ADMIN)
async getPendingPayments() {
    return await this.request('/orders/pending-payments');
}

// Obtener comprobante de pago
async getPaymentProof(orderId) {
    return await this.request(`/orders/${orderId}/payment-proof`);
}

// ============================================
// PAGOS (Transferencias)
// ============================================

// Enviar transferencia (cliente) con FormData (no usar this.request por Content-Type)
async submitTransferProof(formData) {
    const url = `${this.baseURL}/payments/bank-transfer`;
    const headers = {};

    // token
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(url, {
        method: 'POST',
        headers,          // sin Content-Type; fetch lo define por boundary
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al enviar transferencia');
    }
    return data;
}

// Listar transferencias pendientes (admin)
async getPendingTransfers() {
    return await this.request('/payments/pending');
}

// Obtener una transferencia por ID (admin)
async getTransferById(id) {
    return await this.request(`/payments/${id}`);
}

// Validar transferencia (admin): approved=true/false
async validateTransfer(id, approved) {
    return await this.request(`/payments/${id}/validate`, {
        method: 'POST',
        body: JSON.stringify({ approved })
    });
}


    }

    // Crear instancia global solo si no existe
    if (typeof api === 'undefined') {
        window.api = new APIClient();
    }

    // Exportar para uso en módulos
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = APIClient;
    }
    
}

console.log('✅ API Client cargado con soporte medicinal');

