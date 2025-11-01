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
        
        if (repoIndex !== -1) {
            const repoPath = '/' + pathParts.slice(0, repoIndex + 1).join('/') + '/';
            
            // Verificar si la URL actual incluye /frontend/
            const currentPath = window.location.pathname;
            const hasFrontendInPath = currentPath.includes('/frontend/') || currentPath.endsWith('/frontend');
            
            // Si GitHub Pages está configurado para servir desde la raíz (no desde /frontend/),
            // siempre agregar /frontend/ al basePath
            // El workflow de GitHub Actions debería servir desde /frontend/, pero si no está configurado así,
            // necesitamos agregar /frontend/ manualmente
            if (!hasFrontendInPath) {
                // GitHub Pages está sirviendo desde la raíz, agregar /frontend/
                basePath = repoPath + 'frontend/';
            } else {
                // GitHub Pages está sirviendo desde /frontend/ correctamente
                basePath = repoPath;
            }
        } else {
            // Si no encontramos el repoName en el path, puede ser que estemos en la raíz
            // Intentar construir el path asumiendo que el primer segmento es el usuario
            const firstPart = pathParts[0];
            if (firstPart && window.location.hostname.includes('github.io')) {
                // Construir: /usuario/repo/frontend/
                basePath = '/' + firstPart + '/' + repoName + '/frontend/';
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
                const newPath = window.getBasePath(currentPath);
                // Solo actualizar si el nuevo path es diferente y no comienza con http
                if (newPath && newPath !== currentPath && !newPath.startsWith('http')) {
                    element.setAttribute(attribute, newPath);
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

