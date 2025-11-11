// visual-editor.js - Sistema de Edición Visual Mejorado

/**
 * Estado del editor visual
 */
const visualEditorState = {
    currentMode: 'visual', // 'visual' o 'json'
    currentTab: 'products', // tab activo
    currentPage: 1, // página actual siendo editada
    editedData: null, // datos en edición
    isDirty: false // cambios sin guardar
};

const DEFAULT_CATALOG_IMAGE = './images/catalogo/catalogo_body.png';
const MAX_IMAGE_UPLOAD_MB = 5;

/**
 * Inicializar el editor visual
 */
function initVisualEditor() {
    console.log('🎨 Inicializando Editor Visual...');
    
    // Event listeners para cambio de modo
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => switchEditorMode(btn.dataset.mode));
    });
    
    // Event listeners para toolbar visual
    document.getElementById('addItemBtn')?.addEventListener('click', addItemVisual);
    document.getElementById('addPageBtnVisual')?.addEventListener('click', addPageVisual);
    document.getElementById('deletePageBtnVisual')?.addEventListener('click', deletePageVisual);
    
    // Event listener para cambio de página
    document.getElementById('pageSelector')?.addEventListener('change', (e) => {
        visualEditorState.currentPage = parseInt(e.target.value);
        renderVisualEditor();
    });
    
    console.log('✅ Editor Visual inicializado');
}

/**
 * Cambiar entre modo Visual y JSON
 */
function switchEditorMode(mode) {
    visualEditorState.currentMode = mode;
    
    // Update UI buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide editors
    const visualEditor = document.getElementById('visualEditor');
    const jsonEditor = document.getElementById('jsonEditor');
    
    if (mode === 'visual') {
        visualEditor.style.display = 'block';
        jsonEditor.style.display = 'none';
        renderVisualEditor();
    } else {
        visualEditor.style.display = 'none';
        jsonEditor.style.display = 'block';
        // El editor JSON ya se renderiza con el tab change
    }
}

/**
 * Renderizar el editor visual según el tab activo
 */
function renderVisualEditor() {
    const tab = visualEditorState.currentTab;
    const content = document.getElementById('visualContent');
    const toolbar = document.getElementById('visualToolbar');
    const itemTypeSpan = document.getElementById('itemType');
    
    // Obtener datos actuales del tab
    let data = getTabData(tab);
    
    if (!data) {
        content.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><h3>No hay datos</h3><p>Selecciona otro tab o agrega contenido nuevo</p></div>';
        toolbar.style.display = 'none';
        return;
    }
    
    // Mostrar/ocultar toolbar según tipo de contenido
    if (tab === 'products' || tab === 'hash' || tab === 'oil') {
        toolbar.style.display = 'flex';
        itemTypeSpan.textContent = tab === 'oil' ? 'Aceite' : (tab === 'hash' ? 'Hash' : 'Producto');
        
        // Render page selector
        renderPageSelector(tab);
        
        // Render items de la página actual
        renderProductItems(data, tab);
    } else if (tab === 'terms' || tab === 'policies') {
        toolbar.style.display = 'none';
        renderContentEditor(data, tab);
    } else {
        toolbar.style.display = 'none';
        content.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><h3>Tab no soportado</h3></div>';
    }
}

/**
 * Obtener datos del tab actual
 */
function getTabData(tab) {
    if (tab === 'products') {
        return getProductsData();
    } else if (tab === 'hash') {
        return getHashData();
    } else if (tab === 'oil') {
        return getOilData();
    } else if (tab === 'terms') {
        return catalogData.terms;
    } else if (tab === 'policies') {
        return { policies: catalogData.policies, policies2: catalogData.policies2 };
    }
    return null;
}

/**
 * Obtener datos de productos organizados por página
 */
function getProductsData() {
    const pages = {};
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('productsPage')) {
            const pageNum = parseInt(key.replace('productsPage', ''));
            pages[pageNum] = catalogData[key];
        }
    });
    return pages;
}

