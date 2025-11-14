// frontend/admin/js/api/apiClient.js
// Cliente API para comunicación con el backend ADMIN
// ✅ ACTUALIZADO CON SOPORTE MEDICINAL Y JSON ESTÁTICO

// Log inmediato para verificar que el script se carga
try {
    console.log('📦 [ADMIN API] Script apiClient.js cargado');
    console.log('📦 [ADMIN API] Timestamp:', new Date().toISOString());
    console.log('📦 [ADMIN API] URL actual:', window.location.href);
} catch (e) {
    console.error('❌ [ADMIN API] Error en log inicial:', e);
}

// Prevenir doble declaración
if (typeof APIClient === 'undefined') {
    console.log('📦 [ADMIN API] Creando clase APIClient...');
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
            
            this.token = null;
            
            // Log para debug
            if (isProduction) {
                console.log('🌐 Modo producción detectado');
                console.log('🔗 API URL:', this.baseURL);
            } else {
                console.log('💻 Modo desarrollo detectado');
                console.log('🔗 API URL:', this.baseURL);
            }
        }

        getCsrfTokenFromCookie() {
            if (typeof document === 'undefined') {
                return null;
            }
            const cookies = document.cookie ? document.cookie.split('; ') : [];
            const entry = cookies.find((row) => row.startsWith('csrf_token='));
            if (!entry) {
                return null;
            }
            return decodeURIComponent(entry.split('=')[1] || '');
        }

        async ensureCsrfToken() {
            if (!this.baseURL) {
                return null;
            }

            const existing = this.getCsrfTokenFromCookie();
            if (existing) {
                return existing;
            }

            try {
                const response = await fetch(`${this.baseURL}/auth/csrf`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data?.data?.csrfToken) {
                    return data.data.csrfToken;
                }
            } catch (error) {
                console.warn('⚠️ No se pudo obtener token CSRF:', error.message);
            }

            return this.getCsrfTokenFromCookie();
        }
        
        // Método auxiliar para hacer peticiones
        handleUnauthorized() {
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('userLoggedOut'));
            }
            if (typeof authManager !== 'undefined' && authManager.clearSession) {
                authManager.clearSession();
                if (typeof authManager.updateUI === 'function') {
                    authManager.updateUI();
                }
            }
        }

        async request(endpoint, options = {}) {
            // Verificar si hay backend configurado
            if (!this.baseURL) {
                const error = new Error('Backend no configurado. Por favor, configura la URL del backend en producción o usa el modo de desarrollo.');
                error.code = 'NO_BACKEND_CONFIGURED';
                throw error;
            }

            const url = `${this.baseURL}${endpoint}`;
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            const method = (options.method || 'GET').toUpperCase();
            const requiresCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);

            if (requiresCsrf) {
                const csrfToken = await this.ensureCsrfToken();
                if (csrfToken) {
                    headers['X-CSRF-Token'] = csrfToken;
                }
            }

            try {
                const response = await fetch(url, {
                    ...options,
                    headers,
                    credentials: options.credentials || 'include'
                });

                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        this.handleUnauthorized();
                    }
                    const error = new Error(data.message || 'Error en la petición');
                    error.response = {
                        status: response.status,
                        data
                    };
                    throw error;
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

        // Métodos HTTP wrapper (get, post, put, delete, patch)
        async get(endpoint, options = {}) {
            return await this.request(endpoint, {
                ...options,
                method: 'GET'
            });
        }

        async post(endpoint, data = null, options = {}) {
            return await this.request(endpoint, {
                ...options,
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined
            });
        }

        async put(endpoint, data = null, options = {}) {
            return await this.request(endpoint, {
                ...options,
                method: 'PUT',
                body: data ? JSON.stringify(data) : undefined
            });
        }

        async patch(endpoint, data = null, options = {}) {
            return await this.request(endpoint, {
                ...options,
                method: 'PATCH',
                body: data ? JSON.stringify(data) : undefined
            });
        }

        async delete(endpoint, options = {}) {
            return await this.request(endpoint, {
                ...options,
                method: 'DELETE'
            });
        }

        // Métodos de autenticación
        async register(userData) {
            const response = await this.request('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

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
                
                // Comparar contraseña PRIMERO antes de verificar estado (para no revelar si el usuario existe)
                const passwordHash = await this.hashPassword(password);
                
                if (user.password_hash !== passwordHash) {
                    return {
                        success: false,
                        message: 'Credenciales incorrectas'
                    };
                }
                
                // Determinar account_status si no está definido explícitamente
                let accountStatus = user.account_status;
                if (!accountStatus) {
                    // Calcular basado en is_verified e is_active
                    if (user.is_verified === true || user.is_verified === 1) {
                        accountStatus = 'approved';
                    } else if (user.is_active === false || user.is_active === 0) {
                        accountStatus = 'rejected';
                    } else {
                        accountStatus = 'pending';
                    }
                }
                
                // Para clientes (no admin), verificar estado de aprobación
                const isAdmin = user.role === 'admin';
                
                if (!isAdmin) {
                    // Solo clientes aprobados pueden hacer login
                    if (accountStatus === 'pending') {
                        return {
                            success: false,
                            message: 'Tu cuenta está pendiente de aprobación. Por favor, espera a que un administrador revise tu solicitud.',
                            account_status: 'pending'
                        };
                    }
                    
                    if (accountStatus === 'rejected') {
                        return {
                            success: false,
                            message: user.rejection_reason 
                                ? `Tu cuenta ha sido rechazada: ${user.rejection_reason}` 
                                : 'Tu cuenta ha sido rechazada. Contacta al administrador para más información.',
                            account_status: 'rejected',
                            rejection_reason: user.rejection_reason || null
                        };
                    }
                    
                    if (accountStatus !== 'approved') {
                        return {
                            success: false,
                            message: 'Tu cuenta no está aprobada. Contacta al administrador.',
                            account_status: accountStatus
                        };
                    }
                }
                
                // Verificar si el usuario está activo (para todos los roles)
                if (!user.is_active && !isAdmin) {
                    return {
                        success: false,
                        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
                        account_status: 'rejected'
                    };
                }
                
                // Generar token simple (simulado)
                const token = this.generateSimpleToken(user);
                
                // Preparar datos del usuario (sin password_hash)
                const { password_hash, ...userData } = user;
                
                // Asegurar que account_status esté en userData
                userData.account_status = accountStatus;
                
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
        
        // 🆕 Verificar si un hash es bcrypt (empieza con $2a$, $2b$, o $2y$)
        isBcryptHash(hash) {
            return hash && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'));
        }
        
        // 🆕 Comparar contraseña con hash (soporta SHA-256 y bcrypt)
        async comparePassword(password, storedHash) {
            if (this.isBcryptHash(storedHash)) {
                // Intentar usar bcryptjs si está disponible (cargado desde CDN)
                // Verificar múltiples formas en que puede estar disponible
                const bcrypt = window.bcryptjs || window.bcrypt || (typeof bcryptjs !== 'undefined' ? bcryptjs : null);
                
                if (bcrypt && (typeof bcrypt.compareSync === 'function' || typeof bcrypt.compare === 'function')) {
                    try {
                        // Intentar compareSync primero (más común en bcryptjs)
                        if (typeof bcrypt.compareSync === 'function') {
                            return bcrypt.compareSync(password, storedHash);
                        } 
                        // Si no, usar compare (puede ser sync o async)
                        else if (typeof bcrypt.compare === 'function') {
                            const result = bcrypt.compare(password, storedHash);
                            // Si es una promesa, esperarla; si no, retornar directamente
                            if (result instanceof Promise) {
                                return await result;
                            }
                            return result;
                        }
                    } catch (error) {
                        console.error('❌ Error al comparar con bcryptjs:', error);
                        return false;
                    }
                }
                
                // ⚠️ PARCHE TEMPORAL: Si bcryptjs no está disponible, usar comparación parcial de hash
                // ⚠️ NOTA: Esto NO es seguro criptográficamente, solo es un parche temporal para desarrollo
                // Compara los primeros 10 caracteres de cada hash como medida de emergencia
                console.warn('⚠️ Hash bcrypt detectado pero bcryptjs no está disponible.');
                console.warn('⚠️ Usando parche temporal (comparación parcial de primeros 10 caracteres)');
                console.warn('💡 RECOMENDACIÓN: Verificar que bcryptjs se cargue correctamente o migrar hash a SHA-256');
                
                // Parche: Comparar primeros 10 caracteres del hash almacenado con hash SHA-256 calculado
                // Esto permite login temporal sin cambiar la BD, pero NO es seguro
                try {
                    const calculatedSHA256 = await this.hashPassword(password);
                    
                    // Comparar primeros 10 caracteres del hash bcrypt almacenado
                    // con primeros 10 caracteres del hash SHA-256 calculado
                    const storedHashPrefix = storedHash.substring(0, 10);
                    const calculatedPrefix = calculatedSHA256.substring(0, 10);
                    
                    console.log('🔍 Parche: Comparando prefijos de hash:', {
                        storedPrefix: storedHashPrefix,
                        calculatedPrefix: calculatedPrefix,
                        match: storedHashPrefix === calculatedPrefix
                    });
                    
                    // Comparar prefijos (esto es solo un parche, no seguro)
                    if (storedHashPrefix === calculatedPrefix) {
                        console.warn('⚠️ Parche aplicado: hash parcial coincide (NO SEGURO - SOLO PARA DESARROLLO)');
                        return true;
                    }
                    
                    // Si no coincide, intentar una vez más esperar un poco por si bcryptjs se está cargando
                    if (window.bcryptjsReady === undefined) {
                        console.warn('⚠️ Esperando 500ms por si bcryptjs se está cargando...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                        const bcryptRetry = window.bcryptjs || window.bcrypt || (typeof bcryptjs !== 'undefined' ? bcryptjs : null);
                        if (bcryptRetry && typeof bcryptRetry.compareSync === 'function') {
                            console.log('✅ bcryptjs cargado después de esperar, intentando de nuevo...');
                            return bcryptRetry.compareSync(password, storedHash);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error en parche temporal:', error);
                }
                
                return false;
            }
            
            // Para SHA-256, calcular y comparar
            const calculatedHash = await this.hashPassword(password);
            return calculatedHash === storedHash;
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
            // Si no hay backend, no hay perfil
            if (!this.baseURL) {
                throw new Error('Backend no configurado');
            }

            try {
                const response = await this.request('/auth/profile');
                
                // Validar respuesta estrictamente
                if (!response || !response.success) {
                    throw new Error('Respuesta inválida del servidor');
                }
                
                return response;
            } catch (error) {
                // Si es 401 (no autorizado), limpiar token y lanzar error
                if (error.response && error.response.status === 401) {
                    this.clearToken();
                    // Limpiar cookies también
                    this.clearAuthCookies();
                    throw new Error('Sesión expirada o inválida');
                }
                throw error;
            }
        }

        // Limpiar cookies de autenticación
        clearAuthCookies() {
            if (typeof document === 'undefined') {
                return;
            }

            const cookiesToClear = ['access_token', 'refresh_token', 'csrf_token'];
            cookiesToClear.forEach(cookieName => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/api/auth;`;
            });
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

        async logout() {
            this.clearToken();

            if (!this.baseURL) {
                return { success: true };
            }

            try {
                const response = await this.request('/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({})
                });
                return response;
            } catch (error) {
                if (error.response && error.response.status === 401) {
                    return { success: true, message: 'Sesión expirada' };
                }
                throw error;
            }
        }

        setToken(token) {
            this.token = token;
        }

        clearToken() {
            this.token = null;
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
                        // Desarrollo local - para admin, la ruta es diferente
                        const isAdminArea = window.location.pathname.includes('/admin/');
                        if (isAdminArea) {
                            // En admin, usar ../api/ para subir un nivel
                            apiPath = '../api/' + filename;
                        } else {
                            apiPath = window.location.pathname.includes('/frontend/') 
                                ? './api/' + filename 
                                : './frontend/api/' + filename;
                        }
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
                // Solo mostrar warning si no es un 404 (archivo no encontrado es esperado)
                if (!error.message.includes('404') && !error.message.includes('File not found')) {
                    console.warn(`⚠️ No se pudo cargar ${filename} estático:`, error.message);
                }
                return null;
            }
        }

        // Métodos de productos con fallback a JSON estático
        async getProducts(filters = {}) {
            // Helper para aplicar filtros a productos
            const applyFiltersToProducts = (products, filters) => {
                let filtered = [...products];
                
                // Filtrar por búsqueda
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    filtered = filtered.filter(p => 
                        p.name.toLowerCase().includes(searchLower) ||
                        (p.description && p.description.toLowerCase().includes(searchLower)) ||
                        (p.sku && p.sku.toLowerCase().includes(searchLower))
                    );
                }
                
                // Filtrar por categoría
                if (filters.category && filters.category !== 'all') {
                    filtered = filtered.filter(p => 
                        p.category_slug === filters.category || 
                        p.category_id === parseInt(filters.category)
                    );
                }
                
                // Filtrar por precio mínimo
                if (filters.minPrice) {
                    filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
                }
                
                // Filtrar por precio máximo
                if (filters.maxPrice) {
                    filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
                }
                
                // Filtrar por stock
                if (filters.inStock) {
                    filtered = filtered.filter(p => p.stock > 0);
                }
                
                // Filtrar por destacados
                if (filters.featured) {
                    filtered = filtered.filter(p => p.featured === true);
                }
                
                // Limitar resultados
                if (filters.limit) {
                    filtered = filtered.slice(0, parseInt(filters.limit));
                }
                
                return filtered;
            };
            
            // SIEMPRE intentar JSON estático PRIMERO (más rápido y funciona sin backend)
            try {
                const staticData = await this.loadStaticJSON('products.json');
                console.log('🔍 JSON estático cargado:', staticData);
                if (staticData && staticData.success && staticData.data && staticData.data.products) {
                    let products = applyFiltersToProducts(staticData.data.products, filters);
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
            
            // Solo si hay backend configurado Y el JSON falló, intentar API dinámica
            if (this.baseURL) {
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
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático como fallback...', error);
                    try {
                        const staticData = await this.loadStaticJSON('products.json');
                        if (staticData && staticData.success && staticData.data && staticData.data.products) {
                            let products = applyFiltersToProducts(staticData.data.products, filters);
                            console.log('✅ Productos cargados desde JSON estático (fallback):', products.length);
                            return {
                                success: true,
                                data: { products },
                                message: 'Productos cargados desde API estática (fallback)'
                            };
                        }
                    } catch (staticError) {
                        console.error('❌ No se pudo cargar JSON estático como fallback:', staticError);
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se pudo cargar JSON estático
                throw new Error('No se pudo cargar productos. Verifica que products.json esté disponible.');
            }
        }

        async getProductById(id) {
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // Si no hay backend configurado O estamos en producción, usar JSON estático
            if (!this.baseURL || isProduction) {
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
            
            // Si hay backend, usar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request(`/products/${id}`);
                } catch (error) {
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático...', error);
                    const staticData = await this.loadStaticJSON('products.json');
                    if (staticData && staticData.success && staticData.data.products) {
                        const product = staticData.data.products.find(p => p.id === parseInt(id));
                        if (product) {
                            return {
                                success: true,
                                data: { product },
                                message: 'Producto cargado desde API estática (fallback)'
                            };
                        }
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se encontró el producto en JSON
                throw new Error(`Producto con ID ${id} no encontrado en productos.json`);
            }
        }

        async searchProducts(query) {
            // Para búsqueda, usar getProducts con filtro search
            return await this.getProducts({ search: query });
        }

        async getFeaturedProducts() {
            const isProduction = window.location.hostname.includes('github.io') || 
                                (window.location.hostname !== 'localhost' && 
                                 window.location.hostname !== '127.0.0.1');
            
            // Si no hay backend configurado O estamos en producción, usar JSON estático
            if (!this.baseURL || isProduction) {
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
            
            // Si hay backend, usar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request('/products/featured');
                } catch (error) {
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático...', error);
                    const staticData = await this.loadStaticJSON('products-featured.json');
                    if (staticData && staticData.success) {
                        console.warn('⚠️ Usando JSON estático como fallback');
                        return staticData;
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se pudo cargar JSON estático
                // Intentar filtrar desde products.json
                try {
                    const staticData = await this.loadStaticJSON('products.json');
                    if (staticData && staticData.success && staticData.data.products) {
                        const featured = staticData.data.products.filter(p => p.featured === true);
                        return {
                            success: true,
                            data: { products: featured },
                            message: 'Productos destacados extraídos de products.json'
                        };
                    }
                } catch (error) {
                    // Ignorar error
                }
                throw new Error('No se pudieron cargar productos destacados. Verifica que products-featured.json esté disponible.');
            }
        }

        async getCategories() {
            // Helper para extraer categorías del JSON
            const extractCategoriesFromJSON = (staticData) => {
                if (!staticData || !staticData.success || !staticData.data || !staticData.data.products) {
                    return null;
                }
                
                const categoriesMap = new Map();
                const seenSlugs = new Set();
                
                staticData.data.products.forEach(product => {
                    let slug = product.category_slug || product.category;
                    let name = product.category || product.category_slug;
                    
                    if (slug) {
                        slug = slug.toLowerCase().trim();
                        name = name ? name.trim() : slug;
                        
                        if (slug && slug !== 'undefined' && !seenSlugs.has(slug)) {
                            seenSlugs.add(slug);
                            categoriesMap.set(slug, name);
                        }
                    }
                });
                
                const categories = Array.from(categoriesMap.entries()).map(([slug, name]) => ({
                    id: slug,
                    name: name,
                    slug: slug
                }));
                
                return {
                    success: true,
                    data: { categories },
                    message: 'Categorías cargadas desde API estática'
                };
            };
            
            // SIEMPRE intentar JSON estático PRIMERO (más rápido y funciona sin backend)
            try {
                const staticData = await this.loadStaticJSON('products.json');
                const result = extractCategoriesFromJSON(staticData);
                if (result) {
                    console.log('✅ Categorías extraídas del JSON estático:', result.data.categories.length);
                    return result;
                }
            } catch (error) {
                console.warn('⚠️ No se pudo cargar JSON estático, intentando API dinámica...', error);
            }
            
            // Solo si hay backend configurado Y el JSON falló, intentar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request('/products/categories');
                } catch (error) {
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático como fallback...', error);
                    try {
                        const staticData = await this.loadStaticJSON('products.json');
                        const result = extractCategoriesFromJSON(staticData);
                        if (result) {
                            console.log('✅ Categorías cargadas desde JSON estático (fallback)');
                            return result;
                        }
                    } catch (staticError) {
                        console.error('❌ No se pudo cargar JSON estático como fallback:', staticError);
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se pudo cargar JSON estático
                console.warn('⚠️ No hay backend configurado y JSON estático no disponible');
                return {
                    success: true,
                    data: { categories: [] },
                    message: 'No se pudieron cargar categorías'
                };
            }
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
            // Helper para aplicar filtros a orders
            const applyFiltersToOrders = (orders, filters) => {
                let filtered = [...orders];
                
                // Filtrar por estado
                if (filters.status && filters.status !== 'all') {
                    filtered = filtered.filter(o => o.status === filters.status);
                }
                
                // Filtrar por cliente
                if (filters.customer_id) {
                    filtered = filtered.filter(o => o.customer_id === parseInt(filters.customer_id));
                }
                
                // Filtrar por fecha desde
                if (filters.date_from) {
                    filtered = filtered.filter(o => {
                        const orderDate = new Date(o.created_at || o.date);
                        const filterDate = new Date(filters.date_from);
                        return orderDate >= filterDate;
                    });
                }
                
                // Filtrar por fecha hasta
                if (filters.date_to) {
                    filtered = filtered.filter(o => {
                        const orderDate = new Date(o.created_at || o.date);
                        const filterDate = new Date(filters.date_to);
                        return orderDate <= filterDate;
                    });
                }
                
                // Limitar resultados
                if (filters.limit) {
                    filtered = filtered.slice(0, parseInt(filters.limit));
                }
                
                return filtered;
            };
            
            // SIEMPRE intentar JSON estático PRIMERO (más rápido y funciona sin backend)
            try {
                const staticData = await this.loadStaticJSON('orders.json');
                console.log('🔍 JSON estático de orders cargado:', staticData);
                if (staticData && staticData.success && staticData.data) {
                    // Verificar si tiene orders directamente o dentro de data
                    const ordersArray = staticData.data.orders || staticData.data || [];
                    if (Array.isArray(ordersArray) && ordersArray.length > 0) {
                        let orders = applyFiltersToOrders(ordersArray, filters);
                        console.log('✅ Pedidos cargados desde JSON estático:', orders.length);
                        console.log('📊 Primeros pedidos:', orders.slice(0, 3).map(o => ({ id: o.id, status: o.status, total: o.total })));
                        return {
                            success: true,
                            data: { orders },
                            message: 'Pedidos cargados desde API estática'
                        };
                    } else if (Array.isArray(ordersArray)) {
                        // Array vacío, pero válido
                        console.log('⚠️ JSON estático tiene array vacío de pedidos');
                        return {
                            success: true,
                            data: { orders: [] },
                            message: 'No hay pedidos disponibles'
                        };
                    }
                } else {
                    console.warn('⚠️ JSON estático no tiene formato válido:', staticData);
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar JSON estático de orders:', error.message);
                console.warn('⚠️ Intentando API dinámica...');
            }
            
            // Solo si hay backend configurado Y el JSON falló, intentar API dinámica
            if (this.baseURL) {
                try {
                    const queryParams = new URLSearchParams();
                    
                    Object.keys(filters).forEach(key => {
                        if (filters[key]) {
                            queryParams.append(key, filters[key]);
                        }
                    });

                    const queryString = queryParams.toString();
                    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
                    
                    return await this.request(endpoint);
                } catch (error) {
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático como fallback...', error);
                    try {
                        const staticData = await this.loadStaticJSON('orders.json');
                        if (staticData && staticData.success && staticData.data) {
                            const ordersArray = staticData.data.orders || staticData.data || [];
                            if (Array.isArray(ordersArray)) {
                                let orders = applyFiltersToOrders(ordersArray, filters);
                                console.log('✅ Pedidos cargados desde JSON estático (fallback):', orders.length);
                                return {
                                    success: true,
                                    data: { orders },
                                    message: 'Pedidos cargados desde API estática (fallback)'
                                };
                            }
                        }
                    } catch (staticError) {
                        console.error('❌ No se pudo cargar JSON estático como fallback:', staticError);
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se pudo cargar JSON estático
                console.warn('⚠️ No hay backend y JSON estático no disponible para orders');
                // Intentar una última vez cargar el JSON
                try {
                    const staticData = await this.loadStaticJSON('orders.json');
                    if (staticData && staticData.success && staticData.data) {
                        const ordersArray = staticData.data.orders || staticData.data || [];
                        if (Array.isArray(ordersArray)) {
                            let orders = applyFiltersToOrders(ordersArray, filters);
                            console.log('✅ Pedidos cargados desde JSON estático (último intento):', orders.length);
                            return {
                                success: true,
                                data: { orders },
                                message: 'Pedidos cargados desde API estática'
                            };
                        }
                    }
                } catch (finalError) {
                    console.error('❌ Error final al cargar JSON estático:', finalError);
                }
                return {
                    success: true,
                    data: { orders: [] },
                    message: 'No se pudieron cargar pedidos. Verifica que orders.json exista en /api/'
                };
            }
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

        // ============================================
        // MÉTODOS DE PAGOS (ADMIN)
        // ============================================
        
        async getPayments(filters = {}) {
            // Helper para aplicar filtros a payments
            const applyFiltersToPayments = (payments, filters) => {
                let filtered = [...payments];
                
                // Filtrar por estado
                if (filters.status && filters.status !== 'all') {
                    filtered = filtered.filter(p => p.status === filters.status);
                }
                
                // Filtrar por método
                if (filters.method && filters.method !== 'all') {
                    filtered = filtered.filter(p => p.method === filters.method);
                }
                
                // Filtrar por proveedor
                if (filters.provider_id) {
                    filtered = filtered.filter(p => p.provider_id === parseInt(filters.provider_id));
                }
                
                // Filtrar por orden
                if (filters.order_id) {
                    filtered = filtered.filter(p => p.order_id === parseInt(filters.order_id));
                }
                
                // Filtrar por cliente
                if (filters.customer_id) {
                    filtered = filtered.filter(p => p.customer_id === parseInt(filters.customer_id));
                }
                
                // Filtrar por rango de fechas
                if (filters.date_from) {
                    const dateFrom = new Date(filters.date_from);
                    filtered = filtered.filter(p => {
                        const paymentDate = new Date(p.created_at);
                        return paymentDate >= dateFrom;
                    });
                }
                
                if (filters.date_to) {
                    const dateTo = new Date(filters.date_to);
                    dateTo.setHours(23, 59, 59, 999); // Incluir todo el día
                    filtered = filtered.filter(p => {
                        const paymentDate = new Date(p.created_at);
                        return paymentDate <= dateTo;
                    });
                }
                
                // Filtrar por rango de montos
                if (filters.amount_min) {
                    const minAmount = parseFloat(filters.amount_min);
                    filtered = filtered.filter(p => (p.amount_gross || p.amount || 0) >= minAmount);
                }
                
                if (filters.amount_max) {
                    const maxAmount = parseFloat(filters.amount_max);
                    filtered = filtered.filter(p => (p.amount_gross || p.amount || 0) <= maxAmount);
                }
                
                return filtered;
            };
            
            // SIEMPRE intentar JSON estático PRIMERO (más rápido y funciona sin backend)
            try {
                const staticData = await this.loadStaticJSON('payments.json');
                if (staticData && staticData.success && staticData.data) {
                    const paymentsArray = staticData.data.payments || staticData.data || [];
                    if (Array.isArray(paymentsArray)) {
                        let payments = applyFiltersToPayments(paymentsArray, filters);
                        
                        // Aplicar paginación si existe
                        const limit = filters.limit ? parseInt(filters.limit) : null;
                        const offset = filters.offset ? parseInt(filters.offset) : 0;
                        const total = payments.length;
                        
                        if (limit !== null) {
                            payments = payments.slice(offset, offset + limit);
                        }
                        
                        // Calcular estadísticas desde los datos filtrados
                        const allFiltered = applyFiltersToPayments(paymentsArray, filters);
                        const stats = {
                            total: allFiltered.length,
                            captured: allFiltered.filter(p => p.status === 'captured').length,
                            authorized: allFiltered.filter(p => p.status === 'authorized').length,
                            pending: allFiltered.filter(p => p.status === 'pending').length,
                            failed: allFiltered.filter(p => p.status === 'failed').length,
                            voided: allFiltered.filter(p => p.status === 'voided').length
                        };
                        
                        console.log('✅ Pagos cargados desde JSON estático:', payments.length);
                        return {
                            success: true,
                            data: payments,
                            stats,
                            pagination: {
                                limit: limit || total,
                                offset,
                                total
                            }
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar JSON estático de payments:', error.message);
                console.warn('⚠️ Intentando API dinámica...');
            }
            
            // Solo si hay backend configurado Y el JSON falló, intentar API dinámica
            if (this.baseURL) {
                try {
                    const queryParams = new URLSearchParams();
                    Object.keys(filters).forEach(key => {
                        if (filters[key] && filters[key] !== 'all') {
                            queryParams.append(key, filters[key]);
                        }
                    });
                    
                    const response = await this.request(`/payments?${queryParams.toString()}`);
                    return response;
                } catch (error) {
                    console.error('❌ Error al cargar pagos desde API dinámica:', error);
                    // Si el error es de red o backend no configurado, continuar al fallback
                    if (error.code === 'NO_BACKEND_CONFIGURED' || error.code === 'NETWORK_ERROR') {
                        console.warn('⚠️ Backend no disponible, retornando array vacío');
                    } else {
                        throw error;
                    }
                }
            }
            
            // Si no hay backend o falló, retornar array vacío con estructura válida
            console.warn('⚠️ No se pudo cargar pagos desde ninguna fuente');
            return {
                success: true,
                data: [],
                stats: {
                    total: 0,
                    captured: 0,
                    authorized: 0,
                    pending: 0,
                    failed: 0,
                    voided: 0
                },
                pagination: {
                    limit: filters.limit || 50,
                    offset: filters.offset || 0,
                    total: 0
                }
            };
        }

        async getPaymentStats() {
            // Intentar JSON estático primero
            try {
                const staticData = await this.loadStaticJSON('payments.json');
                if (staticData && staticData.success && staticData.data) {
                    const payments = staticData.data.payments || staticData.data || [];
                    if (Array.isArray(payments)) {
                        return {
                            success: true,
                            total: payments.length,
                            captured: payments.filter(p => p.status === 'captured').length,
                            authorized: payments.filter(p => p.status === 'authorized').length,
                            pending: payments.filter(p => p.status === 'pending').length,
                            failed: payments.filter(p => p.status === 'failed').length,
                            voided: payments.filter(p => p.status === 'voided').length
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar estadísticas desde JSON estático:', error.message);
            }
            
            // Si hay backend, intentar API dinámica
            if (this.baseURL) {
                try {
                    const response = await this.request('/payments?limit=1');
                    return response.stats || { total: 0, captured: 0, authorized: 0, pending: 0, failed: 0, voided: 0 };
                } catch (error) {
                    console.warn('⚠️ Error al cargar estadísticas desde API dinámica:', error.message);
                }
            }
            
            // Fallback: retornar stats vacías
            return {
                success: true,
                total: 0,
                captured: 0,
                authorized: 0,
                pending: 0,
                failed: 0,
                voided: 0
            };
        }

        // ============================================
        // MÉTODOS DE LOGÍSTICA (ADMIN)
        // ============================================
        
        async getShippingProviders() {
            // Intentar JSON estático primero
            try {
                const staticData = await this.loadStaticJSON('shipping-providers.json');
                if (staticData && staticData.success && staticData.data) {
                    const providers = staticData.data.providers || staticData.data || [];
                    if (Array.isArray(providers)) {
                        console.log('✅ Proveedores de envío cargados desde JSON estático:', providers.length);
                        return {
                            success: true,
                            data: { providers },
                            count: providers.length
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar proveedores de envío desde JSON estático:', error.message);
            }
            
            // Si hay backend, intentar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request('/shipping-providers');
                } catch (error) {
                    if (error.code === 'NO_BACKEND_CONFIGURED' || error.code === 'NETWORK_ERROR') {
                        console.warn('⚠️ Backend no disponible para proveedores de envío');
                    } else {
                        throw error;
                    }
                }
            }
            
            // Fallback: retornar array vacío
            return {
                success: true,
                data: { providers: [] },
                count: 0
            };
        }

        async getShipments(filters = {}) {
            // Intentar JSON estático primero
            try {
                const staticData = await this.loadStaticJSON('shipments.json');
                if (staticData && staticData.success && staticData.data) {
                    const shipments = staticData.data.shipments || staticData.data || [];
                    if (Array.isArray(shipments)) {
                        console.log('✅ Envíos cargados desde JSON estático:', shipments.length);
                        return {
                            success: true,
                            data: { shipments },
                            count: shipments.length
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar envíos desde JSON estático:', error.message);
            }
            
            // Si hay backend, intentar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request('/shipments');
                } catch (error) {
                    if (error.code === 'NO_BACKEND_CONFIGURED' || error.code === 'NETWORK_ERROR') {
                        console.warn('⚠️ Backend no disponible para envíos');
                    } else {
                        throw error;
                    }
                }
            }
            
            // Fallback: retornar array vacío
            return {
                success: true,
                data: { shipments: [] },
                count: 0
            };
        }

        async getInternalDeliveryZones() {
            // Intentar JSON estático primero
            try {
                const staticData = await this.loadStaticJSON('internal-delivery-zones.json');
                if (staticData && staticData.success && staticData.data) {
                    const zones = staticData.data.zones || staticData.data || [];
                    if (Array.isArray(zones)) {
                        console.log('✅ Zonas de entrega cargadas desde JSON estático:', zones.length);
                        return {
                            success: true,
                            data: { zones },
                            count: zones.length
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar zonas desde JSON estático:', error.message);
            }
            
            // Si hay backend, intentar API dinámica
            if (this.baseURL) {
                try {
                    return await this.request('/internal-delivery-zones');
                } catch (error) {
                    if (error.code === 'NO_BACKEND_CONFIGURED' || error.code === 'NETWORK_ERROR') {
                        console.warn('⚠️ Backend no disponible para zonas de entrega');
                    } else {
                        throw error;
                    }
                }
            }
            
            // Fallback: retornar array vacío
            return {
                success: true,
                data: { zones: [] },
                count: 0
            };
        }

        async getPackingMaterials(filters = {}) {
            // Intentar JSON estático primero
            try {
                const staticData = await this.loadStaticJSON('packing-materials.json');
                if (staticData && staticData.success && staticData.data) {
                    const materials = staticData.data.materials || staticData.data || [];
                    if (Array.isArray(materials)) {
                        console.log('✅ Materiales de empaque cargados desde JSON estático:', materials.length);
                        return {
                            success: true,
                            data: { materials },
                            count: materials.length
                        };
                    }
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar materiales desde JSON estático:', error.message);
            }
            
            // Si hay backend, intentar API dinámica
            if (this.baseURL) {
                try {
                    const queryParams = new URLSearchParams();
                    if (filters.active_only) {
                        queryParams.append('active_only', filters.active_only);
                    }
                    const query = queryParams.toString();
                    return await this.request(`/packing-materials${query ? '?' + query : ''}`);
                } catch (error) {
                    if (error.code === 'NO_BACKEND_CONFIGURED' || error.code === 'NETWORK_ERROR') {
                        console.warn('⚠️ Backend no disponible para materiales de empaque');
                    } else {
                        throw error;
                    }
                }
            }
            
            // Fallback: retornar array vacío
            return {
                success: true,
                data: { materials: [] },
                count: 0
            };
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
            // Helper para aplicar filtros a users
            const applyFiltersToUsers = (users, filters) => {
                let filtered = [...users];
                
                // Filtrar por rol
                if (filters.role && filters.role !== 'all') {
                    filtered = filtered.filter(u => u.role === filters.role);
                }
                
                // Filtrar por estado de cuenta
                if (filters.account_status) {
                    filtered = filtered.filter(u => u.account_status === filters.account_status);
                }
                
                // Filtrar por búsqueda
                if (filters.search) {
                    const searchLower = filters.search.toLowerCase();
                    filtered = filtered.filter(u => 
                        (u.name && u.name.toLowerCase().includes(searchLower)) ||
                        (u.email && u.email.toLowerCase().includes(searchLower)) ||
                        (u.first_name && u.first_name.toLowerCase().includes(searchLower)) ||
                        (u.last_name && u.last_name.toLowerCase().includes(searchLower))
                    );
                }
                
                // Limitar resultados
                if (filters.limit) {
                    filtered = filtered.slice(0, parseInt(filters.limit));
                }
                
                return filtered;
            };
            
            // SIEMPRE intentar JSON estático PRIMERO (más rápido y funciona sin backend)
            try {
                const staticData = await this.loadStaticJSON('users.json');
                if (staticData) {
                    console.log('🔍 JSON estático de users cargado:', staticData);
                }
                if (staticData && staticData.success && staticData.data && staticData.data.users) {
                    let users = applyFiltersToUsers(staticData.data.users, filters);
                    console.log('✅ Usuarios cargados desde JSON estático:', users.length);
                    return {
                        success: true,
                        data: { users },
                        total: users.length,
                        message: 'Usuarios cargados desde API estática'
                    };
                }
            } catch (error) {
                console.warn('⚠️ Error al cargar JSON estático de users, intentando API dinámica...', error);
            }
            
            // Solo si hay backend configurado Y el JSON falló, intentar API dinámica
            if (this.baseURL) {
                try {
                    const queryParams = new URLSearchParams();
                    
                    Object.keys(filters).forEach(key => {
                        if (filters[key]) {
                            queryParams.append(key, filters[key]);
                        }
                    });

                    const queryString = queryParams.toString();
                    const endpoint = queryString ? `/users?${queryString}` : '/users';
                    
                    return await this.request(endpoint);
                } catch (error) {
                    // Si la API dinámica falla, intentar JSON estático como último recurso
                    console.warn('⚠️ API dinámica falló, intentando JSON estático como fallback...', error);
                    try {
                        const staticData = await this.loadStaticJSON('users.json');
                        if (staticData && staticData.success && staticData.data && staticData.data.users) {
                            let users = applyFiltersToUsers(staticData.data.users, filters);
                            console.log('✅ Usuarios cargados desde JSON estático (fallback):', users.length);
                            return {
                                success: true,
                                data: { users },
                                total: users.length,
                                message: 'Usuarios cargados desde API estática (fallback)'
                            };
                        }
                    } catch (staticError) {
                        console.error('❌ No se pudo cargar JSON estático como fallback:', staticError);
                    }
                    throw error;
                }
            } else {
                // No hay backend y no se pudo cargar JSON estático
                console.warn('⚠️ No hay backend y JSON estático no disponible para users');
                return {
                    success: true,
                    data: { users: [] },
                    total: 0,
                    message: 'No se pudieron cargar usuarios'
                };
            }
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

        async approveUser(id, notes = '', isForced = false) {
            return await this.request(`/users/${id}/approve`, {
                method: 'POST',
                body: JSON.stringify({ 
                    admin_notes: notes,
                    is_forced: isForced
                })
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

        async createUser(userData) {
            return await this.request('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }

        // Subir comprobante de pago
        async uploadPaymentProof(orderId, file) {
            const formData = new FormData();
            formData.append('proof', file);
            formData.append('orderId', orderId);

            const url = `${this.baseURL}/orders/${orderId}/payment-proof`;
            const headers = {};

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: formData, // No incluir Content-Type, el navegador lo manejará
                    credentials: 'include'
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

            const response = await fetch(url, {
                method: 'POST',
                headers,          // sin Content-Type; fetch lo define por boundary
                body: formData,
                credentials: 'include'
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

        // Obtener métricas del dashboard de pagos
        async getPaymentMetrics(dateFrom = null, dateTo = null) {
            let endpoint = '/payments/metrics/dashboard';
            const params = [];
            if (dateFrom) params.push(`date_from=${encodeURIComponent(dateFrom)}`);
            if (dateTo) params.push(`date_to=${encodeURIComponent(dateTo)}`);
            if (params.length > 0) {
                endpoint += '?' + params.join('&');
            }
            return await this.request(endpoint);
        }

        // ============================================
        // LOGÍSTICA
        // ============================================

        // Obtener métricas del dashboard de logística
        async getLogisticsMetrics(dateFrom = null, dateTo = null) {
            let endpoint = '/logistics/metrics/dashboard';
            const params = [];
            if (dateFrom) params.push(`date_from=${encodeURIComponent(dateFrom)}`);
            if (dateTo) params.push(`date_to=${encodeURIComponent(dateTo)}`);
            if (params.length > 0) {
                endpoint += '?' + params.join('&');
            }
            return await this.request(endpoint);
        }

        // ============================================
        // ANALYTICS
        // ============================================

        // Obtener pedidos agrupados por comuna
        async getOrdersByComuna(filters = {}) {
            let endpoint = '/analytics/orders-by-comuna';
            const params = [];
            
            if (filters.from) params.push(`from=${encodeURIComponent(filters.from)}`);
            if (filters.to) params.push(`to=${encodeURIComponent(filters.to)}`);
            if (filters.status) {
                const statusParam = Array.isArray(filters.status) ? filters.status.join(',') : filters.status;
                params.push(`status=${encodeURIComponent(statusParam)}`);
            }
            if (filters.shipping_provider) params.push(`shipping_provider=${encodeURIComponent(filters.shipping_provider)}`);
            if (filters.min_ticket) params.push(`min_ticket=${encodeURIComponent(filters.min_ticket)}`);
            if (filters.product_type) params.push(`product_type=${encodeURIComponent(filters.product_type)}`);
            
            if (params.length > 0) {
                endpoint += '?' + params.join('&');
            }
            return await this.request(endpoint);
        }

        // Obtener GeoJSON de comunas de la RM
        async getRMComunasGeoJson() {
            return await this.request('/geo/rm-comunas');
        }

        // ============================================
        // ANALYTICS - DASHBOARDS COMPLETOS
        // ============================================

        // Executive Dashboard
        async getExecutiveDashboard(period = '30d') {
            return await this.request(`/analytics/executive?period=${period}`);
        }

        async getRevenueTrend(type = 'daily', period = '30d') {
            return await this.request(`/analytics/executive/revenue-trend?type=${type}&period=${period}`);
        }

        // Dashboard Comercial/Ventas
        async getCommercialDashboard(period = '30d') {
            return await this.request(`/analytics/commercial?period=${period}`);
        }

        async getTopProducts(period = '30d', sort = 'revenue', limit = 10) {
            return await this.request(`/analytics/commercial/top-products?period=${period}&sort=${sort}&limit=${limit}`);
        }

        async getTemporalPerformance(period = '30d') {
            return await this.request(`/analytics/commercial/temporal?period=${period}`);
        }

        // Dashboard de Clientes
        async getCustomersDashboard(period = '30d') {
            return await this.request(`/analytics/customers?period=${period}`);
        }

        async getRFMSegmentation() {
            return await this.request('/analytics/customers/rfm');
        }

        async getCohortAnalysis() {
            return await this.request('/analytics/customers/cohort');
        }

        // Dashboard de Marketing
        async getMarketingDashboard(period = '30d') {
            return await this.request(`/analytics/marketing?period=${period}`);
        }

        // Dashboard de Producto
        async getProductsDashboard(period = '30d') {
            return await this.request(`/analytics/products?period=${period}`);
        }

        // Dashboard de Inventario
        async getInventoryDashboard() {
            return await this.request('/analytics/inventory');
        }

        // Dashboard de Operaciones
        async getOperationsDashboard(period = '30d') {
            return await this.request(`/analytics/operations?period=${period}`);
        }

        // Dashboard de UX
        async getUXDashboard(period = '30d') {
            return await this.request(`/analytics/ux?period=${period}`);
        }

        // Dashboard Financiero
        async getFinancialDashboard(period = '30d') {
            return await this.request(`/analytics/financial?period=${period}`);
        }

        // Dashboard de Servicio al Cliente
        async getCustomerServiceDashboard(period = '30d') {
            return await this.request(`/analytics/customer-service?period=${period}`);
        }

        // ============================================
        // ALERTAS Y NOTIFICACIONES
        // ============================================

        // Verificar todas las alertas
        async checkAlerts() {
            return await this.request('/alerts/check');
        }

        // Verificar stock crítico
        async checkLowStock() {
            return await this.request('/alerts/low-stock');
        }

        // Detectar anomalías de revenue
        async checkRevenueAnomalies() {
            return await this.request('/alerts/revenue-anomalies');
        }

        // Detectar fraude
        async checkFraud() {
            return await this.request('/alerts/fraud');
        }

    }

    // Crear instancia global solo si no existe
    console.log('📦 [ADMIN API] Verificando si api existe...', typeof window !== 'undefined' ? typeof window.api : 'window no disponible');
    if (typeof window !== 'undefined' && typeof window.api === 'undefined') {
        console.log('📦 [ADMIN API] Creando instancia de APIClient...');
        window.api = new APIClient();
        console.log('✅ [ADMIN API] Instancia creada:', window.api);
    } else {
        console.log('⚠️ [ADMIN API] api ya existe, usando existente');
    }

    // Exponer la clase APIClient globalmente para uso con new
    if (typeof window !== 'undefined') {
        window.APIClient = APIClient;
    }

    // Exportar para uso en módulos
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = APIClient;
    }
    
}

console.log('✅ API Client cargado con soporte medicinal y JSON estático');