// script.js - Funcionalidad del catálogo

// Variables globales
let currentPage = 1;
const totalPages = 7;
let currentTab = 'products';

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initCatalog();
    setupEventListeners();
    renderContent();
});

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
    document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
    
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
    renderProducts();
    renderHash();
    renderOils();
    renderPolicies();
}

function renderTerms() {
    const container = document.getElementById('termsContent');
    if (container && catalogData.terms) {
        container.innerHTML = catalogData.terms.content;
    }
}

function renderProducts() {
    // Página 1 de productos
    const grid1 = document.getElementById('productsGrid1');
    if (grid1 && catalogData.productsPage1) {
        grid1.innerHTML = catalogData.productsPage1.map(product => createProductCard(product)).join('');
    }
    
    // Página 2 de productos
    const grid2 = document.getElementById('productsGrid2');
    if (grid2 && catalogData.productsPage2) {
        grid2.innerHTML = catalogData.productsPage2.map(product => createProductCard(product)).join('');
    }
}

function createProductCard(product) {
    const pricesHTML = Object.entries(product.prices)
        .map(([quantity, price]) => `
            <div class="price-item">
                <span class="price-label">${quantity}</span>
                <span class="price-value">${price}</span>
            </div>
        `).join('');
    
    // Usar imagen de catalogo_body.png como fallback
    const imageUrl = product.image || './images/catalogo/catalogo_body.png';
    
    return `
        <div class="product-card">
            <img src="${imageUrl}" alt="${product.name}" class="product-image" 
                 onerror="this.src='./images/catalogo/catalogo_body.png'; this.onerror=null;">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-strain">${product.strain}</p>
                <div class="product-prices">
                    ${pricesHTML}
                </div>
            </div>
        </div>
    `;
}

function renderHash() {
    const hashImagesContainer = document.getElementById('hashImages');
    const hashTitle = document.getElementById('hashTitle');
    const hashPrices = document.getElementById('hashPrices');
    const hashNote = document.getElementById('hashNote');
    
    if (catalogData.hash) {
        // Renderizar imágenes
        if (hashImagesContainer) {
            hashImagesContainer.innerHTML = catalogData.hash.images
                .map(img => `<img src="${img}" alt="Hash" class="hash-image" 
                            onerror="this.src='./images/catalogo/catalogo_body.png'; this.onerror=null;">`)
                .join('');
        }
        
        // Título
        if (hashTitle) {
            hashTitle.textContent = catalogData.hash.title;
        }
        
        // Precios
        if (hashPrices) {
            hashPrices.innerHTML = Object.entries(catalogData.hash.prices)
                .map(([quantity, price]) => `
                    <div class="hash-price-item">
                        <span class="hash-price-label">${quantity}</span>
                        <span class="hash-price-value">${price}</span>
                    </div>
                `).join('');
        }
        
        // Nota
        if (hashNote) {
            hashNote.textContent = catalogData.hash.note;
        }
    }
}

function renderOils() {
    const container = document.getElementById('oilContent');
    if (container && catalogData.oils) {
        container.innerHTML = catalogData.oils.map(oil => createOilCard(oil)).join('');
    }
}

