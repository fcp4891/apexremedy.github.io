// frontend/admin/admin-products.js
// ✅ Gestor de productos con formulario dinámico

(function() {
    'use strict';
    
    // Verificar acceso admin
    function checkAdminAccess() {
        if (typeof authManager === 'undefined' || !authManager.requireAdmin()) {
            return;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminAccess);
    } else {
        checkAdminAccess();
    }
})();

let allProducts = [];
let filteredProducts = [];
const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" text-anchor="middle" x="50" y="55"%3ESin Imagen%3C/text%3E%3C/svg%3E';

// Cargar productos directamente sin esperar authManager
console.log('📋 admin-products.js cargado');

// Intentar cargar inmediatamente
async function initAdminProducts() {
    console.log('🚀 [initAdminProducts] Iniciando...');
    
    try {
        console.log('📦 [initAdminProducts] Llamando a loadProducts()...');
        await loadProducts();
        console.log('📦 [initAdminProducts] loadProducts completado');
        
        console.log('📦 [initAdminProducts] Llamando a loadCategories()...');
        await loadCategories();
        console.log('📦 [initAdminProducts] loadCategories completado');
        
        console.log('📦 [initAdminProducts] Llamando a setupFilters()...');
        setupFilters();
        console.log('✅ [initAdminProducts] Carga completada');
    } catch (error) {
        console.error('❌ [initAdminProducts] Error:', error);
        console.error('❌ [initAdminProducts] Stack:', error.stack);
    }
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📋 DOMContentLoaded');
        setTimeout(initAdminProducts, 500);
    });
} else {
    console.log('📋 DOM ya cargado');
    setTimeout(initAdminProducts, 500);
}

// ============================================
// ACTUALIZAR FORMULARIO SEGÚN CATEGORÍA
// ============================================

function updateFormFields() {
    const category = document.getElementById('productCategory').value;
    console.log('🔄 Actualizando campos para categoría:', category);
    
    // Secciones especiales
    const medicinalSection = document.getElementById('medicinalSection');
    const seedSection = document.getElementById('seedSection');
    const breederField = document.getElementById('breederField');
    const priceField = document.getElementById('priceField');
    
    console.log('📋 Secciones encontradas:', {
        medicinalSection: !!medicinalSection,
        seedSection: !!seedSection,
        breederField: !!breederField,
        priceField: !!priceField
    });
    
    // Ocultar todas las secciones primero
    if (medicinalSection) medicinalSection.classList.add('hidden');
    if (seedSection) seedSection.classList.add('hidden');
    if (breederField) breederField.classList.add('hidden');
    
    // Mostrar campos según categoría
    if (category === 'medicinal') {
        console.log('💊 Mostrando sección medicinal');
        if (medicinalSection) {
            medicinalSection.classList.remove('hidden');
            console.log('✅ Sección medicinal mostrada');
            console.log('🔍 Clases después de mostrar:', medicinalSection.className);
        } else {
            console.log('❌ No se encontró medicinalSection');
        }
        if (priceField) priceField.classList.add('hidden'); // El precio se define por gramos
        if (breederField) breederField.classList.remove('hidden');
        
        // Marcar campos medicinales como requeridos
        const price5g = document.getElementById('price5g');
        const price10g = document.getElementById('price10g');
        const price20g = document.getElementById('price20g');
        const productPrice = document.getElementById('productPrice');
        
        if (price5g) price5g.required = true;
        if (price10g) price10g.required = true;
        if (price20g) price20g.required = true;
        if (productPrice) productPrice.required = false;
    } else if (category === 'semillas_coleccion') {
        console.log('🌱 Mostrando sección de semillas');
        if (seedSection) seedSection.classList.remove('hidden');
        if (breederField) breederField.classList.remove('hidden');
    } else {
        console.log('📦 Mostrando campos regulares');
        if (priceField) priceField.classList.remove('hidden');
        if (breederField) breederField.classList.remove('hidden');
        
        // Marcar campos regulares como requeridos
        const productPrice = document.getElementById('productPrice');
        if (productPrice) productPrice.required = true;
    }
}

// ============================================
// CARGAR PRODUCTOS
// ============================================

async function loadProducts() {
    try {
        console.log('🔄 [loadProducts] Iniciando carga de productos...');
        console.log('🔄 [loadProducts] api disponible:', typeof api !== 'undefined');
        console.log('🔄 [loadProducts] api.getProducts:', typeof api.getProducts);
        
        const response = await api.getProducts({ limit: 500 });
        console.log('📦 [loadProducts] Respuesta recibida:', response);
        
        if (response.success) {
            allProducts = response.data.products;
            console.log('📦 [loadProducts] Productos extraídos:', allProducts.length);
            console.log('📦 [loadProducts] Primer producto:', allProducts[0]);
            
            filteredProducts = [...allProducts];
            console.log('✅ [loadProducts] Productos listos para mostrar:', filteredProducts.length);
            
            updateStats();
            applyFilters();
        } else {
            console.error('❌ [loadProducts] Response no exitoso:', response.message);
        }
    } catch (error) {
        console.error('❌ [loadProducts] Error al cargar productos:', error);
        console.error('❌ [loadProducts] Stack:', error.stack);
        // Mostrar notificación simple si notify no está disponible
        if (typeof notify !== 'undefined') {
            notify.error('Error al cargar productos');
        } else {
            if (typeof notify !== 'undefined') {
                notify.error('Error al cargar productos. Ver consola para más detalles.', 'Error');
            } else {
                console.error('Error al cargar productos');
            }
        }
    }
}

