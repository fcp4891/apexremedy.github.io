/**
 * env-config.js
 * Sistema centralizado de detección de entorno y construcción de rutas
 * 
 * Este archivo DEBE cargarse PRIMERO antes que cualquier otro script
 * para establecer el entorno y las rutas base correctas.
 * 
 * Entornos soportados:
 * - LOCAL: Desarrollo local (localhost, SQLite)
 * - GITHUB_PAGES: QA en GitHub Pages (JSON estático)
 * - PRODUCTION: Producción (PostgreSQL)
 */

(function() {
    'use strict';
    
    // ============================================
    // DETECCIÓN DE ENTORNO
    // ============================================
    
    /**
     * Detecta el entorno actual
     * @returns {string} 'local' | 'github_pages' | 'production'
     */
    function detectEnvironment() {
        if (typeof window === 'undefined') {
            return 'unknown';
        }
        
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // GitHub Pages (QA)
        if (hostname.includes('github.io')) {
            return 'github_pages';
        }
        
        // Local (desarrollo)
        if (hostname === 'localhost' || 
            hostname === '127.0.0.1' || 
            hostname === '0.0.0.0' ||
            protocol === 'file:') {
            return 'local';
        }
        
        // Producción (cualquier otro dominio)
        return 'production';
    }
    
    const ENV = detectEnvironment();
    
    // ============================================
    // CONFIGURACIÓN POR ENTORNO
    // ============================================
    
    const CONFIG = {
        local: {
            // Desarrollo local: archivos en ./frontend/
            basePath: '',
            apiBaseURL: 'http://localhost:3000/api',
            dataSource: 'sqlite',
            staticApiPath: '../api/', // Desde admin/ hacia ../api/
            description: 'Desarrollo local con SQLite'
        },
        github_pages: {
            // GitHub Pages: workflow despliega desde ./frontend a la raíz
            // Entonces los archivos están en: /apexremedy.github.io/api/
            // NO en: /apexremedy.github.io/frontend/api/
            basePath: '', // Se calcula dinámicamente
            apiBaseURL: null, // No hay backend
            dataSource: 'json',
            staticApiPath: '', // Se calcula dinámicamente
            description: 'QA en GitHub Pages con JSON estático'
        },
        production: {
            // Producción: similar a GitHub Pages pero con dominio propio
            basePath: '', // Se calcula dinámicamente si es necesario
            apiBaseURL: null, // Configurar cuando haya backend
            // TODO: Cuando haya backend en producción, cambiar a:
            // apiBaseURL: 'https://api.apexremedy.cl/api',
            dataSource: 'postgresql',
            staticApiPath: '/api/',
            description: 'Producción con PostgreSQL'
        }
    };
    
    // ============================================
    // CÁLCULO DE BASE PATH
    // ============================================
    
    /**
     * Calcula el basePath para GitHub Pages
     * GitHub Pages despliega desde ./frontend, así que los archivos están en la raíz
     */
    function calculateGitHubPagesBasePath() {
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/').filter(p => p);
        const repoName = 'apexremedy.github.io';
        
        // Buscar el índice del repositorio en la URL
        let repoIndex = -1;
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === repoName || pathParts[i].includes('apexremedy')) {
                repoIndex = i;
                break;
            }
        }
        
        if (repoIndex !== -1) {
            // Construir basePath: /fcp4891/apexremedy.github.io/
            // GitHub Pages despliega desde ./frontend, así que los archivos están en la raíz del sitio
            // NO agregamos /frontend/ porque el workflow ya lo despliega a la raíz
            return '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
        } else if (pathname.includes(repoName)) {
            const repoPos = pathname.indexOf(repoName);
            return pathname.substring(0, repoPos + repoName.length) + '/';
        }
        
        return '/';
    }
    
    /**
     * Obtiene la configuración del entorno actual
     */
    function getCurrentConfig() {
        const envConfig = CONFIG[ENV] || CONFIG.local;
        
        // Calcular basePath dinámicamente para GitHub Pages
        if (ENV === 'github_pages') {
            const basePath = calculateGitHubPagesBasePath();
            return {
                ...envConfig,
                basePath: basePath,
                staticApiPath: basePath + 'api/'
            };
        }
        
        // Para producción, también calcular basePath si es necesario
        if (ENV === 'production') {
            // Por ahora, asumimos que producción está en la raíz del dominio
            return {
                ...envConfig,
                basePath: '',
                staticApiPath: '/api/'
            };
        }
        
        return envConfig;
    }
    
    const currentConfig = getCurrentConfig();
    
    // ============================================
    // FUNCIÓN PARA CONSTRUIR RUTAS
    // ============================================
    
    /**
     * Construye una ruta completa usando el basePath del entorno
     * @param {string} path - Ruta relativa (ej: 'api/products.json', 'js/app.js')
     * @returns {string} Ruta completa según el entorno
     */
    function getBasePath(path) {
        // Si es una URL absoluta, devolverla tal cual
        if (!path || 
            path.startsWith('http') || 
            path.startsWith('//') || 
            path.startsWith('data:') || 
            path.startsWith('#') ||
            path.startsWith('mailto:') ||
            path.startsWith('tel:')) {
            return path || currentConfig.basePath;
        }
        
        // Limpiar la ruta
        let cleanPath = path;
        if (cleanPath.startsWith('./')) {
            cleanPath = cleanPath.substring(2);
        }
        if (cleanPath.startsWith('/') && cleanPath.length > 1) {
            cleanPath = cleanPath.substring(1);
        }
        
        // Para LOCAL, usar rutas relativas
        if (ENV === 'local') {
            // Si estamos en admin/, las rutas a api/ deben subir un nivel
            const isInAdmin = window.location.pathname.includes('/admin/');
            if (isInAdmin && cleanPath.startsWith('api/')) {
                return '../' + cleanPath;
            }
            // Si estamos en una subcarpeta dentro de frontend/, mantener relativo
            return cleanPath.startsWith('/') ? cleanPath : './' + cleanPath;
        }
        
        // Para GITHUB_PAGES y PRODUCTION, usar basePath
        return currentConfig.basePath + cleanPath;
    }
    
    // ============================================
    // FUNCIÓN PARA CONSTRUIR RUTAS DE API ESTÁTICA
    // ============================================
    
    /**
     * Construye la ruta a un archivo JSON estático
     * @param {string} filename - Nombre del archivo JSON (ej: 'products.json')
     * @returns {string} Ruta completa al archivo JSON
     */
    function getStaticApiPath(filename) {
        if (ENV === 'local') {
            // Local: desde admin/ usar ../api/, desde frontend/ usar ./api/
            const isInAdmin = window.location.pathname.includes('/admin/');
            return isInAdmin ? '../api/' + filename : './api/' + filename;
        }
        
        // GitHub Pages y Production: usar staticApiPath
        return currentConfig.staticApiPath + filename;
    }
    
    // ============================================
    // EXPORTAR AL ÁMBITO GLOBAL
    // ============================================
    
    window.ENV = ENV;
    window.ENV_CONFIG = currentConfig;
    window.getBasePath = getBasePath;
    window.getStaticApiPath = getStaticApiPath;
    window.BASE_PATH = currentConfig.basePath;
    window.API_BASE_URL = currentConfig.apiBaseURL;
    window.DATA_SOURCE = currentConfig.dataSource;
    
    // Logs de debug
    console.log('🔧 [env-config] Entorno detectado:', ENV);
    console.log('🔧 [env-config] Base Path:', currentConfig.basePath);
    console.log('🔧 [env-config] API Base URL:', currentConfig.apiBaseURL || 'null (solo JSON estático)');
    console.log('🔧 [env-config] Static API Path:', currentConfig.staticApiPath);
    console.log('🔧 [env-config] Data Source:', currentConfig.dataSource);
    console.log('🔧 [env-config] Descripción:', currentConfig.description);
    console.log('🔧 [env-config] Hostname:', window.location.hostname);
    console.log('🔧 [env-config] Pathname:', window.location.pathname);
    
})();
