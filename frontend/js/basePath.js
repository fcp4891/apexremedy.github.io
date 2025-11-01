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
        // Extraer el path base desde el pathname actual
        // pathname será algo como: /fcp4891/apexremedy.github.io/index.html
        // NOTA: El workflow despliega desde ./frontend, así que los archivos están en la raíz del sitio desplegado
        const pathParts = window.location.pathname.split('/').filter(p => p);
        
        // Buscar el índice del repositorio en la URL
        // La estructura de GitHub Pages es: /username/repo-name/path
        let repoIndex = -1;
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === repoName || pathParts[i] === 'apexremedy.github.io') {
                repoIndex = i;
                break;
            }
        }
        
        if (repoIndex !== -1) {
            // Construir ruta base: /username/apexremedy.github.io/
            // O si es un usuario específico: /fcp4891/apexremedy.github.io/
            const username = pathParts[0]; // Primer elemento suele ser el username
            if (username && repoIndex > 0) {
                basePath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
            } else {
                basePath = '/' + repoName + '/';
            }
        } else {
            // Si no encontramos el repo en el path, intentar construir desde el pathname
            // pathname puede ser: /apexremedy.github.io/ o /fcp4891/apexremedy.github.io/
            const pathname = window.location.pathname;
            if (pathname.includes(repoName)) {
                const beforeRepo = pathname.substring(0, pathname.indexOf(repoName));
                basePath = beforeRepo + repoName + '/';
            } else {
                // Fallback: construir desde el primer segmento del path
                if (pathParts.length > 0) {
                    basePath = '/' + pathParts[0] + '/' + repoName + '/';
                } else {
                    basePath = '/' + repoName + '/';
                }
            }
        }
        
        // IMPORTANTE: GitHub Pages despliega desde ./frontend, así que los archivos
        // están en la raíz del sitio desplegado, NO en /frontend/
        // Por lo tanto, NO agregamos 'frontend/' al basePath
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
                    // El basePath ya incluye el path completo desde la raíz del dominio GitHub Pages
                    // Ejemplo: basePath = "/fcp4891/apexremedy.github.io/frontend/"
                    // cleanPath = "style/css_home.css"
                    // newPath = "/fcp4891/apexremedy.github.io/frontend/style/css_home.css"
                    let newPath = currentBasePath + cleanPath;
                    
                    // Asegurarse de que la ruta comience con / para que sea absoluta desde el dominio
                    if (!newPath.startsWith('/')) {
                        newPath = '/' + newPath;
                    }
                    
                    // Solo actualizar si el nuevo path es diferente y válido
                    if (newPath && newPath !== currentPath && newPath.startsWith('/')) {
                        element.setAttribute(attribute, newPath);
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

