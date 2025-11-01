// frontend/js/productModal.js
// Sistema de modal para productos con soporte medicinal - VERSIÓN LIMPIA
// ✅ OPTIMIZADO POR TIPO DE PRODUCTO: Modal personalizado por categoría
// - Productos MEDICINALES/SEMILLAS: siempre usan productDetailModal (información completa)
// - Productos REGULARES: prefieren growShopModal, fallback a productDetailModal
// - Sistema inteligente que funciona en cualquier página

let currentProduct = null;
let selectedGrams = '5g';

const DEFAULT_IMAGE_MODAL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" text-anchor="middle" x="50" y="55"%3ESin Imagen%3C/text%3E%3C/svg%3E';

// Helper: set image with optional hover to second image
function setElementImageWithHover(imgEl, product) {
    if (!imgEl || !product) return;
    const primary = (product.images && product.images[0] && product.images[0].url) || product.image_url || product.image || DEFAULT_IMAGE_MODAL;
    const secondary = (product.images && product.images[1] && product.images[1].url) || null;
    imgEl.src = primary;
    imgEl.alt = product.name;
    // Hover swap if second image exists
    if (secondary) {
        imgEl.onmouseenter = () => { imgEl.src = secondary; };
        imgEl.onmouseleave = () => { imgEl.src = primary; };
    } else {
        imgEl.onmouseenter = null;
        imgEl.onmouseleave = null;
    }
}

/**
 * Abrir modal con detalles del producto
 */
async function openProductModal(productId) {
    try {
        console.log('🔍 Cargando producto ID:', productId);
        
        let product = null;
        
        // 🆕 INTENTAR PRIMERO USAR PRODUCTOS YA CARGADOS (para producción con JSON estático)
        if (typeof productManager !== 'undefined' && productManager.products && productManager.products.length > 0) {
            product = productManager.products.find(p => p.id === parseInt(productId));
            if (product) {
                console.log('✅ Producto encontrado en cache local:', product);
            }
        }
        
        // Si no está en cache, intentar cargar desde API
        if (!product) {
            try {
                const response = await api.getProductById(productId);
                if (response.success) {
                    product = response.data.product || response.data;
                    console.log('✅ Producto cargado desde API:', product);
                }
            } catch (apiError) {
                console.warn('⚠️ No se pudo cargar producto desde API, intentando desde JSON estático...', apiError);
                
                // Fallback: Intentar cargar desde JSON estático
                if (typeof api !== 'undefined' && api.loadStaticJSON) {
                    try {
                        const staticData = await api.loadStaticJSON('products.json');
                        if (staticData && staticData.success && staticData.data && staticData.data.products) {
                            product = staticData.data.products.find(p => p.id === parseInt(productId));
                            if (product) {
                                console.log('✅ Producto encontrado en JSON estático:', product);
                            }
                        }
                    } catch (staticError) {
                        console.error('❌ Error al cargar desde JSON estático:', staticError);
                    }
                }
            }
        }
        
        if (!product) {
            throw new Error('No se pudo cargar el producto desde ninguna fuente');
        }
        
        currentProduct = product;
        
        console.log('✅ Producto cargado:', product);
        
        const attrs = typeof product.attributes === 'string' 
            ? JSON.parse(product.attributes || '{}')
            : (product.attributes || {});
        
        const isMedicinal = product.requires_prescription || product.category === 'medicinal';
        const isSeed = product.category === 'semillas_coleccion';
        const isRegular = !isMedicinal && !isSeed;
        
        // 🆕 SISTEMA DE MODALES PERSONALIZADO POR CATEGORÍA
        const modalType = getModalType(product);
        console.log(`📋 Producto: ${product.name} → Modal: ${modalType}`);
        
        switch (modalType) {
            case 'medicalFlower':
                openMedicalFlowerModal(product, attrs);
                break;
            case 'medicalOil':
                openMedicalOilModal(product, attrs);
                break;
            case 'medicalConcentrate':
                openMedicalConcentrateModal(product, attrs);
                break;
            case 'seed':
                openSeedModal(product, attrs);
                break;
            case 'vaporizer':
                openVaporizerModal(product, attrs);
                break;
            case 'apparel':
                openApparelModal(product, attrs);
                break;
            case 'growShop':
                openGrowShopModal(product, attrs);
                break;
            default:
                // Fallback al modal genérico
                console.warn('⚠️ Tipo de modal no reconocido, usando fallback');
                openGrowShopModal(product, attrs);
        }
        
    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al cargar los detalles del producto');
        }
    }
}

/**
 * 🆕 DETERMINAR TIPO DE MODAL SEGÚN CATEGORÍA Y TIPO DE PRODUCTO
 */