/**
 * Obtener datos de hash organizados por página
 */
function getHashData() {
    const pages = {};
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('hashPage')) {
            const pageNum = parseInt(key.replace('hashPage', ''));
            pages[pageNum] = catalogData[key];
        }
    });
    return pages;
}

function getOilData() {
    const pages = {};
    Object.keys(catalogData).forEach(key => {
        if (key.startsWith('oilPage')) {
            const pageNum = parseInt(key.replace('oilPage', ''));
            pages[pageNum] = catalogData[key];
        }
    });
    return pages;
}

/**
 * Renderizar selector de páginas
 */
function renderPageSelector(tab) {
    const selector = document.getElementById('pageSelector');
    let data = null;
    if (tab === 'products') {
        data = getProductsData();
    } else if (tab === 'hash') {
        data = getHashData();
    } else if (tab === 'oil') {
        data = getOilData();
    }
    
    if (!data || Object.keys(data).length === 0) {
        selector.innerHTML = '';
        return;
    }
    
    const pages = Object.keys(data).sort((a, b) => a - b);
    
    selector.innerHTML = `
        <label>Página:</label>
        <select id="pageSelect">
            ${pages.map(page => `<option value="${page}" ${page == visualEditorState.currentPage ? 'selected' : ''}>Página ${page}</option>`).join('')}
        </select>
    `;
    
    // Re-attach event listener
    document.getElementById('pageSelect')?.addEventListener('change', (e) => {
        visualEditorState.currentPage = parseInt(e.target.value);
        renderVisualEditor();
    });
}

/**
 * Renderizar items de productos/hash/aceites
 */