function createOilCard(oil) {
    const pricesHTML = Object.entries(oil.prices)
        .map(([size, price]) => `
            <div class="oil-price-tag">
                <span>${size}: ${price}</span>
            </div>
        `).join('');
    
    return `
        <div class="oil-card">
            <img src="${oil.image}" alt="${oil.name}" class="oil-image"
                 onerror="this.src='./images/catalogo/catalogo_body.png'; this.onerror=null;">
            <div class="oil-info">
                <h3>${oil.name}</h3>
                <p class="oil-description">${oil.description}</p>
                <p><strong>Concentración:</strong> ${oil.concentration}</p>
                <div class="oil-prices">
                    ${pricesHTML}
                </div>
            </div>
        </div>
    `;
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
            data = {
                page1: catalogData.productsPage1,
                page2: catalogData.productsPage2
            };
            break;
        case 'hash':
            data = catalogData.hash;
            break;
        case 'oil':
            data = catalogData.oils;
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
        const newData = JSON.parse(editor.value);
        
        // Actualizar datos según el tab actual
        switch(currentTab) {
            case 'products':
                catalogData.productsPage1 = newData.page1;
                catalogData.productsPage2 = newData.page2;
                renderProducts();
                break;
            case 'hash':
                catalogData.hash = newData;
                renderHash();
                break;
            case 'oil':
                catalogData.oils = newData;
                renderOils();
                break;
            case 'terms':
                catalogData.terms = newData;
                renderTerms();
                break;
            case 'policies':
                catalogData.policies = newData;
                renderPolicies();
                break;
        }
        
        showToast('Cambios guardados exitosamente');
        closeModal();
        
        // Guardar en localStorage
        localStorage.setItem('catalogData', JSON.stringify(catalogData));
        
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

// Crear layout plano para PDF sin scroll
function createFlatLayoutForPDF() {
    const pages = document.querySelectorAll('.catalog-page');
    const pagesData = [];
    
    pages.forEach((page, index) => {
        // Extraer información de la página
        const scrollContainer = page.querySelector('.page-scroll-container');
        const coverContent = page.querySelector('.cover-content');
        const background = page.querySelector('.page-background, .products-background, .cover-background .cover-image');
        
        let content = null;
        if (scrollContainer) {
            content = scrollContainer.cloneNode(true);
        } else if (coverContent) {
            // Portada sin scroll container
            content = coverContent.cloneNode(true);
        }
        
        if (content) {
            pagesData.push({
                background: background ? background.style.backgroundImage : null,
                content: content
            });
        }
    });
    
    return pagesData;
}

// Crear contenedor temporal para PDF
function createPDFContainer(pagesData) {
    const container = document.createElement('div');
    container.id = 'pdf-container-temp';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#1a1a2e';
    container.style.position = 'relative';
    
    pagesData.forEach((pageData, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.style.position = 'relative';
        pageDiv.style.width = '100%';
        pageDiv.style.minHeight = '297mm'; // A4 height
        pageDiv.style.marginBottom = '10px';
        pageDiv.style.pageBreakAfter = 'always';
        pageDiv.style.backgroundColor = '#1a1a2e';
        pageDiv.style.boxSizing = 'border-box';
        
        // Agregar imagen de fondo
        if (pageData.background) {
            const bgDiv = document.createElement('div');
            bgDiv.className = 'pdf-page-background';
            bgDiv.style.position = 'absolute';
            bgDiv.style.top = '0';
            bgDiv.style.left = '0';
            bgDiv.style.width = '100%';
            bgDiv.style.height = '100%';
            bgDiv.style.backgroundImage = pageData.background;
            bgDiv.style.backgroundSize = 'cover';
            bgDiv.style.backgroundPosition = 'center center';
            bgDiv.style.filter = 'brightness(0.4)';
            bgDiv.style.zIndex = '0';
            pageDiv.appendChild(bgDiv);
        }
        
        // Agregar contenido
        const contentDiv = pageData.content.cloneNode(true);
        contentDiv.style.position = 'relative';
        contentDiv.style.zIndex = '1';
        contentDiv.style.height = 'auto';
        contentDiv.style.maxHeight = 'none';
        contentDiv.style.overflow = 'visible';
        contentDiv.style.padding = '60px';
        contentDiv.style.boxSizing = 'border-box';
        pageDiv.appendChild(contentDiv);
        
        container.appendChild(pageDiv);
    });
    
    document.body.appendChild(container);
    return container;
}

// Limpiar contenedor temporal
function cleanupPDFContainer() {
    const tempContainer = document.getElementById('pdf-container-temp');
    if (tempContainer) {
        tempContainer.remove();
    }
}

// Descargar PDF
async function downloadPDF() {
    showToast('Preparando contenido para PDF...', 'info');
    
    try {
        // Ocultar navegación
        const nav = document.querySelector('.floating-nav');
        const scrollIndicators = document.querySelectorAll('.scroll-indicator');
        nav.style.display = 'none';
        scrollIndicators.forEach(indicator => indicator.style.display = 'none');
        
        // Preparar todas las páginas mostrándolas y expandiendo scroll
        const pages = document.querySelectorAll('.catalog-page');
        const scrollContainers = document.querySelectorAll('.page-scroll-container');
        
        // Guardar estados originales
        const originalStates = [];
        pages.forEach(page => {
            originalStates.push({
                display: page.style.display,
                opacity: page.style.opacity,
                transform: page.style.transform
            });
        });
        
        // Expandir y mostrar todas las páginas
        pages.forEach(page => {
            page.style.display = 'block';
            page.style.opacity = '1';
            page.style.transform = 'none';
            page.style.position = 'relative';
            page.style.height = 'auto';
            page.style.overflow = 'visible';
        });
        
        scrollContainers.forEach(container => {
            container.style.height = 'auto';
            container.style.maxHeight = 'none';
            container.style.overflow = 'visible';
        });
        
        // Esperar a que se renderice
        await new Promise(resolve => setTimeout(resolve, 300));
        
        showToast('Generando PDF...', 'info');
        
        // Configuración de html2pdf
        const opt = {
            margin: 0,
            filename: 'catalogo-apexremedy-2025.pdf',
            image: { 
                type: 'jpeg', 
                quality: 0.98
            },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: true,
                letterRendering: true,
                backgroundColor: '#1a1a2e',
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait'
            },
            pagebreak: { 
                mode: 'avoid-all'
            }
        };
        
        // Generar PDF desde el contenedor original
        const catalogContainer = document.getElementById('catalogContainer');
        await html2pdf().set(opt).from(catalogContainer).save();
        
        // Restaurar estados
        pages.forEach((page, index) => {
            if (originalStates[index]) {
                page.style.display = originalStates[index].display || '';
                page.style.opacity = originalStates[index].opacity || '';
                page.style.transform = originalStates[index].transform || '';
                page.style.position = '';
                page.style.height = '';
                page.style.overflow = '';
            }
        });
        
        scrollContainers.forEach(container => {
            container.style.height = '';
            container.style.maxHeight = '';
            container.style.overflow = '';
        });
        
        // Restaurar navegación
        nav.style.display = '';
        scrollIndicators.forEach(indicator => indicator.style.display = '');
        
        showToast('PDF descargado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar PDF: ' + error.message, 'error');
        
        // Restaurar navegación
        const nav = document.querySelector('.floating-nav');
        const scrollIndicators = document.querySelectorAll('.scroll-indicator');
        nav.style.display = '';
        scrollIndicators.forEach(indicator => indicator.style.display = '');
    }
}

// Cargar datos guardados del localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('catalogData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            Object.assign(catalogData, parsedData);
            renderContent();
        } catch (error) {
            console.error('Error al cargar datos guardados:', error);
        }
    }
}

// Cargar datos guardados al iniciar
loadSavedData();

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
        e.preventDefault();
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

// Exportar funciones útiles
window.catalogFunctions = {
    nextPage,
    prevPage,
    changePage,
    openModal,
    closeModal,
    downloadPDF,
    showToast
};