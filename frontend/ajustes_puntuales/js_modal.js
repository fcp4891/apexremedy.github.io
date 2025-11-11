// ============================================
// APEX REMEDY - ENHANCED PRODUCT MODALS CRUD
// Sistema completo de gestión de productos
// ============================================

// Estado global
const ProductModalState = {
    currentProduct: null,
    currentCategory: null,
    isEditing: false,
    priceVariants: [],
    validationErrors: {},
    isDirty: false
};

// Categorías disponibles con configuración
const PRODUCT_CATEGORIES = {
    'medicinal-flores': {
        name: 'Flores Medicinales',
        icon: 'fa-cannabis',
        color: '#16a34a',
        fields: ['cannabinoids', 'terpenes', 'strain', 'therapeutic', 'usage', 'safety']
    },
    'medicinal-aceites': {
        name: 'Aceites Medicinales',
        icon: 'fa-tint',
        color: '#3b82f6',
        fields: ['cannabinoids', 'concentration', 'therapeutic', 'usage', 'safety']
    },
    'medicinal-concentrados': {
        name: 'Concentrados Medicinales',
        icon: 'fa-flask',
        color: '#f59e0b',
        fields: ['cannabinoids', 'extraction', 'therapeutic', 'usage', 'safety']
    },
    'semillas': {
        name: 'Semillas',
        icon: 'fa-seedling',
        color: '#84cc16',
        fields: ['strain', 'genetics', 'growing']
    },
    'vaporizadores': {
        name: 'Vaporizadores',
        icon: 'fa-wind',
        color: '#64748b',
        fields: ['technical', 'features']
    },
    'ropa': {
        name: 'Ropa',
        icon: 'fa-tshirt',
        color: '#ec4899',
        fields: ['size', 'material']
    },
    'accesorios': {
        name: 'Accesorios',
        icon: 'fa-tools',
        color: '#8b5cf6',
        fields: ['technical', 'features']
    }
};

// ============================================
// MODAL DE SELECCIÓN DE CATEGORÍA
// ============================================