function renderProductItems(data, tab) {
    const content = document.getElementById('visualContent');
    let currentPage = visualEditorState.currentPage;
    
    // Si la página actual no existe en los datos, usar la primera página disponible
    if (!data[currentPage] || !Array.isArray(data[currentPage])) {
        const availablePages = Object.keys(data).map(p => parseInt(p)).sort((a, b) => a - b);
        if (availablePages.length > 0) {
            currentPage = availablePages[0];
            visualEditorState.currentPage = currentPage;
            // Actualizar el selector manualmente sin recargar todo
            const pageSelect = document.getElementById('pageSelect');
            if (pageSelect) {
                pageSelect.value = currentPage;
            }
        } else {
            // No hay páginas disponibles
            content.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="9" y1="9" x2="15" y2="9"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                    <h3>No hay ${tab === 'oil' ? 'aceites' : 'productos'} en esta página</h3>
                    <p>Haz clic en "Agregar ${tab === 'oil' ? 'Aceite' : 'Producto'}" para comenzar</p>
                </div>
            `;
            return;
        }
    }
    
    const items = data[currentPage] || [];
    
    // Verificar que items sea un array
    if (!Array.isArray(items)) {
        console.error('Items no es un array:', items, 'data:', data);
        content.innerHTML = '<div class="empty-state"><h3>Error: Datos inválidos</h3><p>Los datos no tienen el formato esperado.</p></div>';
        return;
    }
    
    if (items.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <line x1="9" y1="9" x2="15" y2="9"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <h3>No hay ${tab === 'oil' ? 'aceites' : 'productos'} en esta página</h3>
                <p>Haz clic en "Agregar ${tab === 'oil' ? 'Aceite' : 'Producto'}" para comenzar</p>
            </div>
        `;
        return;
    }
    
    content.innerHTML = items.map((item, index) => createItemCard(item, index, tab)).join('');
    
    // Attach event listeners
    attachItemEventListeners(tab);
}

/**
 * Crear tarjeta de edición para un item
 */
function createItemCard(item, index, tab) {
    if (tab === 'oil') {
        return `
            <div class="edit-card" data-index="${index}">
                <div class="edit-card-header">
                    <div class="edit-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                        Aceite ${index + 1}
                    </div>
                    <div class="edit-card-actions">
                        <button class="card-action-btn duplicate" data-action="duplicate" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                        <button class="card-action-btn delete" data-action="delete" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <form class="edit-form" data-index="${index}">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" name="name" value="${escapeHtml(item.name)}" placeholder="Nombre del aceite">
                    </div>
                    <div class="form-group">
                        <label>Strain / Tipo</label>
                        <input type="text" name="strain" value="${escapeHtml(item.strain || '')}" placeholder="Ej: 120 a 73 Micrones">
                    </div>
                    <div class="form-group">
                        <label>Concentración</label>
                        <input type="text" name="concentration" value="${escapeHtml(item.concentration || '')}" placeholder="Ej: 5000 mg. CBD por 30 ml.">
                    </div>
                    ${renderImageField(item, index)}
                    <div class="form-group">
                        <label>Precios (en ml)</label>
                        <div class="prices-grid">
                            ${(() => {
                                // Si no hay precios o están vacíos, usar template por defecto con ml
                                const prices = item.prices || {};
                                const defaultPrices = { "10ml": "", "30ml": "", "50ml": "" };
                                const pricesToShow = Object.keys(prices).length > 0 ? prices : defaultPrices;
                                return Object.entries(pricesToShow).map(([size, price]) => `
                                    <div class="price-input-group">
                                        <label>${size}</label>
                                        <div class="price-input-wrapper">
                                            <span class="price-currency">$</span>
                                            <input type="text" name="price_${size}" value="${(price || '').toString().replace('$', '')}" placeholder="0">
                                        </div>
                                    </div>
                                `).join('');
                            })()}
                        </div>
                    </div>
                </form>
            </div>
        `;
    } else {
        // Productos y Hash
        return `
            <div class="edit-card" data-index="${index}">
                <div class="edit-card-header">
                    <div class="edit-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 7h-9M14 17H5M21 12h-8"/>
                        </svg>
                        ${tab === 'hash' ? 'Hash' : 'Producto'} ${index + 1}
                    </div>
                    <div class="edit-card-actions">
                        <button class="card-action-btn duplicate" data-action="duplicate" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                        <button class="card-action-btn delete" data-action="delete" data-index="${index}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <form class="edit-form" data-index="${index}">
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" name="name" value="${escapeHtml(item.name)}" placeholder="Nombre del producto">
                    </div>
                    <div class="form-group">
                        <label>Cepa / Tipo</label>
                        <input type="text" name="strain" value="${escapeHtml(item.strain)}" placeholder="Tipo de cepa">
                    </div>
                    ${renderImageField(item, index)}
                    <div class="form-group">
                        <label>Precios</label>
                        <div class="prices-grid">
                            ${Object.entries(item.prices || {}).map(([size, price]) => `
                                <div class="price-input-group">
                                    <label>${size}</label>
                                    <div class="price-input-wrapper">
                                        <span class="price-currency">$</span>
                                        <input type="text" name="price_${size}" value="${price.replace('$', '')}" placeholder="0">
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </form>
            </div>
        `;
    }
}

/**
 * Renderizar editor de contenido HTML (términos y políticas)
 */
function renderContentEditor(data, tab) {
    const content = document.getElementById('visualContent');
    
    if (tab === 'terms') {
        content.innerHTML = `
            <div class="edit-card">
                <div class="edit-card-header">
                    <div class="edit-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Términos y Condiciones
                    </div>
                </div>
                <form class="edit-form" data-type="terms">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" name="title" value="${escapeHtml(data.title)}" placeholder="Título de la sección">
                    </div>
                    <div class="form-group html-editor-container">
                        <label>Contenido (HTML)</label>
                        <textarea class="html-editor" name="content" placeholder="Contenido en HTML...">${escapeHtml(data.content)}</textarea>
                        <div class="html-preview" id="termsPreview"></div>
                    </div>
                </form>
            </div>
        `;
        
        // Update preview
        document.getElementById('termsPreview').innerHTML = data.content;
        
        // Add live preview
        const editor = document.querySelector('[name="content"]');
        editor?.addEventListener('input', (e) => {
            document.getElementById('termsPreview').innerHTML = e.target.value;
        });
        
    } else if (tab === 'policies') {
        content.innerHTML = `
            <div class="edit-card">
                <div class="edit-card-header">
                    <div class="edit-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Políticas Generales - Parte 1
                    </div>
                </div>
                <form class="edit-form" data-type="policies">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" name="title" value="${escapeHtml(data.policies.title)}" placeholder="Título de la sección">
                    </div>
                    <div class="form-group html-editor-container">
                        <label>Contenido (HTML)</label>
                        <textarea class="html-editor" name="content" placeholder="Contenido en HTML...">${escapeHtml(data.policies.content)}</textarea>
                        <div class="html-preview" id="policies1Preview"></div>
                    </div>
                </form>
            </div>
            
            <div class="edit-card">
                <div class="edit-card-header">
                    <div class="edit-card-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Políticas Generales - Parte 2
                    </div>
                </div>
                <form class="edit-form" data-type="policies2">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" name="title2" value="${escapeHtml(data.policies2.title)}" placeholder="Título de la sección">
                    </div>
                    <div class="form-group html-editor-container">
                        <label>Contenido (HTML)</label>
                        <textarea class="html-editor" name="content2" placeholder="Contenido en HTML...">${escapeHtml(data.policies2.content)}</textarea>
                        <div class="html-preview" id="policies2Preview"></div>
                    </div>
                </form>
            </div>
        `;
        
        // Update previews
        document.getElementById('policies1Preview').innerHTML = data.policies.content;
        document.getElementById('policies2Preview').innerHTML = data.policies2.content;
        
        // Add live preview
        document.querySelector('[name="content"]')?.addEventListener('input', (e) => {
            document.getElementById('policies1Preview').innerHTML = e.target.value;
        });
        document.querySelector('[name="content2"]')?.addEventListener('input', (e) => {
            document.getElementById('policies2Preview').innerHTML = e.target.value;
        });
    }
}

function renderImageField(item, index) {
    const imageValue = item.image || '';
    const isDataUrl = imageValue.startsWith('data:');
    const previewSrc = imageValue ? imageValue : DEFAULT_CATALOG_IMAGE;
    const urlValue = isDataUrl ? '' : imageValue;
    const dataValue = isDataUrl ? imageValue : '';
    const fileLabel = isDataUrl ? 'Imagen adjunta' : '';
    
    return `
        <div class="form-group image-upload-group">
            <label>Imagen</label>
            <div class="image-upload-wrapper" data-placeholder="${escapeHtml(DEFAULT_CATALOG_IMAGE)}">
                <div class="image-dropzone">
                    <img src="${escapeHtml(previewSrc)}" alt="Vista previa" class="image-preview">
                </div>
                <div class="image-upload-actions">
                    <input type="text" name="image" value="${escapeHtml(urlValue)}" placeholder="./images/catalogo/...">
                    <input type="hidden" name="image_data" value="${escapeHtml(dataValue)}">
                    <input type="file" accept="image/*" class="image-file-input" hidden>
                    <div class="image-actions">
                        <button type="button" class="image-upload-btn">
                            <i class="fas fa-upload"></i> Subir desde tu dispositivo
                        </button>
                        <button type="button" class="image-clear-btn">
                            <i class="fas fa-times"></i> Quitar imagen
                        </button>
                    </div>
                    <p class="image-upload-hint">Arrastra una imagen aquí o pega una URL pública.</p>
                    <p class="image-file-name">${fileLabel}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Adjuntar event listeners a los items
 */
function attachItemEventListeners(tab) {
    // Event listeners para formularios (auto-save)
    const forms = document.querySelectorAll('.edit-form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => saveItemChanges(form, tab));
            input.addEventListener('blur', () => saveItemChanges(form, tab));
        });
        
        setupImageUpload(form, tab);
    });
    
    // Event listeners para botones de acción
    const actionBtns = document.querySelectorAll('.card-action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            const index = parseInt(btn.dataset.index);
            
            if (action === 'delete') {
                deleteItem(index, tab);
            } else if (action === 'duplicate') {
                duplicateItem(index, tab);
            }
        });
    });
}

