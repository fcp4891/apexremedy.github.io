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
        // Construir el path base desde el hostname siempre
        // hostname será algo como: fcp4891.github.io
        const hostParts = window.location.hostname.split('.');
        let repoPath = '';
        
        if (hostParts.length >= 2) {
            const username = hostParts[0]; // fcp4891
            repoPath = '/' + username + '/' + repoName + '/';
        } else {
            // Fallback: intentar extraer del pathname si el hostname no tiene el formato esperado
            const pathParts = window.location.pathname.split('/').filter(p => p);
            const repoIndex = pathParts.indexOf(repoName);
            if (repoIndex > 0) {
                // Si encontramos el repoName y hay algo antes, usar eso como usuario
                repoPath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
            } else if (repoIndex === 0) {
                // Si el repoName está en el índice 0, construir desde hostname
                const fallbackHostParts = window.location.hostname.split('.');
                if (fallbackHostParts.length >= 2) {
                    repoPath = '/' + fallbackHostParts[0] + '/' + repoName + '/';
                }
            }
        }
        
        // Verificar si la URL actual incluye /frontend/
        // Si NO incluye /frontend/, significa que GitHub Pages está sirviendo desde la raíz
        // (lo cual es correcto cuando se usa GitHub Actions con path: './frontend')
        // En ese caso, NO agregar /frontend/ al basePath
        const currentPath = window.location.pathname;
        const hasFrontendInPath = currentPath.includes('/frontend/') || currentPath.endsWith('/frontend');
        
        if (repoPath) {
            if (hasFrontendInPath) {
                // Si la URL incluye /frontend/, agregarlo al basePath
                basePath = repoPath + 'frontend/';
            } else {
                // Si NO incluye /frontend/, GitHub Pages está sirviendo desde la raíz
                // (archivos de frontend/ están en la raíz del sitio desplegado)
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
    
    // Debug: mostrar el basePath calculado
    if (basePath) {
        console.log('🔧 BasePath calculado:', basePath);
        console.log('🔧 URL actual:', window.location.pathname);
        console.log('🔧 Hostname:', window.location.hostname);
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
        // Solo hacer si estamos en GitHub Pages y tenemos un basePath válido
        const currentBasePath = window.BASE_PATH || basePath;
        if (!currentBasePath || !isGitHubPages) return;
        
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

