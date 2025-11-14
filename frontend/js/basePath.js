/**
 * Detectar y configurar el path base según el entorno
 * Usa el sistema centralizado env-config.js si está disponible
 * Para GitHub Pages, ajusta las rutas automáticamente
 */

(function() {
    'use strict';
    
    // Usar el sistema centralizado si está disponible
    let basePath = '';
    let getBasePathFn = null;
    
    if (typeof window !== 'undefined' && typeof window.getBasePath === 'function') {
        // El sistema centralizado ya está disponible (env-config.js)
        basePath = window.BASE_PATH || '';
        getBasePathFn = window.getBasePath;
        console.log('✅ Usando sistema centralizado de rutas (env-config.js)');
    } else {
        // Fallback: calcular manualmente (compatibilidad hacia atrás)
        const isGitHubPages = window.location.hostname.includes('github.io');
        const repoName = 'apexremedy.github.io';
        
        if (isGitHubPages) {
            const pathname = window.location.pathname;
            const pathParts = pathname.split('/').filter(p => p);
            
            let repoIndex = -1;
            for (let i = 0; i < pathParts.length; i++) {
                if (pathParts[i] === repoName || pathParts[i].includes('apexremedy')) {
                    repoIndex = i;
                    break;
                }
            }
            
            if (repoIndex !== -1) {
                basePath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
            } else if (pathname.includes(repoName)) {
                const repoPos = pathname.indexOf(repoName);
                basePath = pathname.substring(0, repoPos + repoName.length) + '/';
            } else {
                basePath = '/';
            }
            
            console.log('⚠️ Usando cálculo manual de basePath (env-config.js no encontrado)');
        }
        
        // Función de fallback
        getBasePathFn = function(path) {
            if (!path) return basePath;
            
            if (path.startsWith('http') || path.startsWith('//') || path.startsWith('data:') || path.startsWith('#')) {
                return path;
            }
            
            let cleanPath = path;
            if (cleanPath.startsWith('./')) {
                cleanPath = cleanPath.substring(2);
            }
            if (cleanPath.startsWith('/') && cleanPath.length > 1) {
                cleanPath = cleanPath.substring(1);
            }
            
            if (!basePath) {
                return cleanPath.startsWith('/') ? cleanPath : './' + cleanPath;
            }
            
            return basePath + cleanPath;
        };
    }
    
    // Exportar función
    window.getBasePath = getBasePathFn;
    
    // Exportar basePath globalmente
    window.BASE_PATH = basePath;
    
    // Debug: mostrar el basePath calculado
    if (basePath) {
        console.log('🔧 BasePath calculado:', basePath);
        console.log('🔧 URL actual:', window.location.pathname);
        console.log('🔧 Hostname:', window.location.hostname);
    }
    
    // Función para actualizar rutas en un elemento (con protección contra actualizaciones múltiples)
    const updatedElements = new WeakSet(); // Track elementos ya actualizados
    
    function updateElementPath(element, attribute) {
        // Prevenir actualizaciones múltiples del mismo elemento
        if (updatedElements.has(element)) {
            return;
        }
        
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
                    let newPath = currentBasePath + cleanPath;
                    
                    // Asegurarse de que la ruta comience con / para que sea absoluta desde el dominio
                    if (!newPath.startsWith('/')) {
                        newPath = '/' + newPath;
                    }
                    
                    // Solo actualizar si el nuevo path es diferente y válido
                    if (newPath && newPath !== currentPath && newPath.startsWith('/')) {
                        element.setAttribute(attribute, newPath);
                        updatedElements.add(element); // Marcar como actualizado
                    }
                }
            }
        }
    }
    
    // Flag para prevenir ejecuciones múltiples
    let pathsUpdated = false;
    
    // Actualizar rutas en el DOM al cargar
    function updateAllPaths() {
        // Solo hacer si estamos en GitHub Pages y tenemos un basePath válido
        const currentBasePath = window.BASE_PATH || basePath;
        const isGitHubPages = window.location.hostname.includes('github.io');
        if (!currentBasePath || !isGitHubPages) return;
        
        // Prevenir ejecuciones múltiples que causan parpadeo
        if (pathsUpdated) return;
        pathsUpdated = true;
        
        try {
            // Actualizar links (solo rutas relativas, no absolutas)
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                // Solo actualizar si no es una URL absoluta y no comienza con #
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                    updateElementPath(link, 'href');
                }
            });
            
            // NO actualizar scripts dinámicamente - causa parpadeo
            // Los scripts ya fueron cargados antes de este punto
            
            // Actualizar imágenes
            document.querySelectorAll('img[src]').forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
                    updateElementPath(img, 'src');
                }
            });
            
            // NO actualizar CSS dinámicamente - causa parpadeo
            // Los CSS ya fueron cargados antes de este punto
            
            // Actualizar form actions
            document.querySelectorAll('form[action]').forEach(form => {
                const action = form.getAttribute('action');
                if (action && !action.startsWith('http') && !action.startsWith('//')) {
                    updateElementPath(form, 'action');
                }
            });
        } catch (error) {
            console.warn('⚠️ Error al actualizar rutas:', error);
            pathsUpdated = false; // Permitir reintentar si hay error
        }
    }
    
    // Ejecutar SOLO una vez cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Ejecutar solo una vez
            if (!pathsUpdated) {
                updateAllPaths();
            }
        }, { once: true });
    } else {
        // Si ya está listo, ejecutar inmediatamente (solo una vez)
        if (!pathsUpdated) {
            updateAllPaths();
        }
    }
    
    // NO ejecutar después de delay - causa parpadeo
})();