function setupImageUpload(form, tab) {
    if (!form || form.dataset.index === undefined) {
        return;
    }
    
    const wrapper = form.querySelector('.image-upload-wrapper');
    if (!wrapper) {
        return;
    }
    
    const dropzone = wrapper.querySelector('.image-dropzone');
    const fileInput = wrapper.querySelector('.image-file-input');
    const uploadBtn = wrapper.querySelector('.image-upload-btn');
    const clearBtn = wrapper.querySelector('.image-clear-btn');
    const urlInput = wrapper.querySelector('input[name="image"]');
    const dataInput = wrapper.querySelector('input[name="image_data"]');
    const previewImg = wrapper.querySelector('.image-preview');
    const fileNameEl = wrapper.querySelector('.image-file-name');
    const placeholder = wrapper.dataset.placeholder || DEFAULT_CATALOG_IMAGE;
    
    const applyImage = (src, source, meta = {}) => {
        if (!previewImg) return;
        
        if (source === 'file') {
            previewImg.src = src;
            if (dataInput) dataInput.value = src;
            if (urlInput) urlInput.value = '';
            if (fileNameEl) {
                const fileText = meta.name ? `${meta.name} · ${formatFileSize(meta.size)}` : 'Imagen adjunta';
                fileNameEl.textContent = fileText;
            }
        } else if (source === 'url') {
            previewImg.src = src || placeholder;
            if (dataInput) dataInput.value = '';
            if (urlInput) urlInput.value = src;
            if (fileNameEl) fileNameEl.textContent = '';
        } else if (source === 'clear') {
            previewImg.src = placeholder;
            if (dataInput) dataInput.value = '';
            if (urlInput) urlInput.value = '';
            if (fileNameEl) fileNameEl.textContent = '';
        }
        
        previewImg.onerror = () => {
            showToast('No se pudo cargar la imagen seleccionada.', 'error');
            previewImg.onerror = null;
            previewImg.src = placeholder;
        };
        
        saveItemChanges(form, tab);
    };
    
    const handleFileList = (fileList) => {
        if (!fileList || !fileList.length) return;
        const file = fileList[0];
        
        if (!file.type.startsWith('image/')) {
            showToast('Formato no soportado. Selecciona un archivo de imagen.', 'error');
            return;
        }
        
        if (file.size > MAX_IMAGE_UPLOAD_MB * 1024 * 1024) {
            showToast(`La imagen es demasiado pesada (máximo ${MAX_IMAGE_UPLOAD_MB} MB).`, 'error');
            return;
        }
        
        readImageFile(file)
            .then((dataUrl) => {
                applyImage(dataUrl, 'file', { name: file.name, size: file.size });
            })
            .catch(() => {
                showToast('Ocurrió un error al leer el archivo.', 'error');
            });
    };
    
    uploadBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput?.click();
    });
    
    dropzone?.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput?.click();
    });
    
    fileInput?.addEventListener('change', (e) => {
        handleFileList(e.target.files);
        fileInput.value = '';
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('is-dragover');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone?.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('is-dragover');
        });
    });
    
    dropzone?.addEventListener('drop', (e) => {
        handleFileList(e.dataTransfer.files);
    });
    
    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        applyImage('', 'clear');
    });
    
    if (urlInput) {
        const applyUrl = () => {
            const value = urlInput.value.trim();
            if (value) {
                applyImage(value, 'url');
            } else if (!dataInput?.value) {
                applyImage('', 'clear');
            } else {
                saveItemChanges(form, tab);
            }
        };
        
        urlInput.addEventListener('change', applyUrl);
        urlInput.addEventListener('blur', applyUrl);
        urlInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                applyUrl();
            }
        });
    }
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Guardar cambios de un item
 */