function updateStats() {
    const total = allProducts.length;
    const inStock = allProducts.filter(p => p.stock > 0).length;
    const medicinal = allProducts.filter(p => p.requires_prescription).length;
    const categories = [...new Set(allProducts.map(p => p.category))].length;
    
    // Verificar que los elementos existan antes de actualizarlos
    const totalEl = document.getElementById('totalProducts');
    const inStockEl = document.getElementById('inStockProducts');
    const medicinalEl = document.getElementById('medicinalProducts');
    const categoriesEl = document.getElementById('totalCategories');
    
    if (totalEl) totalEl.textContent = total;
    if (inStockEl) inStockEl.textContent = inStock;
    if (medicinalEl) medicinalEl.textContent = medicinal;
    if (categoriesEl) categoriesEl.textContent = categories;
}

async function loadCategories() {
    try {
        console.log('🔄 [loadCategories] Iniciando carga de categorías...');
        
        // Cargar todas las categorías disponibles (admin puede ver todo)
        // Pasar ?all=true para forzar cargar todas las categorías
        const response = await fetch(api.baseURL + '/products/categories?all=true', {
            credentials: 'include'
        }).then(res => res.json());
        
        console.log('📦 [loadCategories] Respuesta recibida:', response);
        
        if (response.success) {
            const categories = response.data.categories || [];
            console.log('📦 [loadCategories] Categorías extraídas:', categories);
            
            const select = document.getElementById('categoryFilter');
            console.log('📦 [loadCategories] Selector encontrado:', !!select);
            
            if (!select) {
                console.warn('⚠️ [loadCategories] categoryFilter no encontrado');
                return;
            }
            
            // Limpiar opciones previas (excepto la primera "Todas")
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Agregar categorías de la API (ahora son strings simples)
            categories.forEach(catName => {
                const option = document.createElement('option');
                option.value = catName; // Usar el nombre completo de la BD
                option.textContent = catName;
                select.appendChild(option);
            });
            
            console.log('✅ [loadCategories] Categorías cargadas:', categories.length);
        }
    } catch (error) {
        console.error('❌ [loadCategories] Error al cargar categorías:', error);
        console.error('❌ [loadCategories] Stack:', error.stack);
        if (typeof notify !== 'undefined') {
            notify.error('Error al cargar las categorías');
        }
    }
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

// ============================================
// FILTROS
// ============================================

function setupFilters() {
    let searchTimeout;
    document.getElementById('searchInput')?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    document.getElementById('categoryFilter')?.addEventListener('change', applyFilters);
    document.getElementById('statusFilter')?.addEventListener('change', applyFilters);
}

function applyFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    filteredProducts = allProducts.filter(p => {
        const matchSearch = !search || 
            p.name.toLowerCase().includes(search) || 
            (p.description && p.description.toLowerCase().includes(search));
        const matchCategory = !category || p.category === category || p.category_slug === category;
        
        let matchStatus = true;
        if (status === 'in_stock') matchStatus = (p.stock_quantity || p.stock) > 0;
        if (status === 'out_of_stock') matchStatus = (p.stock_quantity || p.stock) === 0;
        if (status === 'featured') matchStatus = p.featured;
        if (status === 'medicinal') matchStatus = p.requires_prescription || p.is_medicinal;
        
        return matchSearch && matchCategory && matchStatus;
    });

    displayProducts();
}

// ============================================
// MOSTRAR PRODUCTOS
// ============================================

