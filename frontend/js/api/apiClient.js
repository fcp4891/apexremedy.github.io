// frontend/js/api/apiClient.js
// Cliente API para comunicación con el backend
// ✅ ACTUALIZADO CON SOPORTE MEDICINAL

// Log inmediato para verificar que el script se carga
try {
    console.log('📦 [API] Script apiClient.js cargado');
    console.log('📦 [API] Timestamp:', new Date().toISOString());
    console.log('📦 [API] URL actual:', window.location.href);
} catch (e) {
    console.error('❌ [API] Error en log inicial:', e);
}

// Prevenir doble declaración
if (typeof APIClient === 'undefined') {
    console.log('📦 [API] Creando clase APIClient...');
    class APIClient {
        constructor() {
            // Detectar entorno usando el detector de entorno
            let backendURL = null;
            
            // Usar detector de entorno si está disponible
            if (typeof window !== 'undefined' && window.envDetector) {
                backendURL = window.envDetector.getBackendURL();
                this.env = window.envDetector.env;
                this.dataSource = window.envDetector.dataSource.type;
            } else {
                // Fallback: detección básica
                const isProduction = window.location.hostname.includes('github.io') || 
                                    (window.location.hostname !== 'localhost' && 
                                     window.location.hostname !== '127.0.0.1');
                
                if (isProduction) {
                    this.env = 'github';
                    this.dataSource = 'json';
                    // En GitHub Pages, no hay backend
                    backendURL = null;
                } else {
                    this.env = 'local';
                    this.dataSource = 'sqlite';
                    // En local, usar backend en localhost
                    backendURL = 'http://localhost:3000/api';
                }
            }
            
            this.baseURL = backendURL;
            this.token = null;
            
            // Log informativo
            console.log(`📍 Entorno: ${this.env} | Fuente: ${this.dataSource}`);
            console.log(`🔗 Backend URL: ${this.baseURL || 'Solo JSON estático'}`);
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
                    
                    // Crear error personalizado con información del backend
                    const error = new Error(data.message || 'Error en la petición');
                    error.response = {
                        status: response.status,
                        data: data
                    };
                    error.error_code = data.error_code;
                    error.field = data.field;
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
                // Usar método mejorado que soporta SHA-256 y detecta bcrypt
                const passwordMatch = await this.comparePassword(password, user.password_hash);
                
                // Log para depuración (solo en desarrollo)
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('🔐 Debug login:', {
                        email: email,
                        passwordHashStored: user.password_hash,
                        isBcrypt: this.isBcryptHash(user.password_hash),
                        match: passwordMatch
                    });
                }
                
                if (!passwordMatch) {
                    // Si es bcrypt, dar mensaje más específico
                    if (this.isBcryptHash(user.password_hash)) {
                        return {
                            success: false,
                            message: 'Error de configuración: El hash de contraseña no es compatible. Contacta al administrador.'
                        };
                    }
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
                // Verificar múltiples formas en que puede estar disponible y esperar si es necesario
                let bcrypt = null;
                
                // Función helper para obtener bcryptjs
                const getBcrypt = () => {
                    // Probar diferentes formas de acceso
                    if (typeof window !== 'undefined') {
                        if (window.bcryptjs && typeof window.bcryptjs.compareSync === 'function') {
                            return window.bcryptjs;
                        }
                        if (window.bcrypt && typeof window.bcrypt.compareSync === 'function') {
                            return window.bcrypt;
                        }
                    }
                    // Probar variable global sin window
                    if (typeof bcryptjs !== 'undefined' && bcryptjs && typeof bcryptjs.compareSync === 'function') {
                        return bcryptjs;
                    }
                    return null;
                };
                
                // Intentar obtener bcrypt inmediatamente
                bcrypt = getBcrypt();
                
                // Si no está disponible, esperar un poco (bcryptjs puede estar cargándose)
                if (!bcrypt) {
                    console.log('⏳ Esperando que bcryptjs termine de cargar...');
                    // Esperar hasta 2 segundos en intervalos de 100ms
                    for (let i = 0; i < 20; i++) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        bcrypt = getBcrypt();
                        if (bcrypt) {
                            console.log('✅ bcryptjs disponible después de esperar', i * 100, 'ms');
                            break;
                        }
                    }
                    if (!bcrypt) {
                        console.warn('⚠️ bcryptjs no está disponible después de esperar 2 segundos');
                    }
                }
                
                if (bcrypt) {
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
                            // GitHub Pages despliega desde ./frontend, así que api/ está en la raíz del repo
                            apiPath = repoPath + 'api/' + filename;
                        } else {
                            // Fallback: intentar construir la ruta desde el pathname
                            if (window.location.pathname.includes(repoName)) {
                                const repoPos = window.location.pathname.indexOf(repoName);
                                const repoPath = window.location.pathname.substring(0, repoPos + repoName.length);
                                apiPath = repoPath + '/api/' + filename;
                            } else {
                                // Fallback simple para desarrollo local
                                apiPath = window.location.pathname.includes('/frontend/') 
                                    ? './api/' + filename 
                                    : './frontend/api/' + filename;
                            }
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
                
                // 🆕 Verificar si el usuario puede ver productos medicinales
                // Nota: Esto requiere verificar authManager si está disponible
                let canViewMedicinal = false;
                if (typeof window !== 'undefined' && window.authManager) {
                    canViewMedicinal = window.authManager.isAuthenticated() && 
                                      (() => {
                                          const user = window.authManager.getCurrentUser();
                                          return user && (user.account_status === 'approved' || user.role === 'admin');
                                      })();
                }
                
                const categoriesMap = new Map();
                const seenSlugs = new Set();
                
                staticData.data.products.forEach(product => {
                    // 🆕 FILTRAR productos medicinales si el usuario no tiene acceso
                    if (!canViewMedicinal) {
                        const isMedicinal = product.requires_prescription === true || 
                                          product.is_medicinal === true ||
                                          (product.category_slug && product.category_slug.includes('medicinal')) ||
                                          (product.category && product.category.toLowerCase().includes('medicinal'));
                        if (isMedicinal) {
                            return; // Saltar este producto
                        }
                    }
                    
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
            }
            
            // No hay backend y no se pudo cargar JSON estático
            console.warn('⚠️ No hay backend configurado y JSON estático no disponible');
            return {
                success: true,
                data: { categories: [] },
                message: 'No se pudieron cargar categorías'
            };
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
                
                // Filtrar por cliente
                if (filters.customer_id) {
                    filtered = filtered.filter(o => 
                        o.customer_id === parseInt(filters.customer_id) || 
                        o.user_id === parseInt(filters.customer_id)
                    );
                }
                
                // Filtrar por estado
                if (filters.status && filters.status !== 'all') {
                    filtered = filtered.filter(o => o.status === filters.status);
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
            
            // Si hay backend configurado, usar API dinámica directamente (más actualizado)
            if (this.baseURL) {
                try {
                    const queryParams = new URLSearchParams();
                    
                    Object.keys(filters).forEach(key => {
                        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                            queryParams.append(key, filters[key]);
                        }
                    });

                    const queryString = queryParams.toString();
                    const endpoint = queryString ? `/orders?${queryString}` : '/orders';
                    
                    console.log('🔗 Cargando pedidos desde API dinámica:', endpoint);
                    const response = await this.request(endpoint);
                    console.log('✅ Respuesta de API dinámica:', response);
                    return response;
                } catch (error) {
                    console.warn('⚠️ API dinámica falló, intentando JSON estático como fallback...', error.message);
                }
            }
            
            // Si no hay backend o falló, intentar JSON estático
            try {
                const staticData = await this.loadStaticJSON('orders.json');
                console.log('🔍 JSON estático de orders cargado:', staticData);
                if (staticData && staticData.success && staticData.data) {
                    // Verificar si tiene orders directamente o dentro de data
                    const ordersArray = staticData.data.orders || staticData.data || [];
                    if (Array.isArray(ordersArray) && ordersArray.length > 0) {
                        let orders = applyFiltersToOrders(ordersArray, filters);
                        console.log('✅ Pedidos cargados desde JSON estático:', orders.length);
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
            }
            
            // Si todo falla, retornar array vacío
            console.warn('⚠️ No se pudo cargar pedidos desde ninguna fuente');
            return {
                success: true,
                data: { orders: [] },
                message: 'No se pudieron cargar pedidos'
            };
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

        async saveCultivationCession(cessionData) {
            return await this.request('/cultivation-cessions', {
                method: 'POST',
                body: JSON.stringify(cessionData)
            });
        }

        async saveUserRegistrationDocuments(registrationId, userId, documents) {
            return await this.request('/user-registration-documents', {
                method: 'POST',
                body: {
                    registration_id: registrationId,
                    user_id: userId,
                    documents: documents
                }
            });
        }

        async saveUserRegistration(registrationData) {
            return await this.request('/user-registrations', {
                method: 'POST',
                body: JSON.stringify(registrationData)
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