function saveItemChanges(form, tab) {
    const formData = new FormData(form);
    const index = parseInt(form.dataset.index);
    const type = form.dataset.type;
    
    if (type === 'terms') {
        catalogData.terms.title = formData.get('title');
        catalogData.terms.content = formData.get('content');
    } else if (type === 'policies') {
        catalogData.policies.title = formData.get('title');
        catalogData.policies.content = formData.get('content');
    } else if (type === 'policies2') {
        catalogData.policies2.title = formData.get('title2');
        catalogData.policies2.content = formData.get('content2');
    } else {
        // Products, hash, oil
        const item = {};
        
        // Campos básicos
        item.name = formData.get('name') || '';
        item.strain = formData.get('strain') || '';
        const dataImage = formData.get('image_data') || '';
        let imageValue = dataImage || (formData.get('image') || '').trim();
        if (!imageValue) {
            imageValue = DEFAULT_CATALOG_IMAGE;
        }
        item.image = imageValue;
        
        if (tab === 'oil') {
            item.concentration = formData.get('concentration') || '';
        }
        
        // Precios
        item.prices = {};
        for (let [key, value] of formData.entries()) {
            if (key.startsWith('price_')) {
                const size = key.replace('price_', '');
                item.prices[size] = '$' + value;
            }
        }
        
        // Guardar en catalogData
        const currentPage = visualEditorState.currentPage;
        if (tab === 'oil') {
            const dataKey = `oilPage${currentPage}`;
            if (!catalogData[dataKey]) catalogData[dataKey] = [];
            catalogData[dataKey][index] = item;
        } else {
            const dataKey = tab === 'products' ? `productsPage${currentPage}` : `hashPage${currentPage}`;
            catalogData[dataKey][index] = item;
        }
    }
    
    visualEditorState.isDirty = true;
    console.log('✏️ Item actualizado:', { tab, index: index || type });
}

