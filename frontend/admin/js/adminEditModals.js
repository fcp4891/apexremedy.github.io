// frontend/admin/js/adminEditModals.js
// Sistema mejorado de modales CRUD para productos ApexRemedy

const ProductModalState = {
    currentProduct: null,
    currentCategory: null,
    currentImage: null,
    isEditing: false,
    priceVariants: [],
    validationErrors: {},
    isDirty: false
};

const MAX_PRODUCT_IMAGE_MB = 5;
const PRODUCT_IMAGE_PLACEHOLDER = '../assets/images/placeholder.jpg';

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getPrimaryProductImage(product) {
    if (!product) return '';
    if (Array.isArray(product.images) && product.images.length > 0) {
        const primary = product.images.find(img => img.is_primary) || product.images[0];
        if (primary && primary.url) return primary.url;
    }
    return product.image || product.image_url || '';
}

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
    },
    cbd: {
        name: 'CBD',
        icon: 'fa-leaf',
        color: '#22c55e',
        fields: ['cannabinoids', 'therapeutic', 'usage', 'safety']
    }
};

function openCategorySelector() {
    const modalHTML = `
        <div class="product-modal-overlay" id="categorySelectorModal" data-action="close-modal-overlay" data-modal-id="categorySelectorModal">
            <div class="product-modal-container" style="max-width: 900px;" data-action="stop-propagation">
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
                    <button class="product-modal-close-btn" data-action="close-category-selector">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="product-modal-body">
                    <div class="category-selector-grid">
                        ${Object.entries(PRODUCT_CATEGORIES).map(([slug, config]) => `
                            <div class="category-selector-item" style="border-color: ${config.color}" data-action="open-product-modal" data-category-slug="${slug}">
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

    const previous = document.getElementById('categorySelectorModal');
    if (previous) previous.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleCategorySelectorEscape);
}

function closeCategorySelector(event) {
    // Si se llama desde event delegation, el evento puede venir del overlay o del botón
    if (event) {
        const target = event.target;
        const modal = document.getElementById('categorySelectorModal');
        
        // Si el click es en el overlay (fondo oscuro), cerrar
        if (target.id === 'categorySelectorModal' || target.closest('#categorySelectorModal') === modal) {
            // Verificar que no sea un click dentro del contenedor
            const container = modal?.querySelector('.product-modal-container');
            if (container && container.contains(target)) {
                return; // No cerrar si el click es dentro del contenedor
            }
        }
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

function handleCategorySelectorEscape(event) {
    if (event.key === 'Escape') {
        closeCategorySelector();
    }
}

function openProductModal(categorySlug, product = null) {
    console.log('📝 Abriendo modal de producto:', categorySlug, product);

    closeCategorySelector();

    if (!PRODUCT_CATEGORIES[categorySlug]) {
        showNotification('Categoría no válida', 'error');
        return;
    }

    ProductModalState.currentCategory = categorySlug;
    ProductModalState.currentProduct = product;
    ProductModalState.currentImage = getPrimaryProductImage(product);
    ProductModalState.isEditing = !!product;
    ProductModalState.priceVariants = product?.price_variants || [];
    ProductModalState.isDirty = false;

    const category = PRODUCT_CATEGORIES[categorySlug];
    const modalHTML = buildProductModalHTML(category, categorySlug, product, ProductModalState.isEditing);

    const previous = document.getElementById('productEditModal');
    if (previous) previous.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        initializeProductModal(product);
        loadPriceVariants(product);
    }, 50);

    document.addEventListener('keydown', handleProductModalEscape);
}