function getModalType(product) {
    // Mapeo directo por categoría del producto
    const categoryModalMap = {
        // Productos medicinales
        'medicinal-flores': 'medicalFlower',
        'Flores Medicinales': 'medicalFlower',
        'medicinal-aceites': 'medicalOil',
        'Aceites Medicinales': 'medicalOil',
        'medicinal-concentrados': 'medicalConcentrate',
        'Concentrados Medicinales': 'medicalConcentrate',
        
        // Semillas
        'semillas': 'seed',
        'Semillas': 'seed',
        'semillas_coleccion': 'seed',
        
        // Vaporizadores
        'vaporizadores': 'vaporizer',
        'Vaporizadores': 'vaporizer',
        
        // Ropa y merchandising
        'ropa': 'apparel',
        'Ropa': 'apparel',
        'merchandising': 'apparel',
        'Merchandising': 'apparel',
        
        // CBD y otros productos regulares
        'CBD': 'growShop',
        'Accesorios': 'growShop',
        'accesorios': 'growShop'
    };
    
    // Buscar por categoría exacta primero
    if (categoryModalMap[product.category]) {
        return categoryModalMap[product.category];
    }
    
    // Buscar por product_type si está disponible
    if (product.product_type) {
        const typeModalMap = {
            'flower': product.is_medicinal ? 'medicalFlower' : 'growShop',
            'oil': product.is_medicinal ? 'medicalOil' : 'growShop',
            'concentrate': product.is_medicinal ? 'medicalConcentrate' : 'growShop',
            'seed': 'seed',
            'accessory': 'vaporizer', // vaporizadores son accesorios
            'apparel': 'apparel'
        };
        
        if (typeModalMap[product.product_type]) {
            return typeModalMap[product.product_type];
        }
    }
    
    // Fallback por propiedades del producto
    if (product.requires_prescription || product.is_medicinal) {
        // Es medicinal, determinar subtipo
        if (product.category?.toLowerCase().includes('aceite') || product.product_type === 'oil') {
            return 'medicalOil';
        } else if (product.category?.toLowerCase().includes('concentrado') || product.product_type === 'concentrate') {
            return 'medicalConcentrate';
        } else {
            return 'medicalFlower'; // Por defecto flores medicinales
        }
    }
    
    // Por defecto grow shop para productos regulares
    return 'growShop';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA FLORES MEDICINALES
 */
function openMedicalFlowerModal(product, attrs) {
    const modal = document.getElementById('medicalFlowerModal');
    if (!modal) {
        console.warn('⚠️ Modal medicalFlowerModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    console.log('🌿 Abriendo modal de flor medicinal:', product);
    console.log('📊 Datos completos del producto:', JSON.stringify(product, null, 2));
    
    // Extraer información medicinal si está anidada
    let medicinalInfo = {};
    if (product.medicinal_info) {
        try {
            medicinalInfo = typeof product.medicinal_info === 'string' 
                ? JSON.parse(product.medicinal_info) 
                : product.medicinal_info;
        } catch (e) {
            console.warn('⚠️ Error parseando medicinal_info:', e);
        }
    }
    
    // Datos básicos
    const setName = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '';
    };
    
    setName('medFlowerName', product.name);
    setName('medFlowerBreeder', product.breeder || attrs?.breeder || 'Apexremedy');
    setName('medFlowerSku', product.sku || 'N/A');
    setName('medFlowerCategory', formatCategoryName(product.category || product.category_slug));
    
    // Descripción completa
    const descEl = document.getElementById('medFlowerDescription');
    if (descEl) {
        descEl.textContent = product.description || product.short_description || 'Sin descripción disponible';
    }
    
    // Imagen
    const image = document.getElementById('medFlowerImage');
    if (image) {
        setElementImageWithHover(image, product);
    }
    
    // Precio y stock
    setName('medFlowerPrice', `$${formatPrice(product.base_price || product.price || 0)}`);
    setName('medFlowerStock', formatStock(product.stock_quantity || product.stock || 0, product.stock_unit || 'g'));
    
    // 🆕 Extraer campos desde medicinal_info si existen
    const cannabinoidProfile = product.cannabinoid_profile || medicinalInfo?.cannabinoid_profile || attrs?.cannabinoid_profile;
    const terpeneProfile = product.terpene_profile || medicinalInfo?.terpene_profile || attrs?.terpene_profile;
    const strainInfo = product.strain_info || medicinalInfo?.strain_info || attrs?.strain_info;
    const therapeuticInfo = product.therapeutic_info || medicinalInfo?.therapeutic_info || attrs?.therapeutic_info;
    const usageInfo = product.usage_info || medicinalInfo?.usage_info || attrs?.usage_info;
    const safetyInfo = product.safety_info || medicinalInfo?.safety_info || attrs?.safety_info;
    
    // Perfil cannabinoide
    if (cannabinoidProfile) {
        console.log('✅ Mostrando perfil cannabinoide:', cannabinoidProfile);
        fillCannabinoidProfile(cannabinoidProfile, 'medFlowerCannabinoids');
    } else {
        console.warn('⚠️ No se encontró perfil cannabinoide');
    }
    
    // Perfil terpénico
    if (terpeneProfile) {
        console.log('✅ Mostrando perfil terpénico:', terpeneProfile);
        fillTerpeneProfile(terpeneProfile, 'medFlowerTerpenes');
    }
    
    // Información de cepa
    if (strainInfo) {
        console.log('✅ Mostrando información de cepa:', strainInfo);
        fillStrainInfo(strainInfo, 'medFlowerStrain');
    }
    
    // Información terapéutica
    if (therapeuticInfo) {
        console.log('✅ Mostrando información terapéutica:', therapeuticInfo);
        fillTherapeuticInfo(therapeuticInfo, 'medFlowerTherapeutic');
    }
    
    // Información de uso
    if (usageInfo) {
        console.log('✅ Mostrando información de uso:', usageInfo);
        fillUsageInfo(usageInfo, 'medFlowerUsage');
    }
    
    // Información de seguridad
    if (safetyInfo) {
        console.log('✅ Mostrando información de seguridad:', safetyInfo);
        fillSafetyInfo(safetyInfo, 'medFlowerSafety');
    }
    
    // 🆕 Información adicional desde attributes
    if (attrs) {
        if (attrs.cannabinoids) {
            fillCannabinoidProfile(attrs.cannabinoids, 'medFlowerCannabinoids');
        }
        if (attrs.terpenes) {
            fillTerpeneProfile(attrs.terpenes, 'medFlowerTerpenes');
        }
        if (attrs.effects) {
            const effectsEl = document.getElementById('medFlowerEffects');
            if (effectsEl) effectsEl.textContent = attrs.effects;
        }
        if (attrs.flavor) {
            const flavorEl = document.getElementById('medFlowerFlavor');
            if (flavorEl) flavorEl.textContent = attrs.flavor;
        }
    }
    
    // Crear selector de gramaje si hay variantes de precio
    createGramSelectorForModal(product, 'medFlowerGramsContainer', 'medFlowerPrice');
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA ACEITES MEDICINALES
 */
function openMedicalOilModal(product, attrs) {
    const modal = document.getElementById('medicalOilModal');
    if (!modal) {
        console.warn('⚠️ Modal medicalOilModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    // Datos básicos
    document.getElementById('medOilName').textContent = product.name;
    document.getElementById('medOilBreeder').textContent = product.breeder || 'Apexremedy';
    document.getElementById('medOilSku').textContent = product.sku || 'N/A';
    document.getElementById('medOilCategory').textContent = formatCategoryName(product.category);
    
    // Imagen
    const image = document.getElementById('medOilImage');
    setElementImageWithHover(image, product);
    
    // Precio y stock
    document.getElementById('medOilPrice').textContent = `$${formatPrice(product.base_price || product.price)}`;
    document.getElementById('medOilStock').textContent = formatStock(product.stock_quantity || product.stock, product.stock_unit || 'unidades');
    
    // Especificaciones técnicas
    if (product.specifications) {
        fillSpecifications(product.specifications, 'medOilSpecs');
    }
    
    // Perfil cannabinoide
    if (product.cannabinoid_profile) {
        fillCannabinoidProfile(product.cannabinoid_profile, 'medOilCannabinoids');
    }
    
    // Información de extracción
    if (product.strain_info) {
        fillStrainInfo(product.strain_info, 'medOilStrain');
    }
    
    // Atributos físicos
    if (product.attributes) {
        fillAttributes(product.attributes, 'medOilAttributes');
    }
    
    // Información terapéutica
    if (product.therapeutic_info) {
        fillTherapeuticInfo(product.therapeutic_info, 'medOilTherapeutic');
    }
    
    // Información de uso
    if (product.usage_info) {
        fillUsageInfo(product.usage_info, 'medOilUsage');
    }
    
    // Información de seguridad
    if (product.safety_info) {
        fillSafetyInfo(product.safety_info, 'medOilSafety');
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA CONCENTRADOS MEDICINALES
 */
function openMedicalConcentrateModal(product, attrs) {
    const modal = document.getElementById('medicalConcentrateModal');
    if (!modal) {
        console.warn('⚠️ Modal medicalConcentrateModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    // Datos básicos
    document.getElementById('medConcentrateName').textContent = product.name;
    document.getElementById('medConcentrateBreeder').textContent = product.breeder || 'Apexremedy';
    document.getElementById('medConcentrateSku').textContent = product.sku || 'N/A';
    document.getElementById('medConcentrateCategory').textContent = formatCategoryName(product.category);
    
    // Imagen
    const image = document.getElementById('medConcentrateImage');
    setElementImageWithHover(image, product);
    
    // Precio y stock
    document.getElementById('medConcentratePrice').textContent = `$${formatPrice(product.base_price || product.price)}`;
    document.getElementById('medConcentrateStock').textContent = formatStock(product.stock_quantity || product.stock, product.stock_unit || 'g');
    
    // Perfil cannabinoide
    if (product.cannabinoid_profile) {
        fillCannabinoidProfile(product.cannabinoid_profile, 'medConcentrateCannabinoids');
    }
    
    // Información de cepa
    if (product.strain_info) {
        fillStrainInfo(product.strain_info, 'medConcentrateStrain');
    }
    
    // Información terapéutica
    if (product.therapeutic_info) {
        fillTherapeuticInfo(product.therapeutic_info, 'medConcentrateTherapeutic');
    }
    
    // Información de uso
    if (product.usage_info) {
        fillUsageInfo(product.usage_info, 'medConcentrateUsage');
    }
    
    // Crear selector de gramaje si hay variantes de precio
    createGramSelectorForModal(product, 'medConcentrateGramsContainer', 'medConcentratePrice');
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA SEMILLAS
 */
function openSeedModal(product, attrs) {
    const modal = document.getElementById('seedModal');
    if (!modal) {
        console.warn('⚠️ Modal seedModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    // Datos básicos
    document.getElementById('seedName').textContent = product.name;
    document.getElementById('seedBreeder').textContent = product.breeder || attrs.breeder || 'Banco de semillas';
    document.getElementById('seedSku').textContent = product.sku || 'N/A';
    document.getElementById('seedCategory').textContent = formatCategoryName(product.category);
    document.getElementById('seedDescription').textContent = product.description || 'Sin descripción disponible';
    
    // Imagen
    const image = document.getElementById('seedImage');
    setElementImageWithHover(image, product);
    
    // Precio y stock
    document.getElementById('seedPrice').textContent = `$${formatPrice(product.base_price || product.price)}`;
    document.getElementById('seedStock').textContent = formatStock(product.stock_quantity || product.stock, product.stock_unit || 'packs');
    
    // Información de cepa
    if (product.strain_info) {
        fillStrainInfo(product.strain_info, 'seedStrain');
    }
    
    // Especificaciones del pack
    if (product.specifications) {
        fillSpecifications(product.specifications, 'seedSpecs');
    }
    
    // Atributos de cultivo
    if (product.attributes) {
        fillAttributes(product.attributes, 'seedAttributes');
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA VAPORIZADORES
 */
function openVaporizerModal(product, attrs) {
    const modal = document.getElementById('vaporizerModal');
    if (!modal) {
        console.warn('⚠️ Modal vaporizerModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    // Datos básicos
    document.getElementById('vaporizerName').textContent = product.name;
    document.getElementById('vaporizerBrand').textContent = product.breeder || attrs.brand || 'Marca Premium';
    document.getElementById('vaporizerSku').textContent = product.sku || 'N/A';
    document.getElementById('vaporizerCategory').textContent = formatCategoryName(product.category);
    document.getElementById('vaporizerDescription').textContent = product.description || 'Sin descripción disponible';
    
    // Imagen
    const image = document.getElementById('vaporizerImage');
    setElementImageWithHover(image, product);
    
    // Precio y stock
    document.getElementById('vaporizerPrice').textContent = `$${formatPrice(product.base_price || product.price)}`;
    document.getElementById('vaporizerStock').textContent = formatStock(product.stock_quantity || product.stock, product.stock_unit || 'unidades');
    
    // Especificaciones técnicas
    if (product.specifications) {
        fillSpecifications(product.specifications, 'vaporizerSpecs');
    }
    
    // Características
    if (product.attributes) {
        fillAttributes(product.attributes, 'vaporizerAttributes');
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 MODAL ESPECIALIZADO PARA ROPA/MERCHANDISING
 */
function openApparelModal(product, attrs) {
    const modal = document.getElementById('apparelModal');
    if (!modal) {
        console.warn('⚠️ Modal apparelModal no encontrado, usando fallback');
        openGrowShopModal(product, attrs);
        return;
    }
    
    // Datos básicos
    document.getElementById('apparelName').textContent = product.name;
    document.getElementById('apparelSku').textContent = product.sku || 'N/A';
    document.getElementById('apparelCategory').textContent = formatCategoryName(product.category);
    document.getElementById('apparelDescription').textContent = product.description || 'Sin descripción disponible';
    
    // Imagen
    const image = document.getElementById('apparelImage');
    setElementImageWithHover(image, product);
    
    // Precio y stock
    document.getElementById('apparelPrice').textContent = `$${formatPrice(product.base_price || product.price)}`;
    document.getElementById('apparelStock').textContent = formatStock(product.stock_quantity || product.stock, product.stock_unit || 'unidades');
    
    // Especificaciones
    if (product.specifications) {
        fillSpecifications(product.specifications, 'apparelSpecs');
    }
    
    // Características
    if (product.attributes) {
        fillAttributes(product.attributes, 'apparelAttributes');
    }
    
    // Mostrar modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * 🆕 Abrir modal estándar para productos regulares (index.html)
 */
function openRegularProductModal(product, attrs) {
    clearModalFields();
    applyModalTheme(false, false, true, attrs);
    
    // Llenar datos básicos con verificación
    const elements = {
        'modalProductName': product.name,
        'modalProductBreeder': product.breeder || '',
        'modalDescription': product.description || 'Sin descripción disponible',
        'modalSku': product.sku || 'N/A',
        'modalCategory': formatCategoryName(product.category)
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Imagen
    const modalImage = document.getElementById('modalProductImage');
    if (modalImage) {
        setElementImageWithHover(modalImage, product);
    }
    
    // Configurar badge y producto regular
    setupRarityBadge(product, attrs, false, false);
    setupRegularProduct(product);
    
    // Mostrar modal
    const modal = document.getElementById('productDetailModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 🆕 Abrir modal de Grow Shop para productos regulares
 */
function openGrowShopModal(product, attrs) {
    // Llenar datos básicos con verificación de existencia
    const elements = {
        'growShopProductName': product.name,
        'growShopProductBreeder': product.breeder || '',
        'growShopCategoryBadge': formatCategoryName(product.category),
        'growShopDescription': product.description || 'Sin descripción disponible',
        'growShopSku': product.sku || 'N/A',
        'growShopCategory': formatCategoryName(product.category),
        'growShopProductPrice': `${formatPrice(product.price)}`,
        'growShopProductStock': formatStock(product.stock, 'unid'),
        'growShopStockInfo': (product.stock && product.stock > 0) ? 'Disponible' : 'Agotado'
    };
    
    // Establecer textContent solo si el elemento existe
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`⚠️ Elemento no encontrado: ${id}`);
        }
    });
    
    // Imagen
    const modalImage = document.getElementById('growShopProductImage');
    if (modalImage) {
        setElementImageWithHover(modalImage, product);
    }
    
    // Badge destacado
    const featuredBadge = document.getElementById('growShopFeaturedBadge');
    if (featuredBadge) {
        if (product.featured) {
            featuredBadge.classList.remove('hidden');
        } else {
            featuredBadge.classList.add('hidden');
        }
    }
    
    // Información del producto
    const infoContainer = document.getElementById('growShopProductInfo');
    if (infoContainer) {
        infoContainer.innerHTML = `
            <div class="flex justify-between items-center pb-2 border-b border-gray-200">
                <span class="text-sm text-gray-600 font-medium">Categoría</span>
                <span class="text-sm font-semibold text-gray-900">${formatCategoryName(product.category)}</span>
            </div>
            ${product.sku ? `
            <div class="flex justify-between items-center pb-2 border-b border-gray-200">
                <span class="text-sm text-gray-600 font-medium">SKU</span>
                <span class="text-sm font-mono text-gray-900">${product.sku}</span>
            </div>` : ''}
            ${product.breeder ? `
            <div class="flex justify-between items-center pb-2 border-b border-gray-200">
                <span class="text-sm text-gray-600 font-medium">Marca/Fabricante</span>
                <span class="text-sm font-semibold text-gray-900">${product.breeder}</span>
            </div>` : ''}
            <div class="flex justify-between items-center pb-2 border-b border-gray-200">
                <span class="text-sm text-gray-600 font-medium">Precio</span>
                <span class="text-lg font-bold text-green-600">${formatPrice(product.price)}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600 font-medium">Disponibilidad</span>
                <span class="text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatStock(product.stock, 'unidades')}
                </span>
            </div>
        `;
    }
    
    // Mostrar modal de Grow Shop
    const growShopModal = document.getElementById('growShopModal');
    if (growShopModal) {
        growShopModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('❌ Modal growShopModal no encontrado');
    }
}

/**
 * 🆕 Limpiar todos los campos del modal
 */
function clearModalFields() {
    // Campos básicos
    const fields = [
        'modalProductName',
        'modalProductBreeder',
        'modalProductPrice',
        'modalProductStock',
        'modalStockInfo',
        'modalDescription',
        'modalSku',
        'modalCategory',
        'modalStrainType',
        'modalGenetics',
        'modalThc',
        'modalCbd',
        'modalFlowering',
        'modalDifficulty',
        'modalAromas',
        'modalEffects'
    ];
    
    fields.forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            if (el.tagName === 'DIV') {
                el.innerHTML = '';
            } else {
                el.textContent = '';
            }
        }
    });
    
    // Limpiar selector de gramos si existe
    const gramSelector = document.getElementById('gramSelectorMedicinal');
    if (gramSelector) {
        gramSelector.remove();
    }
    
    // Limpiar imagen
    const modalImage = document.getElementById('modalProductImage');
    if (modalImage) {
        modalImage.src = DEFAULT_IMAGE_MODAL;
        modalImage.onmouseenter = null;
        modalImage.onmouseleave = null;
    }
}

function applyModalTheme(isMedicinal, isSeed, isRegular, attrs) {
    const modal = document.getElementById('productDetailModal');
    const modalContent = modal?.querySelector('.bg-gradient-to-br');
    const modalHeader = document.getElementById('modalHeader');
    const modalFooter = document.getElementById('modalFooter');
    
    if (!modalHeader || !modalFooter || !modalContent) return;
    
    let headerGradient, bgGradient;
    
    if (isMedicinal) {
        // MEDICINAL: Rojo
        headerGradient = 'bg-gradient-to-r from-red-500 via-red-300 to-red-500';
        bgGradient = 'bg-gradient-to-br from-red-10 to-red-60';
    } else if (isSeed) {
        // SEMILLAS: Colores según tipo de cepa (Sativa/Indica/Híbrida)
        const strainType = attrs.strain_type?.toLowerCase() || 'híbrida';
        
        if (strainType.includes('sativa')) {
            // SATIVA: Verde energético
            headerGradient = 'bg-gradient-to-r from-emerald-500 via-green-300 to-emerald-500';
            bgGradient = 'bg-gradient-to-br from-emerald-10 to-green-60';
        } else if (strainType.includes('indica')) {
            // INDICA: Púrpura/Violeta relajante
            headerGradient = 'bg-gradient-to-r from-violet-500 via-purple-300 to-violet-500';
            bgGradient = 'bg-gradient-to-br from-violet-10 to-purple-60';
        } else {
            // HÍBRIDA: Ámbar/Dorado (balance)
            headerGradient = 'bg-gradient-to-r from-amber-500 via-orange-300 to-amber-500';
            bgGradient = 'bg-gradient-to-br from-amber-10 to-amber-60';
        }
    } else {
        // GROW SHOP: Gris elegante
        headerGradient = 'bg-gradient-to-r from-gray-500 via-gray-300 to-gray-500';
        bgGradient = 'bg-gradient-to-br from-gray-10 to-gray-60';
    }
    
    modalHeader.className = `${headerGradient} p-3 flex-shrink-0`;
    modalFooter.className = `${headerGradient} px-4 py-2 flex-shrink-0`;
    modalContent.className = `${bgGradient} rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col`;
    
    const nameEl = document.getElementById('modalProductName');
    const breederEl = document.getElementById('modalProductBreeder');
    if (nameEl) nameEl.className = 'text-2xl font-bold text-white drop-shadow-lg';
    if (breederEl) breederEl.className = 'text-gray-100 text-xs mt-1';
}

function setupRarityBadge(product, attrs, isMedicinal, isSeed) {
    const rarityBadge = document.getElementById('modalRarityBadge');
    if (!rarityBadge) return;
    
    if (isMedicinal) {
        rarityBadge.textContent = '🏥 MEDICINAL';
        rarityBadge.className = 'px-3 py-1 rounded-full font-bold text-xs shadow-lg bg-red-600 text-white';
    } else if (isSeed) {
        const rarity = attrs.rarity || 'común';
        const rarityColors = {
            'común': 'bg-gray-400 text-gray-900',
            'poco común': 'bg-green-500 text-white',
            'rara': 'bg-blue-500 text-white',
            'épica': 'bg-purple-600 text-white',
            'legendaria': 'bg-orange-500 text-white',
            'galardonado': 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white'
        };
        rarityBadge.textContent = rarity.toUpperCase();
        rarityBadge.className = `px-3 py-1 rounded-full font-bold text-xs shadow-lg ${rarityColors[rarity] || rarityColors['común']}`;
    } else {
        rarityBadge.textContent = formatCategoryName(product.category);
        rarityBadge.className = 'px-3 py-1 rounded-full font-bold text-xs shadow-lg bg-gray-600 text-white';
    }
}

function setupMedicinalProduct(product, attrs) {
    console.log('💊 Configurando producto medicinal:', product.name);
    
    // ✅ FIX: Usar medicinal_prices en lugar de price_variants
    let priceVariants = {};
    
    // Primero intentar con medicinal_prices
    if (product.medicinal_prices) {
        try {
            priceVariants = typeof product.medicinal_prices === 'string' 
                ? JSON.parse(product.medicinal_prices) 
                : product.medicinal_prices;
            console.log('✅ medicinal_prices parseado:', priceVariants);
        } catch (e) {
            console.error('❌ Error parseando medicinal_prices:', e);
        }
    }
    
    // Si no tiene medicinal_prices, intentar con price_variants (legacy)
    if (!priceVariants || Object.keys(priceVariants).length === 0) {
        if (product.price_variants) {
            try {
                priceVariants = typeof product.price_variants === 'string' 
                    ? JSON.parse(product.price_variants) 
                    : product.price_variants;
                console.log('ℹ️ Usando price_variants (legacy):', priceVariants);
            } catch (e) {
                console.error('❌ Error parseando price_variants:', e);
            }
        }
    }
    
    // Si aún no hay precios, usar precio base
    if (!priceVariants || Object.keys(priceVariants).length === 0) {
        console.warn('⚠️ No hay precios configurados, usando precio base');
        priceVariants = { '5g': product.price || 0 };
    }
    
    // Limpiar valores null
    const cleanPrices = {};
    for (const [key, value] of Object.entries(priceVariants)) {
        if (value !== null && value !== 'null' && value > 0) {
            cleanPrices[key] = parseInt(value);
        }
    }
    
    // Si después de limpiar no hay precios, usar precio base
    const finalPrices = Object.keys(cleanPrices).length > 0 ? cleanPrices : { '5g': product.price || 0 };
    
    // Seleccionar 5g por defecto, o la primera opción disponible
    const availableGrams = Object.keys(finalPrices);
    selectedGrams = availableGrams.includes('5g') ? '5g' : availableGrams[0];
    
    console.log('💊 Precios finales:', finalPrices);
    console.log('💊 Gramaje seleccionado:', selectedGrams);
    
    // Stock y precio
    updateMedicinalPrice(finalPrices);
    
    const stockEl = document.getElementById('modalProductStock');
    const stockInfoEl = document.getElementById('modalStockInfo');
    if (stockEl) stockEl.textContent = formatStock(product.stock, 'g');
    if (stockInfoEl) stockInfoEl.textContent = (product.stock && product.stock > 0) ? 'Disponible' : 'Agotado';
    
    let medInfo = {};
    try {
        medInfo = typeof product.medicinal_info === 'string' 
            ? JSON.parse(product.medicinal_info) 
            : (product.medicinal_info || {});
    } catch (e) {
        console.error('Error parsing medicinal_info:', e);
    }
    
    // Llenar campos básicos de semillas si existen
    const strainTypeEl = document.getElementById('modalStrainType');
    const geneticsEl = document.getElementById('modalGenetics');
    const thcEl = document.getElementById('modalThc');
    const cbdEl = document.getElementById('modalCbd');
    const floweringEl = document.getElementById('modalFlowering');
    const difficultyEl = document.getElementById('modalDifficulty');
    
    if (strainTypeEl) strainTypeEl.textContent = attrs.strain_type || 'Medicinal';
    if (geneticsEl) geneticsEl.textContent = attrs.genetics || medInfo.therapeutic_use || 'Uso médico';
    if (thcEl) thcEl.textContent = `${attrs.thc_percent || 0}%`;
    if (cbdEl) cbdEl.textContent = `${attrs.cbd_percent || 0}%`;
    if (floweringEl) floweringEl.textContent = attrs.flowering_time || 'Variable';
    if (difficultyEl) difficultyEl.textContent = attrs.difficulty || 'N/A';

// ✅ LLENAR AROMAS
const aromasEl = document.getElementById('modalAromas');
if (aromasEl) {
    let aromas = [];
    if (product.medicinal_aromas) {
        aromas = typeof product.medicinal_aromas === 'string' 
            ? product.medicinal_aromas.split(',').map(a => a.trim())
            : product.medicinal_aromas;
    } else if (attrs.aromas) {
        aromas = attrs.aromas;
    }
    
    if (aromas.length > 0) {
        aromasEl.innerHTML = aromas.map(a => 
            `<span class="px-2 py-1 bg-white text-pink-700 rounded-full text-xs font-medium shadow-sm">${a}</span>`
        ).join('');
        console.log('✅ Aromas:', aromas);
    }
}

// ✅ LLENAR EFECTOS
const effectsEl = document.getElementById('modalEffects');
if (effectsEl) {
    let effects = [];
    if (product.medicinal_effects) {
        effects = typeof product.medicinal_effects === 'string'
            ? product.medicinal_effects.split(',').map(e => e.trim())
            : product.medicinal_effects;
    } else if (attrs.effects) {
        effects = attrs.effects;
    }
    
    if (effects.length > 0) {
        effectsEl.innerHTML = effects.map(e => 
            `<span class="px-2 py-1 bg-white text-blue-700 rounded-full text-xs font-medium shadow-sm">${e}</span>`
        ).join('');
        console.log('✅ Efectos:', effects);
    }
}

// ✅ THC/CBD/CBN MEDICINALES
if (product.medicinal_thc && thcEl) {
    thcEl.textContent = `${product.medicinal_thc}%`;
}
if (product.medicinal_cbd && cbdEl) {
    cbdEl.textContent = `${product.medicinal_cbd}%`;
}
const cbnEl = document.getElementById('modalCbn');
if (cbnEl && product.medicinal_cbn) {
    cbnEl.textContent = `${product.medicinal_cbn}%`;
}

// ✅ TIPO Y GENÉTICA
if (product.medicinal_strain_type && strainTypeEl) {
    strainTypeEl.textContent = product.medicinal_strain_type;
}
if (product.medicinal_genetics && geneticsEl) {
    geneticsEl.textContent = product.medicinal_genetics;
}

    // ✅ =====================================================
    // ✅ NUEVO CÓDIGO - LLENAR INFORMACIÓN MEDICINAL COMPLETA
    // ✅ =====================================================
    console.log('💊 Llenando información medicinal:', medInfo);
    
    // Campos de información terapéutica
    const therapeuticEl = document.getElementById('modalTherapeuticUse');
    const dosageEl = document.getElementById('modalDosage');
    const administrationEl = document.getElementById('modalAdministration');
    const contraindicationsEl = document.getElementById('modalContraindications');
    const sideEffectsEl = document.getElementById('modalSideEffects');
    
    if (therapeuticEl) {
        therapeuticEl.textContent = medInfo.therapeutic_use || 'No especificado';
        console.log('✅ Uso terapéutico:', medInfo.therapeutic_use);
    } else {
        console.warn('⚠️ Elemento modalTherapeuticUse no encontrado');
    }
    
    if (dosageEl) {
        dosageEl.textContent = medInfo.dosage_recommendation || 'Consultar con profesional';
        console.log('✅ Dosificación:', medInfo.dosage_recommendation);
    } else {
        console.warn('⚠️ Elemento modalDosage no encontrado');
    }
    
    if (administrationEl) {
        administrationEl.textContent = medInfo.administration || 'No especificado';
        console.log('✅ Administración:', medInfo.administration);
    } else {
        console.warn('⚠️ Elemento modalAdministration no encontrado');
    }
    
    if (contraindicationsEl) {
        contraindicationsEl.textContent = medInfo.contraindications || 'Consultar con profesional';
        console.log('✅ Contraindicaciones:', medInfo.contraindications);
    } else {
        console.warn('⚠️ Elemento modalContraindications no encontrado');
    }
    
    if (sideEffectsEl) {
        sideEffectsEl.textContent = medInfo.side_effects || 'No especificado';
        console.log('✅ Efectos secundarios:', medInfo.side_effects);
    } else {
        console.warn('⚠️ Elemento modalSideEffects no encontrado');
    }
    
    // Campos adicionales de la cepa medicinal
    const medicinalThcEl = document.getElementById('modalMedicinalThc');
    const medicinalCbdEl = document.getElementById('modalMedicinalCbd');
    const medicinalCbnEl = document.getElementById('modalMedicinalCbn');
    const medicinalStrainTypeEl = document.getElementById('modalMedicinalStrainType');
    const medicinalGeneticsEl = document.getElementById('modalMedicinalGenetics');
    const medicinalOriginEl = document.getElementById('modalMedicinalOrigin');
    const medicinalAromasEl = document.getElementById('modalMedicinalAromas');
    const medicinalEffectsEl = document.getElementById('modalMedicinalEffects');
    const medicinalTerpenesEl = document.getElementById('modalMedicinalTerpenes');
    const medicinalFlavorEl = document.getElementById('modalMedicinalFlavor');
    
    if (medicinalThcEl && product.medicinal_thc) {
        medicinalThcEl.textContent = `${product.medicinal_thc}%`;
        console.log('✅ THC medicinal:', product.medicinal_thc);
    }
    
    if (medicinalCbdEl && product.medicinal_cbd) {
        medicinalCbdEl.textContent = `${product.medicinal_cbd}%`;
        console.log('✅ CBD medicinal:', product.medicinal_cbd);
    }
    
    if (medicinalCbnEl && product.medicinal_cbn) {
        medicinalCbnEl.textContent = `${product.medicinal_cbn}%`;
        console.log('✅ CBN medicinal:', product.medicinal_cbn);
    }
    
    if (medicinalStrainTypeEl && product.medicinal_strain_type) {
        medicinalStrainTypeEl.textContent = product.medicinal_strain_type;
        console.log('✅ Tipo de cepa medicinal:', product.medicinal_strain_type);
    }
    
    if (medicinalGeneticsEl && product.medicinal_genetics) {
        medicinalGeneticsEl.textContent = product.medicinal_genetics;
        console.log('✅ Genética medicinal:', product.medicinal_genetics);
    }
    
    if (medicinalOriginEl && product.medicinal_origin) {
        medicinalOriginEl.textContent = product.medicinal_origin;
        console.log('✅ Origen medicinal:', product.medicinal_origin);
    }
    
    if (medicinalAromasEl && product.medicinal_aromas) {
        medicinalAromasEl.textContent = product.medicinal_aromas;
        console.log('✅ Aromas medicinales:', product.medicinal_aromas);
    }
    
    if (medicinalEffectsEl && product.medicinal_effects) {
        medicinalEffectsEl.textContent = product.medicinal_effects;
        console.log('✅ Efectos medicinales:', product.medicinal_effects);
    }
    
    if (medicinalTerpenesEl && product.medicinal_terpenes) {
        medicinalTerpenesEl.textContent = product.medicinal_terpenes;
        console.log('✅ Terpenos medicinales:', product.medicinal_terpenes);
    }
    
    if (medicinalFlavorEl && product.medicinal_flavor) {
        medicinalFlavorEl.textContent = product.medicinal_flavor;
        console.log('✅ Sabor medicinal:', product.medicinal_flavor);
    }
    
    console.log('✅ Información medicinal completa cargada');

// ✅ MOSTRAR sección medicinal
const medicinalSection = document.getElementById('medicinalInfoSection');
if (medicinalSection) {
    medicinalSection.classList.remove('hidden');
    console.log('✅ Sección medicinal mostrada');
}

    // ✅ =====================================================
    // ✅ FIN DEL NUEVO CÓDIGO
    // ✅ =====================================================
    
    // ✅ NUEVO: Crear botones de gramaje dinámicamente basados en precios disponibles
    createGramsButtons(finalPrices);
}

function setupSeedProduct(product, attrs) {
    // Llenar campos básicos con verificación
    const priceEl = document.getElementById('modalProductPrice');
    const stockEl = document.getElementById('modalProductStock');
    const stockInfoEl = document.getElementById('modalStockInfo');
    
    if (priceEl) priceEl.textContent = `${formatPrice(product.price)}`;
    if (stockEl) stockEl.textContent = formatStock(product.stock, 'unid');
    if (stockInfoEl) stockInfoEl.textContent = (product.stock && product.stock > 0) ? 'Disponible' : 'Agotado';
    
    // Llenar campos de genética
    const strainTypeEl = document.getElementById('modalStrainType');
    const geneticsEl = document.getElementById('modalGenetics');
    if (strainTypeEl) strainTypeEl.textContent = attrs.strain_type || 'N/A';
    if (geneticsEl) geneticsEl.textContent = attrs.genetics || 'N/A';
    
    // Llenar THC/CBD
    const thcEl = document.getElementById('modalThc');
    const cbdEl = document.getElementById('modalCbd');
    if (thcEl) thcEl.textContent = `${attrs.thc_percent || 0}%`;
    if (cbdEl) cbdEl.textContent = `${attrs.cbd_percent || 0}%`;
    
    // Llenar floración
    const floweringEl = document.getElementById('modalFlowering');
    if (floweringEl) floweringEl.textContent = attrs.flowering_time_weeks ? `${attrs.flowering_time_weeks} sem` : 'N/A';
    
    // Llenar dificultad (si existe)
    const difficultyEl = document.getElementById('modalDifficulty');
    if (difficultyEl) difficultyEl.textContent = attrs.difficulty || 'N/A';
    
    // Llenar aromas
    const aromasEl = document.getElementById('modalAromas');
    if (aromasEl && attrs.aromas && attrs.aromas.length > 0) {
        aromasEl.innerHTML = attrs.aromas.map(a => 
            `<span class="px-2 py-1 bg-white text-pink-700 rounded-full text-xs font-medium shadow-sm">${a}</span>`
        ).join('');
    } else if (aromasEl) {
        aromasEl.innerHTML = '<span class="text-xs text-gray-500">No especificado</span>';
    }
    
    // Llenar efectos
    const effectsEl = document.getElementById('modalEffects');
    if (effectsEl && attrs.effects && attrs.effects.length > 0) {
        effectsEl.innerHTML = attrs.effects.map(e => 
            `<span class="px-2 py-1 bg-white text-blue-700 rounded-full text-xs font-medium shadow-sm">${e}</span>`
        ).join('');
    } else if (effectsEl) {
        effectsEl.innerHTML = '<span class="text-xs text-gray-500">No especificado</span>';
    }
}

function setupRegularProduct(product) {
    // Llenar campos básicos con verificación
    const priceEl = document.getElementById('modalProductPrice');
    const stockEl = document.getElementById('modalProductStock');
    const stockInfoEl = document.getElementById('modalStockInfo');
    
    if (priceEl) priceEl.textContent = `${formatPrice(product.price)}`;
    if (stockEl) stockEl.textContent = formatStock(product.stock, 'unid');
    if (stockInfoEl) stockInfoEl.textContent = (product.stock && product.stock > 0) ? 'Disponible' : 'Agotado';
    
    // Ocultar secciones que no aplican para productos regulares
    const strainTypeEl = document.getElementById('modalStrainType');
    const geneticsEl = document.getElementById('modalGenetics');
    const thcEl = document.getElementById('modalThc');
    const cbdEl = document.getElementById('modalCbd');
    const floweringEl = document.getElementById('modalFlowering');
    const difficultyEl = document.getElementById('modalDifficulty');
    const aromasEl = document.getElementById('modalAromas');
    const effectsEl = document.getElementById('modalEffects');
    
    // Ocultar campos de genética mostrando N/A
    if (strainTypeEl) strainTypeEl.textContent = 'N/A';
    if (geneticsEl) geneticsEl.textContent = 'N/A';
    if (thcEl) thcEl.textContent = 'N/A';
    if (cbdEl) cbdEl.textContent = 'N/A';
    if (floweringEl) floweringEl.textContent = 'N/A';
    if (difficultyEl) difficultyEl.textContent = 'N/A';
    if (aromasEl) aromasEl.innerHTML = '<span class="text-xs text-gray-500">No aplica</span>';
    if (effectsEl) effectsEl.innerHTML = '<span class="text-xs text-gray-500">No aplica</span>';
}

function selectGrams(grams, priceVariants) {
    selectedGrams = grams;
    console.log('📦 Gramaje seleccionado:', grams);
    
    // Actualizar botones
    const buttons = document.querySelectorAll('#gramsButtonsContainer button');
    buttons.forEach(btn => {
        const btnGrams = btn.textContent;
        if (btnGrams) {
            btn.className = btnGrams === grams
                ? 'px-4 py-2 rounded-lg border-2 transition-all font-semibold text-sm border-red-600 bg-red-50 text-red-700'
                : 'px-4 py-2 rounded-lg border-2 transition-all font-semibold text-sm border-gray-300 text-gray-600 hover:border-red-400';
        }
    });
    
    updateMedicinalPrice(priceVariants);
}

function updateMedicinalPrice(priceVariants) {
    // ✅ VALIDAR que priceVariants existe y es un objeto
    if (!priceVariants || typeof priceVariants !== 'object') {
        console.error('❌ updateMedicinalPrice: priceVariants no es válido', priceVariants);
        return;
    }
    
    // ✅ VALIDAR que selectedGrams existe en priceVariants
    if (!priceVariants[selectedGrams]) {
        console.warn(`⚠️ No hay precio para ${selectedGrams}, usando primera opción`);
        const firstKey = Object.keys(priceVariants)[0];
        if (firstKey) {
            selectedGrams = firstKey;
        } else {
            console.error('❌ No hay precios disponibles');
            return;
        }
    }
    
    const price = priceVariants[selectedGrams];
    const priceEl = document.getElementById('modalProductPrice');
    
    if (priceEl) {
        priceEl.textContent = `$${formatPrice(price)}`;
        console.log(`✅ Precio actualizado: ${selectedGrams} = $${formatPrice(price)}`);
    } else {
        console.warn('⚠️ Elemento modalProductPrice no encontrado');
    }
}

function createGramsButtons(priceVariants) {
    const container = document.getElementById('gramsButtonsContainer');
    if (!container) {
        console.warn('⚠️ No se encontró gramsButtonsContainer');
        return;
    }
    
    // Limpiar botones existentes
    container.innerHTML = '';
    
    // Crear botón para cada precio disponible
    const sortedGrams = Object.keys(priceVariants).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
    });
    
    sortedGrams.forEach(grams => {
        const button = document.createElement('button');
        button.textContent = grams;
        button.onclick = () => selectGrams(grams, priceVariants);
        button.className = grams === selectedGrams
            ? 'px-4 py-2 rounded-lg border-2 transition-all font-semibold text-sm border-red-600 bg-red-50 text-red-700'
            : 'px-4 py-2 rounded-lg border-2 transition-all font-semibold text-sm border-gray-300 text-gray-600 hover:border-red-400';
        
        container.appendChild(button);
    });
    
    console.log('✅ Botones de gramaje creados:', sortedGrams);
}

function formatPrice(price) {
    // Validar y convertir precio
    let numPrice = price;
    
    // Si es string, intentar convertir a número
    if (typeof price === 'string') {
        numPrice = parseFloat(price.replace(/[$,]/g, ''));
    }
    
    // Si no es un número válido, retornar 0
    if (isNaN(numPrice) || numPrice === null || numPrice === undefined) {
        console.warn('⚠️ Precio inválido recibido:', price);
        numPrice = 0;
    }
    
    return new Intl.NumberFormat('es-CL').format(numPrice);
}

function formatStock(stock, unit = 'unidades') {
    // Validar stock
    let numStock = stock;
    
    // Si es string, intentar convertir a número
    if (typeof stock === 'string') {
        numStock = parseInt(stock);
    }
    
    // Si no es un número válido, retornar 0
    if (isNaN(numStock) || numStock === null || numStock === undefined) {
        console.warn('⚠️ Stock inválido recibido:', stock);
        numStock = 0;
    }
    
    return numStock > 0 ? `${numStock} ${unit}` : 'Sin stock';
}

function formatCategoryName(category) {
    const names = {
        'semillas_coleccion': 'Semillas de Colección',
        'accesorios': 'Accesorios',
        'indoors': 'Indoors',
        'iluminacion': 'Iluminación',
        'aditivos': 'Aditivos',
        'vapo': 'Vaporizadores',
        'parafernalia': 'Parafernalia',
        'smartshop': 'Smartshop',
        'merchandising': 'Merchandising',
        'ofertas': 'Ofertas',
        'medicinal': '🏥 Medicinal'
    };
    return names[category] || category;
}

function closeProductModal() {
    // Cerrar todos los modales
    const modals = [
        'productDetailModal', 'growShopModal', 'medicalFlowerModal', 
        'medicalOilModal', 'medicalConcentrateModal', 'seedModal', 
        'vaporizerModal', 'apparelModal'
    ];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    });
    
    document.body.style.overflow = '';
    currentProduct = null;
    selectedGrams = '5g';
}

function closeProductModalOnOverlay(event) {
    const modalIds = [
        'productDetailModal', 'growShopModal', 'medicalFlowerModal', 
        'medicalOilModal', 'medicalConcentrateModal', 'seedModal', 
        'vaporizerModal', 'apparelModal'
    ];
    
    if (modalIds.includes(event.target.id)) {
        closeProductModal();
    }
}

// ============================================
// 🆕 FUNCIONES AUXILIARES PARA LLENAR MODALES
// ============================================

/**
 * Llenar perfil cannabinoide con barras de progreso
 */
function fillCannabinoidProfile(profile, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = profile;
    if (typeof profile === 'string') {
        try {
            data = JSON.parse(profile);
        } catch (e) {
            console.error('Error parsing cannabinoid profile:', e);
            return;
        }
    }
    
    const cannabinoids = ['thc', 'cbd', 'cbn', 'cbg', 'cbc', 'thcv'];
    const colors = {
        thc: 'bg-red-500',
        cbd: 'bg-green-500', 
        cbn: 'bg-purple-500',
        cbg: 'bg-blue-500',
        cbc: 'bg-yellow-500',
        thcv: 'bg-pink-500'
    };
    
    container.innerHTML = cannabinoids.map(cannabinoid => {
        const value = data[cannabinoid] || 0;
        const maxValue = Math.max(...Object.values(data)) || 25;
        const percentage = (value / maxValue) * 100;
        
        if (value > 0) {
            return `
                <div class="bg-white rounded-lg p-3 shadow-sm">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-bold text-gray-700 uppercase">${cannabinoid}</span>
                        <span class="text-sm font-bold text-gray-900">${value}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="${colors[cannabinoid]} h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }
        return '';
    }).filter(item => item).join('');
}

/**
 * Llenar perfil terpénico
 */
function fillTerpeneProfile(profile, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = profile;
    if (typeof profile === 'string') {
        try {
            data = JSON.parse(profile);
        } catch (e) {
            console.error('Error parsing terpene profile:', e);
            return;
        }
    }
    
    container.innerHTML = Object.entries(data).map(([terpene, value]) => `
        <div class="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
            <span class="text-sm font-medium text-purple-700">${terpene}</span>
            <span class="text-sm font-bold text-gray-900">${value}%</span>
        </div>
    `).join('');
}

/**
 * Llenar información de cepa
 */
function fillStrainInfo(info, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = info;
    if (typeof info === 'string') {
        try {
            data = JSON.parse(info);
        } catch (e) {
            console.error('Error parsing strain info:', e);
            return;
        }
    }
    
    const fields = {
        type: 'Tipo',
        genetics: 'Genética',
        lineage: 'Linaje',
        origin: 'Origen',
        flowering_time: 'Floración',
        flowering_time_weeks: 'Floración',
        yield: 'Rendimiento',
        thc: 'THC',
        cbd: 'CBD',
        extraction: 'Extracción',
        carrier_oil: 'Aceite Base'
    };
    
    container.innerHTML = Object.entries(data)
        .filter(([key, value]) => value && fields[key])
        .map(([key, value]) => `
            <div class="flex justify-between items-start">
                <span class="text-xs text-gray-600 font-medium">${fields[key]}:</span>
                <span class="text-xs text-gray-800 font-semibold text-right max-w-[60%]">${value}</span>
            </div>
        `).join('');
}

/**
 * Llenar información terapéutica
 */
function fillTherapeuticInfo(info, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = info;
    if (typeof info === 'string') {
        try {
            data = JSON.parse(info);
        } catch (e) {
            console.error('Error parsing therapeutic info:', e);
            return;
        }
    }
    
    let html = '';
    
    if (data.conditions && Array.isArray(data.conditions)) {
        html += `
            <div>
                <span class="font-semibold text-green-800">Indicaciones:</span>
                <ul class="mt-1 ml-2">
                    ${data.conditions.map(condition => `<li class="text-gray-700">• ${condition}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (data.benefits && Array.isArray(data.benefits)) {
        html += `
            <div>
                <span class="font-semibold text-green-800">Beneficios:</span>
                <ul class="mt-1 ml-2">
                    ${data.benefits.map(benefit => `<li class="text-gray-700">• ${benefit}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (data.effects && Array.isArray(data.effects)) {
        html += `
            <div>
                <span class="font-semibold text-green-800">Efectos:</span>
                <div class="mt-1 flex flex-wrap gap-1">
                    ${data.effects.map(effect => `<span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">${effect}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Llenar información de uso
 */
function fillUsageInfo(info, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = info;
    if (typeof info === 'string') {
        try {
            data = JSON.parse(info);
        } catch (e) {
            console.error('Error parsing usage info:', e);
            return;
        }
    }
    
    let html = '';
    
    if (data.recommended_time) {
        html += `
            <div>
                <span class="font-semibold text-amber-800">Momento recomendado:</span>
                <span class="text-gray-700 ml-1">${data.recommended_time}</span>
            </div>
        `;
    }
    
    if (data.dosage) {
        html += `
            <div>
                <span class="font-semibold text-amber-800">Dosificación:</span>
                <div class="mt-1 ml-2 text-xs">
                    ${Object.entries(data.dosage).map(([level, dose]) => 
                        `<div class="flex justify-between">
                            <span class="capitalize">${level}:</span>
                            <span class="font-medium">${dose}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    if (data.administration && Array.isArray(data.administration)) {
        html += `
            <div>
                <span class="font-semibold text-amber-800">Administración:</span>
                <ul class="mt-1 ml-2">
                    ${data.administration.map(method => `<li class="text-gray-700">• ${method}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (data.onset || data.duration) {
        html += `
            <div class="grid grid-cols-2 gap-2 text-xs">
                ${data.onset ? `
                    <div>
                        <span class="font-semibold text-amber-800">Inicio:</span>
                        <div class="text-gray-700">${data.onset}</div>
                    </div>
                ` : ''}
                ${data.duration ? `
                    <div>
                        <span class="font-semibold text-amber-800">Duración:</span>
                        <div class="text-gray-700">${data.duration}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Llenar información de seguridad
 */
function fillSafetyInfo(info, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = info;
    if (typeof info === 'string') {
        try {
            data = JSON.parse(info);
        } catch (e) {
            console.error('Error parsing safety info:', e);
            return;
        }
    }
    
    let html = '';
    
    if (data.contraindications) {
        const contraindications = Array.isArray(data.contraindications) 
            ? data.contraindications 
            : [data.contraindications];
        
        html += `
            <div>
                <span class="font-semibold text-red-800">Contraindicaciones:</span>
                <ul class="mt-1 ml-2">
                    ${contraindications.map(item => `<li class="text-gray-700">• ${item}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (data.side_effects) {
        const sideEffects = Array.isArray(data.side_effects) 
            ? data.side_effects 
            : [data.side_effects];
        
        html += `
            <div>
                <span class="font-semibold text-red-800">Efectos secundarios:</span>
                <ul class="mt-1 ml-2">
                    ${sideEffects.map(effect => `<li class="text-gray-700">• ${effect}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (data.interactions) {
        const interactions = Array.isArray(data.interactions) 
            ? data.interactions 
            : [data.interactions];
        
        html += `
            <div>
                <span class="font-semibold text-red-800">Interacciones:</span>
                <ul class="mt-1 ml-2">
                    ${interactions.map(interaction => `<li class="text-gray-700">• ${interaction}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Llenar especificaciones técnicas
 */
function fillSpecifications(specs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = specs;
    if (typeof specs === 'string') {
        try {
            data = JSON.parse(specs);
        } catch (e) {
            console.error('Error parsing specifications:', e);
            return;
        }
    }
    
    container.innerHTML = Object.entries(data).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
            <div class="flex justify-between items-start">
                <span class="text-xs text-gray-600 font-medium">${label}:</span>
                <span class="text-xs text-gray-800 font-semibold text-right max-w-[60%]">${value}</span>
            </div>
        `;
    }).join('');
}

/**
 * Llenar atributos del producto
 */
function fillAttributes(attrs, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let data = attrs;
    if (typeof attrs === 'string') {
        try {
            data = JSON.parse(attrs);
        } catch (e) {
            console.error('Error parsing attributes:', e);
            return;
        }
    }
    
    container.innerHTML = Object.entries(data).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `
            <div class="flex justify-between items-start">
                <span class="text-xs text-gray-600 font-medium">${label}:</span>
                <span class="text-xs text-gray-800 font-semibold text-right max-w-[60%]">${value}</span>
            </div>
        `;
    }).join('');
}

/**
 * Crear selector de gramaje para productos con variantes de precio
 */
function createGramSelectorForModal(product, containerId, priceElementId) {
    const container = document.getElementById(containerId);
    const priceElement = document.getElementById(priceElementId);
    
    if (!container || !priceElement) return;
    
    // Buscar variantes de precio en la base de datos si están disponibles
    // Por ahora usar un selector básico
    const variants = ['1g', '5g', '10g', '28g'];
    const basePrice = product.base_price || product.price;
    
    container.innerHTML = variants.map(variant => `
        <button onclick="updateModalPrice('${variant}', ${basePrice}, '${priceElementId}')" 
                class="px-3 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-green-400 transition-all font-semibold text-sm">
            ${variant}
        </button>
    `).join('');
}

/**
 * Actualizar precio en modal según gramaje seleccionado
 */
function updateModalPrice(variant, basePrice, priceElementId) {
    const priceElement = document.getElementById(priceElementId);
    if (!priceElement) return;
    
    // Multiplicadores aproximados por gramaje
    const multipliers = {
        '1g': 1,
        '5g': 4.5,
        '10g': 8.5,
        '28g': 22
    };
    
    const multiplier = multipliers[variant] || 1;
    const finalPrice = basePrice * multiplier;
    
    priceElement.textContent = `$${formatPrice(finalPrice)}`;
    
    // Actualizar botones activos
    const container = priceElement.closest('.modal, [id*="Modal"]');
    if (container) {
        const buttons = container.querySelectorAll('button[onclick*="updateModalPrice"]');
        buttons.forEach(btn => {
            if (btn.textContent.trim() === variant) {
                btn.className = 'px-3 py-2 rounded-lg border-2 border-green-600 bg-green-50 text-green-700 font-semibold text-sm';
            } else {
                btn.className = 'px-3 py-2 rounded-lg border-2 border-gray-300 text-gray-600 hover:border-green-400 transition-all font-semibold text-sm';
            }
        });
    }
}

async function addToCartFromModal() {
    if (!currentProduct) {
        if (typeof notify !== 'undefined') notify.error('No hay producto seleccionado');
        return;
    }
    
    // Validar stock
    const stock = currentProduct.stock_quantity || currentProduct.stock;
    if (!stock || stock <= 0) {
        if (typeof notify !== 'undefined') notify.warning('Producto sin stock disponible');
        return;
    }
    
    // ✅ PRODUCTOS MEDICINALES AHORA SE PUEDEN COMPRAR EN LÍNEA
    // Restricción eliminada - ya no bloqueamos requires_prescription
    
    try {
        if (typeof cart === 'undefined' || !cart) {
            throw new Error('Sistema de carrito no disponible');
        }
        
        const button = document.querySelector('#productDetailModal button[onclick="addToCartFromModal()"]');
        if (button) {
            const originalHTML = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin text-xl"></i><span class="text-lg">Agregando...</span>';
            
            const added = await cart.addProduct(currentProduct.id, 1);
            
            if (added) {
                button.innerHTML = '<i class="fas fa-check text-xl"></i><span class="text-lg">¡Agregado!</span>';
                await new Promise(resolve => setTimeout(resolve, 1000));
                button.innerHTML = originalHTML;
                button.disabled = false;
                closeProductModal();
                if (typeof cart.updateCartBadge === 'function') cart.updateCartBadge();
            } else {
                throw new Error('No se pudo agregar al carrito');
            }
        }
    } catch (error) {
        console.error('❌ Error al agregar al carrito:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al agregar al carrito: ' + error.message);
        }
        const button = document.querySelector('#productDetailModal button[onclick="addToCartFromModal()"]');
        if (button) {
            button.innerHTML = '<i class="fas fa-shopping-cart text-lg"></i><span class="text-base">Agregar al Carrito</span>';
            button.disabled = false;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProductModal();
});

// Exportar funciones globales
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.closeProductModalOnOverlay = closeProductModalOnOverlay;
window.addToCartFromModal = addToCartFromModal;
window.selectGrams = selectGrams;
window.updateModalPrice = updateModalPrice;

console.log('✅ Sistema de modal con soporte medicinal cargado');