/**
 * Eliminar un item
 */
async function deleteItem(index, tab) {
    const confirmed = await showConfirm('¿Estás seguro de eliminar este elemento?');
    if (!confirmed) return;
    
    const currentPage = visualEditorState.currentPage;
    if (tab === 'oil') {
        const dataKey = `oilPage${currentPage}`;
        if (catalogData[dataKey]) {
            catalogData[dataKey].splice(index, 1);
        }
    } else {
        const dataKey = tab === 'products' ? `productsPage${currentPage}` : `hashPage${currentPage}`;
        catalogData[dataKey].splice(index, 1);
    }
    
    visualEditorState.isDirty = true;
    renderVisualEditor();
    showToast('✅ Elemento eliminado', 'success');
}

/**
 * Duplicar un item
 */
function duplicateItem(index, tab) {
    let item;
    
    const currentPage = visualEditorState.currentPage;
    if (tab === 'oil') {
        const dataKey = `oilPage${currentPage}`;
        if (catalogData[dataKey] && catalogData[dataKey][index]) {
            item = JSON.parse(JSON.stringify(catalogData[dataKey][index]));
            item.name += ' (Copia)';
            catalogData[dataKey].push(item);
        }
    } else {
        const dataKey = tab === 'products' ? `productsPage${currentPage}` : `hashPage${currentPage}`;
        item = JSON.parse(JSON.stringify(catalogData[dataKey][index]));
        item.name += ' (Copia)';
        catalogData[dataKey].push(item);
    }
    
    visualEditorState.isDirty = true;
    renderVisualEditor();
    showToast('✅ Elemento duplicado', 'success');
}

/**
 * Agregar nuevo item visual
 */