function buildProductModalHTML(category, categorySlug, product, isEdit) {
    const safeValue = (value, fallback = '') => value ?? fallback;

    return `
        <div class="product-modal-overlay" id="productEditModal" data-action="close-modal-overlay" data-modal-id="productEditModal">
            <div class="product-modal-container" data-action="stop-propagation">
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
                    <button class="product-modal-close-btn" data-action="close-product-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="product-modal-body">
                    <form id="productForm" data-action="submit-product-form">
                        <input type="hidden" id="productId" value="${safeValue(product?.id)}">
                        <input type="hidden" id="categorySlug" value="${categorySlug}">
                        ${buildBasicInfoSection(product)}
                        ${buildPriceStockSection(product, categorySlug)}
                        ${buildCategorySpecificSections(categorySlug, product)}
                        ${buildMediaSection(product)}
                        ${buildStatusSection(product)}
                    </form>
                </div>
                <div class="product-modal-footer">
                    <div class="product-modal-footer-left">
                        ${isEdit ? `
                            <button type="button" class="product-btn product-btn-danger product-btn-sm" data-action="delete-product-from-modal">
                                <i class="fas fa-trash"></i>
                                Eliminar
                            </button>
                        ` : ''}
                    </div>
                    <div class="product-modal-footer-right">
                        <button type="button" class="product-btn product-btn-secondary" data-action="close-product-modal">
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

function buildBasicInfoSection(product) {
    const safeValue = (value, fallback = '') => value ?? fallback;
    const brandOptions = (Array.isArray(window.allBrands) ? window.allBrands : []).map(brand => `
        <option value="${brand.id}" ${product?.brand_id == brand.id ? 'selected' : ''}>${brand.name}</option>
    `).join('');

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
                        <input type="text" id="productName" name="name" class="product-form-input" required value="${safeValue(product?.name)}" placeholder="Ej: Blue Dream - Flor Premium">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-barcode"></i>
                            SKU
                        </label>
                        <input type="text" id="productSku" name="sku" class="product-form-input" value="${safeValue(product?.sku)}" placeholder="Ej: BD-001">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-building"></i>
                            Marca
                        </label>
                        <select id="productBrand" name="brand_id" class="product-form-select">
                            <option value="">Sin marca</option>
                            ${brandOptions}
                        </select>
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-align-left"></i>
                            Descripción Corta
                        </label>
                        <input type="text" id="productShortDescription" name="short_description" class="product-form-input" maxlength="150" value="${safeValue(product?.short_description)}" placeholder="Descripción breve">
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-file-alt"></i>
                            Descripción Completa
                        </label>
                        <textarea id="productDescription" name="description" class="product-form-textarea" rows="4" placeholder="Descripción detallada">${safeValue(product?.description)}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildPriceStockSection(product, categorySlug) {
    const safeValue = (value, fallback = '') => value ?? fallback;
    const unitType = safeValue(product?.unit_type, categorySlug.includes('medicinal') ? 'weight' : 'unit');
    const baseUnit = safeValue(product?.base_unit, unitType === 'volume' ? 'ml' : (unitType === 'weight' ? 'g' : 'unidad'));
    const unitSize = safeValue(product?.unit_size, 1);
    const medicalCategory = safeValue(product?.medical_category, 'thc');

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
                        <input type="number" id="productPrice" name="base_price" class="product-form-input" step="1" min="0" value="${safeValue(product?.base_price ?? product?.price, '')}" placeholder="Precio de referencia">
                        <small class="product-help-text">
                            <i class="fas fa-info-circle"></i>
                            Precio usado como referencia en el catálogo.
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
                        <input type="number" id="productStock" name="stock_quantity" class="product-form-input" step="0.1" min="0" required value="${safeValue(product?.stock_quantity ?? product?.stock, 0)}">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-weight"></i>
                            Unidad de Stock
                        </label>
                        <select id="productStockUnit" name="stock_unit" class="product-form-select">
                            <option value="gramos" ${product?.stock_unit === 'gramos' ? 'selected' : ''}>Gramos</option>
                            <option value="unidades" ${product?.stock_unit === 'unidades' ? 'selected' : ''}>Unidades</option>
                            <option value="ml" ${product?.stock_unit === 'ml' ? 'selected' : ''}>Mililitros</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-balance-scale"></i>
                            Tipo de Unidad
                        </label>
                        <select id="productUnitType" name="unit_type" class="product-form-select">
                            <option value="weight" ${unitType === 'weight' ? 'selected' : ''}>Peso</option>
                            <option value="unit" ${unitType === 'unit' ? 'selected' : ''}>Unidad</option>
                            <option value="volume" ${unitType === 'volume' ? 'selected' : ''}>Volumen</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-ruler-horizontal"></i>
                            Unidad Base
                        </label>
                        <input type="text" id="productBaseUnit" name="base_unit" class="product-form-input" value="${baseUnit}" placeholder="Ej: g, ml">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">
                            <i class="fas fa-ruler"></i>
                            Tamaño de Unidad
                        </label>
                        <input type="number" id="productUnitSize" name="unit_size" class="product-form-input" step="0.1" min="0" value="${unitSize}">
                    </div>
                </div>
                ${categorySlug.includes('medicinal') ? `
                    <div class="product-col-span-2">
                        <div class="product-form-group">
                            <label class="product-form-label">
                                <i class="fas fa-prescription-bottle-alt"></i>
                                Categoría Médica
                            </label>
                            <select id="productMedicalCategory" name="medical_category" class="product-form-select">
                                <option value="thc" ${medicalCategory === 'thc' ? 'selected' : ''}>THC Dominante</option>
                                <option value="cbd" ${medicalCategory === 'cbd' ? 'selected' : ''}>CBD Dominante</option>
                                <option value="balanced" ${medicalCategory === 'balanced' ? 'selected' : ''}>Balanceado (THC/CBD)</option>
                            </select>
                        </div>
                    </div>
                ` : ''}
            </div>
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--modal-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <label class="product-form-label" style="margin: 0;">
                        <i class="fas fa-th-list"></i>
                        Variantes de Precio
                        <span class="required-mark">*</span>
                    </label>
                    <button type="button" class="add-variant-btn" data-action="add-price-variant">
                        <i class="fas fa-plus"></i>
                        Agregar Variante
                    </button>
                </div>
                <div id="priceVariantsContainer" class="price-variants-container"></div>
                <small class="product-help-text">
                    <i class="fas fa-lightbulb"></i>
                    Define presentaciones específicas (Ej: 1 g, 5 g, 10 g) con sus precios correspondientes.
                </small>
            </div>
        </div>
    `;
}

