// frontend/admin/js/adminProductModals.js
// Sistema de modales de administración específicos por categoría
// VERSIÓN FINAL CORREGIDA v3

let currentEditingProduct = null;
let allCategories = [];
let allBrands = [];
let isSystemInitialized = false;

/**
 * Inicializar sistema de administración
 */
async function initAdminSystem() {
    console.log('🚀 [initAdminSystem] Sistema ya inicializado por admin-products.js, evitando doble carga...');
    // No hacer nada porque admin-products.js ya está cargando todo
}

/**
 * Cargar categorías y marcas desde la base de datos
 */
async function loadCategoriesAndBrands() {
    try {
        console.log('📦 Cargando categorías y marcas...');
        
        // Usar api client para cargar categorías
        try {
            const response = await api.getCategories();
            
            if (response.success && response.data && response.data.categories) {
                // response.data.categories es un array de strings con los nombres de categorías
                const categoriesFromAPI = response.data.categories;
                
                // Convertir a formato esperado con slugs correctos
                allCategories = categoriesFromAPI.map((catName, index) => {
                    let slug = catName.toLowerCase().replace(/\s+/g, '-');
                    
                    // Mapeo específico para categorías medicinales (corregir orden)
                    const medicinalMapping = {
                        'flores-medicinales': 'medicinal-flores',
                        'aceites-medicinales': 'medicinal-aceites', 
                        'concentrados-medicinales': 'medicinal-concentrados',
                        'cápsulas-medicinales': 'medicinal-cápsulas',
                        'tópicos-medicinales': 'medicinal-tópicos'
                    };
                    
                    // Usar mapeo si existe, sino usar slug generado
                    if (medicinalMapping[slug]) {
                        slug = medicinalMapping[slug];
                    }
                    
                    return {
                    id: index + 1,
                        slug: slug,
                    name: catName
                    };
                });
                
                console.log('✅ Categorías cargadas desde API:', allCategories);
                console.log('🔧 Mapeo de slugs aplicado para categorías medicinales');
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar categorías desde API:', error);
            // Usar valores por defecto (con slugs corregidos)
            allCategories = [
                { id: 1, slug: 'medicinal-flores', name: 'Flores Medicinales' },
                { id: 2, slug: 'medicinal-aceites', name: 'Aceites Medicinales' },
                { id: 3, slug: 'medicinal-concentrados', name: 'Concentrados Medicinales' },
                { id: 4, slug: 'medicinal-cápsulas', name: 'Cápsulas Medicinales' },
                { id: 5, slug: 'medicinal-tópicos', name: 'Tópicos Medicinales' },
                { id: 6, slug: 'semillas', name: 'Semillas' },
                { id: 7, slug: 'vaporizadores', name: 'Vaporizadores' },
                { id: 8, slug: 'accesorios', name: 'Accesorios' },
                { id: 9, slug: 'ropa', name: 'Ropa' },
                { id: 10, slug: 'cbd', name: 'CBD' }
            ];
            console.log('⚠️ Usando categorías por defecto');
        }
        
        // Intentar cargar marcas (endpoint no implementado, usar por defecto)
        try {
            // Por ahora usar marcas por defecto ya que el endpoint no existe
            allBrands = [
                { id: 1, name: 'Apex Remedy' },
                { id: 2, name: 'Sensi Seeds' },
                { id: 3, name: 'Royal Queen Seeds' },
                { id: 4, name: 'DNA Genetics' },
                { id: 5, name: 'Barney\'s Farm' }
            ];
            console.log('✅ Marcas cargadas (por defecto):', allBrands.length);
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar marcas');
            allBrands = [];
        }
        
        // Poblar selector de categorías
        populateCategorySelectors();
        
    } catch (error) {
        console.error('Error cargando categorías y marcas:', error);
    }
}

/**
 * Poblar selectores de categoría
 */
function populateCategorySelectors() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    console.log('🏷️ Poblando selector de categorías...', {
        categoryFilter: !!categoryFilter,
        categoriesCount: allCategories.length
    });
    
    if (categoryFilter && allCategories.length > 0) {
        // Limpiar opciones existentes (excepto la primera)
        categoryFilter.innerHTML = '<option value="">Categorías</option>';
        
        // Agregar categorías
        allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.slug;
            option.textContent = cat.name;
            categoryFilter.appendChild(option);
            console.log(`➕ Agregada categoría: ${cat.name} (value: ${cat.slug})`);
        });
        
        console.log('✅ Selector de categorías poblado con', allCategories.length, 'categorías');
    } else {
        console.warn('⚠️ No se puede poblar selector de categorías:', {
            categoryFilter: !!categoryFilter,
            categoriesCount: allCategories.length
        });
    }
}

/**
 * Setup event listeners - DESHABILITADO
 */