function addItemVisual() {
    const tab = visualEditorState.currentTab;
    
    let newItem;
    if (tab === 'oil') {
        newItem = {
            name: "Aceite CBD Full Spectrum",
            strain: "120 a 73 Micrones",
            concentration: "5000 mg. CBD por 30 ml.",
            image: "images/catalogo/placeholder.jpg",
            prices: {
                "10ml": "$0",
                "30ml": "$0",
                "50ml": "$0"
            }
        };
        const currentPage = visualEditorState.currentPage;
        const dataKey = `oilPage${currentPage}`;
        if (!catalogData[dataKey]) catalogData[dataKey] = [];
        catalogData[dataKey].push(newItem);
    } else if (tab === 'hash') {
        newItem = {
            name: "Rive Rosin",
            strain: "Micrones",
            image: "images/catalogo/placeholder.jpg",
            prices: {
                "0.5gr": "$0",
                "1gr": "$0",
                "2grs": "$0"
            }
        };
        const currentPage = visualEditorState.currentPage;
        const dataKey = `hashPage${currentPage}`;
        if (!catalogData[dataKey]) catalogData[dataKey] = [];
        catalogData[dataKey].push(newItem);
    } else {
        newItem = {
            name: "Nuevo Producto",
            strain: "Tipo de cepa",
            image: "./images/catalogo/placeholder.jpg",
            prices: {
                "1g": "$0",
                "3.5g": "$0",
                "7g": "$0",
                "14g": "$0"
            }
        };
        const currentPage = visualEditorState.currentPage;
        const dataKey = `productsPage${currentPage}`;
        if (!catalogData[dataKey]) catalogData[dataKey] = [];
        catalogData[dataKey].push(newItem);
    }
    
    visualEditorState.isDirty = true;
    renderVisualEditor();
    showToast('✅ Elemento agregado', 'success');
    
    // Scroll al final
    const content = document.getElementById('visualContent');
    setTimeout(() => content.scrollTop = content.scrollHeight, 100);
}

/**
 * Agregar nueva página visual
 */
function addPageVisual() {
    const tab = visualEditorState.currentTab;
    
    let data, dataKey, nextPage;
    
    if (tab === 'products') {
        data = getProductsData();
        const pageNumbers = Object.keys(data).map(n => parseInt(n));
        nextPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;
        dataKey = `productsPage${nextPage}`;
        catalogData[dataKey] = [{
            name: "Nuevo Producto",
            strain: "Tipo de cepa",
            image: "./images/catalogo/placeholder.jpg",
            prices: {
                "1g": "$0",
                "3.5g": "$0",
                "7g": "$0",
                "14g": "$0"
            }
        }];
    } else if (tab === 'hash') {
        data = getHashData();
        const pageNumbers = Object.keys(data).map(n => parseInt(n));
        nextPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;
        dataKey = `hashPage${nextPage}`;
        catalogData[dataKey] = [{
            name: "Live Rosin",
            strain: "120 a 73 Micrones",
            image: "images/catalogo/placeholder.jpg",
            prices: {
                "0.5gr": "$40.000",
                "1gr": "$70.000",
                "2grs": "$130.000"
            }
        }];
    } else if (tab === 'oil') {
        data = getOilData();
        const pageNumbers = Object.keys(data).map(n => parseInt(n));
        nextPage = pageNumbers.length > 0 ? Math.max(...pageNumbers) + 1 : 1;
        dataKey = `oilPage${nextPage}`;
        catalogData[dataKey] = [{
            name: "Aceite CBD Full Spectrum",
            strain: "120 a 73 Micrones",
            concentration: "5000 mg. CBD por 30 ml.",
            image: "images/catalogo/placeholder.jpg",
            prices: {
                "10ml": "$40.000",
                "30ml": "$70.000",
                "50ml": "$130.000"
            }
        }];
        // Agregar nota para la nueva página de aceites
        if (!catalogData.oilNotes) {
            catalogData.oilNotes = {};
        }
        catalogData.oilNotes[dataKey] = "Aceite de CBD de espectro completo, ayuda con el dolor crónico, ansiedad e insomnio.";
    } else {
        catalogData[dataKey] = [{
            name: "Producto Ejemplo",
            strain: "Tipo de cepa",
            image: "./images/catalogo/placeholder.jpg",
            prices: {
                "1g": "$15.000",
                "3.5g": "$45.000",
                "7g": "$85.000",
                "14g": "$160.000"
            }
        }];
    }
    
    visualEditorState.currentPage = nextPage;
    visualEditorState.isDirty = true;
    renderVisualEditor();
    showToast(`✅ Página ${nextPage} creada`, 'success');
}