function displayProducts() {
    console.log('🎨 Renderizando productos:', filteredProducts.length);
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) {
        console.error('❌ No se encontró el elemento productsTableBody');
        return;
    }
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500">No se encontraron productos</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredProducts.map(p => {
        const attrs = parseAttributes(p);
        
        // Determinar color de badge según categoría
        let categoryBadgeClasses = 'bg-gray-100 text-gray-700'; // DEFAULT: gris para grow shop
        
        if (p.requires_prescription || p.category === 'medicinal') {
            categoryBadgeClasses = 'bg-red-100 text-red-800';
        } else if (p.category === 'semillas_coleccion') {
            categoryBadgeClasses = 'bg-amber-100 text-amber-800';
        }
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">#${p.id}</td>
                <td class="px-6 py-4">
                    <img src="${(p.images && p.images[0] && p.images[0].url) || p.image || p.image_url || DEFAULT_IMAGE}" 
                         alt="${p.name}"
                         class="w-16 h-16 object-cover rounded-lg shadow-md" 
                         onerror="this.src='${DEFAULT_IMAGE}'">
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${p.name}</div>
                    <div class="text-xs text-gray-500">${p.breeder || ''} ${p.sku ? '| ' + p.sku : ''}</div>
                    ${attrs.strain_type ? `<div class="text-xs text-amber-600 mt-1"><i class="fas fa-cannabis text-xs mr-1"></i>${attrs.strain_type}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${categoryBadgeClasses}">
                        ${formatCategoryName(p.category)}
                    </span>
                    ${attrs.rarity && p.category === 'semillas_coleccion' ? `<div class="mt-1"><span class="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">${attrs.rarity}</span></div>` : ''}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${formatPrice(p)}
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${(p.stock_quantity || p.stock) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${p.stock_quantity || p.stock} ${p.requires_prescription ? 'g' : 'unid'}
                    </span>
                </td>
                <td class="px-6 py-4">
                    ${p.featured ? '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"><i class="fas fa-star mr-1"></i>Destacado</span>' : ''}
                </td>
                <td class="px-6 py-4 text-sm whitespace-nowrap">
                    <button onclick="openEditModal(${p.id})" class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="deleteProduct(${p.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function parseAttributes(product) {
    try {
        return typeof product.attributes === 'string' 
            ? JSON.parse(product.attributes) 
            : (product.attributes || {});
    } catch {
        return {};
    }
}

function formatPrice(product) {
    // Usar base_price en lugar de price
    const price = product.base_price || product.price || 0;
    
    if (product.price_variants) {
        try {
            const variants = typeof product.price_variants === 'string' 
                ? JSON.parse(product.price_variants) 
                : product.price_variants;
            const minPrice = Math.min(...Object.values(variants));
            return `Desde $${minPrice.toLocaleString()}`;
        } catch (e) {
            return `$${price.toLocaleString()}`;
        }
    }
    return `$${price.toLocaleString()}`;
}

// ============================================
// MODAL - CREAR/EDITAR
// ============================================

function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    updateFormFields(); // Resetear campos dinámicos
    document.getElementById('productModal').classList.remove('hidden');
}

        async function editProduct(id) {
            try {
                console.log('🔄 Editando producto ID:', id);
                console.log('🔍 VERIFICACIÓN INICIAL DE ELEMENTOS:');
                console.log('  dosageRecommendation existe:', !!document.getElementById('dosageRecommendation'));
                console.log('  administrationMethod existe:', !!document.getElementById('administrationMethod'));
                console.log('  therapeuticUse existe:', !!document.getElementById('therapeuticUse'));
                console.log('  contraindications existe:', !!document.getElementById('contraindications'));
        const response = await api.getProductById(id);
        console.log('📦 Respuesta del producto:', response);
        
        if (response.success) {
            const product = response.data.product || response.data;
            const attrs = parseAttributes(product);
            console.log('🔍 Producto cargado:', product);
            console.log('🏷️ Atributos parseados:', attrs);
            console.log('📊 Datos específicos del producto:', {
                category: product.category,
                requires_prescription: product.requires_prescription,
                price_variants: product.price_variants,
                medicinal_info: product.medicinal_info,
                attributes: product.attributes
            });
            
            // MOSTRAR TODOS LOS CAMPOS DISPONIBLES PARA DEBUGGING
            console.log('🔍 TODOS LOS CAMPOS DEL PRODUCTO:');
            Object.keys(product).forEach(key => {
                console.log(`  ${key}:`, product[key]);
            });
            
            // PRUEBA ESPECÍFICA PARA VERIFICAR DATOS MEDICINALES
            console.log('🧪 PRUEBA ESPECÍFICA DE DATOS MEDICINALES:');
            console.log('  medicinal_info (raw):', product.medicinal_info);
            console.log('  medicinal_info (type):', typeof product.medicinal_info);
            
            if (product.medicinal_info) {
                console.log('  medicinal_info (processed):', product.medicinal_info);
                console.log('  therapeutic_use:', product.medicinal_info.therapeutic_use);
                console.log('  contraindications:', product.medicinal_info.contraindications);
            }
            
            document.getElementById('modalTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productStock').value = product.stock;
            document.getElementById('productSku').value = product.sku || '';
            document.getElementById('productBreeder').value = product.breeder || '';
            document.getElementById('productFeatured').checked = product.featured || false;
            document.getElementById('productImage').value = product.image || '';
            document.getElementById('productImageHover').value = product.image_hover || '';
            
            console.log('✅ Campos básicos cargados');
            
            // Cargar imágenes si existen
            if (product.image) {
                console.log('🖼️ Cargando imagen principal:', product.image);
                const previewImg = document.getElementById('previewImg');
                if (previewImg) {
                    previewImg.src = product.image;
                    previewImg.classList.remove('hidden');
                    document.getElementById('uploadPlaceholder').classList.add('hidden');
                }
            }
            
            if (product.image_hover) {
                console.log('🖼️ Cargando imagen hover:', product.image_hover);
                const previewHoverImg = document.getElementById('previewImgHover');
                if (previewHoverImg) {
                    previewHoverImg.src = product.image_hover;
                    previewHoverImg.classList.remove('hidden');
                    document.getElementById('uploadPlaceholderHover').classList.add('hidden');
                }
            }
            
            // Si es medicinal (basado en categoría)
            if (product.category === 'medicinal') {
                console.log('💊 Cargando datos medicinales...');
                
                // Cargar variantes de precio si existen
                if (product.price_variants) {
                    const variants = typeof product.price_variants === 'string' 
                        ? JSON.parse(product.price_variants) 
                        : product.price_variants;
                    
                    console.log('💰 Variantes de precio:', variants);
                    const price5g = document.getElementById('price5g');
                    const price10g = document.getElementById('price10g');
                    const price20g = document.getElementById('price20g');
                    
                    if (price5g) price5g.value = variants['5g'] || '';
                    if (price10g) price10g.value = variants['10g'] || '';
                    if (price20g) price20g.value = variants['20g'] || '';
                }
                
                // Esperar un momento para que updateFormFields termine y los campos estén disponibles
                await new Promise(resolve => setTimeout(resolve, 200));
                
                // Verificar que la sección medicinal esté visible
                const medicinalSection = document.getElementById('medicinalSection');
                console.log('🔍 Sección medicinal visible:', medicinalSection && !medicinalSection.classList.contains('hidden'));
                
                // Cargar información medicinal si existe
                if (product.medicinal_info && typeof product.medicinal_info === 'object') {
                    console.log('📋 Información medicinal:', product.medicinal_info);
                    const medInfo = product.medicinal_info;
                    
                    console.log('💊 Datos medicinales:', medInfo);
                    console.log('🔍 Valores específicos:');
                    console.log('  - therapeutic_use:', medInfo.therapeutic_use);
                    console.log('  - dosage_recommendation:', medInfo.dosage_recommendation);
                    console.log('  - administration:', medInfo.administration);
                    console.log('  - contraindications:', medInfo.contraindications);
                    console.log('  - side_effects:', medInfo.side_effects);
                    
                    const therapeuticUse = document.getElementById('therapeuticUse');
                    const dosage = document.getElementById('dosageRecommendation');
                    const administration = document.getElementById('administrationMethod');
                    const contraindications = document.getElementById('contraindications');
                    const sideEffects = document.getElementById('sideEffects');
                    
                    console.log('🔍 Elementos del DOM encontrados:');
                    console.log('  - therapeuticUse:', !!therapeuticUse);
                    console.log('  - dosage:', !!dosage);
                    console.log('  - administration:', !!administration);
                    console.log('  - contraindications:', !!contraindications);
                    console.log('  - sideEffects:', !!sideEffects);
                    
                    if (therapeuticUse) {
                        therapeuticUse.value = medInfo.therapeutic_use || '';
                        console.log('✅ therapeuticUse cargado:', therapeuticUse.value);
                    }
                    if (dosage) {
                        dosage.value = medInfo.dosage_recommendation || '';
                        console.log('✅ dosage cargado:', dosage.value);
                    }
                    if (administration) {
                        administration.value = medInfo.administration || '';
                        console.log('✅ administration cargado:', administration.value);
                    }
                    if (contraindications) {
                        contraindications.value = Array.isArray(medInfo.contraindications) 
                            ? medInfo.contraindications.join(', ') 
                            : medInfo.contraindications || '';
                        console.log('✅ contraindications cargado:', contraindications.value);
                    }
                    if (sideEffects) {
                        sideEffects.value = Array.isArray(medInfo.side_effects) 
                            ? medInfo.side_effects.join(', ') 
                            : medInfo.side_effects || '';
                        console.log('✅ sideEffects cargado:', sideEffects.value);
                    }
                    
                    // Forzar actualización visual de los campos
                    console.log('🔄 Forzando actualización visual de campos...');
                    [therapeuticUse, dosage, administration, contraindications, sideEffects].forEach(field => {
                        if (field) {
                            field.style.display = 'none';
                            field.offsetHeight; // Forzar reflow
                            field.style.display = '';
                        }
                    });
                } else {
                    console.log('⚠️ No hay datos medicinales válidos para cargar');
                    console.log('  - medicinal_info existe:', !!product.medicinal_info);
                    console.log('  - tipo:', typeof product.medicinal_info);
                }
                
                // Cargar campos medicinales existentes del HTML
                const medicinalFields = {
                    'medicinalStrainType': product.medicinal_strain_type,
                    'medicinalThc': product.medicinal_thc,
                    'medicinalCbd': product.medicinal_cbd,
                    'medicinalCbn': product.medicinal_cbn,
                    'medicinalGenetics': product.medicinal_genetics,
                    'medicinalOrigin': product.medicinal_origin,
                    'medicinalAromas': product.medicinal_aromas,
                    'medicinalEffects': product.medicinal_effects,
                    'medicinalTerpenes': product.medicinal_terpenes,
                    'medicinalFlavor': product.medicinal_flavor
                };
                
                console.log('💊 Campos medicinales a cargar:', medicinalFields);
                Object.entries(medicinalFields).forEach(([fieldId, value]) => {
                    const element = document.getElementById(fieldId);
                    if (element && value) {
                        element.value = value;
                        console.log(`✅ Campo ${fieldId} cargado:`, value);
                    }
                });
            }
            
            // Si es semilla
            if (product.category === 'semillas_coleccion') {
                console.log('🌱 Cargando datos de semilla...');
                console.log('🏷️ Atributos de semilla:', attrs);
                document.getElementById('strainType').value = attrs.strain_type || '';
                document.getElementById('thcPercent').value = attrs.thc_percent || '';
                document.getElementById('cbdPercent').value = attrs.cbd_percent || '';
                document.getElementById('genetics').value = attrs.genetics || '';
                document.getElementById('flowering').value = attrs.flowering_time_weeks || '';
                document.getElementById('aromas').value = Array.isArray(attrs.aromas) ? attrs.aromas.join(', ') : '';
                document.getElementById('effects').value = Array.isArray(attrs.effects) ? attrs.effects.join(', ') : '';
                document.getElementById('rarity').value = attrs.rarity || 'común';
                console.log('✅ Campos de semilla cargados');
            }
            
            // Cargar TODOS los campos disponibles del producto
            console.log('🔄 Cargando todos los campos disponibles...');
            
            // Campos básicos adicionales
            const statusField = document.getElementById('productStatus');
            const typeField = document.getElementById('productType');
            if (statusField) statusField.value = product.status || '';
            if (typeField) typeField.value = product.type || '';
            
            // Campos medicinales directos de la tabla
            const medicinalFields = {
                'medicinalStrainType': product.medicinal_strain_type,
                'medicinalThc': product.medicinal_thc,
                'medicinalCbd': product.medicinal_cbd,
                'medicinalCbn': product.medicinal_cbn,
                'medicinalGenetics': product.medicinal_genetics,
                'medicinalOrigin': product.medicinal_origin,
                'medicinalAromas': product.medicinal_aromas,
                'medicinalEffects': product.medicinal_effects,
                'medicinalTerpenes': product.medicinal_terpenes,
                'medicinalFlavor': product.medicinal_flavor
            };
            
            console.log('💊 Campos medicinales directos:', medicinalFields);
            Object.entries(medicinalFields).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element && value !== undefined && value !== null) {
                    element.value = value;
                    console.log(`✅ Campo ${fieldId} cargado:`, value);
                }
            });
            
            // Campos de precios medicinales
            const priceFields = {
                'price5g': product.medicinal_price_5g,
                'price10g': product.medicinal_price_10g,
                'price20g': product.medicinal_price_20g
            };
            
            console.log('💰 Campos de precios:', priceFields);
            Object.entries(priceFields).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element && value !== undefined && value !== null) {
                    element.value = value;
                    console.log(`✅ Precio ${fieldId} cargado:`, value);
                }
            });
            
            // Campos de información medicinal (JSON)
            if (product.medicinal_info) {
                console.log('📋 Información medicinal JSON:', product.medicinal_info);
                let medInfo;
                try {
                    medInfo = typeof product.medicinal_info === 'string' 
                        ? JSON.parse(product.medicinal_info) 
                        : product.medicinal_info;
                } catch (e) {
                    console.error('Error parseando medicinal_info:', e);
                    medInfo = {};
                }
                
                console.log('💊 Información medicinal parseada:', medInfo);
                
                const infoFields = {
                    'therapeuticUse': medInfo.therapeutic_use,
                    'dosageRecommendation': medInfo.dosage_recommendation,
                    'administrationMethod': medInfo.administration,
                    'contraindications': medInfo.contraindications,
                    'sideEffects': medInfo.side_effects
                };
                
                Object.entries(infoFields).forEach(([fieldId, value]) => {
                    const element = document.getElementById(fieldId);
                    console.log(`🔍 Buscando elemento ${fieldId}:`, !!element);
                    if (element && value !== undefined && value !== null) {
                        element.value = value;
                        console.log(`✅ Campo ${fieldId} cargado desde JSON:`, value);
                    } else {
                        console.log(`❌ Campo ${fieldId} no se pudo cargar:`, { element: !!element, value });
                    }
                });
                
                // VERIFICACIÓN ESPECÍFICA PARA CAMPOS PROBLEMÁTICOS
                console.log('🔍 VERIFICACIÓN ESPECÍFICA:');
                const dosageEl = document.getElementById('dosageRecommendation');
                const adminEl = document.getElementById('administrationMethod');
                console.log('  dosageRecommendation existe:', !!dosageEl);
                console.log('  administrationMethod existe:', !!adminEl);
                if (dosageEl) console.log('  dosageRecommendation valor:', dosageEl.value);
                if (adminEl) console.log('  administrationMethod valor:', adminEl.value);
            }
            
            // También cargar campos directos que puedan tener información adicional
            const directInfoFields = {
                'therapeuticUse': product.therapeutic_use,
                'dosageRecommendation': product.dosage_recommendation,
                'administrationMethod': product.administration,
                'contraindications': product.contraindications,
                'sideEffects': product.side_effects
            };
            
            console.log('💊 Campos directos adicionales:', directInfoFields);
            Object.entries(directInfoFields).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element && value !== undefined && value !== null && value !== '') {
                    // Solo sobrescribir si el campo está vacío o si el valor directo es más completo
                    if (!element.value || element.value.trim() === '') {
                        element.value = value;
                        console.log(`✅ Campo ${fieldId} cargado desde campo directo:`, value);
                    }
                }
            });
            
            // Campos de semillas (si existen)
            const seedFields = {
                'strainType': product.strain_type,
                'thcPercent': product.thc_percent,
                'cbdPercent': product.cbd_percent,
                'genetics': product.genetics,
                'flowering': product.flowering_time_weeks,
                'aromas': product.aromas,
                'effects': product.effects,
                'rarity': product.rarity
            };
            
            console.log('🌱 Campos de semillas:', seedFields);
            Object.entries(seedFields).forEach(([fieldId, value]) => {
                const element = document.getElementById(fieldId);
                if (element && value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        element.value = value.join(', ');
                    } else {
                        element.value = value;
                    }
                    console.log(`✅ Campo ${fieldId} cargado:`, value);
                }
            });
            
            // Actualizar campos según categoría DESPUÉS de cargar todos los datos
            console.log('🔄 Actualizando campos según categoría...');
            console.log('🔍 VALORES ANTES DE updateFormFields:');
            console.log('  therapeuticUse:', document.getElementById('therapeuticUse')?.value);
            console.log('  dosageRecommendation:', document.getElementById('dosageRecommendation')?.value);
            console.log('  administrationMethod:', document.getElementById('administrationMethod')?.value);
            
            updateFormFields();
            
            console.log('🔍 VALORES DESPUÉS DE updateFormFields:');
            console.log('  therapeuticUse:', document.getElementById('therapeuticUse')?.value);
            console.log('  dosageRecommendation:', document.getElementById('dosageRecommendation')?.value);
            console.log('  administrationMethod:', document.getElementById('administrationMethod')?.value);
            
            // VERIFICACIÓN FINAL DE VISIBILIDAD
            console.log('🔍 VERIFICACIÓN FINAL DE VISIBILIDAD:');
            const medicinalSection = document.getElementById('medicinalSection');
            if (medicinalSection) {
                console.log('  medicinalSection clases:', medicinalSection.className);
                console.log('  medicinalSection visible:', !medicinalSection.classList.contains('hidden'));
            }
            
            document.getElementById('productModal').classList.remove('hidden');
            
            // EJECUTAR DIAGNÓSTICO VISUAL DESPUÉS DE MOSTRAR EL MODAL
            setTimeout(() => {
                if (typeof runVisualDiagnostic === 'function') {
                    runVisualDiagnostic();
                }
            }, 200);
        }
    } catch (error) {
        if (typeof notify !== 'undefined') {
            notify.error('Error al cargar producto');
        } else {
            console.error('Error al cargar producto');
        }
    }
}

function closeModal() {
    // Ocultar modal
    document.getElementById('productModal').classList.add('hidden');
    
    // Limpiar formulario
    clearForm();
}

function clearForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    // Limpiar todos los campos del formulario
    form.reset();
    
    // Limpiar campos específicos que no se resetean con reset()
    const fieldsToClear = [
        'productId', 'productName', 'productDescription', 'productStock', 
        'productSku', 'productBreeder', 'productPrice', 'productImage', 
        'productImageHover', 'price5g', 'price10g', 'price20g',
        'therapeuticUse', 'dosageRecommendation', 'administrationMethod',
        'contraindications', 'sideEffects', 'medicinalThc', 'medicinalCbd',
        'medicinalCbn', 'medicinalGenetics', 'medicinalOrigin', 'medicinalAromas',
        'medicinalEffects', 'medicinalTerpenes', 'medicinalFlavor', 'price1g',
        'medicinalStock', 'strainType', 'thcPercent', 'cbdPercent', 'genetics',
        'flowering', 'aromas', 'effects', 'rarity'
    ];
    
    fieldsToClear.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = false;
            } else {
                field.value = '';
            }
        }
    });
    
    // Limpiar imágenes de preview
    const previewImg = document.getElementById('previewImg');
    const previewImgHover = document.getElementById('previewImgHover');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadPlaceholderHover = document.getElementById('uploadPlaceholderHover');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const removeImageHoverBtn = document.getElementById('removeImageHoverBtn');
    
    if (previewImg) {
        previewImg.src = '';
        previewImg.classList.add('hidden');
    }
    if (previewImgHover) {
        previewImgHover.src = '';
        previewImgHover.classList.add('hidden');
    }
    if (uploadPlaceholder) {
        uploadPlaceholder.classList.remove('hidden');
    }
    if (uploadPlaceholderHover) {
        uploadPlaceholderHover.classList.remove('hidden');
    }
    if (removeImageBtn) {
        removeImageBtn.classList.add('hidden');
    }
    if (removeImageHoverBtn) {
        removeImageHoverBtn.classList.add('hidden');
    }
    
    // Ocultar secciones especiales
    const medicinalSection = document.getElementById('medicinalSection');
    const seedSection = document.getElementById('seedSection');
    
    if (medicinalSection) {
        medicinalSection.classList.add('hidden');
    }
    if (seedSection) {
        seedSection.classList.add('hidden');
    }
    
    // Mostrar campo de precio normal
    const priceField = document.getElementById('priceField');
    if (priceField) {
        priceField.classList.remove('hidden');
    }
    
    console.log('✅ Formulario limpiado');
}

async function deleteProduct(id) {
    const confirmed = typeof notify !== 'undefined' ? 
        await notify.confirmDelete('este producto') : 
        confirm('¿Estás seguro de que quieres eliminar este producto?');
    if (!confirmed) return;
    
    try {
        const response = await api.deleteProduct(id);
        
        if (response.success) {
            if (typeof notify !== 'undefined') {
                notify.success('Producto eliminado exitosamente');
            } else {
                if (typeof notify !== 'undefined') {
                    notify.success('Producto eliminado exitosamente', 'Eliminado');
                } else {
                    console.log('Producto eliminado exitosamente');
                }
            }
            loadProducts();
        }
    } catch (error) {
        if (typeof notify !== 'undefined') {
            notify.error('Error al eliminar producto');
        } else {
            if (typeof notify !== 'undefined') {
                notify.error('Error al eliminar producto', 'Error');
            } else {
                console.error('Error al eliminar producto');
            }
        }
    }
}

// ============================================
// GUARDAR PRODUCTO
// ============================================

function setupForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const category = document.getElementById('productCategory').value;
        
        // Datos básicos
        const productData = {
            name: document.getElementById('productName').value,
            category: category,
            description: document.getElementById('productDescription').value,
            stock: parseInt(document.getElementById('productStock').value),
            sku: document.getElementById('productSku').value,
            breeder: document.getElementById('productBreeder').value || null,
            featured: document.getElementById('productFeatured').checked,
            image: document.getElementById('productImage').value,
            image_hover: document.getElementById('productImageHover').value || null
        };
        
        // Si es MEDICINAL
        if (category === 'medicinal') {
            productData.requires_prescription = true;
            
            // Obtener precios
            const price5g = parseInt(document.getElementById('price5g')?.value);
            const price10g = parseInt(document.getElementById('price10g')?.value);
            const price20g = parseInt(document.getElementById('price20g')?.value);
            
            productData.price_variants = {
                '5g': price5g,
                '10g': price10g,
                '20g': price20g
            };
            productData.price = price5g; // Precio base
            
            // Si estamos editando, obtener datos existentes para preservar valores vacíos
            let existingProduct = null;
            if (productId) {
                try {
                    const existingResponse = await api.getProductById(productId);
                    if (existingResponse.success && existingResponse.data?.product) {
                        existingProduct = existingResponse.data.product;
                        console.log('📦 Obteniendo datos existentes para preservar campos vacíos');
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudieron obtener datos existentes:', e);
                }
            }
            
            // Helper para preservar valores existentes
            const preserveValue = (newValue, existingValue) => {
                // Si el nuevo valor está vacío o es null/undefined, usar el existente
                if (!newValue || newValue === '' || newValue === null) {
                    return existingValue !== undefined ? existingValue : '';
                }
                return newValue;
            };
            
            // Helper para parsear JSON desde string o objeto
            const parseMedicinalInfo = (data) => {
                if (!data) return {};
                if (typeof data === 'string') {
                    try {
                        // Puede venir doblemente escapado
                        let parsed = data;
                        if (parsed.startsWith('"') && parsed.endsWith('"')) {
                            parsed = JSON.parse(parsed);
                        }
                        if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                        }
                        return parsed;
                    } catch (e) {
                        try {
                            return JSON.parse(data);
                        } catch (e2) {
                            console.warn('Error parseando medicinal_info:', e2);
                            return {};
                        }
                    }
                }
                return data || {};
            };
            
            // Parsear medicinal_info existente
            const existingMedicinalInfo = existingProduct ? parseMedicinalInfo(existingProduct.medicinal_info) : {};
            
            // Recolectar datos medicinales preservando valores existentes
            const therapeuticUse = document.getElementById('therapeuticUse')?.value || '';
            const dosageRecommendation = document.getElementById('dosageRecommendation')?.value || '';
            const administration = document.getElementById('administrationMethod')?.value || '';
            const contraindicationsValue = document.getElementById('contraindications')?.value || '';
            const sideEffectsValue = document.getElementById('sideEffects')?.value || '';
            
            // Manejar contraindications y side_effects que pueden ser arrays o strings
            let contraindications = contraindicationsValue;
            if (Array.isArray(existingMedicinalInfo.contraindications)) {
                if (!contraindicationsValue) {
                    contraindications = existingMedicinalInfo.contraindications.join(', ');
                }
            } else if (existingMedicinalInfo.contraindications && !contraindicationsValue) {
                contraindications = Array.isArray(existingMedicinalInfo.contraindications)
                    ? existingMedicinalInfo.contraindications.join(', ')
                    : existingMedicinalInfo.contraindications;
            }
            
            let sideEffects = sideEffectsValue;
            if (Array.isArray(existingMedicinalInfo.side_effects)) {
                if (!sideEffectsValue) {
                    sideEffects = existingMedicinalInfo.side_effects.join(', ');
                }
            } else if (existingMedicinalInfo.side_effects && !sideEffectsValue) {
                sideEffects = Array.isArray(existingMedicinalInfo.side_effects)
                    ? existingMedicinalInfo.side_effects.join(', ')
                    : existingMedicinalInfo.side_effects;
            }
            
            productData.medicinal_info = {
                therapeutic_use: preserveValue(therapeuticUse, existingMedicinalInfo.therapeutic_use),
                dosage_recommendation: preserveValue(dosageRecommendation, existingMedicinalInfo.dosage_recommendation),
                administration: preserveValue(administration, existingMedicinalInfo.administration),
                contraindications: contraindications || preserveValue('', existingMedicinalInfo.contraindications),
                side_effects: sideEffects || preserveValue('', existingMedicinalInfo.side_effects)
            };
            
            // Campos medicinales específicos - preservar valores existentes
            productData.unit = document.getElementById('productUnit')?.value || existingProduct?.unit || 'gramos';
            
            const strainTypeValue = document.getElementById('medicinalStrainType')?.value || '';
            productData.medicinal_strain_type = preserveValue(strainTypeValue, existingProduct?.medicinal_strain_type);
            
            const thcValue = document.getElementById('medicinalThc')?.value;
            const cbdValue = document.getElementById('medicinalCbd')?.value;
            const cbnValue = document.getElementById('medicinalCbn')?.value;
            
            productData.medicinal_thc = thcValue !== '' && thcValue !== null && thcValue !== undefined
                ? parseFloat(thcValue) || 0
                : (existingProduct?.medicinal_thc ?? 0);
            
            productData.medicinal_cbd = cbdValue !== '' && cbdValue !== null && cbdValue !== undefined
                ? parseFloat(cbdValue) || 0
                : (existingProduct?.medicinal_cbd ?? 0);
            
            productData.medicinal_cbn = cbnValue !== '' && cbnValue !== null && cbnValue !== undefined
                ? parseFloat(cbnValue) || 0
                : (existingProduct?.medicinal_cbn ?? 0);
            
            productData.medicinal_genetics = preserveValue(
                document.getElementById('medicinalGenetics')?.value || '',
                existingProduct?.medicinal_genetics
            );
            
            productData.medicinal_origin = preserveValue(
                document.getElementById('medicinalOrigin')?.value || '',
                existingProduct?.medicinal_origin
            );
            
            productData.medicinal_aromas = preserveValue(
                document.getElementById('medicinalAromas')?.value || '',
                existingProduct?.medicinal_aromas
            );
            
            productData.medicinal_effects = preserveValue(
                document.getElementById('medicinalEffects')?.value || '',
                existingProduct?.medicinal_effects
            );
            
            productData.medicinal_terpenes = preserveValue(
                document.getElementById('medicinalTerpenes')?.value || '',
                existingProduct?.medicinal_terpenes
            );
            
            productData.medicinal_flavor = preserveValue(
                document.getElementById('medicinalFlavor')?.value || '',
                existingProduct?.medicinal_flavor
            );
            
            // Precios específicos medicinales - preservar si no hay nuevos valores
            const price1gValue = document.getElementById('price1g')?.value;
            productData.medicinal_price_1g = price1gValue && price1gValue !== ''
                ? parseInt(price1gValue)
                : (existingProduct?.medicinal_price_1g ?? null);
            
            productData.medicinal_price_5g = price5g || existingProduct?.medicinal_price_5g || null;
            productData.medicinal_price_10g = price10g || existingProduct?.medicinal_price_10g || null;
            productData.medicinal_price_20g = price20g || existingProduct?.medicinal_price_20g || null;
            
            // Stock medicinal
            const medicinalStockValue = document.getElementById('medicinalStock')?.value;
            productData.medicinal_stock = medicinalStockValue && medicinalStockValue !== ''
                ? parseInt(medicinalStockValue)
                : (existingProduct?.medicinal_stock ?? productData.stock);
            
            // Parsear attributes existentes si es una actualización
            let existingAttributes = {};
            if (existingProduct?.attributes) {
                try {
                    existingAttributes = typeof existingProduct.attributes === 'string'
                        ? JSON.parse(existingProduct.attributes)
                        : existingProduct.attributes;
                } catch (e) {
                    console.warn('Error parseando attributes existentes:', e);
                }
            }
            
            // Parsear strain_info existente si está disponible
            let existingStrainInfo = {};
            if (existingProduct?.strain_info) {
                try {
                    existingStrainInfo = typeof existingProduct.strain_info === 'string'
                        ? JSON.parse(existingProduct.strain_info)
                        : existingProduct.strain_info;
                } catch (e) {
                    console.warn('Error parseando strain_info existente:', e);
                }
            }
            
            // Atributos básicos para medicinales - preservar datos existentes
            const strainTypeAttr = document.getElementById('strainType')?.value || '';
            productData.attributes = {
                strain_type: preserveValue(strainTypeAttr, existingStrainInfo.type || existingAttributes.strain_type),
                thc_percent: productData.medicinal_thc || existingAttributes.thc_percent || 0,
                cbd_percent: productData.medicinal_cbd || existingAttributes.cbd_percent || 0,
                aromas: (document.getElementById('aromas')?.value || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s) || (existingAttributes.aromas || []),
                effects: (document.getElementById('medicinalEffects')?.value || '')
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s) || (existingAttributes.effects || []),
                rarity: existingAttributes.rarity || 'medicinal'
            };
            
            // Preservar strain_info completo si existe
            if (existingProduct?.strain_info) {
                try {
                    let strainInfoToPreserve = parseMedicinalInfo(existingProduct.strain_info);
                    // Actualizar solo los campos que tienen nuevos valores
                    if (productData.medicinal_genetics) strainInfoToPreserve.genetics = productData.medicinal_genetics;
                    if (productData.medicinal_origin) strainInfoToPreserve.origin = productData.medicinal_origin;
                    if (productData.medicinal_strain_type) strainInfoToPreserve.type = productData.medicinal_strain_type;
                    
                    productData.strain_info = JSON.stringify(strainInfoToPreserve);
                } catch (e) {
                    console.warn('Error preservando strain_info:', e);
                }
            }
            
        } else if (category === 'semillas_coleccion') {
            // SEMILLAS
            productData.requires_prescription = false;
            productData.price = parseFloat(document.getElementById('productPrice').value);
            
            productData.attributes = {
                strain_type: document.getElementById('strainType').value,
                genetics: document.getElementById('genetics').value,
                thc_percent: parseFloat(document.getElementById('thcPercent').value) || 0,
                cbd_percent: parseFloat(document.getElementById('cbdPercent').value) || 0,
                flowering_time_weeks: document.getElementById('flowering').value,
                aromas: document.getElementById('aromas').value.split(',').map(s => s.trim()).filter(s => s),
                effects: document.getElementById('effects').value.split(',').map(s => s.trim()).filter(s => s),
                rarity: document.getElementById('rarity').value
            };
            
        } else {
            // PRODUCTOS REGULARES
            productData.requires_prescription = false;
            productData.price = parseFloat(document.getElementById('productPrice').value);
            productData.attributes = null;
        }

        // Validar campos requeridos
        if (!productData.name || !productData.category) {
            if (typeof notify !== 'undefined') {
                notify.warning('Por favor completa todos los campos requeridos', 'Campos Requeridos');
            } else {
                console.warn('Por favor completa todos los campos requeridos');
            }
            return;
        }
        
        if (category === 'medicinal') {
            const requiredFields = ['price5g', 'price10g', 'price20g'];
            for (const field of requiredFields) {
                const value = document.getElementById(field)?.value;
                if (!value || isNaN(parseInt(value))) {
                    if (typeof notify !== 'undefined') {
                        notify.warning(`Por favor ingresa un precio válido para ${field}`, 'Precio Inválido');
                    } else {
                        console.warn(`Por favor ingresa un precio válido para ${field}`);
                    }
                    return;
                }
            }
        } else if (!productData.price || isNaN(productData.price)) {
            if (typeof notify !== 'undefined') {
                notify.warning('Por favor ingresa un precio válido', 'Precio Inválido');
            } else {
                console.warn('Por favor ingresa un precio válido');
            }
            return;
        }
        
        // 🔍 DEBUG: Ver datos antes de enviar
        console.log('📦 DATOS A ENVIAR AL SERVIDOR:');
        console.log('  Category:', productData.category);
        console.log('  Price:', productData.price);
        console.log('  Medicinal Info:', productData.medicinal_info);
        console.log('  Price Variants:', productData.price_variants);
        console.log('  Attributes:', productData.attributes);
        console.log('  Campos medicinales específicos:', {
            unit: productData.unit,
            medicinal_strain_type: productData.medicinal_strain_type,
            medicinal_thc: productData.medicinal_thc,
            medicinal_cbd: productData.medicinal_cbd,
            medicinal_cbn: productData.medicinal_cbn,
            medicinal_genetics: productData.medicinal_genetics,
            medicinal_origin: productData.medicinal_origin,
            medicinal_aromas: productData.medicinal_aromas,
            medicinal_effects: productData.medicinal_effects,
            medicinal_terpenes: productData.medicinal_terpenes,
            medicinal_flavor: productData.medicinal_flavor
        });
        console.log('  Full Data:', JSON.stringify(productData, null, 2));

        try {
            let response;
            if (productId) {
                console.log(`🔄 Actualizando producto ID: ${productId}`);
                response = await api.updateProduct(productId, productData);
            } else {
                console.log('➕ Creando nuevo producto');
                response = await api.createProduct(productData);
            }

            if (response.success) {
                if (typeof notify !== 'undefined') {
                    notify.success(productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
                } else {
                    alert(productId ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
                }
                closeModal();
                loadProducts();
            }
        } catch (error) {
            console.error('❌ ERROR AL GUARDAR PRODUCTO:', error);
            console.error('📄 Error completo:', {
                message: error.message,
                stack: error.stack
            });
            
            if (typeof notify !== 'undefined') {
                notify.error('Error al guardar producto: ' + error.message);
            } else {
                if (typeof notify !== 'undefined') {
                    notify.error('Error al guardar producto: ' + error.message, 'Error');
                } else {
                    console.error('Error al guardar producto:', error.message);
                }
            }
        }
    });
    
    // Event listener para cambio de categoría
    const categorySelect = document.getElementById('productCategory');
    if (categorySelect) {
        categorySelect.addEventListener('change', updateFormFields);
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Función duplicada eliminada - usando la primera versión

// Exportar funciones globales
window.openCreateModal = openCreateModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.closeModal = closeModal;
window.updateFormFields = updateFormFields;
window.clearForm = clearForm;

console.log('✅ Admin Products cargado');