// script.js - Funcionalidad del catálogo

// Variables globales
let currentPage = 1;
let totalPages = 8;
let currentTab = 'products';

// Mostrar advertencia si se usa file://
function showFileProtocolWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 40px;
        text-align: center;
        font-family: 'Poppins', sans-serif;
    `;
    
    warning.innerHTML = `
        <div style="max-width: 600px; background: #1a1a2e; padding: 40px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #e74c3c; margin-bottom: 20px; font-size: 28px;">Servidor Local Requerido</h2>
            <p style="margin-bottom: 30px; line-height: 1.8; font-size: 16px;">
                Este catálogo necesita ejecutarse desde un servidor web local para funcionar correctamente.
                <br><br>
                <strong>El protocolo file:// no es compatible</strong> debido a las restricciones de seguridad del navegador.
            </p>
            <div style="background: #0f0f1e; padding: 20px; border-radius: 10px; margin-bottom: 30px; text-align: left;">
                <h3 style="color: #4CAF50; margin-bottom: 15px; font-size: 18px;">📋 Opciones para iniciar el servidor:</h3>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fff;">Opción 1 (Python):</strong>
                    <pre style="background: #000; padding: 10px; border-radius: 5px; margin-top: 5px; overflow-x: auto;">python -m http.server 8000</pre>
                </div>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #fff;">Opción 2 (Node.js):</strong>
                    <pre style="background: #000; padding: 10px; border-radius: 5px; margin-top: 5px; overflow-x: auto;">npm start</pre>
                    <pre style="background: #000; padding: 10px; border-radius: 5px; margin-top: 5px; overflow-x: auto;">node server.js</pre>
                </div>
                <div>
                    <strong style="color: #fff;">Opción 3 (Windows):</strong>
                    <pre style="background: #000; padding: 10px; border-radius: 5px; margin-top: 5px; overflow-x: auto;">start-server.bat</pre>
                </div>
            </div>
            <p style="color: #4CAF50; font-size: 14px; margin-bottom: 20px;">
                Luego abre en tu navegador: <strong style="color: #fff;">http://localhost:8000</strong>
            </p>
            <button onclick="window.location.reload()" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 15px 40px;
                font-size: 16px;
                border-radius: 50px;
                cursor: pointer;
                font-weight: 600;
                transition: transform 0.2s;
                margin-top: 10px;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Recargar después de iniciar servidor
            </button>
        </div>
    `;
    
    document.body.appendChild(warning);
    document.body.style.overflow = 'hidden';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar si se está usando file:// protocol
    if (window.location.protocol === 'file:') {
        showFileProtocolWarning();
        return;
    }
    
    // Verificar si hay errores de conexión (puerto incorrecto)
    checkServerConnection();
    
    // Esperar a que se cargue el catálogo desde API si está disponible
    if (typeof window.catalogFromAPI === 'function') {
        await window.catalogFromAPI();
    }
    
    // Si no se cargó desde API, cargar datos locales
    if (!window.catalogFromDB) {
        loadSavedData();
    }
    
    initCatalog();
    setupEventListeners();
    
    // Esperar un momento para asegurar que los datos estén listos
    setTimeout(() => {
        renderContent();
    }, 100);
});

// Verificar conexión con el servidor
function checkServerConnection() {
    // Intentar cargar un recurso para verificar la conexión
    fetch(window.location.origin + '/data.js', { method: 'HEAD' })
        .catch(() => {
            // Si falla, puede ser que el servidor esté en otro puerto
            const currentPort = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
            if (currentPort === '8000') {
                showWrongPortWarning();
            }
        });
}

// Mostrar advertencia si se accede al puerto incorrecto
function showWrongPortWarning() {
    // Esperar un poco para ver si realmente hay un error
    setTimeout(() => {
        const errors = document.querySelectorAll('link[href*=":8000"], script[src*=":8000"]');
        if (errors.length > 0) {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #e74c3c;
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10001;
                max-width: 400px;
                font-family: 'Poppins', sans-serif;
                animation: slideIn 0.3s ease-out;
            `;
            warning.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 24px; margin-right: 10px;">⚠️</span>
                    <strong style="font-size: 16px;">Puerto Incorrecto</strong>
                </div>
                <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
                    Estás accediendo al puerto 8000, pero el servidor está corriendo en otro puerto.
                </p>
                <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
                    <strong>Revisa la consola donde ejecutaste el servidor</strong> para ver el puerto correcto (probablemente 8001).
                </p>
                <button onclick="this.parentElement.remove()" style="
                    background: rgba(255,255,255,0.2);
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 8px 16px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                    font-size: 14px;
                ">Cerrar</button>
            `;
            document.body.appendChild(warning);
            
            // Auto-remover después de 10 segundos
            setTimeout(() => {
                if (warning.parentElement) {
                    warning.remove();
                }
            }, 10000);
        }
    }, 1000);
}

// Inicializar catálogo
function initCatalog() {
    updatePageCounter();
    updateNavigationButtons();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    document.getElementById('prevBtn').addEventListener('click', prevPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    
    // Teclas de navegación
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') prevPage();
        if (e.key === 'ArrowRight') nextPage();
        if (e.key === 'Escape') closeModal();
    });
    
    // Botones de acción
    document.getElementById('editBtn').addEventListener('click', openModal);
    
    // Modal
    document.getElementById('saveBtn').addEventListener('click', saveChanges);
    
    // Tabs del editor
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
}

// Navegación entre páginas
function nextPage() {
    if (currentPage < totalPages) {
        changePage(currentPage + 1);
    }
}

function prevPage() {
    if (currentPage > 1) {
        changePage(currentPage - 1);
    }
}

function changePage(pageNumber) {
    // Ocultar página actual
    const currentPageElement = document.querySelector('.catalog-page.active');
    if (currentPageElement) {
        currentPageElement.classList.remove('active');
    }
    
    // Mostrar nueva página
    currentPage = pageNumber;
    const newPageElement = document.querySelector(`.catalog-page[data-page="${pageNumber}"]`);
    if (newPageElement) {
        newPageElement.classList.add('active');
    }
    
    updatePageCounter();
    updateNavigationButtons();
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updatePageCounter() {
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Renderizar contenido
function renderContent() {
    renderTerms();
    renderProducts(); // Esto creará las páginas dinámicas si son necesarias
    renderHash();
    renderOils();
    renderPolicies();
    // Actualizar números de página después de renderizar todo
    updatePageNumbers();
}

function renderTerms() {
    const container = document.getElementById('termsContent');
    if (container && catalogData.terms) {
        container.innerHTML = catalogData.terms.content;
    }
}

// Función para crear páginas de productos dinámicamente
function ensureProductsPagesExist() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Encontrar la primera página de hash para insertar antes de ella
    const hashPage = document.getElementById('hash1') || document.querySelector('[id^="hash"]');
    if (!hashPage) return;
    
    // Obtener todas las páginas de productos en los datos
    const productPages = [];
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('productsPage')) {
            const pageNum = key.replace('productsPage', '');
            productPages.push(parseInt(pageNum));
        }
    });
    
    // Ordenar las páginas
    productPages.sort((a, b) => a - b);
    
    // Crear páginas faltantes
    productPages.forEach(pageNum => {
        const pageId = `products${pageNum}`;
        const gridId = `productsGrid${pageNum}`;
        
        // Verificar si la página ya existe
        if (!document.getElementById(pageId)) {
            // Crear la página HTML (el número de página se actualizará después)
            const pageElement = document.createElement('section');
            pageElement.className = 'catalog-page';
            pageElement.id = pageId;
            
            pageElement.innerHTML = `
                <div class="products-background" style="background-image: url('./images/catalogo/catalogo_body.png')"></div>
                <div class="page-scroll-container">
                    <div class="page-header">
                        <img src="./images/catalogo/flores-removebg-preview.png" alt="Nuestras Flores" class="flores-header-image">
                        <div class="title-underline"></div>
                    </div>
                    <div class="content-wrapper">
                        <div class="products-grid" id="${gridId}"></div>
                    </div>
                </div>
            `;
            
            // Insertar antes de la página de hash
            catalogContainer.insertBefore(pageElement, hashPage);
            
            console.log(`Página de productos ${pageNum} creada dinámicamente`);
        }
    });
}

/**
 * Eliminar páginas HTML de productos que ya no existen en los datos
 */
function removeOrphanProductPages() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Obtener todas las páginas de productos que existen en los datos
    const dataPages = new Set();
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('productsPage')) {
            const pageNum = key.replace('productsPage', '');
            dataPages.add(`products${pageNum}`);
        }
    });
    
    // Buscar todas las páginas HTML de productos y eliminar las que no están en los datos
    const allProductPages = catalogContainer.querySelectorAll('[id^="products"]');
    allProductPages.forEach(pageElement => {
        const pageId = pageElement.id;
        // Verificar que es una página de productos (no debe ser "products-grid" u otro)
        if (pageId.startsWith('products') && !pageId.includes('Grid')) {
            if (!dataPages.has(pageId)) {
                console.log(`🗑️ Eliminando página HTML huérfana: ${pageId}`);
                pageElement.remove();
            }
        }
    });
}

/**
 * Eliminar páginas HTML de hash que ya no existen en los datos
 */
function removeOrphanHashPages() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Obtener todas las páginas de hash que existen en los datos
    const dataPages = new Set();
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('hashPage')) {
            const pageNum = key.replace('hashPage', '');
            dataPages.add(`hash${pageNum}`);
        }
    });
    
    // Buscar todas las páginas HTML de hash y eliminar las que no están en los datos
    const allHashPages = catalogContainer.querySelectorAll('[id^="hash"]');
    allHashPages.forEach(pageElement => {
        const pageId = pageElement.id;
        // Verificar que es una página de hash (no debe ser "hash-grid" u otro)
        if (pageId.startsWith('hash') && !pageId.includes('Grid') && !pageId.includes('Note')) {
            if (!dataPages.has(pageId)) {
                console.log(`🗑️ Eliminando página HTML huérfana: ${pageId}`);
                pageElement.remove();
            }
        }
    });
}

/**
 * Eliminar páginas HTML de aceites que ya no existen en los datos
 */
function removeOrphanOilPages() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Obtener todas las páginas de aceites que existen en los datos
    const dataPages = new Set();
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('oilPage')) {
            const pageNum = key.replace('oilPage', '');
            dataPages.add(`oil${pageNum}`);
        }
    });
    
    // Buscar todas las páginas HTML de aceites y eliminar las que no están en los datos
    const allOilPages = catalogContainer.querySelectorAll('[id^="oil"]');
    allOilPages.forEach(pageElement => {
        const pageId = pageElement.id;
        // Verificar que es una página de aceites (no debe ser "oil-grid" u otro)
        if (pageId.startsWith('oil') && !pageId.includes('Grid') && !pageId.includes('Note')) {
            if (!dataPages.has(pageId)) {
                console.log(`🗑️ Eliminando página HTML huérfana: ${pageId}`);
                pageElement.remove();
            }
        }
    });
}

/**
 * Eliminar todas las páginas HTML huérfanas (que ya no existen en los datos)
 */
function removeOrphanPages() {
    removeOrphanProductPages();
    removeOrphanHashPages();
    removeOrphanOilPages();
}

// Función para actualizar los números de página después de insertar nuevas páginas
function updatePageNumbers() {
    const allPages = Array.from(document.querySelectorAll('.catalog-page'));
    
    // Ordenar páginas por orden lógico:
    // 1. Portada (cover)
    // 2. Términos (terms)
    // 3. Páginas de productos (products1, products2, products3, etc.)
    // 4. Hash
    // 5. Aceites (oil)
    // 6. Políticas (policies, policies2)
    
    const pageOrder = ['cover', 'terms'];
    
    // Agregar páginas de productos ordenadas
    const productPages = allPages
        .filter(page => page.id && page.id.startsWith('products'))
        .sort((a, b) => {
            const numA = parseInt(a.id.replace('products', '')) || 0;
            const numB = parseInt(b.id.replace('products', '')) || 0;
            return numA - numB;
        })
        .map(page => page.id);
    
    pageOrder.push(...productPages);
    
    // Agregar páginas de hash ordenadas
    const hashPages = allPages
        .filter(page => page.id && page.id.startsWith('hash'))
        .sort((a, b) => {
            const numA = parseInt(a.id.replace('hash', '')) || 0;
            const numB = parseInt(b.id.replace('hash', '')) || 0;
            return numA - numB;
        })
        .map(page => page.id);
    
    pageOrder.push(...hashPages);
    
    // Agregar páginas de aceites ordenadas
    const oilPages = allPages
        .filter(page => page.id && page.id.startsWith('oil'))
        .sort((a, b) => {
            const numA = parseInt(a.id.replace('oil', '')) || 0;
            const numB = parseInt(b.id.replace('oil', '')) || 0;
            return numA - numB;
        })
        .map(page => page.id);
    
    pageOrder.push(...oilPages);
    pageOrder.push('policies1');
    
    // Actualizar data-page de cada página
    pageOrder.forEach((pageId, index) => {
        const page = document.getElementById(pageId);
        if (page) {
            page.setAttribute('data-page', index + 1);
        }
    });
    
    // Actualizar totalPages
    totalPages = allPages.length;
    updatePageCounter();
    updateNavigationButtons();
}

function renderProducts() {
    console.log('🔄 renderProducts() iniciado');
    
    // Eliminar páginas HTML que ya no existen en los datos
    removeOrphanProductPages();
    
    // Asegurar que todas las páginas necesarias existan
    ensureProductsPagesExist();
    
    // Actualizar imágenes de encabezado para todas las páginas de productos
    updateProductsHeaders();
    
    // Obtener todas las páginas de productos
    const productPages = Object.keys(catalogData).filter(key => key.startsWith('productsPage'));
    console.log(`📄 Encontradas ${productPages.length} páginas de productos:`, productPages);
    
    // Renderizar todas las páginas de productos dinámicamente
    productPages.forEach(key => {
        const pageNum = key.replace('productsPage', '');
        const grid = document.getElementById(`productsGrid${pageNum}`);
        
        if (grid) {
            if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                // Renderizar directamente (sin setTimeout para actualización inmediata)
                const html = catalogData[key].map(product => createProductCard(product)).join('');
                grid.innerHTML = html;
                console.log(`✅ Renderizada página ${pageNum}: ${catalogData[key].length} productos`);
                
                // Forzar reflow para asegurar actualización visual
                void grid.offsetHeight;
            } else {
                // Si no hay datos o está vacío, limpiar el grid
                grid.innerHTML = '';
                console.log(`⚠️ Página ${pageNum} vacía, grid limpiado`);
            }
        } else {
            // Si no se encuentra el grid, intentar crear la página
            console.warn(`⚠️ No se encontró el grid productsGrid${pageNum} para la página ${key}, intentando crear...`);
            ensureProductsPagesExist();
            // Intentar de nuevo después de crear
            const gridAfter = document.getElementById(`productsGrid${pageNum}`);
            if (gridAfter) {
                if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                    const html = catalogData[key].map(product => createProductCard(product)).join('');
                    gridAfter.innerHTML = html;
                    console.log(`✅ Página ${pageNum} creada y renderizada después del intento`);
                    void gridAfter.offsetHeight;
                }
            } else {
                console.error(`❌ No se pudo crear el grid productsGrid${pageNum}`);
            }
        }
    });
    
    console.log('✅ renderProducts() completado');
}

// Función para refrescar la vista de la página actual
function refreshCurrentPageView(renderAll = false) {
    // Si se solicita, re-renderizar todas las secciones
    if (renderAll) {
        renderProducts();
        renderHash();
        renderOils();
        renderTerms();
        renderPolicies();
        updatePageNumbers();
    }
    
    // Forzar actualización de todos los elementos
    const allProductsGrids = document.querySelectorAll('.products-grid');
    allProductsGrids.forEach(grid => {
        // Forzar reflow para asegurar que los cambios se muestren
        void grid.offsetHeight;
    });
    
    const currentPageElement = document.querySelector('.catalog-page.active');
    if (currentPageElement) {
        // Forzar reflow en la página actual
        void currentPageElement.offsetHeight;
        
        // Si la página actual es una página de productos, scroll al inicio
        const productsGrid = currentPageElement.querySelector('.products-grid');
        if (productsGrid) {
            // Scroll suave al inicio del contenido
            setTimeout(() => {
                const scrollContainer = currentPageElement.querySelector('.page-scroll-container');
                if (scrollContainer) {
                    scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
        }
    }
    
    // Actualizar navegación por si cambió el número total de páginas
    updatePageCounter();
    updateNavigationButtons();
}

// Función para actualizar encabezados de productos (flores)
function updateProductsHeaders() {
    // Buscar todas las páginas que contengan grids de productos
    // Esto asegura que funcionará incluso si hay más páginas dinámicas
    const allPages = document.querySelectorAll('.catalog-page');
    
    allPages.forEach(page => {
        // Verificar si esta página contiene un grid de productos
        const productsGrid = page.querySelector('.products-grid');
        
        if (productsGrid) {
            const header = page.querySelector('.page-header');
            if (header) {
                // Eliminar cualquier número de página o título existente
                const pageNumber = header.querySelector('.page-number');
                const pageTitle = header.querySelector('.page-title');
                
                if (pageNumber) pageNumber.remove();
                if (pageTitle) pageTitle.remove();
                
                // Buscar si ya existe una imagen
                let img = header.querySelector('.flores-header-image');
                if (!img) {
                    // Si no existe, crear la imagen
                    img = document.createElement('img');
                    img.className = 'flores-header-image';
                    img.alt = 'Nuestras Flores';
                    // Insertar antes del title-underline
                    const underline = header.querySelector('.title-underline');
                    if (underline) {
                        header.insertBefore(img, underline);
                    } else {
                        header.appendChild(img);
                    }
                }
                // Actualizar siempre la imagen a flores
                img.src = './images/catalogo/flores-removebg-preview.png';
                img.alt = 'Nuestras Flores';
            }
        }
    });
}

// Función para normalizar rutas de imágenes
function normalizeImagePath(imagePath) {
    if (!imagePath) {
        return './images/catalogo/catalogo_body.png';
    }
    
    // Si es una URL completa, devolverla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Normalizar rutas relativas
    let normalized = imagePath;
    
    // Si comienza con /, convertir a ruta relativa
    if (normalized.startsWith('/')) {
        normalized = '.' + normalized;
    }
    
    // Si no comienza con ./, agregarlo
    if (!normalized.startsWith('./') && !normalized.startsWith('../')) {
        normalized = './' + normalized;
    }
    
    // Si la ruta contiene placeholder.jpg (sin .png), intentar encontrar placeholder.jpg.png
    if (normalized.includes('placeholder.jpg') && !normalized.endsWith('.png')) {
        // Buscar el archivo correcto: placeholder.jpg.png
        const basePath = normalized.replace('placeholder.jpg', 'placeholder.jpg.png');
        return basePath;
    }
    
    return normalized;
}

function createProductCard(product) {
    const pricesHTML = Object.entries(product.prices)
        .map(([quantity, price]) => `
            <div class="price-item">
                <span class="price-label">${quantity}</span>
                <span class="price-value">${price}</span>
            </div>
        `).join('');
    
    // Normalizar y usar imagen de catalogo_body.png como fallback
    const imageUrl = normalizeImagePath(product.image);
    
    // Si tiene concentration (aceites), mostrar concentration, si no mostrar strain
    const infoText = product.concentration || product.strain || '';
    
    return `
        <div class="product-card">
            <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                 crossorigin="anonymous"
                 onerror="this.onerror=null; this.src='./images/catalogo/catalogo_body.png';">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-strain">${infoText}</p>
                ${product.concentration ? `<p class="product-strain" style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">${product.strain || ''}</p>` : ''}
                <div class="product-prices">
                    ${pricesHTML}
                </div>
            </div>
        </div>
    `;
}

// Función para crear páginas de hash dinámicamente
function ensureHashPagesExist() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Encontrar la primera página de aceites para insertar antes de ella
    const oilPage = document.getElementById('oil1') || document.querySelector('[id^="oil"]');
    if (!oilPage) return;
    
    // Obtener todas las páginas de hash en los datos
    const hashPages = [];
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('hashPage')) {
            const pageNum = key.replace('hashPage', '');
            hashPages.push(parseInt(pageNum));
        }
    });
    
    // Ordenar las páginas
    hashPages.sort((a, b) => a - b);
    
    // Crear páginas faltantes
    hashPages.forEach(pageNum => {
        const pageId = `hash${pageNum}`;
        const gridId = `hashGrid${pageNum}`;
        const noteId = `hashNote${pageNum}`;
        
        // Verificar si la página ya existe
        if (!document.getElementById(pageId)) {
            // Crear la página HTML
            const pageElement = document.createElement('section');
            pageElement.className = 'catalog-page';
            pageElement.id = pageId;
            
            pageElement.innerHTML = `
                <div class="products-background" style="background-image: url('./images/catalogo/catalogo_body.png')"></div>
                <div class="page-scroll-container">
                    <div class="page-header">
                        <img src="./images/catalogo/extracto-removebg-preview.png" alt="Hash Premium" class="flores-header-image">
                        <div class="title-underline"></div>
                    </div>
                    <div class="content-wrapper">
                        <div class="products-grid" id="${gridId}"></div>
                        <div class="hash-note" id="${noteId}"></div>
                    </div>
                </div>
            `;
            
            // Insertar antes de la página de aceites
            catalogContainer.insertBefore(pageElement, oilPage);
            
            console.log(`Página de hash ${pageNum} creada dinámicamente`);
        }
    });
}

function renderHash() {
    console.log('🔄 renderHash() iniciado');
    
    // Eliminar páginas HTML que ya no existen en los datos
    removeOrphanHashPages();
    
    // Asegurar que todas las páginas necesarias existan
    ensureHashPagesExist();
    
    // Actualizar imagen de encabezado para todas las páginas de hash
    updateHashHeader();
    
    // Obtener todas las páginas de hash
    const hashPages = Object.keys(catalogData).filter(key => key.startsWith('hashPage'));
    console.log(`📄 Encontradas ${hashPages.length} páginas de hash:`, hashPages);
    
    // Renderizar todas las páginas de hash dinámicamente
    hashPages.forEach(key => {
        const pageNum = key.replace('hashPage', '');
        const grid = document.getElementById(`hashGrid${pageNum}`);
        const noteElement = document.getElementById(`hashNote${pageNum}`);
        
        if (grid) {
            if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                // Renderizar productos de hash usando la misma función createProductCard
                const html = catalogData[key].map(hash => createProductCard(hash)).join('');
                grid.innerHTML = html;
                console.log(`✅ Renderizada página de hash ${pageNum}: ${catalogData[key].length} productos`);
                
                // Forzar reflow para asegurar actualización visual
                void grid.offsetHeight;
            } else {
                // Si no hay datos o está vacío, limpiar el grid
                grid.innerHTML = '';
                console.log(`⚠️ Página de hash ${pageNum} vacía, grid limpiado`);
            }
        } else {
            // Si no se encuentra el grid, intentar crear la página
            console.warn(`⚠️ No se encontró el grid hashGrid${pageNum} para la página ${key}, intentando crear...`);
            ensureHashPagesExist();
            // Intentar de nuevo después de crear
            const gridAfter = document.getElementById(`hashGrid${pageNum}`);
            if (gridAfter) {
                if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                    const html = catalogData[key].map(hash => createProductCard(hash)).join('');
                    gridAfter.innerHTML = html;
                    console.log(`✅ Página de hash ${pageNum} creada y renderizada después del intento`);
                    void gridAfter.offsetHeight;
                }
            } else {
                console.error(`❌ No se pudo crear el grid hashGrid${pageNum}`);
            }
        }
        
        // Renderizar nota si existe
        if (noteElement && catalogData.hashNotes && catalogData.hashNotes[`hashPage${pageNum}`]) {
            noteElement.textContent = catalogData.hashNotes[`hashPage${pageNum}`];
            noteElement.style.marginTop = '2rem';
            noteElement.style.padding = '1rem';
            noteElement.style.textAlign = 'center';
            noteElement.style.fontStyle = 'italic';
            noteElement.style.color = 'rgba(255, 255, 255, 0.8)';
        }
    });
    
    console.log('✅ renderHash() completado');
}

// Función para actualizar encabezado de hash (para todas las páginas)
function updateHashHeader() {
    // Buscar todas las páginas que contengan hash en el ID
    const allPages = document.querySelectorAll('.catalog-page');
    
    allPages.forEach(page => {
        // Verificar si esta página es de hash
        if (page.id && page.id.startsWith('hash')) {
            const header = page.querySelector('.page-header');
            if (header) {
                // Eliminar cualquier número de página o título existente
                const pageNumber = header.querySelector('.page-number');
                const pageTitle = header.querySelector('.page-title');
                
                if (pageNumber) pageNumber.remove();
                if (pageTitle) pageTitle.remove();
                
                // Buscar si ya existe una imagen
                let img = header.querySelector('.flores-header-image');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'flores-header-image';
                    img.alt = 'Hash Premium';
                    const underline = header.querySelector('.title-underline');
                    if (underline) {
                        header.insertBefore(img, underline);
                    } else {
                        header.appendChild(img);
                    }
                }
                // Actualizar siempre la imagen a extracto
                img.src = './images/catalogo/extracto-removebg-preview.png';
                img.alt = 'Hash Premium';
            }
        }
    });
}

// Función para crear páginas de aceites dinámicamente
function ensureOilPagesExist() {
    const catalogContainer = document.getElementById('catalogContainer');
    if (!catalogContainer) return;
    
    // Encontrar la página de políticas para insertar antes de ella
    const policiesPage = document.getElementById('policies1');
    if (!policiesPage) return;
    
    // Obtener todas las páginas de aceites en los datos
    const oilPages = [];
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('oilPage')) {
            const pageNum = key.replace('oilPage', '');
            oilPages.push(parseInt(pageNum));
        }
    });
    
    // Ordenar las páginas
    oilPages.sort((a, b) => a - b);
    
    // Crear páginas faltantes
    oilPages.forEach(pageNum => {
        const pageId = `oil${pageNum}`;
        const gridId = `oilGrid${pageNum}`;
        const noteId = `oilNote${pageNum}`;
        
        // Verificar si la página ya existe
        if (!document.getElementById(pageId)) {
            // Crear la página HTML
            const pageElement = document.createElement('section');
            pageElement.className = 'catalog-page';
            pageElement.id = pageId;
            
            pageElement.innerHTML = `
                <div class="products-background" style="background-image: url('./images/catalogo/catalogo_body.png')"></div>
                <div class="page-scroll-container">
                    <div class="page-header">
                        <img src="./images/catalogo/aceites-removebg-preview.png" alt="Aceites Esenciales" class="flores-header-image">
                        <div class="title-underline"></div>
                    </div>
                    <div class="content-wrapper">
                        <div class="products-grid" id="${gridId}"></div>
                        <div class="hash-note" id="${noteId}"></div>
                    </div>
                </div>
            `;
            
            // Insertar antes de la página de políticas
            catalogContainer.insertBefore(pageElement, policiesPage);
            
            console.log(`Página de aceites ${pageNum} creada dinámicamente`);
        }
    });
}

function renderOils() {
    console.log('🔄 renderOils() iniciado');
    
    // Eliminar páginas HTML que ya no existen en los datos
    removeOrphanOilPages();
    
    // Asegurar que todas las páginas necesarias existan
    ensureOilPagesExist();
    
    // Actualizar imagen de encabezado para todas las páginas de aceites
    updateOilsHeader();
    
    // Obtener todas las páginas de aceites
    const oilPages = Object.keys(catalogData).filter(key => key.startsWith('oilPage'));
    console.log(`📄 Encontradas ${oilPages.length} páginas de aceites:`, oilPages);
    
    // Renderizar todas las páginas de aceites dinámicamente
    oilPages.forEach(key => {
        const pageNum = key.replace('oilPage', '');
        const grid = document.getElementById(`oilGrid${pageNum}`);
        const noteElement = document.getElementById(`oilNote${pageNum}`);
        
        if (grid) {
            if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                // Renderizar aceites usando la misma función createProductCard
                const html = catalogData[key].map(oil => createProductCard(oil)).join('');
                grid.innerHTML = html;
                console.log(`✅ Renderizada página de aceites ${pageNum}: ${catalogData[key].length} productos`);
                
                // Forzar reflow para asegurar actualización visual
                void grid.offsetHeight;
            } else {
                // Si no hay datos o está vacío, limpiar el grid
                grid.innerHTML = '';
                console.log(`⚠️ Página de aceites ${pageNum} vacía, grid limpiado`);
            }
        } else {
            // Si no se encuentra el grid, intentar crear la página
            console.warn(`⚠️ No se encontró el grid oilGrid${pageNum} para la página ${key}, intentando crear...`);
            ensureOilPagesExist();
            // Intentar de nuevo después de crear
            const gridAfter = document.getElementById(`oilGrid${pageNum}`);
            if (gridAfter) {
                if (catalogData[key] && Array.isArray(catalogData[key]) && catalogData[key].length > 0) {
                    const html = catalogData[key].map(oil => createProductCard(oil)).join('');
                    gridAfter.innerHTML = html;
                    console.log(`✅ Página de aceites ${pageNum} creada y renderizada después del intento`);
                    void gridAfter.offsetHeight;
                }
            } else {
                console.error(`❌ No se pudo crear el grid oilGrid${pageNum}`);
            }
        }
        
        // Renderizar nota si existe
        if (noteElement && catalogData.oilNotes && catalogData.oilNotes[`oilPage${pageNum}`]) {
            noteElement.textContent = catalogData.oilNotes[`oilPage${pageNum}`];
            noteElement.style.marginTop = '2rem';
            noteElement.style.padding = '1rem';
            noteElement.style.textAlign = 'center';
            noteElement.style.fontStyle = 'italic';
            noteElement.style.color = 'rgba(255, 255, 255, 0.8)';
        }
    });
    
    console.log('✅ renderOils() completado');
}

// Función para actualizar encabezado de aceites (para todas las páginas)
function updateOilsHeader() {
    // Buscar todas las páginas que contengan oil en el ID
    const allPages = document.querySelectorAll('.catalog-page');
    
    allPages.forEach(page => {
        // Verificar si esta página es de aceites
        if (page.id && page.id.startsWith('oil')) {
            const header = page.querySelector('.page-header');
            if (header) {
                // Eliminar cualquier número de página o título existente
                const pageNumber = header.querySelector('.page-number');
                const pageTitle = header.querySelector('.page-title');
                
                if (pageNumber) pageNumber.remove();
                if (pageTitle) pageTitle.remove();
                
                // Buscar si ya existe una imagen
                let img = header.querySelector('.flores-header-image');
                if (!img) {
                    img = document.createElement('img');
                    img.className = 'flores-header-image';
                    img.alt = 'Aceites Esenciales';
                    const underline = header.querySelector('.title-underline');
                    if (underline) {
                        header.insertBefore(img, underline);
                    } else {
                        header.appendChild(img);
                    }
                }
                // Actualizar siempre la imagen a aceites
                img.src = './images/catalogo/aceites-removebg-preview.png';
                img.alt = 'Aceites Esenciales';
            }
        }
    });
}


function renderPolicies() {
    const container = document.getElementById('policiesContent');
    if (container && catalogData.policies) {
        container.innerHTML = catalogData.policies.content;
    }
    
    const container2 = document.getElementById('policies2Content');
    if (container2 && catalogData.policies2) {
        container2.innerHTML = catalogData.policies2.content;
    }
}

// Modal de edición
function openModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('active');
    
    // Asegurar que catalogData esté sincronizado con localStorage antes de cargar
    const savedData = localStorage.getItem('catalogData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // Actualizar catalogData con los datos guardados
            Object.assign(catalogData, parsedData);
        } catch (error) {
            console.error('Error al cargar datos al abrir modal:', error);
        }
    }
    
    loadEditorData('products');
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.classList.remove('active');
}

function switchTab(tab) {
    currentTab = tab;
    
    // Actualizar botones de tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    // Cargar datos del tab
    loadEditorData(tab);
}

function loadEditorData(tab) {
    const editor = document.getElementById('dataEditor');
    let data;
    
    switch(tab) {
        case 'products':
            // Asegurar que catalogData tenga los datos más recientes de localStorage
            const savedData = localStorage.getItem('catalogData');
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    // Actualizar catalogData con los datos guardados antes de cargar en el editor
                    Object.keys(parsedData).forEach(key => {
                        if (key.startsWith('productsPage')) {
                            catalogData[key] = parsedData[key];
                        }
                    });
                } catch (error) {
                    console.error('Error al cargar datos guardados en loadEditorData:', error);
                }
            }
            
            // Cargar todas las páginas de productos dinámicamente
            data = {};
            // Buscar todas las propiedades que empiecen con productsPage
            Object.keys(catalogData).forEach(key => {
                if (key.startsWith('productsPage')) {
                    const pageNum = key.replace('productsPage', '');
                    data[`page${pageNum}`] = catalogData[key];
                }
            });
            // Si no hay páginas guardadas, usar las por defecto
            if (Object.keys(data).length === 0) {
                data = {
                    page1: catalogData.productsPage1 || [],
                    page2: catalogData.productsPage2 || []
                };
            }
            
            console.log('📝 Cargando datos en editor:', Object.keys(data), 'desde catalogData:', Object.keys(catalogData).filter(k => k.startsWith('productsPage')));
            break;
        case 'hash':
            // Cargar todas las páginas de hash dinámicamente (similar a products)
            const savedHashData = localStorage.getItem('catalogData');
            if (savedHashData) {
                try {
                    const parsedData = JSON.parse(savedHashData);
                    // Actualizar catalogData con los datos guardados antes de cargar en el editor
                    Object.keys(parsedData).forEach(key => {
                        if (key.startsWith('hashPage')) {
                            catalogData[key] = parsedData[key];
                        }
                        if (key === 'hashNotes') {
                            catalogData[key] = parsedData[key];
                        }
                    });
                } catch (error) {
                    console.error('Error al cargar datos guardados en loadEditorData (hash):', error);
                }
            }
            
            // Cargar todas las páginas de hash dinámicamente
            data = {};
            // Buscar todas las propiedades que empiecen con hashPage
            Object.keys(catalogData).forEach(key => {
                if (key.startsWith('hashPage')) {
                    const pageNum = key.replace('hashPage', '');
                    data[`page${pageNum}`] = catalogData[key];
                }
            });
            
            // Agregar notas si existen
            if (catalogData.hashNotes) {
                const notes = {};
                Object.keys(catalogData.hashNotes).forEach(key => {
                    const pageNum = key.replace('hashPage', '');
                    notes[`page${pageNum}`] = catalogData.hashNotes[key];
                });
                data._notes = notes;
            }
            
            // Si no hay páginas guardadas, usar las por defecto
            if (Object.keys(data).length === 0 || Object.keys(data).length === 1 && data._notes) {
                data = {
                    page1: catalogData.hashPage1 || []
                };
            }
            
            console.log('📝 Cargando datos de hash en editor:', Object.keys(data), 'desde catalogData:', Object.keys(catalogData).filter(k => k.startsWith('hashPage')));
            break;
        case 'oil':
            // Cargar todas las páginas de aceites dinámicamente (similar a products y hash)
            const savedOilData = localStorage.getItem('catalogData');
            if (savedOilData) {
                try {
                    const parsedData = JSON.parse(savedOilData);
                    // Actualizar catalogData con los datos guardados antes de cargar en el editor
                    Object.keys(parsedData).forEach(key => {
                        if (key.startsWith('oilPage')) {
                            catalogData[key] = parsedData[key];
                        }
                        if (key === 'oilNotes') {
                            catalogData[key] = parsedData[key];
                        }
                    });
                } catch (error) {
                    console.error('Error al cargar datos guardados en loadEditorData (oil):', error);
                }
            }
            
            // Cargar todas las páginas de aceites dinámicamente
            data = {};
            // Buscar todas las propiedades que empiecen con oilPage
            Object.keys(catalogData).forEach(key => {
                if (key.startsWith('oilPage')) {
                    const pageNum = key.replace('oilPage', '');
                    data[`page${pageNum}`] = catalogData[key];
                }
            });
            
            // Agregar notas si existen
            if (catalogData.oilNotes) {
                const notes = {};
                Object.keys(catalogData.oilNotes).forEach(key => {
                    const pageNum = key.replace('oilPage', '');
                    notes[`page${pageNum}`] = catalogData.oilNotes[key];
                });
                data._notes = notes;
            }
            
            // Si no hay páginas guardadas, usar las por defecto
            if (Object.keys(data).length === 0 || Object.keys(data).length === 1 && data._notes) {
                data = {
                    page1: catalogData.oilPage1 || []
                };
            }
            
            console.log('📝 Cargando datos de aceites en editor:', Object.keys(data), 'desde catalogData:', Object.keys(catalogData).filter(k => k.startsWith('oilPage')));
            break;
        case 'terms':
            data = catalogData.terms;
            break;
        case 'policies':
            data = catalogData.policies;
            break;
    }
    
    editor.value = JSON.stringify(data, null, 2);
}

function saveChanges() {
    const editor = document.getElementById('dataEditor');
    
    try {
        // Validar que el JSON sea válido
        if (!editor.value || editor.value.trim() === '') {
            showToast('Error: El editor está vacío', 'error');
            return;
        }
        
        const newData = JSON.parse(editor.value);
        console.log('📋 JSON parseado correctamente:', newData);
        
        // Actualizar datos según el tab actual
        switch(currentTab) {
            case 'products':
                // Usar la nueva función del product-manager que maneja agregar/eliminar
                if (typeof window.productManager !== 'undefined' && window.productManager.saveProductChanges) {
                    const pageCount = window.productManager.saveProductChanges(newData);
                    showToast(`✅ Cambios guardados. ${pageCount} página(s) de productos`, 'success');
                } else {
                    // Fallback al método anterior si product-manager no está cargado
                    console.log('Datos nuevos desde editor:', newData);
                    Object.keys(newData).forEach(key => {
                        if (key.startsWith('page')) {
                            const pageNum = key.replace('page', '');
                            const dataKey = `productsPage${pageNum}`;
                            catalogData[dataKey] = newData[key];
                            console.log(`✅ Guardando ${dataKey} (desde ${key}):`, newData[key]);
                        }
                    });
                    
                    localStorage.setItem('catalogData', JSON.stringify(catalogData));
                    renderProducts();
                    updatePageNumbers();
                    showToast('✅ Cambios guardados', 'success');
                }
                break;
            case 'hash':
                // Manejar hash similar a products (con páginas dinámicas)
                console.log('Guardando datos de hash desde editor:', newData);
                
                // Separar notas del objeto principal
                let notesData = null;
                if (newData._notes) {
                    notesData = newData._notes;
                    delete newData._notes;
                }
                
                // Obtener páginas actuales de hash
                const currentHashPages = Object.keys(catalogData)
                    .filter(k => k.startsWith('hashPage'))
                    .map(k => k.replace('hashPage', ''));
                
                console.log('Páginas actuales de hash:', currentHashPages);
                
                // Obtener páginas nuevas del editor
                const newHashPages = Object.keys(newData)
                    .filter(k => k.startsWith('page'))
                    .map(k => k.replace('page', ''));
                
                console.log('Páginas en editor de hash:', newHashPages);
                
                // PASO 1: Eliminar páginas que ya no existen en newData
                currentHashPages.forEach(pageNum => {
                    if (!newHashPages.includes(pageNum)) {
                        const dataKey = `hashPage${pageNum}`;
                        console.log(`🗑️ Eliminando página de hash ${pageNum} (${dataKey})`);
                        delete catalogData[dataKey];
                        // También eliminar la nota si existe
                        if (catalogData.hashNotes && catalogData.hashNotes[dataKey]) {
                            delete catalogData.hashNotes[dataKey];
                        }
                        
                        // Eliminar también la página HTML del DOM
                        const pageElement = document.getElementById(`hash${pageNum}`);
                        if (pageElement) {
                            console.log(`🗑️ Eliminando página HTML: hash${pageNum}`);
                            pageElement.remove();
                        }
                    }
                });
                
                // PASO 2: Actualizar/Agregar páginas del editor
                Object.keys(newData).forEach(key => {
                    if (key.startsWith('page')) {
                        const pageNum = key.replace('page', '');
                        const dataKey = `hashPage${pageNum}`;
                        catalogData[dataKey] = newData[key];
                        console.log(`✅ ${currentHashPages.includes(pageNum) ? 'Actualizada' : 'Agregada'} página de hash ${pageNum}:`, newData[key].length, 'productos');
                    }
                });
                
                // PASO 3: Actualizar notas si existen
                if (notesData) {
                    if (!catalogData.hashNotes) {
                        catalogData.hashNotes = {};
                    }
                    Object.keys(notesData).forEach(key => {
                        if (key.startsWith('page')) {
                            const pageNum = key.replace('page', '');
                            const noteKey = `hashPage${pageNum}`;
                            catalogData.hashNotes[noteKey] = notesData[key];
                        }
                    });
                }
                
                // PASO 4: Guardar en localStorage
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                
                // PASO 5: Re-renderizar
                console.log('🎨 Re-renderizando hash...');
                renderHash();
                updatePageNumbers();
                
                // PASO 6: Actualizar contadores
                const totalHashPages = Object.keys(catalogData)
                    .filter(k => k.startsWith('hashPage')).length;
                console.log('✅ Proceso completado. Total de páginas de hash:', totalHashPages);
                
                showToast(`✅ Cambios de hash guardados. ${totalHashPages} página(s)`, 'success');
                break;
            case 'oil':
                // Manejar aceites similar a products y hash (con páginas dinámicas)
                console.log('Guardando datos de aceites desde editor:', newData);
                
                // Separar notas del objeto principal
                let oilNotesData = null;
                if (newData._notes) {
                    oilNotesData = newData._notes;
                    delete newData._notes;
                }
                
                // Obtener páginas actuales de aceites
                const currentOilPages = Object.keys(catalogData)
                    .filter(k => k.startsWith('oilPage'))
                    .map(k => k.replace('oilPage', ''));
                
                console.log('Páginas actuales de aceites:', currentOilPages);
                
                // Obtener páginas nuevas del editor
                const newOilPages = Object.keys(newData)
                    .filter(k => k.startsWith('page'))
                    .map(k => k.replace('page', ''));
                
                console.log('Páginas en editor de aceites:', newOilPages);
                
                // PASO 1: Eliminar páginas que ya no existen en newData
                currentOilPages.forEach(pageNum => {
                    if (!newOilPages.includes(pageNum)) {
                        const dataKey = `oilPage${pageNum}`;
                        console.log(`🗑️ Eliminando página de aceites ${pageNum} (${dataKey})`);
                        delete catalogData[dataKey];
                        // También eliminar la nota si existe
                        if (catalogData.oilNotes && catalogData.oilNotes[dataKey]) {
                            delete catalogData.oilNotes[dataKey];
                        }
                        
                        // Eliminar también la página HTML del DOM
                        const pageElement = document.getElementById(`oil${pageNum}`);
                        if (pageElement) {
                            console.log(`🗑️ Eliminando página HTML: oil${pageNum}`);
                            pageElement.remove();
                        }
                    }
                });
                
                // PASO 2: Actualizar/Agregar páginas del editor
                Object.keys(newData).forEach(key => {
                    if (key.startsWith('page')) {
                        const pageNum = key.replace('page', '');
                        const dataKey = `oilPage${pageNum}`;
                        catalogData[dataKey] = newData[key];
                        console.log(`✅ ${currentOilPages.includes(pageNum) ? 'Actualizada' : 'Agregada'} página de aceites ${pageNum}:`, newData[key].length, 'productos');
                    }
                });
                
                // PASO 3: Actualizar notas si existen
                if (oilNotesData) {
                    if (!catalogData.oilNotes) {
                        catalogData.oilNotes = {};
                    }
                    Object.keys(oilNotesData).forEach(key => {
                        if (key.startsWith('page')) {
                            const pageNum = key.replace('page', '');
                            const noteKey = `oilPage${pageNum}`;
                            catalogData.oilNotes[noteKey] = oilNotesData[key];
                        }
                    });
                }
                
                // PASO 4: Guardar en localStorage
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                
                // PASO 5: Re-renderizar
                console.log('🎨 Re-renderizando aceites...');
                renderOils();
                updatePageNumbers();
                
                // PASO 6: Actualizar contadores
                const totalOilPages = Object.keys(catalogData)
                    .filter(k => k.startsWith('oilPage')).length;
                console.log('✅ Proceso completado. Total de páginas de aceites:', totalOilPages);
                
                showToast(`✅ Cambios de aceites guardados. ${totalOilPages} página(s)`, 'success');
                break;
            case 'terms':
                catalogData.terms = newData;
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderTerms();
                showToast('✅ Cambios de términos guardados', 'success');
                break;
            case 'policies':
                catalogData.policies = newData;
                localStorage.setItem('catalogData', JSON.stringify(catalogData));
                renderPolicies();
                showToast('✅ Cambios de políticas guardados', 'success');
                break;
        }
        
        // Actualizar números de página y contadores (por si cambió el número de páginas)
        updatePageNumbers();
        
        // Actualizar la vista actual con scroll suave (con re-render completo)
        refreshCurrentPageView(true);
        
        // Cerrar el modal después de guardar exitosamente
        setTimeout(() => {
            closeModal();
            // Forzar actualización adicional después de cerrar para asegurar que todo se vea
            setTimeout(() => {
                refreshCurrentPageView(false);
                // Si hay editor visual abierto, actualizarlo también
                if (window.visualEditor && window.visualEditor.state && window.visualEditor.state.currentMode === 'visual') {
                    if (typeof window.visualEditor.render === 'function') {
                        window.visualEditor.render();
                    }
                }
            }, 200);
        }, 500);
        
    } catch (error) {
        showToast('Error: Formato JSON inválido', 'error');
        console.error('Error al parsear JSON:', error);
    }
}

// Toast de notificaciones
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastMessage.textContent = message;
    
    // Cambiar icono según tipo
    if (type === 'error') {
        toast.style.borderLeftColor = '#e74c3c';
        toastIcon.innerHTML = `
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        `;
    } else {
        toast.style.borderLeftColor = 'var(--primary-color)';
        toastIcon.innerHTML = `<polyline points="20 6 9 17 4 12"/>`;
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Confirmación personalizada (reemplazo de confirm())
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const overlay = modal.querySelector('.confirm-modal-overlay');
        
        // Establecer el mensaje
        messageEl.textContent = message;
        
        // Mostrar modal
        modal.classList.add('active');
        
        // Función para manejar Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal(false);
            }
        };
        
        // Función para cerrar y resolver
        const closeModal = (result) => {
            document.removeEventListener('keydown', handleEscape);
            modal.classList.remove('active');
            resolve(result);
        };
        
        // Event listeners
        okBtn.onclick = () => closeModal(true);
        cancelBtn.onclick = () => closeModal(false);
        overlay.onclick = () => closeModal(false);
        
        // Cerrar con Escape
        document.addEventListener('keydown', handleEscape);
    });
}

// Descargar PDF - Versión simple solo portada

// Cargar datos guardados del localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('catalogData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            // Fusionar datos guardados con datos por defecto
            Object.assign(catalogData, parsedData);
            console.log('Datos guardados cargados desde localStorage:', parsedData);
        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
        }
    } else {
        console.log('No hay datos guardados en localStorage, usando datos por defecto');
    }
}

// Animación de entrada para elementos
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos animables después de que se cargue el contenido
setTimeout(() => {
    document.querySelectorAll('.product-card, .terms-card, .policies-card, .oil-card').forEach(el => {
        observer.observe(el);
    });
}, 100);

// Prevenir que las imágenes se arrastren
document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
        const allowDragZone = e.target.closest('[data-allow-image-drag]');
        if (!allowDragZone) {
            e.preventDefault();
        }
    }
});

// Smooth scroll para mejores transiciones
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Exportar funciones útiles y variables
window.catalogFunctions = {
    nextPage,
    prevPage,
    changePage,
    openModal,
    closeModal,
    showToast,
    showConfirm
};

// Exponer currentTab globalmente para que product-manager.js pueda acceder
Object.defineProperty(window, 'currentTab', {
    get: function() { return currentTab; },
    set: function(value) { currentTab = value; }
});

// Exponer showConfirm globalmente para fácil acceso
window.showConfirm = showConfirm;