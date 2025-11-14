/**
 * Detectar y configurar el path base según el entorno
 * Usa el sistema centralizado env-config.js si está disponible
 * Versión para admin - usa el mismo sistema que frontend/js/basePath.js
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
        console.log('✅ [admin/basePath] Usando sistema centralizado de rutas (env-config.js)');
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
            
            console.log('⚠️ [admin/basePath] Usando cálculo manual de basePath (env-config.js no encontrado)');
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
        const isGitHubPages = window.location.hostname.includes('github.io');
        if (!currentBasePath || !isGitHubPages) return;
        
        // NO procesar elementos dentro de contenedores que ya fueron procesados por adminTemplate.js
        // Estos contenedores son dinámicos y sus rutas ya fueron corregidas
        const excludedContainers = ['#header-container', '#footer-container'];
        
        // Actualizar links (excluyendo los que están en contenedores procesados)
        document.querySelectorAll('a[href]').forEach(link => {
            // Verificar si el link está dentro de un contenedor excluido
            const isInExcludedContainer = excludedContainers.some(selector => {
                const container = document.querySelector(selector);
                return container && container.contains(link);
            });
            if (!isInExcludedContainer) {
                updateElementPath(link, 'href');
            }
        });
        
        // Actualizar scripts (excepto los que ya tienen src absoluto)
        document.querySelectorAll('script[src]').forEach(script => {
            updateElementPath(script, 'src');
        });
        
        // Actualizar imágenes (excluyendo las que están en contenedores procesados)
        document.querySelectorAll('img[src]').forEach(img => {
            // Verificar si la imagen está dentro de un contenedor excluido
            const isInExcludedContainer = excludedContainers.some(selector => {
                const container = document.querySelector(selector);
                return container && container.contains(img);
            });
            if (!isInExcludedContainer) {
                updateElementPath(img, 'src');
            }
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

