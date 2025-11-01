/**
 * Detectar y configurar el path base según el entorno
 * Para GitHub Pages, ajusta las rutas automáticamente
 * Versión para admin - copia de frontend/js/basePath.js
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
        // pathname será algo como: /apexremedy.github.io/frontend/admin/index.html
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const repoIndex = pathParts.indexOf(repoName);
        
        let repoPath = '';
        // El pathname ya incluye el repo completo: /apexremedy.github.io/frontend/admin/index.html
        // NO necesitamos agregar el usuario porque las rutas absolutas son relativas al dominio actual
        // El dominio es fcp4891.github.io, entonces /apexremedy.github.io/ es correcto
        if (repoIndex !== -1) {
            // Usar solo el repoName desde el pathname (sin el usuario)
            repoPath = '/' + repoName + '/';
        } else {
            // Fallback: construir desde el pathname completo si no encontramos el repoName
            // Pero esto no debería pasar normalmente
            repoPath = '/' + repoName + '/';
        }
        
        // Verificar si la URL actual incluye /frontend/
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
            
            // NO procesar rutas que ya están siendo procesadas por adminTemplate.js
            // Si la ruta ya incluye el basePath completo, no procesarla de nuevo
            const currentBasePath = window.BASE_PATH || basePath;
            if (currentBasePath && currentPath.startsWith(currentBasePath)) {
                // La ruta ya fue procesada, no hacer nada
                return;
            }
            
            // Solo actualizar rutas relativas (evitar rutas absolutas que ya tienen el path completo)
            if (currentPath.startsWith('./') || currentPath.startsWith('../') || (!currentPath.startsWith('/') && currentPath.length > 0)) {
                // Asegurarse de que tenemos un basePath válido
                if (currentBasePath) {
                    let cleanPath = currentPath;
                    let subdirectory = '';
                    
                    // Detectar si estamos en un subdirectorio (como /admin/)
                    const currentUrl = window.location.pathname;
                    const isInAdmin = currentUrl.includes('/admin/');
                    
                    // Manejar diferentes tipos de rutas relativas
                    if (cleanPath.startsWith('../')) {
                        // Ruta que sale del directorio actual (../ significa salir de admin/)
                        // Ejemplo: ../assets/images/logo.png desde /admin/ → /frontend/assets/images/logo.png
                        cleanPath = cleanPath.substring(3); // Remover ../
                        subdirectory = ''; // No agregar admin/ porque estamos saliendo
                    } else if (cleanPath.startsWith('./')) {
                        // Ruta relativa al directorio actual (./ significa desde admin/)
                        // Ejemplo: ./style/css_admin.css desde /admin/ → /frontend/admin/style/css_admin.css
                        cleanPath = cleanPath.substring(2); // Remover ./
                        if (isInAdmin) {
                            subdirectory = 'admin/';
                        }
                    } else if (!cleanPath.startsWith('/')) {
                        // Ruta relativa sin prefijo (asumimos que es desde el directorio actual)
                        if (isInAdmin) {
                            subdirectory = 'admin/';
                        }
                    }
                    
                    // Construir la nueva ruta completa
                    // El basePath ya incluye el path completo desde la raíz del dominio GitHub Pages
                    // Ejemplo: basePath = "/apexremedy.github.io/frontend/"
                    // subdirectory = "admin/" o ""
                    // cleanPath = "style/css_admin.css" o "assets/images/logo.png"
                    // newPath = "/apexremedy.github.io/frontend/admin/style/css_admin.css" o "/apexremedy.github.io/frontend/assets/images/logo.png"
                    let newPath = currentBasePath + subdirectory + cleanPath;
                    
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