function openCategorySelector() {
    const modalHTML = `
        <div class="product-modal-overlay" id="categorySelectorModal" onclick="closeCategorySelector(event)">
            <div class="product-modal-container" style="max-width: 800px;" onclick="event.stopPropagation()">
                
                <!-- Header -->
                <div class="product-modal-header">
                    <div class="product-modal-header-content">
                        <div class="product-modal-icon">
                            <i class="fas fa-layer-group"></i>
                        </div>
                        <div class="product-modal-title-group">
                            <h2>Selecciona el tipo de producto</h2>
                            <p>Elige la categoría para crear un nuevo producto</p>
                        </div>
                    </div>
                    <button class="product-modal-close-btn" onclick="closeCategorySelector()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="product-modal-body">
                    <div class="category-selector-grid">
                        ${Object.entries(PRODUCT_CATEGORIES).map(([slug, config]) => `
                            <div class="category-selector-item" onclick="openProductModal('${slug}', null)">
                                <div class="category-selector-icon" style="color: ${config.color};">
                                    <i class="fas ${config.icon}"></i>
                                </div>
                                <div class="category-selector-name">${config.name}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

            </div>
        </div>
    `;

    // Remover modal anterior si existe
    const oldModal = document.getElementById('categorySelectorModal');
    if (oldModal) oldModal.remove();

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';
    
    // Cerrar con ESC
    document.addEventListener('keydown', handleCategorySelectorEscape);
}

function closeCategorySelector(event) {
    if (event && event.target.id !== 'categorySelectorModal') {
        return;
    }

    const modal = document.getElementById('categorySelectorModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleCategorySelectorEscape);
        }, 200);
    }
}

function handleCategorySelectorEscape(e) {
    if (e.key === 'Escape') {
        closeCategorySelector();
    }
}

// ============================================
// MODAL PRINCIPAL DE PRODUCTO
// ============================================

function openProductModal(categorySlug, product = null) {
    console.log('📝 Abriendo modal de producto:', categorySlug, product);
    
    // Cerrar selector de categoría si está abierto
    closeCategorySelector();
    
    // Validar categoría
    if (!PRODUCT_CATEGORIES[categorySlug]) {
        console.error('Categoría no válida:', categorySlug);
        showNotification('Categoría no válida', 'error');
        return;
    }

    // Actualizar estado
    ProductModalState.currentCategory = categorySlug;
    ProductModalState.currentProduct = product;
    ProductModalState.isEditing = product !== null;
    ProductModalState.priceVariants = product?.price_variants || [];
    ProductModalState.isDirty = false;

    const category = PRODUCT_CATEGORIES[categorySlug];
    const isEdit = ProductModalState.isEditing;

    // Construir HTML del modal
    const modalHTML = buildProductModalHTML(category, categorySlug, product, isEdit);

    // Remover modal anterior si existe
    const oldModal = document.getElementById('productEditModal');
    if (oldModal) oldModal.remove();

    // Agregar nuevo modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden';

    // Inicializar funcionalidades
    setTimeout(() => {
        initializeProductModal(product);
        loadPriceVariants(product);
    }, 100);

    // Cerrar con ESC
    document.addEventListener('keydown', handleProductModalEscape);
}

function buildProductModalHTML(category, categorySlug, product, isEdit) {
    const safeValue = (value, defaultValue = '') => value !== undefined && value !== null ? value : defaultValue;
    
    return `
        <div class="product-modal-overlay" id="productEditModal" onclick="closeProductModal(event)">
            <div class="product-modal-container" onclick="event.stopPropagation()">
                
                <!-- Header -->
                <div class="product-modal-header" style="background: linear-gradient(135deg, ${category.color}, ${adjustColor(category.color, -20)});">
                    <div class="product-modal-header-content">
                        <div class="product-modal-icon">
                            <i class="fas ${category.icon}"></i>
                        </div>
                        <div class="product-modal-title-group">
                            <h2>${isEdit ? 'Editar' : 'Crear'} ${category.name}</h2>
                            <p>
                                <i class="fas ${category.icon}"></i>
                                ${isEdit ? `ID: ${product.id}` : 'Nuevo producto'}
                            </p>
                        </div>
                    </div>
                    <button class="product-modal-close-btn" onclick="closeProductModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Body -->
                <div class="product-modal-body">
                    <form id="productForm" onsubmit="handleProductSubmit(event)">
                        <input type="hidden" id="productId" value="${safeValue(product?.id)}">
                        <input type="hidden" id="categorySlug" value="${categorySlug}">

                        ${buildBasicInfoSection(product)}
                        ${buildPriceStockSection(product, categorySlug)}
                        ${buildCategorySpecificSections(categorySlug, product)}
                        ${buildMediaSection(product)}
                        ${buildStatusSection(product)}

                    </form>
                </div>

                <!-- Footer -->
                <div class="product-modal-footer">
                    <div class="product-modal-footer-left">
                        ${isEdit ? `
                            <button type="button" class="product-btn product-btn-danger product-btn-sm" onclick="handleDeleteProduct()">
                                <i class="fas fa-trash"></i>
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                    <div class="product-modal-footer-right">
                        <button type="button" class="product-btn product-btn-secondary" onclick="closeProductModal()">
                            <i class="fas fa-times"></i>
                            Cancelar
                        </button>
                        <button type="submit" form="productForm" class="product-btn product-btn-primary" id="saveProductBtn">
                            <i class="fas fa-save"></i>
                            ${isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;
}

// ============================================
// SECCIONES DEL FORMULARIO
// ============================================

function buildBasicInfoSection(product) {
    const safeValue = (value, defaultValue = '') => value !== undefined && value !== null ? value : defaultValue;
    
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h3 class="product-section-title">Información Básica</h3>
            </div>

            <div class="product-grid product-grid-2">
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-tag"></i>
                            Nombre del Producto
                            <span class="required-mark">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="productName" 
                            name="name"
                            class="product-form-input" 
                            required
                            value="${safeValue(product?.name)}"
                            placeholder="Ej: Blue Dream - Flor Premium"
                            oninput="handleInputChange(this)"
                        >
                        <div class="validation-feedback invalid-feedback">
                            <i class="fas fa-exclamation-circle"></i>
                            <span>El nombre es requerido</span>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-barcode"></i>
                            SKU
                        </label>
                        <input 
                            type="text" 
                            id="productSku" 
                            name="sku"
                            class="product-form-input"
                            value="${safeValue(product?.sku)}"
                            placeholder="Ej: BD-001"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-building"></i>
                            Marca
                        </label>
                        <select 
                            id="productBrand" 
                            name="brand_id"
                            class="product-form-select"
                            onchange="handleInputChange(this)"
                        >
                            <option value="">Sin marca</option>
                            ${typeof allBrands !== 'undefined' && allBrands ? 
                                allBrands.map(brand => 
                                    `<option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>`
                                ).join('') : ''}
                        </select>
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-align-left"></i>
                            Descripción Corta
                        </label>
                        <input 
                            type="text" 
                            id="productShortDescription" 
                            name="short_description"
                            class="product-form-input"
                            value="${safeValue(product?.short_description)}"
                            placeholder="Descripción breve para listados (máx 150 caracteres)"
                            maxlength="150"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-file-alt"></i>
                            Descripción Completa
                        </label>
                        <textarea 
                            id="productDescription" 
                            name="description"
                            class="product-form-textarea"
                            rows="4"
                            placeholder="Descripción detallada del producto..."
                            oninput="handleInputChange(this)"
                        >${safeValue(product?.description)}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildPriceStockSection(product, categorySlug) {
    const safeValue = (value, defaultValue = '') => value !== undefined && value !== null ? value : defaultValue;
    const isMedicinal = categorySlug.includes('medicinal');
    
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <h3 class="product-section-title">Precio y Stock</h3>
            </div>

            <div class="product-grid product-grid-3">
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-money-bill-wave"></i>
                            Precio Base (CLP)
                        </label>
                        <input 
                            type="number" 
                            id="productPrice" 
                            name="base_price"
                            class="product-form-input"
                            step="1"
                            min="0"
                            value="${safeValue(product?.base_price || product?.price)}"
                            placeholder="Precio de referencia"
                            oninput="handleInputChange(this)"
                        >
                        <small class="product-help-text">
                            <i class="fas fa-info-circle"></i>
                            Precio base, se usarán las variantes para ventas
                        </small>
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-boxes"></i>
                            Cantidad en Stock
                            <span class="required-mark">*</span>
                        </label>
                        <input 
                            type="number" 
                            id="productStock" 
                            name="stock_quantity"
                            class="product-form-input"
                            step="0.1"
                            min="0"
                            required
                            value="${safeValue(product?.stock_quantity || product?.stock, 0)}"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-weight"></i>
                            Unidad de Stock
                        </label>
                        <select 
                            id="productStockUnit" 
                            name="stock_unit"
                            class="product-form-select"
                            onchange="handleInputChange(this)"
                        >
                            <option value="gramos" ${product?.stock_unit === 'gramos' ? 'selected' : ''}>Gramos</option>
                            <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                            <option value="ml" ${product?.stock_unit === 'ml' ? 'selected' : ''}>Mililitros</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Variantes de Precio -->
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--modal-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <label class="product-form-label" style="margin: 0;">
                        <i class="fas fa-th-list"></i>
                        Variantes de Precio
                        <span class="required-mark">*</span>
                    </label>
                    <button type="button" class="add-variant-btn" onclick="addPriceVariant()">
                        <i class="fas fa-plus"></i>
                        Agregar Variante
                    </button>
                </div>
                <div id="priceVariantsContainer" class="price-variants-container">
                    <!-- Las variantes se cargarán aquí -->
                </div>
                <small class="product-help-text">
                    <i class="fas fa-lightbulb"></i>
                    Define diferentes presentaciones y precios (Ej: 1g, 5g, 10g)
                </small>
            </div>
        </div>
    `;
}

function buildCategorySpecificSections(categorySlug, product) {
    const category = PRODUCT_CATEGORIES[categorySlug];
    let html = '';

    // Secciones específicas según la categoría
    if (category.fields.includes('cannabinoids')) {
        html += buildCannabinoidsSection(product);
    }

    if (category.fields.includes('terpenes')) {
        html += buildTerpenesSection(product);
    }

    if (category.fields.includes('strain')) {
        html += buildStrainSection(product);
    }

    if (category.fields.includes('therapeutic')) {
        html += buildTherapeuticSection(product);
    }

    if (category.fields.includes('usage')) {
        html += buildUsageSection(product);
    }

    if (category.fields.includes('safety')) {
        html += buildSafetySection(product);
    }

    return html;
}

function buildCannabinoidsSection(product) {
    const cannabinoids = parseProductJSON(product?.cannabinoid_profile);
    
    return `
        <div class="product-section cannabinoid-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
                    <i class="fas fa-cannabis"></i>
                </div>
                <h3 class="product-section-title">Perfil de Cannabinoides (%)</h3>
            </div>

            <div class="product-grid product-grid-5">
                ${['THC', 'CBD', 'CBN', 'CBG', 'THCV'].map(cannabinoid => `
                    <div>
                        <div class="product-form-group">
                            <label class="product-form-label">
                                ${cannabinoid}
                            </label>
                            <input 
                                type="number" 
                                id="cannabinoid_${cannabinoid.toLowerCase()}" 
                                name="cannabinoid_${cannabinoid.toLowerCase()}"
                                class="product-form-input"
                                step="0.1"
                                min="0"
                                max="100"
                                value="${cannabinoids[cannabinoid] || ''}"
                                placeholder="0.0%"
                                oninput="handleInputChange(this)"
                            >
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildTerpenesSection(product) {
    const terpenes = parseProductJSON(product?.terpene_profile);
    const terpenesList = ['Mirceno', 'Limoneno', 'Cariofileno', 'Pineno', 'Linalool', 'Humuleno'];
    
    return `
        <div class="product-section terpene-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #a855f7, #9333ea);">
                    <i class="fas fa-flask"></i>
                </div>
                <h3 class="product-section-title">Perfil de Terpenos (%)</h3>
            </div>

            <div class="product-grid product-grid-3">
                ${terpenesList.map(terpene => `
                    <div>
                        <div class="product-form-group">
                            <label class="product-form-label">
                                ${terpene}
                            </label>
                            <input 
                                type="number" 
                                id="terpene_${terpene.toLowerCase()}" 
                                name="terpene_${terpene.toLowerCase()}"
                                class="product-form-input"
                                step="0.1"
                                min="0"
                                value="${terpenes[terpene] || ''}"
                                placeholder="0.0%"
                                oninput="handleInputChange(this)"
                            >
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildStrainSection(product) {
    const strainInfo = parseProductJSON(product?.strain_info);
    
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-dna"></i>
                </div>
                <h3 class="product-section-title">Información de Cepa</h3>
            </div>

            <div class="product-grid product-grid-2">
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Tipo de Cepa
                        </label>
                        <select 
                            id="strain_type" 
                            name="strain_type"
                            class="product-form-select"
                            onchange="handleInputChange(this)"
                        >
                            <option value="">Seleccionar</option>
                            <option value="indica" ${strainInfo.type === 'indica' ? 'selected' : ''}>Indica</option>
                            <option value="sativa" ${strainInfo.type === 'sativa' ? 'selected' : ''}>Sativa</option>
                            <option value="hybrid" ${strainInfo.type === 'hybrid' ? 'selected' : ''}>Híbrida</option>
                        </select>
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Genética
                        </label>
                        <input 
                            type="text" 
                            id="strain_genetics" 
                            name="strain_genetics"
                            class="product-form-input"
                            value="${strainInfo.genetics || ''}"
                            placeholder="Ej: 60% Indica / 40% Sativa"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Linaje
                        </label>
                        <input 
                            type="text" 
                            id="strain_lineage" 
                            name="strain_lineage"
                            class="product-form-input"
                            value="${strainInfo.lineage || ''}"
                            placeholder="Ej: (Parent 1 x Parent 2)"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildTherapeuticSection(product) {
    const therapeuticInfo = parseProductJSON(product?.therapeutic_info);
    
    return `
        <div class="product-section therapeutic-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                    <i class="fas fa-heartbeat"></i>
                </div>
                <h3 class="product-section-title">Información Terapéutica</h3>
            </div>

            <div class="product-grid product-grid-2">
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Beneficios Terapéuticos
                        </label>
                        <textarea 
                            id="therapeutic_benefits" 
                            name="therapeutic_benefits"
                            class="product-form-textarea"
                            rows="3"
                            placeholder="Describe los beneficios terapéuticos..."
                            oninput="handleInputChange(this)"
                        >${therapeuticInfo.benefits || ''}</textarea>
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Indicaciones
                        </label>
                        <textarea 
                            id="therapeutic_indications" 
                            name="therapeutic_indications"
                            class="product-form-textarea"
                            rows="3"
                            placeholder="Para qué condiciones está indicado..."
                            oninput="handleInputChange(this)"
                        >${therapeuticInfo.indications || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildUsageSection(product) {
    const usageInfo = parseProductJSON(product?.usage_info);
    
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-hand-holding-medical"></i>
                </div>
                <h3 class="product-section-title">Información de Uso</h3>
            </div>

            <div class="product-grid product-grid-2">
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Dosis Recomendada
                        </label>
                        <input 
                            type="text" 
                            id="usage_dosage" 
                            name="usage_dosage"
                            class="product-form-input"
                            value="${usageInfo.dosage || ''}"
                            placeholder="Ej: 0.1-0.3g por uso"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Método de Administración
                        </label>
                        <input 
                            type="text" 
                            id="usage_method" 
                            name="usage_method"
                            class="product-form-input"
                            value="${usageInfo.method || ''}"
                            placeholder="Ej: Vaporización, Sublingual"
                            oninput="handleInputChange(this)"
                        >
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Instrucciones de Uso
                        </label>
                        <textarea 
                            id="usage_instructions" 
                            name="usage_instructions"
                            class="product-form-textarea"
                            rows="3"
                            placeholder="Instrucciones detalladas de cómo usar el producto..."
                            oninput="handleInputChange(this)"
                        >${usageInfo.instructions || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildSafetySection(product) {
    const safetyInfo = parseProductJSON(product?.safety_info);
    
    return `
        <div class="product-section safety-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 class="product-section-title">Información de Seguridad</h3>
            </div>

            <div class="product-grid product-grid-2">
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Contraindicaciones
                        </label>
                        <textarea 
                            id="safety_contraindications" 
                            name="safety_contraindications"
                            class="product-form-textarea"
                            rows="2"
                            placeholder="Situaciones en las que NO se debe usar..."
                            oninput="handleInputChange(this)"
                        >${safetyInfo.contraindications || ''}</textarea>
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Efectos Secundarios
                        </label>
                        <textarea 
                            id="safety_side_effects" 
                            name="safety_side_effects"
                            class="product-form-textarea"
                            rows="2"
                            placeholder="Posibles efectos secundarios..."
                            oninput="handleInputChange(this)"
                        >${safetyInfo.side_effects || ''}</textarea>
                    </div>
                </div>

                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            Advertencias
                        </label>
                        <textarea 
                            id="safety_warnings" 
                            name="safety_warnings"
                            class="product-form-textarea"
                            rows="2"
                            placeholder="Advertencias importantes..."
                            oninput="handleInputChange(this)"
                        >${safetyInfo.warnings || ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildMediaSection(product) {
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-images"></i>
                </div>
                <h3 class="product-section-title">Imágenes y Media</h3>
            </div>

            <div class="product-form-group">
                <label class="product-form-label">
                    <i class="fas fa-link"></i>
                    URL de Imagen Principal
                </label>
                <input 
                    type="url" 
                    id="productImageUrl" 
                    name="image_url"
                    class="product-form-input"
                    value="${product?.image_url || ''}"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    oninput="handleInputChange(this)"
                >
                <small class="product-help-text">
                    <i class="fas fa-info-circle"></i>
                    URL completa de la imagen principal del producto
                </small>
            </div>
        </div>
    `;
}

function buildStatusSection(product) {
    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-toggle-on"></i>
                </div>
                <h3 class="product-section-title">Estado y Configuración</h3>
            </div>

            <div class="product-grid product-grid-2">
                <!-- Featured -->
                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input 
                            type="checkbox" 
                            id="productFeatured" 
                            name="featured"
                            class="product-toggle-input"
                            ${product?.featured ? 'checked' : ''}
                            onchange="handleInputChange(this)"
                        >
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productFeatured">
                        <strong>Producto Destacado</strong>
                        <small>Aparecerá en la sección de destacados</small>
                    </label>
                </div>

                <!-- Status -->
                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input 
                            type="checkbox" 
                            id="productStatus" 
                            name="status"
                            class="product-toggle-input"
                            ${product?.status === 'active' || product?.status === 1 || !product ? 'checked' : ''}
                            onchange="handleInputChange(this)"
                        >
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productStatus">
                        <strong>Producto Activo</strong>
                        <small>Visible para los clientes</small>
                    </label>
                </div>

                <!-- Medicinal (solo si aplica) -->
                ${ProductModalState.currentCategory.includes('medicinal') ? `
                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input 
                            type="checkbox" 
                            id="productMedicinal" 
                            name="is_medicinal"
                            class="product-toggle-input"
                            checked
                            disabled
                        >
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productMedicinal">
                        <strong>Producto Medicinal</strong>
                        <small>Requiere receta médica</small>
                    </label>
                </div>

                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input 
                            type="checkbox" 
                            id="productPrescription" 
                            name="requires_prescription"
                            class="product-toggle-input"
                            ${product?.requires_prescription ? 'checked' : ''}
                            onchange="handleInputChange(this)"
                        >
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productPrescription">
                        <strong>Requiere Receta</strong>
                        <small>Acceso solo con prescripción</small>
                    </label>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// VARIANTES DE PRECIO
// ============================================

function loadPriceVariants(product) {
    const container = document.getElementById('priceVariantsContainer');
    if (!container) return;

    // Cargar variantes existentes o crear una por defecto
    const variants = product?.price_variants || [];
    
    if (variants.length === 0) {
        // Agregar una variante por defecto
        addPriceVariant();
    } else {
        // Cargar variantes existentes
        variants.forEach((variant, index) => {
            addPriceVariant(variant);
        });
    }
}

function addPriceVariant(variant = null) {
    const container = document.getElementById('priceVariantsContainer');
    if (!container) return;

    const index = container.children.length;
    const variantHTML = `
        <div class="price-variant-item" data-variant-index="${index}">
            <div class="product-form-group">
                <label class="product-form-label">Nombre</label>
                <input 
                    type="text" 
                    name="variant_name_${index}"
                    class="product-form-input"
                    value="${variant?.variant_name || ''}"
                    placeholder="Ej: 1 gramo"
                    required
                    oninput="handleInputChange(this)"
                >
            </div>

            <div class="product-form-group">
                <label class="product-form-label">Cantidad</label>
                <input 
                    type="number" 
                    name="variant_quantity_${index}"
                    class="product-form-input"
                    step="0.1"
                    min="0"
                    value="${variant?.quantity || ''}"
                    placeholder="1"
                    required
                    oninput="handleInputChange(this)"
                >
            </div>

            <div class="product-form-group">
                <label class="product-form-label">Unidad</label>
                <select 
                    name="variant_unit_${index}"
                    class="product-form-select"
                    onchange="handleInputChange(this)"
                >
                    <option value="g" ${variant?.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="ml" ${variant?.unit === 'ml' ? 'selected' : ''}>ml</option>
                    <option value="unidad" ${variant?.unit === 'unidad' ? 'selected' : ''}>unidad</option>
                </select>
            </div>

            <div class="product-form-group">
                <label class="product-form-label">Precio (CLP)</label>
                <input 
                    type="number" 
                    name="variant_price_${index}"
                    class="product-form-input"
                    step="1"
                    min="0"
                    value="${variant?.price || ''}"
                    placeholder="15000"
                    required
                    oninput="handleInputChange(this)"
                >
            </div>

            <button 
                type="button" 
                class="price-variant-remove-btn"
                onclick="removePriceVariant(this)"
                title="Eliminar variante"
            >
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', variantHTML);
}

function removePriceVariant(button) {
    const container = document.getElementById('priceVariantsContainer');
    const item = button.closest('.price-variant-item');
    
    // Verificar que haya al menos 2 variantes antes de eliminar
    if (container.children.length <= 1) {
        showNotification('Debe haber al menos una variante de precio', 'warning');
        return;
    }

    item.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        item.remove();
        ProductModalState.isDirty = true;
    }, 300);
}

// ============================================
// MANEJO DEL FORMULARIO
// ============================================

function initializeProductModal(product) {
    console.log('🎨 Inicializando modal de producto');
    
    // Track de cambios
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('input', () => {
            ProductModalState.isDirty = true;
        });
    }
}

function handleInputChange(element) {
    // Marcar como modificado
    ProductModalState.isDirty = true;

    // Validación en tiempo real
    if (element.required && !element.value) {
        element.classList.add('is-invalid');
        element.classList.remove('is-valid');
    } else if (element.value) {
        element.classList.add('is-valid');
        element.classList.remove('is-invalid');
    } else {
        element.classList.remove('is-valid', 'is-invalid');
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const saveBtn = document.getElementById('saveProductBtn');

    // Validar formulario
    if (!form.checkValidity()) {
        form.reportValidity();
        showNotification('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    // Deshabilitar botón de guardar
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        // Recolectar datos del formulario
        const formData = collectFormData(form);

        console.log('📤 Enviando datos del producto:', formData);

        // Enviar a la API
        const response = ProductModalState.isEditing 
            ? await api.updateProduct(formData.id, formData)
            : await api.createProduct(formData);

        if (response.success) {
            showNotification(
                ProductModalState.isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente',
                'success'
            );

            // Cerrar modal y recargar productos
            closeProductModal();
            
            // Recargar tabla de productos si existe la función
            if (typeof loadProducts === 'function') {
                await loadProducts(true);
            }
        } else {
            throw new Error(response.message || 'Error al guardar el producto');
        }

    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification(error.message || 'Error al guardar el producto', 'error');
    } finally {
        // Rehabilitar botón
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-save"></i> ${ProductModalState.isEditing ? 'Guardar Cambios' : 'Crear Producto'}`;
    }
}

function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};

    // Campos básicos
    data.id = document.getElementById('productId')?.value || null;
    data.name = formData.get('name');
    data.sku = formData.get('sku');
    data.description = formData.get('description');
    data.short_description = formData.get('short_description');
    data.brand_id = formData.get('brand_id') || null;
    data.base_price = parseFloat(formData.get('base_price')) || 0;
    data.stock_quantity = parseFloat(formData.get('stock_quantity')) || 0;
    data.stock_unit = formData.get('stock_unit');
    data.image_url = formData.get('image_url');
    data.featured = document.getElementById('productFeatured')?.checked ? 1 : 0;
    data.status = document.getElementById('productStatus')?.checked ? 'active' : 'inactive';

    // Categoría
    const categorySlug = document.getElementById('categorySlug').value;
    data.category_slug = categorySlug;
    
    // Medicinal flags
    if (categorySlug.includes('medicinal')) {
        data.is_medicinal = 1;
        data.requires_prescription = document.getElementById('productPrescription')?.checked ? 1 : 0;
    }

    // Cannabinoides
    const cannabinoids = {};
    ['thc', 'cbd', 'cbn', 'cbg', 'thcv'].forEach(c => {
        const value = formData.get(`cannabinoid_${c}`);
        if (value) cannabinoids[c.toUpperCase()] = parseFloat(value);
    });
    if (Object.keys(cannabinoids).length > 0) {
        data.cannabinoid_profile = cannabinoids;
    }

    // Terpenos
    const terpenes = {};
    ['mirceno', 'limoneno', 'cariofileno', 'pineno', 'linalool', 'humuleno'].forEach(t => {
        const value = formData.get(`terpene_${t}`);
        if (value) terpenes[t.charAt(0).toUpperCase() + t.slice(1)] = parseFloat(value);
    });
    if (Object.keys(terpenes).length > 0) {
        data.terpene_profile = terpenes;
    }

    // Strain info
    const strainType = formData.get('strain_type');
    const strainGenetics = formData.get('strain_genetics');
    const strainLineage = formData.get('strain_lineage');
    if (strainType || strainGenetics || strainLineage) {
        data.strain_info = {
            type: strainType,
            genetics: strainGenetics,
            lineage: strainLineage
        };
    }

    // Therapeutic info
    const therapeuticBenefits = formData.get('therapeutic_benefits');
    const therapeuticIndications = formData.get('therapeutic_indications');
    if (therapeuticBenefits || therapeuticIndications) {
        data.therapeutic_info = {
            benefits: therapeuticBenefits,
            indications: therapeuticIndications
        };
    }

    // Usage info
    const usageDosage = formData.get('usage_dosage');
    const usageMethod = formData.get('usage_method');
    const usageInstructions = formData.get('usage_instructions');
    if (usageDosage || usageMethod || usageInstructions) {
        data.usage_info = {
            dosage: usageDosage,
            method: usageMethod,
            instructions: usageInstructions
        };
    }

    // Safety info
    const safetyContraindications = formData.get('safety_contraindications');
    const safetySideEffects = formData.get('safety_side_effects');
    const safetyWarnings = formData.get('safety_warnings');
    if (safetyContraindications || safetySideEffects || safetyWarnings) {
        data.safety_info = {
            contraindications: safetyContraindications,
            side_effects: safetySideEffects,
            warnings: safetyWarnings
        };
    }

    // Recolectar variantes de precio
    const priceVariants = [];
    const variantItems = document.querySelectorAll('.price-variant-item');
    variantItems.forEach((item, index) => {
        const name = formData.get(`variant_name_${index}`);
        const quantity = formData.get(`variant_quantity_${index}`);
        const unit = formData.get(`variant_unit_${index}`);
        const price = formData.get(`variant_price_${index}`);

        if (name && quantity && unit && price) {
            priceVariants.push({
                variant_name: name,
                quantity: parseFloat(quantity),
                unit: unit,
                price: parseFloat(price)
            });
        }
    });

    if (priceVariants.length > 0) {
        data.price_variants = priceVariants;
    }

    return data;
}

async function handleDeleteProduct() {
    if (!ProductModalState.currentProduct?.id) {
        showNotification('No hay producto para eliminar', 'error');
        return;
    }

    const productName = ProductModalState.currentProduct.name;
    
    if (!confirm(`¿Estás seguro de eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await api.deleteProduct(ProductModalState.currentProduct.id);

        if (response.success) {
            showNotification('Producto eliminado correctamente', 'success');
            closeProductModal();
            
            // Recargar tabla de productos
            if (typeof loadProducts === 'function') {
                await loadProducts(true);
            }
        } else {
            throw new Error(response.message || 'Error al eliminar el producto');
        }

    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification(error.message || 'Error al eliminar el producto', 'error');
    }
}

// ============================================
// CERRAR MODAL
// ============================================

function closeProductModal(event) {
    if (event && event.target.id !== 'productEditModal') {
        return;
    }

    // Verificar si hay cambios sin guardar
    if (ProductModalState.isDirty) {
        if (!confirm('Hay cambios sin guardar. ¿Estás seguro de cerrar?')) {
            return;
        }
    }

    const modal = document.getElementById('productEditModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleProductModalEscape);
            
            // Limpiar estado
            ProductModalState.currentProduct = null;
            ProductModalState.currentCategory = null;
            ProductModalState.isEditing = false;
            ProductModalState.priceVariants = [];
            ProductModalState.validationErrors = {};
            ProductModalState.isDirty = false;
        }, 200);
    }
}

function handleProductModalEscape(e) {
    if (e.key === 'Escape') {
        closeProductModal();
    }
}

// ============================================
// UTILIDADES
// ============================================

function parseProductJSON(data) {
    if (!data) return {};
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.warn('Error parseando JSON:', e);
            return {};
        }
    }
    return data || {};
}

function adjustColor(color, amount) {
    // Convertir hex a RGB y ajustar brillo
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function showNotification(message, type = 'info') {
    // Si existe una función notify global, usarla
    if (typeof notify !== 'undefined' && notify[type]) {
        notify[type](message);
    } else {
        // Fallback a alert
        alert(message);
    }
}

// ============================================
// INTEGRACIÓN CON SISTEMA EXISTENTE
// ============================================

// Función compatible con el sistema anterior
function openCreateModal() {
    openCategorySelector();
}

// Función compatible con el sistema anterior
function openEditModal(product) {
    if (!product) {
        console.error('No se recibió producto para editar');
        return;
    }

    // Determinar categoría del producto
    let categorySlug = product.category_slug || product.category?.slug;
    
    if (!categorySlug && product.category_id) {
        // Buscar categoría por ID
        const category = allCategories?.find(c => c.id === product.category_id);
        categorySlug = category?.slug;
    }

    if (!categorySlug) {
        console.error('No se pudo determinar la categoría del producto');
        showNotification('Error: No se pudo determinar la categoría del producto', 'error');
        return;
    }

    openProductModal(categorySlug, product);
}

// Export de funciones globales
window.openCategorySelector = openCategorySelector;
window.closeCategorySelector = closeCategorySelector;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.addPriceVariant = addPriceVariant;
window.removePriceVariant = removePriceVariant;
window.handleProductSubmit = handleProductSubmit;
window.handleDeleteProduct = handleDeleteProduct;

console.log('✅ Sistema de modales CRUD mejorado cargado correctamente');