function setupEventListeners() {
    console.log('⚠️ [setupEventListeners] Deshabilitado, admin-products.js maneja los listeners');
    // No hacer nada, admin-products.js ya tiene sus propios event listeners
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función loadProducts eliminada - usar la de admin-products.js

/**
 * Formatear precio
 */
function formatPrice(price) {
    if (price === undefined || price === null || isNaN(price)) {
        return '0';
    }
    return Number(price).toLocaleString('es-CL');
}

/**
 * Cargar productos desde la API
 */
async function loadProducts() {
    console.log('📦 Cargando productos...');
    
    // Evitar carga múltiple
    if (window.productsLoading) {
        console.log('⚠️ Productos ya se están cargando, evitando duplicación');
        return [];
    }
    
    window.productsLoading = true;
    
    try {
        // Mostrar loading en tabla
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <i class="fas fa-spinner fa-spin text-4xl text-green-600"></i>
                        <p class="text-gray-500 mt-2">Cargando productos...</p>
                    </td>
                </tr>
            `;
        }
        
        // Cargar productos usando API client
        const response = await api.getProducts({ limit: 500 });
        console.log('📦 Respuesta API productos:', response);
        
        let products = [];
        
        if (response.success && response.data && Array.isArray(response.data.products)) {
            products = response.data.products;
        } else if (response.success && Array.isArray(response.data)) {
            products = response.data;
        } else if (Array.isArray(response.products)) {
            products = response.products;
        } else if (Array.isArray(response)) {
            products = response;
        }
        
        console.log('✅ Productos cargados:', products.length);
        
        // Guardar productos para filtros
        window.allProducts = products;
        
        // Actualizar estadísticas
        updateStats(products);
        
        // Renderizar tabla
        renderProductsTable(products);
        
        return products;
        
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        
        // Mostrar error en tabla
        const tbody = document.getElementById('productsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center">
                        <i class="fas fa-exclamation-triangle text-4xl text-red-500"></i>
                        <p class="text-red-500 mt-2">Error al cargar productos: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
        
        // Resetear estadísticas
        updateStats([]);
        
        return [];
    } finally {
        window.productsLoading = false;
    }
}

/**
 * Actualizar estadísticas
 */
function updateStats(products) {
    console.log('📊 Actualizando estadísticas con', products.length, 'productos');
    
    if (!Array.isArray(products)) {
        products = [];
    }
    
    const total = products.length;
    const inStock = products.filter(p => (p.stock_quantity || 0) > 0).length;
    // Usar la misma lógica robusta que el filtro medicinal
    const medicinal = products.filter(p => {
        const isMedicinal = p.is_medicinal == 1 || 
                          p.is_medicinal === 1 || 
                          p.is_medicinal === '1' || 
                          p.is_medicinal === true ||
                          p.is_medicinal === 'true';
        
        const requiresPrescription = p.requires_prescription == 1 || 
                                   p.requires_prescription === 1 || 
                                   p.requires_prescription === '1' || 
                                   p.requires_prescription === true ||
                                   p.requires_prescription === 'true';
        
        const isMedicinalCategory = (p.category_slug && p.category_slug.includes('medicinal')) ||
                                  (p.category && p.category.toLowerCase().includes('medicinal')) ||
                                  (p.category_name && p.category_name.toLowerCase().includes('medicinal'));
        
        return isMedicinal || requiresPrescription || isMedicinalCategory;
    }).length;
    const categories = [...new Set(products.map(p => p.category_slug || p.category || p.category_name).filter(c => c))].length;
    
    console.log('📊 Estadísticas calculadas:', { total, inStock, medicinal, categories });
    
    const totalEl = document.getElementById('totalProducts');
    const inStockEl = document.getElementById('inStockProducts');
    const medicinalEl = document.getElementById('medicinalProducts');
    const categoriesEl = document.getElementById('totalCategories');
    
    if (totalEl) totalEl.textContent = total;
    if (inStockEl) inStockEl.textContent = inStock;
    if (medicinalEl) medicinalEl.textContent = medicinal;
    if (categoriesEl) categoriesEl.textContent = categories;
    
    console.log('✅ Estadísticas actualizadas en DOM');
}

/**
 * Renderizar tabla de productos
 */
function renderProductsTable(products) {
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) return;
    
    if (!Array.isArray(products) || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <i class="fas fa-inbox text-4xl text-gray-400"></i>
                    <p class="text-gray-500 mt-2">No se encontraron productos</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50 transition">
            <td class="px-6 py-4 text-sm text-gray-600">#${product.id}</td>
            <td class="px-6 py-4">
                <img src="${(product.images && product.images[0] && product.images[0].url) || product.image_url || product.image || '../assets/images/placeholder.jpg'}" 
                     alt="${product.name}" 
                     onerror="this.src='../assets/images/placeholder.jpg'"
                     class="w-16 h-16 object-cover rounded-lg">
            </td>
            <td class="px-6 py-4">
                <div class="font-semibold text-gray-800">${product.name}</div>
                <div class="text-sm text-gray-500">${product.sku || 'Sin SKU'}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${product.category_name || product.category_slug || 'Sin categoría'}
                </span>
            </td>
            <td class="px-6 py-4 font-semibold text-gray-800">
                $${formatPrice(product.base_price || product.price || 0)}
            </td>
            <td class="px-6 py-4">
                <span class="text-sm ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                    ${product.stock_quantity || 0} ${product.stock_unit || 'unidades'}
                </span>
            </td>
            <td class="px-6 py-4">
                ${getStatusBadge(product)}
            </td>
            <td class="px-6 py-4">
                <div class="flex gap-2">
                    <button onclick="adminOpenEditModal(${product.id})" 
                            class="text-blue-600 hover:text-blue-800 transition"
                            title="Editar">
                        <i class="fas fa-edit text-lg"></i>
                    </button>
                    <button onclick="duplicateProduct(${product.id})" 
                            class="text-green-600 hover:text-green-800 transition"
                            title="Duplicar">
                        <i class="fas fa-copy text-lg"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" 
                            class="text-red-600 hover:text-red-800 transition"
                            title="Eliminar">
                        <i class="fas fa-trash text-lg"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Get status badge
 */
function getStatusBadge(product) {
    const badges = [];
    
    if (product.featured) {
        badges.push('<span class="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-1"><i class="fas fa-star mr-1"></i>Destacado</span>');
    }
    
    if (product.is_medicinal || product.requires_prescription) {
        badges.push('<span class="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1"><i class="fas fa-prescription mr-1"></i>Medicinal</span>');
    }
    
    if (product.status === 'active' || product.status === 1) {
        badges.push('<span class="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check mr-1"></i>Activo</span>');
    } else {
        badges.push('<span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><i class="fas fa-times mr-1"></i>Inactivo</span>');
    }
    
    return badges.join('');
}

/**
 * Format price
 */
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL').format(price);
}

/**
 * ABRIR MODAL DE CREACIÓN
 */
function openCreateModal() {
    console.log('📝 Abriendo modal de creación');
    
    // Mostrar selector de categoría
    showCategorySelector();
}

/**
 * Mostrar selector de categoría
 */
function showCategorySelector() {
    const modalHTML = `
    <div id="categorySelectorModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeCategorySelector(event)">
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8" onclick="event.stopPropagation()">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Selecciona el tipo de producto</h2>
                <button onclick="closeCategorySelector()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button onclick="openCreateModalForCategory('medicinal-flores')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-lg transition group">
                    <i class="fas fa-cannabis text-4xl text-green-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Flores Medicinales</p>
                </button>
                
                <button onclick="openCreateModalForCategory('medicinal-aceites')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition group">
                    <i class="fas fa-tint text-4xl text-blue-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Aceites Medicinales</p>
                </button>
                
                <button onclick="openCreateModalForCategory('medicinal-concentrados')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:shadow-lg transition group">
                    <i class="fas fa-flask text-4xl text-amber-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Concentrados</p>
                </button>
                
                <button onclick="openCreateModalForCategory('semillas')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-lime-500 hover:shadow-lg transition group">
                    <i class="fas fa-seedling text-4xl text-lime-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Semillas</p>
                </button>
                
                <button onclick="openCreateModalForCategory('vaporizadores')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-slate-500 hover:shadow-lg transition group">
                    <i class="fas fa-wind text-4xl text-slate-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Vaporizadores</p>
                </button>
                
                <button onclick="openCreateModalForCategory('ropa')" 
                        class="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:shadow-lg transition group">
                    <i class="fas fa-tshirt text-4xl text-pink-600 group-hover:scale-110 transition mb-3"></i>
                    <p class="font-semibold text-gray-800">Ropa</p>
                </button>
            </div>
        </div>
    </div>
    `;
    
    // Remover modal anterior si existe
    const oldModal = document.getElementById('categorySelectorModal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Cerrar selector de categoría
 */
function closeCategorySelector(event) {
    if (event && event.target.id !== 'categorySelectorModal') {
        return;
    }
    
    const modal = document.getElementById('categorySelectorModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Abrir modal de creación para categoría específica
 */
function openCreateModalForCategory(categorySlug) {
    console.log('📝 Creando producto para categoría:', categorySlug);
    
    // Cerrar selector de categoría
    closeCategorySelector();
    
    // Abrir modal específico
    currentEditingProduct = null;
    
    switch(categorySlug) {
        case 'medicinal-flores':
            if (typeof openMedicinalFlowerEditModal === 'function') {
                openMedicinalFlowerEditModal(null);
            } else {
                console.error('❌ Función openMedicinalFlowerEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        case 'medicinal-aceites':
            if (typeof openMedicinalOilEditModal === 'function') {
                openMedicinalOilEditModal(null);
            } else {
                console.error('❌ Función openMedicinalOilEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        case 'medicinal-concentrados':
            if (typeof openConcentrateEditModal === 'function') {
                openConcentrateEditModal(null);
            } else {
                console.error('❌ Función openConcentrateEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        case 'semillas':
            if (typeof openSeedEditModal === 'function') {
                openSeedEditModal(null);
            } else {
                console.error('❌ Función openSeedEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        case 'vaporizadores':
            if (typeof openVaporizerEditModal === 'function') {
                openVaporizerEditModal(null);
            } else {
                console.error('❌ Función openVaporizerEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        case 'ropa':
            if (typeof openApparelEditModal === 'function') {
                openApparelEditModal(null);
            } else {
                console.error('❌ Función openApparelEditModal no encontrada');
            if (typeof notify !== 'undefined') {
                    notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
            }
            break;
        default:
            if (typeof notify !== 'undefined') {
                notify.error('Categoría no reconocida');
            }
    }
}

/**
 * ABRIR MODAL DE EDICIÓN DEL SISTEMA ADMINISTRATIVO
 */
async function adminOpenEditModal(productId) {
    console.log('✏️ Abriendo modal de edición para producto:', productId);
    
    try {
        // Cargar producto usando apiClient (maneja autenticación)
        console.log('📞 Usando api.getProductById para cargar producto...');
        const response = await api.getProductById(productId);
        console.log('📦 Respuesta completa del apiClient:', response);
        
        // Manejar formato de respuesta del apiClient
        let product = null;
        if (response.success && response.data && response.data.product) {
            // Formato: {success: true, data: {product: {...}}}
            product = response.data.product;
            console.log('✅ Formato: response.data.product');
        } else if (response.success && response.data) {
            // Formato: {success: true, data: {...}} - producto directo
            product = response.data;
            console.log('✅ Formato: response.data');
        } else if (response.product) {
            // Formato: {product: {...}}
            product = response.product;
            console.log('✅ Formato: response.product');
        } else if (response.data && response.data.product) {
            // Formato anidado
            product = response.data.product;
            console.log('✅ Formato: response.data.product (anidado)');
        } else {
            // Producto directo
            product = response;
            console.log('✅ Formato: response (directo)');
        }
        
        console.log('📦 Producto extraído:', product);
        
        // Verificar que el producto se extrajo correctamente
        if (!product || !product.id) {
            console.error('❌ Error: Producto no válido o sin ID');
            console.log('Producto recibido:', product);
            throw new Error('Producto no válido');
        }
        
        currentEditingProduct = product;
        
        // Detectar categoría y abrir modal apropiado
        console.log('🔍 Campos del producto:', Object.keys(product));
        console.log('📦 product.category:', product.category);
        console.log('📦 product.category_slug:', product.category_slug);
        console.log('📦 product.category_id:', product.category_id);
        console.log('📦 product.category_name:', product.category_name);
        
        const categorySlug = product.category_slug || product.category || product.category_name;
        
        console.log('🏷️ Categoría detectada:', categorySlug);
        
        // Debug: Verificar funciones disponibles
        console.log('🔍 Funciones disponibles:');
        console.log('  - openMedicinalFlowerEditModal:', typeof openMedicinalFlowerEditModal);
        console.log('  - openMedicinalOilEditModal:', typeof openMedicinalOilEditModal);
        console.log('  - openConcentrateEditModal:', typeof openConcentrateEditModal);
        console.log('  - openSeedEditModal:', typeof openSeedEditModal);
        console.log('  - openVaporizerEditModal:', typeof openVaporizerEditModal);
        console.log('  - openApparelEditModal:', typeof openApparelEditModal);
        
        switch(categorySlug) {
            case 'medicinal-flores':
            case 'Flores Medicinales':
                if (typeof openMedicinalFlowerEditModal === 'function') {
                    openMedicinalFlowerEditModal(product);
                } else {
                    console.error('❌ Función openMedicinalFlowerEditModal no encontrada');
                    openBasicEditModal(productId);
                }
                break;
            case 'medicinal-aceites':
            case 'Aceites Medicinales':
                if (typeof openMedicinalOilEditModal === 'function') {
                    openMedicinalOilEditModal(product);
                } else {
                    console.error('❌ Función openMedicinalOilEditModal no encontrada');
                    openBasicEditModal(productId);
                }
                break;
            case 'medicinal-concentrados':
            case 'Concentrados Medicinales':
            case 'Concentrados':
                if (typeof openConcentrateEditModal === 'function') {
                    openConcentrateEditModal(product);
                } else {
                    console.error('❌ Función openConcentrateEditModal no encontrada');
                    if (typeof notify !== 'undefined') {
                        notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                    }
                    openBasicEditModal(productId);
                }
                break;
            case 'semillas':
            case 'Semillas':
                if (typeof openSeedEditModal === 'function') {
                    openSeedEditModal(product);
                } else {
                    console.error('❌ Función openSeedEditModal no encontrada');
                    if (typeof notify !== 'undefined') {
                        notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                    }
                    openBasicEditModal(productId);
                }
                break;
            case 'vaporizadores':
            case 'Vaporizadores':
                if (typeof openVaporizerEditModal === 'function') {
                    openVaporizerEditModal(product);
                } else {
                    console.error('❌ Función openVaporizerEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                        notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                }
                    openBasicEditModal(productId);
                }
                break;
            case 'ropa':
            case 'Ropa':
                if (typeof openApparelEditModal === 'function') {
                    openApparelEditModal(product);
                } else {
                    console.error('❌ Función openApparelEditModal no encontrada');
                if (typeof notify !== 'undefined') {
                        notify.error('Modal no disponible. Verifica que adminEditModals.js esté cargado.');
                    }
                    openBasicEditModal(productId);
                }
                break;
            default:
                console.log('⚠️ Categoría no reconocida:', categorySlug, '- Usando modal básico');
                openBasicEditModal(productId);
        }
        
    } catch (error) {
        console.error('Error abriendo modal de edición:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al cargar el producto. Intentando con modal básico...');
        }
        
        // Fallback: usar modal básico si hay problemas con el sistema avanzado
        console.log('🚨 Fallback: Usando modal básico debido a error...');
        try {
            await openBasicEditModal(productId);
        } catch (fallbackError) {
            console.error('❌ Error también en modal básico:', fallbackError);
            if (typeof notify !== 'undefined') {
                notify.error('Error al cargar el producto: ' + error.message);
            }
        }
    }
}

/**
 * Cerrar cualquier modal de edición
 */
function closeEditModal(event) {
    // Si hay evento, verificar que se hizo clic en el overlay, no en el contenido
    if (event && event.target && event.target.id !== 'editProductModal' && !event.target.closest('button')) {
        return;
    }
    
    // Si se llama desde un botón sin evento, permitir cerrar
    const modal = document.getElementById('editProductModal');
    if (modal) {
        modal.remove();
    }
    
    currentEditingProduct = null;
}

/**
 * Parse JSON helper
 */
function parseJSON(jsonString) {
    if (!jsonString) return {};
    if (typeof jsonString === 'object') return jsonString;
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.warn('Error parseando JSON:', e);
        return {};
    }
}

/**
 * Stringify JSON helper
 */
function stringifyJSON(obj) {
    if (!obj) return '{}';
    if (typeof obj === 'string') return obj;
    try {
        return JSON.stringify(obj);
    } catch (e) {
        console.warn('Error stringificando JSON:', e);
        return '{}';
    }
}

/**
 * Eliminar producto
 */
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el producto');
        }
        
        if (typeof notify !== 'undefined') {
            notify.success('Producto eliminado exitosamente');
        }
        await loadProducts();
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al eliminar el producto');
        }
    }
}

/**
 * Duplicar producto
 */
async function duplicateProduct(productId) {
    try {
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el producto');
        }
        
        const data = await response.json();
        let product = data.success && data.data ? data.data : data;
        
        // Modificar nombre y slug
        product.name = product.name + ' (Copia)';
        product.slug = product.slug + '-copia';
        product.sku = product.sku + '-COPY';
        
        // Remover ID
        delete product.id;
        
        // Abrir modal de creación con datos pre-cargados
        currentEditingProduct = product;
        
        const categorySlug = product.category_slug || product.category;
        openCreateModalForCategory(categorySlug);
        
    } catch (error) {
        console.error('Error duplicando producto:', error);
        if (typeof notify !== 'undefined') {
            notify.error('Error al duplicar el producto');
        }
    }
}

// Esperar a que el DOM esté listo antes de exportar funciones
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOMContentLoaded - adminProductModals.js');
    
    // Event listeners globales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('editProductModal');
            const categoryModal = document.getElementById('categorySelectorModal');
            
            if (modal) closeEditModal();
            if (categoryModal) closeCategorySelector();
        }
    });
    
    // INICIALIZACIÓN NO AUTOMÁTICA - Usar manualInit() para evitar loops
    console.log('✅ adminProductModals.js cargado - usar manualInit() para inicializar');
    
    // Los filtros se configuran después de manualInit() para evitar problemas de timing
});

/**
 * Inicialización manual (para evitar loops)
 */
async function manualInit() {
    if (isSystemInitialized) {
        console.log('⚠️ Sistema ya inicializado, evitando duplicación');
        return;
    }
    
    console.log('🚀 Inicialización manual del sistema de administración...');
    
    try {
        isSystemInitialized = true;
        
        // Cargar categorías y marcas primero
        await loadCategoriesAndBrands();
        
        // Luego cargar productos
        await loadProducts();
        
        // Configurar filtros después de que todo esté cargado
        setTimeout(() => {
            setupFiltersAndSearch();
            testFilters();
        }, 100);
        
        console.log('✅ Sistema de administración inicializado manualmente');
        
    } catch (error) {
        console.error('❌ Error en inicialización manual:', error);
        isSystemInitialized = false; // Reset para permitir retry
    }
}

/**
 * Configurar filtros y búsqueda
 */
function setupFiltersAndSearch() {
    console.log('🔧 Configurando filtros y búsqueda...');
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    console.log('🔍 Elementos encontrados:', {
        searchInput: !!searchInput,
        categoryFilter: !!categoryFilter,
        statusFilter: !!statusFilter
    });
    
    if (searchInput) {
        console.log('✅ Configurando listener de búsqueda');
        searchInput.addEventListener('input', debounce(() => {
            console.log('🔍 Ejecutando búsqueda:', searchInput.value);
            filterProducts();
        }, 300));
    } else {
        console.warn('❌ searchInput no encontrado');
    }
    
    if (categoryFilter) {
        console.log('✅ Configurando listener de categoría');
        categoryFilter.addEventListener('change', () => {
            console.log('📂 Filtrando por categoría:', categoryFilter.value);
            filterProducts();
        });
    } else {
        console.warn('❌ categoryFilter no encontrado');
    }
    
    if (statusFilter) {
        console.log('✅ Configurando listener de estado');
        statusFilter.addEventListener('change', () => {
            console.log('📊 Filtrando por estado:', statusFilter.value);
            filterProducts();
        });
    } else {
        console.warn('❌ statusFilter no encontrado');
    }
}

/**
 * Test específico para el filtro medicinal
 */
function testMedicinalFilter() {
    console.log('🧪 === TEST ESPECÍFICO FILTRO MEDICINAL ===');
    
    // Primero mostrar resumen de todos los productos
    if (window.allProducts && Array.isArray(window.allProducts)) {
        console.log('📊 RESUMEN DE PRODUCTOS:');
        
        const summary = window.allProducts.map(p => {
            const isMedicinal = p.is_medicinal == 1 || 
                              p.is_medicinal === 1 || 
                              p.is_medicinal === '1' || 
                              p.is_medicinal === true ||
                              p.is_medicinal === 'true';
            
            const requiresPrescription = p.requires_prescription == 1 || 
                                       p.requires_prescription === 1 || 
                                       p.requires_prescription === '1' || 
                                       p.requires_prescription === true ||
                                       p.requires_prescription === 'true';
            
            const isMedicinalCategory = (p.category_slug && p.category_slug.includes('medicinal')) ||
                                      (p.category && p.category.toLowerCase().includes('medicinal')) ||
                                      (p.category_name && p.category_name.toLowerCase().includes('medicinal'));
            
            return {
                name: p.name,
                is_medicinal: p.is_medicinal,
                requires_prescription: p.requires_prescription,
                category: p.category_slug || p.category || p.category_name,
                isMed: isMedicinal,
                reqPres: requiresPrescription,
                catMed: isMedicinalCategory,
                final: isMedicinal || requiresPrescription || isMedicinalCategory
            };
        });
        
        console.table(summary);
        
        const medicinalCount = summary.filter(p => p.final).length;
        console.log(`🔢 Total productos medicinales: ${medicinalCount} de ${summary.length}`);
    }
    
    // Establecer el filtro medicinal
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = 'medicinal';
        console.log('✅ Filtro medicinal activado');
        
        // Ejecutar el filtro
        filterProducts();
    } else {
        console.error('❌ statusFilter no encontrado');
    }
}

/**
 * Diagnóstico específico del filtro de categorías
 */
function diagnosticCategoryFilter() {
    console.log('🩺 === DIAGNÓSTICO ESPECÍFICO FILTRO CATEGORÍAS ===');
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) {
        console.error('❌ categoryFilter no encontrado');
        return;
    }
    
    const selectedValue = categoryFilter.value;
    console.log('🎯 Valor seleccionado:', selectedValue);
    
    if (!selectedValue) {
        console.log('⚠️ No hay categoría seleccionada');
        return;
    }
    
    if (!window.allProducts || !Array.isArray(window.allProducts)) {
        console.error('❌ No hay productos cargados');
        return;
    }
    
    console.log('📦 Total productos a evaluar:', window.allProducts.length);
    
    // Evaluar cada producto individualmente
    const matchingProducts = [];
    const nonMatchingProducts = [];
    
    window.allProducts.forEach(product => {
        // Aplicar la misma lógica que el filtro
        const exactMatch = product.category_slug === selectedValue ||
                         product.category === selectedValue ||
                         product.category_name === selectedValue;
        
        const containsMatch = (product.category_slug && product.category_slug.includes(selectedValue)) ||
                            (product.category && product.category.toLowerCase().includes(selectedValue.toLowerCase())) ||
                            (product.category_name && product.category_name.toLowerCase().includes(selectedValue.toLowerCase()));
        
        const reverseMatch = selectedValue.includes(product.category_slug || '') ||
                           selectedValue.toLowerCase().includes((product.category || '').toLowerCase()) ||
                           selectedValue.toLowerCase().includes((product.category_name || '').toLowerCase());
        
        const finalMatch = exactMatch || containsMatch || reverseMatch;
        
        const productDebug = {
            name: product.name,
            category_slug: product.category_slug,
            category: product.category,
            category_name: product.category_name,
            exactMatch,
            containsMatch,
            reverseMatch,
            finalMatch
        };
        
        if (finalMatch) {
            matchingProducts.push(productDebug);
        } else {
            nonMatchingProducts.push(productDebug);
        }
    });
    
    console.log('✅ Productos que SÍ coinciden (' + matchingProducts.length + '):', matchingProducts);
    console.log('❌ Productos que NO coinciden (' + nonMatchingProducts.length + '):', nonMatchingProducts.slice(0, 3)); // Solo los primeros 3
    
    // Test del filtro completo
    console.log('\n🧪 Probando filterProducts() con esta categoría...');
    filterProducts();
}

/**
 * Recargar categorías manualmente
 */
async function reloadCategories() {
    console.log('🔄 Recargando categorías...');
    
    try {
        await loadCategoriesAndBrands();
        console.log('✅ Categorías recargadas exitosamente');
        
        // Mostrar las nuevas categorías
        testCategoryFilter();
    } catch (error) {
        console.error('❌ Error recargando categorías:', error);
    }
}

/**
 * Test específico para el filtro de categorías
 */
function testCategoryFilter() {
    console.log('🧪 === TEST ESPECÍFICO FILTRO CATEGORÍAS ===');
    
    // Mostrar todas las categorías disponibles en el dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        console.log('📂 Categorías disponibles en dropdown:');
        Array.from(categoryFilter.options).forEach((option, index) => {
            if (option.value) {
                console.log(`  ${index}: "${option.textContent}" (value: "${option.value}")`);
            }
        });
    }
    
    // Mostrar muestra de productos y sus categorías
    if (window.allProducts && Array.isArray(window.allProducts)) {
        console.log('📦 Muestra de productos y sus categorías:');
        
        const productCategories = window.allProducts.slice(0, 5).map(p => ({
            name: p.name,
            category_slug: p.category_slug,
            category: p.category,
            category_name: p.category_name
        }));
        
        console.table(productCategories);
        
        // Mostrar todas las categorías únicas de los productos
        const uniqueCategories = [...new Set(window.allProducts.map(p => 
            p.category_slug || p.category || p.category_name
        ).filter(c => c))];
        
        console.log('🏷️ Categorías únicas en productos:', uniqueCategories);
        
        // Comparar slugs del dropdown vs productos
        console.log('🔍 COMPARACIÓN SLUGS:');
        if (categoryFilter && categoryFilter.options.length > 1) {
            Array.from(categoryFilter.options).forEach(option => {
                if (option.value) {
                    const matchingProducts = window.allProducts.filter(p => 
                        p.category_slug === option.value || 
                        p.category === option.value ||
                        p.category_name === option.value
                    );
                    console.log(`  Dropdown: "${option.value}" → ${matchingProducts.length} productos`);
                }
            });
        }
        
        // Test con una categoría medicinal específica
        if (categoryFilter && categoryFilter.options.length > 1) {
            // Buscar una opción medicinal
            let medicinalOption = null;
            Array.from(categoryFilter.options).forEach(option => {
                if (option.value && option.value.includes('medicinal')) {
                    medicinalOption = option;
                }
            });
            
            if (medicinalOption) {
                console.log(`🧪 Probando con categoría: "${medicinalOption.textContent}" (${medicinalOption.value})`);
                categoryFilter.value = medicinalOption.value;
                filterProducts();
            } else {
                console.log('⚠️ No se encontró categoría medicinal para probar');
            }
        }
    }
}

/**
 * Test de filtros para verificar que funcionan
 */
function testFilters() {
    console.log('🧪 Probando funcionamiento de filtros...');
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput && categoryFilter && statusFilter) {
        console.log('✅ Todos los elementos de filtros están disponibles');
        
        // Test simple: verificar que los event listeners están funcionando
        const testEvent = new Event('input');
        searchInput.dispatchEvent(testEvent);
        
        console.log('🔍 Test de filtros completado');
    } else {
        console.error('❌ Algunos elementos de filtros no están disponibles:', {
            searchInput: !!searchInput,
            categoryFilter: !!categoryFilter,
            statusFilter: !!statusFilter
        });
    }
}

/**
 * Resetear filtros
 */
function resetFilters() {
    console.log('🔄 Reseteando filtros...');
    
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    // Recargar todos los productos
    if (window.allProducts && Array.isArray(window.allProducts)) {
        updateStats(window.allProducts);
        renderProductsTable(window.allProducts);
    }
}

/**
 * Filtrar productos
 */
async function filterProducts() {
    console.log('🔍 Filtrando productos...');
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('categoryFilter')?.value || '';
    const selectedStatus = document.getElementById('statusFilter')?.value || '';
    
    console.log('🔧 Filtros aplicados:', {
        searchTerm,
        selectedCategory,
        selectedStatus
    });
    
    try {
        // Cargar todos los productos si no los tenemos
        let products = [];
        if (window.allProducts && Array.isArray(window.allProducts)) {
            products = window.allProducts;
            console.log('📦 Usando productos desde cache:', products.length);
        } else {
            console.log('📡 Cargando productos desde API...');
            const response = await api.getProducts({ limit: 500 });
            if (response.success && response.data && Array.isArray(response.data.products)) {
                products = response.data.products;
            } else if (response.success && Array.isArray(response.data)) {
                products = response.data;
            } else if (Array.isArray(response.products)) {
                products = response.products;
            } else if (Array.isArray(response)) {
                products = response;
            }
            window.allProducts = products; // Cache para próximas búsquedas
            console.log('✅ Productos cargados desde API:', products.length);
        }
        
        if (products.length === 0) {
            console.warn('⚠️ No hay productos para filtrar');
            return;
        }
        
        // Aplicar filtros
        let filteredProducts = products.filter(product => {
            // Filtro de búsqueda
            const matchesSearch = !searchTerm || 
                product.name?.toLowerCase().includes(searchTerm) ||
                product.sku?.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm);
            
            // Filtro de categoría - Lógica mejorada para manejar diferentes formatos
            let matchesCategory = true;
            
            if (selectedCategory && selectedCategory !== '') {
                // Obtener todas las posibles referencias de categoría del producto
                const productCategoryFields = [
                    product.category_slug,
                    product.category,
                    product.category_name
                ].filter(field => field && field !== ''); // Solo campos válidos
                
                // Debug limitado (solo primeros 3 productos para no saturar)
                if (products.indexOf(product) < 3) {
                    console.log(`🔍 CATEGORY MATCH - ${product.name}:`, {
                        selectedCategory,
                        productFields: productCategoryFields,
                        productData: {
                            category_slug: product.category_slug,
                            category: product.category,
                            category_name: product.category_name
                        }
                    });
                }
                
                // Verificar si algún campo del producto coincide con la selección
                matchesCategory = productCategoryFields.some(field => {
                    // Match exacto
                    const exactMatch = field === selectedCategory;
                    
                    // Match contains (bidireccional)
                    const fieldContainsSelected = field.toLowerCase().includes(selectedCategory.toLowerCase());
                    const selectedContainsField = selectedCategory.toLowerCase().includes(field.toLowerCase());
                    
                    const hasMatch = exactMatch || fieldContainsSelected || selectedContainsField;
                    
                    if (hasMatch && products.indexOf(product) < 3) {
                        console.log(`✅ MATCH encontrado para ${product.name}: "${field}" vs "${selectedCategory}" (exacto: ${exactMatch}, contiene: ${fieldContainsSelected}, reverso: ${selectedContainsField})`);
                    }
                    
                    return hasMatch;
                });
                
                if (products.indexOf(product) < 3) {
                    console.log(`🎯 RESULTADO FINAL para ${product.name}: ${matchesCategory}`);
                }
            }
            
            
            // Filtro de estado
            let matchesStatus = true;
            if (selectedStatus) {
                switch (selectedStatus) {
                    case 'in_stock':
                        matchesStatus = (product.stock_quantity || 0) > 0;
                        break;
                    case 'out_of_stock':
                        matchesStatus = (product.stock_quantity || 0) === 0;
                        break;
                    case 'featured':
                        matchesStatus = product.featured == 1;
                        break;
                    case 'medicinal':
                        // Lógica robusta para productos medicinales - maneja diferentes tipos de datos
                        const isMedicinal = product.is_medicinal == 1 || 
                                          product.is_medicinal === 1 || 
                                          product.is_medicinal === '1' || 
                                          product.is_medicinal === true ||
                                          product.is_medicinal === 'true';
                        
                        const requiresPrescription = product.requires_prescription == 1 || 
                                                   product.requires_prescription === 1 || 
                                                   product.requires_prescription === '1' || 
                                                   product.requires_prescription === true ||
                                                   product.requires_prescription === 'true';
                        
                        // También buscar por categorías medicinales
                        const isMedicinalCategory = (product.category_slug && product.category_slug.includes('medicinal')) ||
                                                  (product.category && product.category.toLowerCase().includes('medicinal')) ||
                                                  (product.category_name && product.category_name.toLowerCase().includes('medicinal'));
                        
                        matchesStatus = isMedicinal || requiresPrescription || isMedicinalCategory;
                        
                        // Debug para este producto específico
                        if (selectedStatus === 'medicinal') {
                            console.log(`🔍 ${product.name}: isMedicinal=${isMedicinal}, requiresPrescription=${requiresPrescription}, isMedicinalCategory=${isMedicinalCategory}, final=${matchesStatus}`);
                        }
                        break;
                }
            }
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        console.log(`🔍 Filtrados: ${filteredProducts.length} de ${products.length} productos`);
        
        // Debug: mostrar algunos productos filtrados
        if (filteredProducts.length > 0) {
            console.log('📦 Muestra de productos filtrados:', filteredProducts.slice(0, 2).map(p => ({
                name: p.name,
                category: p.category_slug || p.category || p.category_name,
                stock: p.stock_quantity,
                medicinal: p.is_medicinal,
                featured: p.featured
            })));
        }
        
        // Debug específico para filtro medicinal
        if (selectedStatus === 'medicinal') {
            console.log('🔍 DEBUG FILTRO MEDICINAL:');
            console.log('📊 Total productos:', products.length);
            
            // Mostrar todos los productos y sus valores medicinales
            const medicinalDebug = products.slice(0, 5).map(p => ({
                name: p.name,
                is_medicinal: p.is_medicinal,
                is_medicinal_type: typeof p.is_medicinal,
                requires_prescription: p.requires_prescription,
                requires_prescription_type: typeof p.requires_prescription,
                category: p.category_slug || p.category || p.category_name
            }));
            
            console.table(medicinalDebug);
            
            // Contar productos medicinales usando la misma lógica que el filtro
            const manualCount = products.filter(p => {
                const isMedicinal = p.is_medicinal == 1 || 
                                  p.is_medicinal === 1 || 
                                  p.is_medicinal === '1' || 
                                  p.is_medicinal === true ||
                                  p.is_medicinal === 'true';
                
                const requiresPrescription = p.requires_prescription == 1 || 
                                           p.requires_prescription === 1 || 
                                           p.requires_prescription === '1' || 
                                           p.requires_prescription === true ||
                                           p.requires_prescription === 'true';
                
                const isMedicinalCategory = (p.category_slug && p.category_slug.includes('medicinal')) ||
                                          (p.category && p.category.toLowerCase().includes('medicinal')) ||
                                          (p.category_name && p.category_name.toLowerCase().includes('medicinal'));
                
                const isMatch = isMedicinal || requiresPrescription || isMedicinalCategory;
                
                if (isMatch) {
                    console.log(`✅ ${p.name}: medicinal=${isMedicinal}, prescription=${requiresPrescription}, category=${isMedicinalCategory}`);
                }
                
                return isMatch;
            }).length;
            
            console.log('🔢 Productos medicinales encontrados manualmente:', manualCount);
            console.log('🔢 Productos filtrados finalmente:', filteredProducts.length);
        }
        
        // Actualizar estadísticas con productos filtrados
        updateStats(filteredProducts);
        
        // Renderizar tabla con productos filtrados
        renderProductsTable(filteredProducts);
        
    } catch (error) {
        console.error('❌ Error filtrando productos:', error);
    }
}

// Exportar funciones al scope global
window.initAdminSystem = initAdminSystem;
window.manualInit = manualInit;
window.loadProducts = loadProducts;
window.formatPrice = formatPrice;
window.updateStats = updateStats;
window.renderProductsTable = renderProductsTable;
window.openCreateModal = openCreateModal;
window.adminOpenEditModal = adminOpenEditModal;
window.openCreateModalForCategory = openCreateModalForCategory;
window.closeCategorySelector = closeCategorySelector;
window.closeEditModal = closeEditModal;
window.deleteProduct = deleteProduct;
window.duplicateProduct = duplicateProduct;
window.parseJSON = parseJSON;
window.stringifyJSON = stringifyJSON;
window.setupFiltersAndSearch = setupFiltersAndSearch;
window.filterProducts = filterProducts;
window.resetFilters = resetFilters;
window.testFilters = testFilters;
window.testMedicinalFilter = testMedicinalFilter;
window.testCategoryFilter = testCategoryFilter;
window.reloadCategories = reloadCategories;
window.diagnosticCategoryFilter = diagnosticCategoryFilter;

console.log('✅ Sistema de modales de administración cargado (VERSIÓN FINAL v3)');