/**
 * Eliminar página visual
 */
async function deletePageVisual() {
    const tab = visualEditorState.currentTab;
    
    // Validar que sea un tab que tenga páginas
    if (tab !== 'products' && tab !== 'hash' && tab !== 'oil') {
        showToast('❌ Esta sección no tiene páginas para eliminar', 'error');
        return;
    }
    
    const currentPage = visualEditorState.currentPage;
    let data, dataKey, noteKey;
    
    if (tab === 'products') {
        data = getProductsData();
        dataKey = `productsPage${currentPage}`;
    } else if (tab === 'hash') {
        data = getHashData();
        dataKey = `hashPage${currentPage}`;
        noteKey = dataKey;
    } else if (tab === 'oil') {
        data = getOilData();
        dataKey = `oilPage${currentPage}`;
        noteKey = dataKey;
    }
    
    // Verificar que la página existe
    if (!data || !data[currentPage]) {
        showToast('❌ La página seleccionada no existe', 'error');
        return;
    }
    
    // Verificar que haya más de una página
    const pageCount = Object.keys(data).length;
    if (pageCount <= 1) {
        showToast('❌ No puedes eliminar la última página', 'error');
        return;
    }
    
    // Confirmar eliminación
    const confirmed = await window.showConfirm(`¿Estás seguro de eliminar la página ${currentPage}? Esta acción no se puede deshacer.`);
    if (!confirmed) {
        return;
    }
    
    // Eliminar la página
    delete catalogData[dataKey];
    
    // Eliminar nota si existe
    if (noteKey) {
        if (tab === 'hash' && catalogData.hashNotes && catalogData.hashNotes[noteKey]) {
            delete catalogData.hashNotes[noteKey];
        } else if (tab === 'oil' && catalogData.oilNotes && catalogData.oilNotes[noteKey]) {
            delete catalogData.oilNotes[noteKey];
        }
    }
    
    // Cambiar a la primera página disponible
    const remainingPages = Object.keys(data)
        .filter(k => k !== currentPage.toString())
        .map(n => parseInt(n))
        .sort((a, b) => a - b);
    
    if (remainingPages.length > 0) {
        visualEditorState.currentPage = remainingPages[0];
    }
    
    visualEditorState.isDirty = true;
    
    // Eliminar la página HTML del DOM inmediatamente
    if (tab === 'products') {
        const pageElement = document.getElementById(`products${currentPage}`);
        if (pageElement) {
            console.log(`🗑️ Eliminando página HTML: products${currentPage}`);
            pageElement.remove();
        }
    } else if (tab === 'hash') {
        const pageElement = document.getElementById(`hash${currentPage}`);
        if (pageElement) {
            console.log(`🗑️ Eliminando página HTML: hash${currentPage}`);
            pageElement.remove();
        }
    } else if (tab === 'oil') {
        const pageElement = document.getElementById(`oil${currentPage}`);
        if (pageElement) {
            console.log(`🗑️ Eliminando página HTML: oil${currentPage}`);
            pageElement.remove();
        }
    }
    
    // Actualizar números de página después de eliminar
    if (typeof updatePageNumbers === 'function') {
        updatePageNumbers();
    }
    
    renderVisualEditor();
    showToast(`✅ Página ${currentPage} eliminada`, 'success');
}

/**
 * Utilidad: escapar HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

/**
 * Actualizar el visual editor cuando cambia el tab
 */
function updateVisualEditorTab(tab) {
    visualEditorState.currentTab = tab;
    visualEditorState.currentPage = 1; // Reset a página 1
    
    if (visualEditorState.currentMode === 'visual') {
        renderVisualEditor();
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVisualEditor);
} else {
    initVisualEditor();
}

// Exportar funciones
window.visualEditor = {
    init: initVisualEditor,
    switchMode: switchEditorMode,
    render: renderVisualEditor,
    updateTab: updateVisualEditorTab,
    state: visualEditorState
};