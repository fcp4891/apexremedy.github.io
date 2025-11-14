/**
 * Sistema centralizado de configuración de entorno
 * Detecta automáticamente: LOCAL, GITHUB_PAGES, o PRODUCTION
 * Proporciona basePath y API_BASE_URL consistentes para cada entorno
 */

(function() {
    'use strict';
    
    // ============================================
    // DETECCIÓN DE ENTORNO
    // ============================================
    
    const ENVIRONMENTS = {
        LOCAL: 'local',
        GITHUB_PAGES: 'github_pages',
        PRODUCTION: 'production'
    };
    
    /**
     * Detecta el entorno actual
     * @returns {string} Uno de: 'local', 'github_pages', 'production'
     */
    function detectEnvironment() {
        const hostname = window.location.hostname;
        
        // GitHub Pages: siempre incluye 'github.io'
        if (hostname.includes('github.io')) {
            return ENVIRONMENTS.GITHUB_PAGES;
        }
        
        // Local: localhost, 127.0.0.1, o protocolo file://
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname === '0.0.0.0' ||
            window.location.protocol === 'file:') {
            return ENVIRONMENTS.LOCAL;
        }
        
        // Producción: cualquier otro dominio
        return ENVIRONMENTS.PRODUCTION;
    }
    
    /**
     * Calcula el basePath según el entorno
     * @param {string} env - El entorno detectado
     * @returns {string} El basePath para construir rutas
     */
    function calculateBasePath(env) {
        if (env === ENVIRONMENTS.GITHUB_PAGES) {
            // GitHub Pages: El workflow despliega desde ./frontend a la raíz del sitio
            // URL será: https://fcp4891.github.io/apexremedy.github.io/index.html
            // Entonces basePath = /apexremedy.github.io/
            const pathname = window.location.pathname;
            const pathParts = pathname.split('/').filter(p => p);
            const repoName = 'apexremedy.github.io';
            
            // Buscar el índice del repositorio
            let repoIndex = -1;
            for (let i = 0; i < pathParts.length; i++) {
                if (pathParts[i] === repoName || pathParts[i].includes('apexremedy')) {
                    repoIndex = i;
                    break;
                }
            }
            
            if (repoIndex !== -1) {
                // Construir ruta base: /username/apexremedy.github.io/
                return '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
            } else if (pathname.includes(repoName)) {
                // Fallback: buscar en el pathname completo
                const repoPos = pathname.indexOf(repoName);
                return pathname.substring(0, repoPos + repoName.length) + '/';
            } else {
                // Fallback final: usar raíz
                return '/';
            }
        } else if (env === ENVIRONMENTS.LOCAL) {
            // Local: sin basePath, usar rutas relativas
            return '';
        } else {
            // Producción: usar raíz absoluta
            return '/';
        }
    }
    
    /**
     * Calcula la URL base de la API según el entorno
     * @param {string} env - El entorno detectado
     * @returns {string|null} La URL base de la API o null si no hay backend
     */
    function calculateAPIBaseURL(env) {
        if (env === ENVIRONMENTS.LOCAL) {
            // Local: usar backend en localhost
            return 'http://localhost:3000/api';
        } else if (env === ENVIRONMENTS.GITHUB_PAGES) {
            // GitHub Pages: NO hay backend, usar solo JSON estático
            return null;
        } else {
            // Producción: usar URL de producción (configurar según necesidad)
            // Por ahora, null (solo JSON estático) hasta que se configure el backend
            return null;
            // TODO: Cuando haya backend en producción, cambiar a:
            // return 'https://api.apexremedy.cl/api';
        }
    }
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    const env = detectEnvironment();
    const basePath = calculateBasePath(env);
    const apiBaseURL = calculateAPIBaseURL(env);
    
    // ============================================
    // FUNCIONES PÚBLICAS
    // ============================================
    
    /**
     * Obtiene el entorno actual
     */
    window.getEnvironment = function() {
        return env;
    };
    
    /**
     * Obtiene el basePath actual
     */
    window.getBasePath = function(relativePath) {
        if (!relativePath) return basePath;
        
        // Si la ruta ya es absoluta o comienza con http, devolverla tal cual
        if (relativePath.startsWith('http') || 
            relativePath.startsWith('//') || 
            relativePath.startsWith('data:') ||
            relativePath.startsWith('#')) {
            return relativePath;
        }
        
        // Limpiar la ruta
        let cleanPath = relativePath;
        if (cleanPath.startsWith('./')) {
            cleanPath = cleanPath.substring(2);
        }
        if (cleanPath.startsWith('/') && cleanPath.length > 1) {
            cleanPath = cleanPath.substring(1);
        }
        
        // Si no hay basePath (local), devolver ruta relativa
        if (!basePath) {
            return cleanPath.startsWith('/') ? cleanPath : './' + cleanPath;
        }
        
        // Combinar basePath con la ruta
        return basePath + cleanPath;
    };
    
    /**
     * Obtiene la URL base de la API
     */
    window.getAPIBaseURL = function() {
        return apiBaseURL;
    };
    
    /**
     * Verifica si estamos en un entorno sin backend (solo JSON estático)
     */
    window.isStaticOnly = function() {
        return apiBaseURL === null;
    };
    
    // ============================================
    // EXPORTAR VARIABLES GLOBALES
    // ============================================
    
    window.ENV = env;
    window.BASE_PATH = basePath;
    window.API_BASE_URL = apiBaseURL;
    
    // ============================================
    // LOGS DE DEBUG
    // ============================================
    
    console.log('🔧 [env-config] Entorno detectado:', env);
    console.log('🔧 [env-config] BasePath:', basePath || '(vacío - local)');
    console.log('🔧 [env-config] API Base URL:', apiBaseURL || '(null - solo JSON estático)');
    console.log('🔧 [env-config] Hostname:', window.location.hostname);
    console.log('🔧 [env-config] Pathname:', window.location.pathname);
    
})();

