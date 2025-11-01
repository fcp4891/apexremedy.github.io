/**
 * Detectar y configurar el path base según el entorno
 * Para GitHub Pages, ajusta las rutas automáticamente
 */

(function() {
    'use strict';
    
    // Detectar si estamos en GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io');
    const repoName = 'apexremedy.github.io';
    
    // Si estamos en GitHub Pages y la URL incluye el nombre del repo
    let basePath = '';
    if (isGitHubPages) {
        // Extraer el path base: /fcp4891/apexremedy.github.io/
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const repoIndex = pathParts.indexOf(repoName);
        
        let repoPath = '';
        if (repoIndex !== -1) {
            repoPath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
        } else {
            // Si no encontramos el repoName en el path, construir desde el hostname
            // hostname será algo como: fcp4891.github.io
            const hostParts = window.location.hostname.split('.');
            if (hostParts.length >= 2) {
                const username = hostParts[0];
                repoPath = '/' + username + '/' + repoName + '/';
            }
        }
        
        // Verificar si la URL actual incluye /frontend/
        const currentPath = window.location.pathname;
        const hasFrontendInPath = currentPath.includes('/frontend/') || currentPath.endsWith('/frontend');
        
        // Como GitHub Pages está sirviendo desde la raíz del repo (no desde /frontend/),
        // SIEMPRE agregar /frontend/ al basePath para que las rutas funcionen correctamente
        if (repoPath) {
            if (!hasFrontendInPath) {
                // GitHub Pages está sirviendo desde la raíz, agregar /frontend/
                basePath = repoPath + 'frontend/';
            } else {
                // Si la URL ya incluye /frontend/, usar el repoPath tal cual
                basePath = repoPath;
            }
        }
    }
    
    // Función para obtener la ruta correcta
    window.getBasePath = function(path) {
        if (!path) return basePath;
        
        // Si la ruta ya es absoluta o comienza con http, devolverla tal cual
        if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:')) {
            return path;
        }
        
        // Si la ruta comienza con ./, eliminar el ./
        if (path.startsWith('./')) {
            path = path.substring(2);
        }
        
        // Si la ruta comienza con /, eliminarlo (excepto si es solo /)
        if (path.startsWith('/') && path.length > 1) {
            path = path.substring(1);
        }
        
        // Combinar basePath con la ruta
        return basePath + path;
    };
    
    // Exportar basePath globalmente
    window.BASE_PATH = basePath;
    
    // Debug: mostrar el basePath calculado (solo en desarrollo)
    if (basePath && window.location.hostname.includes('github.io')) {
        console.log('🔧 BasePath calculado:', basePath);
        console.log('🔧 URL actual:', window.location.pathname);
    }
    
    // Función para actualizar rutas en un elemento
    function updateElementPath(element, attribute) {
        const currentPath = element.getAttribute(attribute);
        if (currentPath && 
            !currentPath.startsWith('http') && 
            !currentPath.startsWith('//') && 
            !currentPath.startsWith('data:') &&
            !currentPath.startsWith('#') &&
            !currentPath.startsWith('mailto:') &&
            !currentPath.startsWith('tel:')) {
            
            // Solo actualizar rutas relativas (evitar rutas absolutas que ya tienen el path completo)
            if (currentPath.startsWith('./') || (!currentPath.startsWith('/') && currentPath.length > 0)) {
                // Asegurarse de que tenemos un basePath válido
                const currentBasePath = window.BASE_PATH || basePath;
                if (currentBasePath) {
                    let cleanPath = currentPath;
                    // Eliminar ./ si existe
                    if (cleanPath.startsWith('./')) {
                        cleanPath = cleanPath.substring(2);
                    }
                    // Construir la nueva ruta completa
                    const newPath = currentBasePath + cleanPath;
                    // Solo actualizar si el nuevo path es diferente
                    if (newPath && newPath !== currentPath) {
                        element.setAttribute(attribute, newPath);
                    }
                }
            }
        }
    }
    
    // Actualizar rutas en el DOM al cargar
    function updateAllPaths() {
        if (!basePath) return; // Solo hacer si estamos en GitHub Pages
        
        // Actualizar links
        document.querySelectorAll('a[href]').forEach(link => {
            updateElementPath(link, 'href');
        });
        
        // Actualizar scripts (excepto los que ya tienen src absoluto)
        document.querySelectorAll('script[src]').forEach(script => {
            updateElementPath(script, 'src');
        });
        
        // Actualizar imágenes
        document.querySelectorAll('img[src]').forEach(img => {
            updateElementPath(img, 'src');
        });
        
        // Actualizar CSS
        document.querySelectorAll('link[href]').forEach(link => {
            updateElementPath(link, 'href');
        });
        
        // Actualizar form actions
        document.querySelectorAll('form[action]').forEach(form => {
            updateElementPath(form, 'action');
        });
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateAllPaths);
    } else {
        updateAllPaths();
    }
    
    // También ejecutar después de un pequeño delay para elementos dinámicos
    setTimeout(updateAllPaths, 100);
})();