function buildCategorySpecificSections(categorySlug, product) {
    const category = PRODUCT_CATEGORIES[categorySlug];
    let html = '';

    if (category.fields.includes('cannabinoids')) html += buildCannabinoidsSection(product);
    if (category.fields.includes('terpenes')) html += buildTerpenesSection(product);
    if (category.fields.includes('strain')) html += buildStrainSection(product);
    if (category.fields.includes('therapeutic')) html += buildTherapeuticSection(product);
    if (category.fields.includes('usage')) html += buildUsageSection(product);
    if (category.fields.includes('safety')) html += buildSafetySection(product);
    if (category.fields.includes('concentration')) html += buildConcentrationSection(product);
    if (category.fields.includes('extraction')) html += buildExtractionSection(product);
    if (category.fields.includes('growing')) html += buildGrowingSection(product);
    if (category.fields.includes('technical')) html += buildTechnicalSection(product);
    if (category.fields.includes('features')) html += buildFeaturesSection(product);
    if (category.fields.includes('size')) html += buildSizeSection(product);
    if (category.fields.includes('material')) html += buildMaterialSection(product);

    return html;
}

function buildCannabinoidsSection(product) {
    const raw = parseProductJSON(product?.cannabinoid_profile);
    const cannabinoids = {};
    Object.entries(raw).forEach(([key, value]) => {
        const normalized = key.toUpperCase();
        cannabinoids[normalized] = value;
    });
    const list = ['THC', 'CBD', 'CBN', 'CBG', 'THCV'];

    return `
        <div class="product-section cannabinoid-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #22c55e, #16a34a);">
                    <i class="fas fa-cannabis"></i>
                </div>
                <h3 class="product-section-title">Perfil de Cannabinoides (%)</h3>
            </div>
            <div class="product-grid product-grid-5">
                ${list.map(key => `
                    <div>
                        <div class="product-form-group">
                            <label class="product-form-label">${key}</label>
                            <input type="number" id="cannabinoid_${key.toLowerCase()}" name="cannabinoid_${key.toLowerCase()}" class="product-form-input" step="0.1" min="0" max="100" value="${cannabinoids[key]?.toString() ?? ''}" placeholder="0.0">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildTerpenesSection(product) {
    const raw = parseProductJSON(product?.terpene_profile);
    const terpenes = {};
    Object.entries(raw).forEach(([key, value]) => {
        const normalized = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        terpenes[normalized] = value;
    });
    const list = ['Mirceno', 'Limoneno', 'Cariofileno', 'Pineno', 'Linalool', 'Humuleno'];

    return `
        <div class="product-section terpene-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #a855f7, #9333ea);">
                    <i class="fas fa-flask"></i>
                </div>
                <h3 class="product-section-title">Perfil de Terpenos (%)</h3>
            </div>
            <div class="product-grid product-grid-3">
                ${list.map(name => `
                    <div>
                        <div class="product-form-group">
                            <label class="product-form-label">${name}</label>
                            <input type="number" id="terpene_${name.toLowerCase()}" name="terpene_${name.toLowerCase()}" class="product-form-input" step="0.1" min="0" value="${terpenes[name]?.toString() ?? ''}" placeholder="0.0">
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildStrainSection(product) {
    const strain = parseProductJSON(product?.strain_info);

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
                        <label class="product-form-label">Tipo de Cepa</label>
                        <select id="strain_type" name="strain_type" class="product-form-select">
                            <option value="">Seleccionar</option>
                            <option value="indica" ${strain.type === 'indica' ? 'selected' : ''}>Indica</option>
                            <option value="sativa" ${strain.type === 'sativa' ? 'selected' : ''}>Sativa</option>
                            <option value="hybrid" ${strain.type === 'hybrid' ? 'selected' : ''}>Híbrida</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">Genética</label>
                        <input type="text" id="strain_genetics" name="strain_genetics" class="product-form-input" value="${strain.genetics ?? ''}" placeholder="60% Indica / 40% Sativa">
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Linaje</label>
                        <input type="text" id="strain_lineage" name="strain_lineage" class="product-form-input" value="${strain.lineage ?? ''}" placeholder="(Parent 1 x Parent 2)">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildTherapeuticSection(product) {
    const info = parseProductJSON(product?.therapeutic_info);

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
                        <label class="product-form-label">Beneficios Terapéuticos</label>
                        <textarea id="therapeutic_benefits" name="therapeutic_benefits" class="product-form-textarea" rows="3" placeholder="Describe los beneficios">${info.benefits ?? ''}</textarea>
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Indicaciones</label>
                        <textarea id="therapeutic_indications" name="therapeutic_indications" class="product-form-textarea" rows="3" placeholder="Para qué condiciones está indicado">${info.indications ?? ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildUsageSection(product) {
    const usage = parseProductJSON(product?.usage_info);

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
                        <label class="product-form-label">Dosis Recomendada</label>
                        <input type="text" id="usage_dosage" name="usage_dosage" class="product-form-input" value="${usage.dosage ?? ''}" placeholder="0.1-0.3g por uso">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">Método de Administración</label>
                        <input type="text" id="usage_method" name="usage_method" class="product-form-input" value="${usage.method ?? ''}" placeholder="Vaporización, Sublingual">
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Instrucciones de Uso</label>
                        <textarea id="usage_instructions" name="usage_instructions" class="product-form-textarea" rows="3" placeholder="Instrucciones detalladas">${usage.instructions ?? ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildSafetySection(product) {
    const safety = parseProductJSON(product?.safety_info);

    return `
        <div class="product-section safety-section">
            <div class="product-section-header">
                <div class="product-section-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 la="product-section-title">Información de Seguridad</h3>
            </div>
            <div class="product-grid product-grid-2">
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Contraindicaciones</label>
                        <textarea id="safety_contraindications" name="safety_contraindications" class="product-form-textarea" rows="2" placeholder="Situaciones en las que NO se debe usar">${safety.contraindications ?? ''}</textarea>
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Efectos Secundarios</label>
                        <textarea id="safety_side_effects" name="safety_side_effects" class="product-form-textarea" rows="2" placeholder="Posibles efectos secundarios">${safety.side_effects ?? ''}</textarea>
                    </div>
                </div>
                <div class="product-col-span-2">
                    <div class="product-form-group">
                        <label class="product-form-label">Advertencias</label>
                        <textarea id="safety_warnings" name="safety_warnings" class="product-form-textarea" rows="2" placeholder="Advertencias importantes">${safety.warnings ?? ''}</textarea>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildConcentrationSection(product) {
    const specs = parseProductJSON(product?.specifications);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-vial"></i>
                </div>
                <h3 class="product-section-title">Concentración y Extracto</h3>
            </div>
            <div class="product-grid product-grid-2">
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">Volumen</label>
                        <input type="text" id="spec_volume" name="spec_volume" class="product-form-input" value="${specs.volume ?? ''}" placeholder="30ml">
                    </div>
                </div>
                <div>
                    <div class="product-form-group">
                        <label class="product-form-label">Concentración</label>
                        <input type="text" id="spec_concentration" name="spec_concentration" class="product-form-input" value="${specs.concentration ?? ''}" placeholder="15%">
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildExtractionSection(product) {
    const specs = parseProductJSON(product?.specifications);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-flask"></i>
                </div>
                <h3 class="product-section-title">Método de Extracción</h3>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Método</label>
                <input type="text" id="spec_extraction" name="spec_extraction" class="product-form-input" value="${specs.extraction ?? ''}" placeholder="CO2 Supercrítico">
            </div>
        </div>
    `;
}

function buildGrowingSection(product) {
    const info = parseProductJSON(product?.growing_info);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-seedling"></i>
                </div>
                <h3 class="product-section-title">Cultivo</h3>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Notas de Cultivo</label>
                <textarea id="growing_notes" name="growing_notes" class="product-form-textarea" rows="3" placeholder="Recomendaciones de cultivo">${info.notes ?? ''}</textarea>
            </div>
        </div>
    `;
}

function buildTechnicalSection(product) {
    const specs = parseProductJSON(product?.specifications);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-microchip"></i>
                </div>
                <h3 class="product-section-title">Especificaciones Técnicas</h3>
            </div>
            <div class="product-grid product-grid-2">
                <div class="product-form-group">
                    <label class="product-form-label">Material</label>
                    <input type="text" id="spec_material" name="spec_material" class="product-form-input" value="${specs.material ?? ''}" placeholder="Acero inoxidable">
                </div>
                <div class="product-form-group">
                    <label class="product-form-label">Garantía</label>
                    <input type="text" id="spec_warranty" name="spec_warranty" class="product-form-input" value="${specs.warranty ?? ''}" placeholder="12 meses">
                </div>
            </div>
        </div>
    `;
}

function buildFeaturesSection(product) {
    const attrs = parseProductJSON(product?.attributes);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-star"></i>
                </div>
                <h3 class="product-section-title">Características</h3>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Características</label>
                <textarea id="attr_features" name="attr_features" class="product-form-textarea" rows="3" placeholder="Lista de características">${attrs.features ?? ''}</textarea>
            </div>
        </div>
    `;
}

function buildSizeSection(product) {
    const attrs = parseProductJSON(product?.attributes);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-ruler-combined"></i>
                </div>
                <h3 class="product-section-title">Tallas Disponibles</h3>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Tallas</label>
                <input type="text" id="attr_size" name="attr_size" class="product-form-input" value="${attrs.size ?? ''}" placeholder="S, M, L">
            </div>
        </div>
    `;
}

function buildMaterialSection(product) {
    const attrs = parseProductJSON(product?.attributes);

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-fabric"></i>
                </div>
                <h3 class="product-section-title">Materiales</h3>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Material</label>
                <input type="text" id="attr_material" name="attr_material" class="product-form-input" value="${attrs.material ?? ''}" placeholder="Algodón orgánico">
            </div>
        </div>
    `;
}

function buildMediaSection(product) {
    const currentImage = ProductModalState.currentImage || '';
    const isDataImage = currentImage.startsWith('data:');
    const urlValue = isDataImage ? (product?.image_url || '') : currentImage;
    const dataValue = isDataImage ? currentImage : '';
    const previewSrc = currentImage || PRODUCT_IMAGE_PLACEHOLDER;

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-images"></i>
                </div>
                <h3 class="product-section-title">Imágenes y Media</h3>
            </div>
            <div class="product-image-upload" data-placeholder="${escapeHtml(PRODUCT_IMAGE_PLACEHOLDER)}">
                <div class="product-image-dropzone" data-allow-image-drag>
                    <img src="${escapeHtml(previewSrc)}" alt="Vista previa del producto" class="product-image-preview" data-image-placeholder="${escapeHtml(PRODUCT_IMAGE_PLACEHOLDER)}">
                    <div class="product-image-dropzone-overlay">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Arrastra una imagen aquí</span>
                    </div>
                </div>
                <div class="product-image-controls">
                    <label class="product-form-label">
                        <i class="fas fa-link"></i>
                        URL de Imagen Principal
                    </label>
                    <input type="url" name="image_url" class="product-form-input" value="${escapeHtml(urlValue || '')}" placeholder="https://ejemplo.com/imagen.jpg">
                    <input type="hidden" name="image_data" value="${escapeHtml(dataValue)}">
                    <input type="hidden" name="image_original" value="${escapeHtml(currentImage)}">
                    <input type="hidden" name="image_changed" value="0">
                    <input type="file" accept="image/*" class="product-image-file-input" hidden>
                    <div class="product-image-buttons">
                        <button type="button" class="product-image-upload-btn">
                            <i class="fas fa-upload"></i> Subir desde tu dispositivo
                        </button>
                        <button type="button" class="product-image-clear-btn">
                            <i class="fas fa-undo"></i> Restaurar
                        </button>
                    </div>
                    <p class="product-help-text product-image-hint">
                        <i class="fas fa-info-circle"></i>
                        Usa una URL pública o sube una imagen (máx. ${MAX_PRODUCT_IMAGE_MB} MB). Conservaremos la imagen actual si no realizas cambios.
                    </p>
                    <p class="product-image-name">${currentImage ? 'Imagen actual' : ''}</p>
                </div>
            </div>
        </div>
    `;
}

function buildStatusSection(product) {
    const featured = product?.featured ? 'checked' : '';
    const status = product?.status === 'inactive' ? '' : 'checked';

    return `
        <div class="product-section">
            <div class="product-section-header">
                <div class="product-section-icon">
                    <i class="fas fa-toggle-on"></i>
                </div>
                <h3 class="product-section-title">Estado y Configuración</h3>
            </div>
            <div class="product-grid product-grid-2">
                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input type="checkbox" id="productFeatured" name="featured" class="product-toggle-input" ${featured}>
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productFeatured">
                        <strong>Producto Destacado</strong>
                        <small>Aparecerá en la sección de destacados</small>
                    </label>
                </div>
                <div class="product-toggle-container">
                    <div class="product-toggle-switch">
                        <input type="checkbox" id="productStatus" name="status" class="product-toggle-input" ${status}>
                        <span class="product-toggle-slider"></span>
                    </div>
                    <label class="product-toggle-label" for="productStatus">
                        <strong>Producto Activo</strong>
                        <small>Visible en el catálogo y mantenedores</small>
                    </label>
                </div>
                ${ProductModalState.currentCategory?.includes('medicinal') ? `
                    <div class="product-toggle-container">
                        <div class="product-toggle-switch">
                            <input type="checkbox" id="productMedicinal" class="product-toggle-input" checked disabled>
                            <span class="product-toggle-slider"></span>
                        </div>
                        <label class="product-toggle-label" for="productMedicinal">
                            <strong>Producto Medicinal</strong>
                            <small>Marcado automáticamente para categorías medicinales</small>
                        </label>
                    </div>
                    <div class="product-toggle-container">
                        <div class="product-toggle-switch">
                            <input type="checkbox" id="productPrescription" name="requires_prescription" class="product-toggle-input" ${product?.requires_prescription ? 'checked' : ''}>
                            <span class="product-toggle-slider"></span>
                        </div>
                        <label class="product-toggle-label" for="productPrescription">
                            <strong>Requiere Receta</strong>
                            <small>Restringe la venta solo con receta médica</small>
                        </label>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function loadPriceVariants(product) {
    const container = document.getElementById('priceVariantsContainer');
    if (!container) return;

    const variants = Array.isArray(product?.price_variants) ? product.price_variants : [];

    if (variants.length === 0) {
        const fallbackPrice = product?.base_price ?? product?.price ?? '';
        addPriceVariant({
            variant_name: fallbackPrice ? 'Presentación base' : '',
            quantity: product?.unit_size ?? 1,
            unit: product?.base_unit ?? 'g',
            price: fallbackPrice
        });
    } else {
        variants.forEach(variant => addPriceVariant(variant));
    }
}

function addPriceVariant(variant = null) {
    const container = document.getElementById('priceVariantsContainer');
    if (!container) return;

    const index = container.children.length;
    const html = `
        <div class="price-variant-item" data-variant-index="${index}">
            <div class="product-form-group">
                <label class="product-form-label">Nombre</label>
                <input type="text" name="variant_name_${index}" class="product-form-input" value="${variant?.variant_name ?? ''}" placeholder="Ej: 1 gramo" required>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Cantidad</label>
                <input type="number" name="variant_quantity_${index}" class="product-form-input" step="0.1" min="0" value="${variant?.quantity ?? ''}" placeholder="1" required>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Unidad</label>
                <select name="variant_unit_${index}" class="product-form-select">
                    <option value="g" ${variant?.unit === 'g' ? 'selected' : ''}>g</option>
                    <option value="ml" ${variant?.unit === 'ml' ? 'selected' : ''}>ml</option>
                    <option value="unidad" ${variant?.unit === 'unidad' ? 'selected' : ''}>unidad</option>
                </select>
            </div>
            <div class="product-form-group">
                <label class="product-form-label">Precio (CLP)</label>
                <input type="number" name="variant_price_${index}" class="product-form-input" step="1" min="0" value="${variant?.price ?? ''}" placeholder="15000" required>
            </div>
            <button type="button" class="price-variant-remove-btn" data-action="remove-price-variant" title="Eliminar variante">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
}

function removePriceVariant(button) {
    // Soporte para event delegation: si no se pasa button, obtenerlo del evento
    if (!button || !button.closest) {
        // Si se llama desde event delegation, button puede ser el evento
        if (button && button.target) {
            button = button.target.closest('.price-variant-remove-btn');
        } else {
            console.error('removePriceVariant: button no válido');
            return;
        }
    }

    const container = document.getElementById('priceVariantsContainer');
    if (!container) return;

    if (container.children.length <= 1) {
        if (typeof showNotification === 'function') {
            showNotification('Debe existir al menos una variante de precio', 'warning');
        } else if (typeof notify !== 'undefined' && notify.warning) {
            notify.warning('Debe existir al menos una variante de precio');
        }
        return;
    }

    const item = button.closest('.price-variant-item');
    if (item) {
        item.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            item.remove();
            ProductModalState.isDirty = true;
        }, 300);
    }
}

function initializeProductModal() {
    const form = document.getElementById('productForm');
    if (form) { form.addEventListener('input', () => ProductModalState.isDirty = true); }

    setupProductImageUpload(ProductModalState.currentProduct);
}

function handleInputChange(element) {
    ProductModalState.isDirty = true;
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

    if (!form.checkValidity()) {
        form.reportValidity();
        showNotification('Por favor completa los campos requeridos', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const payload = collectFormData(form);
        console.log('📤 Enviando datos del producto:', payload);

        const response = ProductModalState.isEditing
            ? await api.updateProduct(payload.id, payload)
            : await api.createProduct(payload);

        if (!response.success) {
            throw new Error(response.message || 'Error al guardar el producto');
        }

        showNotification(ProductModalState.isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente', 'success');
        closeProductModal();

        if (typeof loadProducts === 'function') {
            await loadProducts(true);
        }
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification(error.message || 'Error al guardar el producto', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-save"></i> ${ProductModalState.isEditing ? 'Guardar Cambios' : 'Crear Producto'}`;
    }
}

function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};

    data.id = document.getElementById('productId')?.value || null;
    data.name = formData.get('name');
    data.sku = formData.get('sku');
    data.description = formData.get('description');
    data.short_description = formData.get('short_description');

    const brandId = formData.get('brand_id');
    data.brand_id = brandId ? parseInt(brandId) : null;

    const basePrice = formData.get('base_price');
    data.base_price = basePrice ? parseFloat(basePrice) : undefined;

    const stockQty = formData.get('stock_quantity');
    data.stock_quantity = stockQty ? parseFloat(stockQty) : 0;

    data.stock_unit = formData.get('stock_unit') || 'gramos';
    data.unit_type = formData.get('unit_type') || null;
    const unitSize = formData.get('unit_size');
    data.unit_size = unitSize ? parseFloat(unitSize) : null;
    data.base_unit = formData.get('base_unit') || null;
    const imageData = formData.get('image_data');
    const imageUrl = (formData.get('image_url') || '').trim();
    const imageOriginal = formData.get('image_original') || '';
    const imageChanged = formData.get('image_changed') === '1';

    if (imageChanged) {
        if (imageData) {
            data.image = imageData;
            data.image_url = '';
        } else if (imageUrl) {
            data.image = imageUrl;
            data.image_url = imageUrl;
        } else {
            data.image = null;
            data.image_url = '';
        }
    } else if (imageOriginal) {
        data.image = imageOriginal;
        data.image_url = imageOriginal.startsWith('data:') ? '' : imageOriginal;
    } else if (imageUrl) {
        data.image = imageUrl;
        data.image_url = imageUrl;
    } else {
        data.image = null;
        data.image_url = '';
    }
    data.featured = document.getElementById('productFeatured')?.checked ? 1 : 0;
    data.status = document.getElementById('productStatus')?.checked ? 'active' : 'inactive';

    const categorySlug = document.getElementById('categorySlug').value;
    data.category_slug = categorySlug;

    if (categorySlug.includes('medicinal')) {
        data.is_medicinal = 1;
        data.requires_prescription = document.getElementById('productPrescription')?.checked ? 1 : 0;
        const medicalCategory = formData.get('medical_category');
        if (medicalCategory) {
            data.medical_category = medicalCategory;
        }
    }

    const cannabinoids = {};
    ['thc', 'cbd', 'cbn', 'cbg', 'thcv'].forEach(key => {
        const value = formData.get(`cannabinoid_${key}`);
        if (value) cannabinoids[key.toUpperCase()] = parseFloat(value);
    });
    if (Object.keys(cannabinoids).length > 0) data.cannabinoid_profile = cannabinoids;

    const terpenes = {};
    ['mirceno', 'limoneno', 'cariofileno', 'pineno', 'linalool', 'humuleno'].forEach(key => {
        const value = formData.get(`terpene_${key}`);
        if (value) terpenes[key.charAt(0).toUpperCase() + key.slice(1)] = parseFloat(value);
    });
    if (Object.keys(terpenes).length > 0) data.terpene_profile = terpenes;

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

    const therapeuticBenefits = formData.get('therapeutic_benefits');
    const therapeuticIndications = formData.get('therapeutic_indications');
    if (therapeuticBenefits || therapeuticIndications) {
        data.therapeutic_info = {
            benefits: therapeuticBenefits,
            indications: therapeuticIndications
        };
    }

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

    const priceVariants = [];
    document.querySelectorAll('.price-variant-item').forEach((item, index) => {
        const name = formData.get(`variant_name_${index}`);
        const quantity = formData.get(`variant_quantity_${index}`);
        const unit = formData.get(`variant_unit_${index}`);
        const price = formData.get(`variant_price_${index}`);

        if (name && quantity && unit && price) {
            priceVariants.push({
                variant_name: name,
                quantity: parseFloat(quantity),
                unit,
                price: parseFloat(price)
            });
        }
    });

    if (priceVariants.length > 0) data.price_variants = priceVariants;

    return data;
}

function setupProductImageUpload(product) {
    const container = document.querySelector('.product-image-upload');
    if (!container) return;

    const dropzone = container.querySelector('.product-image-dropzone');
    const fileInput = container.querySelector('.product-image-file-input');
    const uploadBtn = container.querySelector('.product-image-upload-btn');
    const clearBtn = container.querySelector('.product-image-clear-btn');
    const urlInput = container.querySelector('input[name="image_url"]');
    const dataInput = container.querySelector('input[name="image_data"]');
    const originalInput = container.querySelector('input[name="image_original"]');
    const changedInput = container.querySelector('input[name="image_changed"]');
    const previewImg = container.querySelector('.product-image-preview');
    const fileNameEl = container.querySelector('.product-image-name');
    const placeholder = container.dataset.placeholder || PRODUCT_IMAGE_PLACEHOLDER;

    if (dropzone) {
        dropzone.dataset.allowImageDrag = 'true';
    }

    const originalImage = originalInput?.value || '';

    const applyPreview = (src) => {
        if (!previewImg) return;
        previewImg.src = src || placeholder;
    };

    const setImageState = ({ source, value, meta = {} }) => {
        if (!previewImg) return;

        if (source === 'file') {
            dataInput.value = value;
            urlInput.value = '';
            applyPreview(value);
            if (fileNameEl) {
                fileNameEl.textContent = meta.label || (meta.name ? `${meta.name} · ${formatFileSize(meta.size)}` : 'Imagen adjunta');
            }
            changedInput.value = '1';
        } else if (source === 'url') {
            dataInput.value = '';
            urlInput.value = value;
            applyPreview(value || placeholder);
            if (fileNameEl) fileNameEl.textContent = '';
            changedInput.value = value ? '1' : (originalImage ? '0' : '0');
        } else if (source === 'original') {
            dataInput.value = '';
            if (originalImage.startsWith('data:')) {
                dataInput.value = originalImage;
                urlInput.value = '';
            } else {
                urlInput.value = originalImage || '';
            }
            applyPreview(originalImage || placeholder);
            if (fileNameEl) fileNameEl.textContent = originalImage ? 'Imagen original' : '';
            changedInput.value = '0';
        } else if (source === 'clear') {
            dataInput.value = '';
            urlInput.value = '';
            applyPreview(placeholder);
            if (fileNameEl) fileNameEl.textContent = '';
            changedInput.value = originalImage ? '1' : '0';
        }

        ProductModalState.isDirty = true;
    };

    // Inicializar vista previa
    if (originalImage) {
        applyPreview(originalImage);
        if (originalImage.startsWith('data:')) {
            dataInput.value = originalImage;
            if (fileNameEl) fileNameEl.textContent = 'Imagen adjunta';
        } else {
            urlInput.value = originalImage;
        }
        changedInput.value = '0';
    } else if (urlInput.value) {
        applyPreview(urlInput.value);
        changedInput.value = '0';
    } else {
        applyPreview(placeholder);
        changedInput.value = '0';
    }

    const handleFileSelection = (fileList) => {
        if (!fileList || !fileList.length) return;
        const file = fileList[0];

        if (!file.type.startsWith('image/')) {
            showNotification('Formato no soportado. Selecciona un archivo de imagen.', 'error');
            return;
        }

        if (file.size > MAX_PRODUCT_IMAGE_MB * 1024 * 1024) {
            showNotification(`La imagen excede el límite de ${MAX_PRODUCT_IMAGE_MB} MB.`, 'error');
            return;
        }

        readFileAsDataURL(file)
            .then((dataUrl) => {
                setImageState({
                    source: 'file',
                    value: dataUrl,
                    meta: { name: file.name, size: file.size }
                });
            })
            .catch(() => {
                showNotification('Ocurrió un error al leer el archivo.', 'error');
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
        handleFileSelection(e.target.files);
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
        handleFileSelection(e.dataTransfer.files);
    });

    clearBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        if (originalImage) {
            setImageState({ source: 'original', value: originalImage });
        } else {
            setImageState({ source: 'clear', value: '' });
        }
    });

    urlInput?.addEventListener('change', () => {
        const value = urlInput.value.trim();
        if (value) {
            setImageState({ source: 'url', value });
        } else if (!dataInput.value && originalImage) {
            setImageState({ source: 'original', value: originalImage });
        } else if (!dataInput.value) {
            setImageState({ source: 'clear', value: '' });
        }
    });

    urlInput?.addEventListener('blur', () => {
        const value = urlInput.value.trim();
        if (value) {
            setImageState({ source: 'url', value });
        }
    });

    // Manejar errores de carga de imagen (reemplazo de onerror inline)
    if (previewImg) {
        previewImg.addEventListener('error', function() {
            const fallbackPlaceholder = this.dataset.imagePlaceholder || placeholder || PRODUCT_IMAGE_PLACEHOLDER;
            this.src = fallbackPlaceholder;
        });
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function handleDeleteProduct() {
    if (!ProductModalState.currentProduct?.id) {
        showNotification('No hay producto para eliminar', 'error');
        return;
    }

    const productName = ProductModalState.currentProduct.name || ProductModalState.currentProduct.slug;

    if (!confirm(`¿Eliminar producto "${productName}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await api.deleteProduct(ProductModalState.currentProduct.id);
        if (!response.success) {
            throw new Error(response.message || 'Error al eliminar');
        }

        showNotification('Producto eliminado correctamente', 'success');
        closeProductModal();

        if (typeof loadProducts === 'function') {
            await loadProducts(true);
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification(error.message || 'Error al eliminar el producto', 'error');
    }
}

function closeProductModal(event) {
    if (event && event.target?.id !== 'productEditModal') {
        return;
    }

    if (ProductModalState.isDirty) {
        if (!confirm('Hay cambios sin guardar. ¿Deseas cerrar el modal?')) {
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
            ProductModalState.currentProduct = null;
            ProductModalState.currentCategory = null;
            ProductModalState.currentImage = null;
            ProductModalState.isEditing = false;
            ProductModalState.priceVariants = [];
            ProductModalState.validationErrors = {};
            ProductModalState.isDirty = false;
        }, 200);
    }
}

function handleProductModalEscape(event) {
    if (event.key === 'Escape') {
        closeProductModal();
    }
}

function parseProductJSON(payload) {
    if (!payload) return {};
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload);
        } catch (error) {
            console.warn('Error parseando JSON:', error);
            return {};
        }
    }
    return payload;
}

function adjustColor(color, amount) {
    try {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    } catch (error) {
        return color;
    }
}

function showNotification(message, type = 'info') {
    if (typeof notify !== 'undefined' && typeof notify[type] === 'function') {
        notify[type](message);
    } else {
        alert(message);
    }
}

function openCreateModal() {
    openCategorySelector();
}

function openEditModal(product) {
    if (!product) {
        showNotification('No se encontró información del producto', 'error');
        return;
    }

    let categorySlug = product.category_slug || product.category?.slug;
    if (!categorySlug && product.category_id && Array.isArray(window.allCategories)) {
        const match = window.allCategories.find(cat => cat.id === product.category_id);
        categorySlug = match?.slug;
    }

    if (!categorySlug) {
        showNotification('No se pudo determinar la categoría del producto', 'error');
        return;
    }

    openProductModal(categorySlug, product);
}

window.openCategorySelector = openCategorySelector;
// Exponer funciones en window para event delegation
window.addPriceVariant = addPriceVariant;
window.removePriceVariant = removePriceVariant;
window.handleProductSubmit = handleProductSubmit;
window.handleDeleteProduct = handleDeleteProduct;
window.closeProductModal = closeProductModal;
window.closeCategorySelector = closeCategorySelector;
window.openProductModal = openProductModal;
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.handleInputChange = handleInputChange;
window.handleSelectChange = handleSelectChange;

console.log('✅ Sistema de modales CRUD mejorado cargado correctamente');
