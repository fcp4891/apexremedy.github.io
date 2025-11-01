// frontend/js/db_articulos.js
// Gestor de productos - Actualizado con soporte medicinal

class ProductManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.loading = false;
    }

    // 🆕 Verificar si el usuario puede ver productos medicinales
    canViewMedicinal() {
        if (typeof authManager === 'undefined') return false;
        if (!authManager.isAuthenticated()) return false;
        
        const user = authManager.getCurrentUser();
        if (!user) return false;
        
        // Admins siempre pueden ver
        if (user.role === 'admin') return true;
        
        // Clientes deben estar aprobados
        const hasAccess = user.account_status === 'approved';
        
        return hasAccess;
    }

    // Helper: Mapear productos del backend al formato del frontend
    mapProductFields(products) {
        if (!products || !Array.isArray(products)) return [];
        
        return products.map(product => ({
            ...product,
            // Mapear campos principales con fallbacks
            price: product.base_price || product.price || 0,
            stock: product.stock_quantity || product.stock || 0,
            // Asegurar que los campos básicos existan
            name: product.name || 'Sin nombre',
            description: product.description || '',
            category: product.category || 'Sin categoría',
            // 🔧 CORRECCIÓN: Preservar tanto images (array) como image (string)
            images: product.images || null,
            image: product.image || product.image_url || null,
            image_url: product.image_url || product.image || null,
            id: product.id || 0
        }));
    }

    // Cargar todos los productos
    async loadProducts(filters = {}) {
        try {
            this.loading = true;
            const response = await api.getProducts(filters);
            
            console.log('📦 Respuesta de getProducts:', response);
            
            if (response && response.success && response.data && response.data.products) {
                const mappedProducts = this.mapProductFields(response.data.products);
                console.log(`✅ ${mappedProducts.length} productos cargados y mapeados`);
                this.products = mappedProducts;
                return this.products;
            }
            
            console.warn('⚠️ Respuesta sin productos:', response);
            this.products = [];
            return [];
        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            console.warn('⚠️ No se pudieron cargar productos desde el backend:', error.message);
            console.info('💡 Verifica que el backend esté configurado y corriendo');
            this.products = [];
            return [];
        } finally {
            this.loading = false;
        }
    }

    // 🆕 Cargar productos medicinales (solo usuarios autorizados)
    async loadMedicinalProducts() {
        if (!this.canViewMedicinal()) {
            return [];
        }

        try {
            this.loading = true;
            const response = await api.getMedicinalProducts();
            
            if (response.success) {
                const products = this.mapProductFields(response.data.products);
                return products;
            }
            
            throw new Error(response.message || 'Error al cargar productos medicinales');
        } catch (error) {
            return [];
        } finally {
            this.loading = false;
        }
    }

    // Obtener producto por ID
    async getProductById(id) {
        try {
            const response = await api.getProductById(id);
            
            if (response.success) {
                return response.data.product;
            }
            
            return null;
        } catch (error) {
            // Si el error es por acceso denegado a producto medicinal
            if (error.message.includes('iniciar sesión') || error.message.includes('aprobada')) {
                notify.warning(error.message, '🔒 Acceso Restringido');
            }
            
            return null;
        }
    }

    // Obtener productos destacados
    async getFeaturedProducts(limit = 6) {
        try {
            const response = await api.getFeaturedProducts();
            
            if (response && response.success && response.data && response.data.products) {
                // Mapear campos del backend al formato esperado por el frontend
                const products = this.mapProductFields(response.data.products.slice(0, limit));
                console.log(`✅ ${products.length} productos destacados mapeados`);
                return products;
            }
            
            console.warn('⚠️ No se encontraron productos destacados en la respuesta:', response);
            return [];
        } catch (error) {
            console.error('❌ Error al obtener productos destacados:', error);
            return [];
        }
    }

    // Buscar productos
    async searchProducts(query) {
        try {
            if (!query || query.trim().length < 2) {
                return [];
            }
            
            const response = await api.searchProducts(query);
            
            if (response.success) {
                // Mapear campos del backend al formato esperado por el frontend
                const products = this.mapProductFields(response.data.products);
                
                return products;
            }
            
            return [];
        } catch (error) {
            return [];
        }
    }

    // Obtener categorías
    async getCategories() {
        try {
            const response = await api.getCategories();
            
            if (response.success) {
                this.categories = response.data.categories;
                return this.categories;
            }
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar categorías de la API, extrayendo de productos cargados...');
        }
        
        // Fallback: Extraer categorías únicas de los productos ya cargados
        if (this.products && this.products.length > 0) {
            const categoriesSet = new Set();
            this.products.forEach(product => {
                if (product.category) {
                    categoriesSet.add(product.category);
                }
                if (product.category_slug) {
                    categoriesSet.add(product.category_slug);
                }
            });
            const categories = Array.from(categoriesSet).filter(cat => cat && cat !== 'undefined');
            console.log('✅ Categorías extraídas de productos:', categories);
            this.categories = categories;
            return categories;
        }
        
        // Si no hay productos cargados, intentar cargarlos primero
        if (this.products.length === 0) {
            await this.loadProducts();
            return this.getCategories(); // Recursión para obtener categorías después de cargar
        }
        
        return [];
    }

    // Filtrar productos localmente (después de cargar)
    filterProducts(filters) {
        let filtered = [...this.products];
        
        console.log('🔍 Filtros aplicados:', filters);
        console.log('📦 Productos antes de filtrar:', filtered.length);
        
        // Filtrar productos medicinales PRIMERO si el usuario no tiene acceso
        if (!this.canViewMedicinal()) {
            const beforeMedicinal = filtered.length;
            filtered = filtered.filter(p => {
                // Excluir productos medicinales y categoría medicinal
                const isMedicinal = p.requires_prescription === true || 
                                   p.category_slug === 'medicinal' ||
                                   (p.category && p.category.toLowerCase().includes('medicinal'));
                return !isMedicinal;
            });
            console.log(`   → Después de filtrar productos medicinales (${beforeMedicinal} → ${filtered.length})`);
        }
        
        if (filters.category && filters.category !== 'all') {
            const beforeCategory = filtered.length;
            filtered = filtered.filter(p => {
                const matches = p.category === filters.category || 
                               p.category_slug === filters.category ||
                               p.category_id === parseInt(filters.category);
                return matches;
            });
            console.log(`   → Después de filtrar por categoría "${filters.category}" (${beforeCategory} → ${filtered.length})`);
        }
        
        if (filters.search) {
            const beforeSearch = filtered.length;
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(searchLower)) ||
                (p.description && p.description.toLowerCase().includes(searchLower)) ||
                (p.sku && p.sku.toLowerCase().includes(searchLower))
            );
            console.log(`   → Después de filtrar por búsqueda "${filters.search}" (${beforeSearch} → ${filtered.length})`);
        }
        
        if (filters.minPrice) {
            const beforeMinPrice = filtered.length;
            filtered = filtered.filter(p => (p.price || 0) >= filters.minPrice);
            console.log(`   → Después de filtrar por precio mínimo ${filters.minPrice} (${beforeMinPrice} → ${filtered.length})`);
        }
        
        if (filters.maxPrice) {
            const beforeMaxPrice = filtered.length;
            filtered = filtered.filter(p => (p.price || 0) <= filters.maxPrice);
            console.log(`   → Después de filtrar por precio máximo ${filters.maxPrice} (${beforeMaxPrice} → ${filtered.length})`);
        }
        
        if (filters.inStock) {
            const beforeStock = filtered.length;
            filtered = filtered.filter(p => this.formatStock(p.stock) > 0);
            console.log(`   → Después de filtrar por stock (${beforeStock} → ${filtered.length})`);
        }
        
        if (filters.featured !== undefined && filters.featured) {
            const beforeFeatured = filtered.length;
            filtered = filtered.filter(p => p.featured === true);
            console.log(`   → Después de filtrar por destacados (${beforeFeatured} → ${filtered.length})`);
        }
        
        console.log('✅ Productos después de todos los filtros:', filtered.length);
        return filtered;
    }

    // Renderizar productos en grid
    renderProducts(products, containerId = 'productsGrid') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`❌ Contenedor ${containerId} no encontrado`);
            return;
        }
        
        console.log(`🎨 Renderizando ${products.length} productos en contenedor: ${containerId}`);
        
        if (products.length === 0) {
            console.warn('⚠️ No hay productos para renderizar');
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
                    <p class="mt-1 text-sm text-gray-500">No se encontraron productos con los filtros seleccionados.</p>
                </div>
            `;
            return;
        }
        
        // Asegurar que el contenedor sea visible
        container.style.display = 'grid';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        
        try {
            const cardsHTML = products.map(product => {
                try {
                    return this.createProductCard(product);
                } catch (error) {
                    console.error('❌ Error al crear card para producto:', product.id, error);
                    return '';
                }
            }).filter(html => html).join('');
            
            console.log(`✅ Generadas ${products.length} tarjetas de productos`);
            container.innerHTML = cardsHTML;
            
            // Agregar event listeners a botones
            this.attachProductEventListeners(container);
            
            // Forzar reflow para asegurar renderizado en móvil
            container.offsetHeight;
            
            console.log('✅ Productos renderizados exitosamente');
        } catch (error) {
            console.error('❌ Error al renderizar productos:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-red-600">Error al renderizar productos: ${error.message}</p>
                </div>
            `;
        }
    }

    // Crear card de producto
    createProductCard(product) {
        const stock = this.formatStock(product.stock);
        const inStock = stock > 0;
        const stockClass = inStock ? 'color: var(--success)' : 'color: var(--error)';
        const stockText = inStock ? `Stock: ${stock}` : 'Sin stock';
        
        // 🆕 Badge especial para productos medicinales
        const medicinalBadge = product.requires_prescription 
            ? '<div class="product-badge" style="background: var(--error); color: white; top: 12px; left: 12px;"><i class="fas fa-prescription"></i> Medicinal</div>'
            : '';
        
        // 🆕 Mostrar precio por gramo si tiene variantes
        let priceDisplay = `$${this.formatPrice(product.price)}`;
        if (product.price_variants) {
            try {
                const variants = typeof product.price_variants === 'string' 
                    ? JSON.parse(product.price_variants) 
                    : product.price_variants;
                const minPrice = Math.min(...Object.values(variants));
                priceDisplay = `Desde $${this.formatPrice(minPrice)}`;
            } catch (e) {
                // Error silencioso al parsear price_variants
            }
        }
        
        // Obtener la URL de la imagen de manera más robusta
        let imageUrl = './assets/images/placeholder.jpg';
        
        // Intentar obtener la imagen en diferentes formatos
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            // Si images es un array de objetos con url
            if (typeof product.images[0] === 'object' && product.images[0].url) {
                imageUrl = product.images[0].url;
            }
            // Si images es un array de strings (URLs directas)
            else if (typeof product.images[0] === 'string') {
                imageUrl = product.images[0];
            }
        } 
        // Si no hay array images, buscar en otros campos
        else if (product.image_url) {
            imageUrl = product.image_url;
        } 
        else if (product.image) {
            imageUrl = product.image;
        }
        
        // Validar y sanitizar categoría
        const categoryDisplay = product.category && product.category !== 'Sin categoría' 
            ? product.category 
            : 'General';
        
        // Validar descripción
        const descriptionDisplay = product.description && product.description.trim() 
            ? product.description 
            : 'Sin descripción disponible';
        
        // Información adicional
        const skuDisplay = product.sku ? `<div class="product-sku" style="font-size: 0.85rem; color: var(--medium-gray); margin-top: 4px;">SKU: ${product.sku}</div>` : '';
        const breederDisplay = product.breeder ? `<div class="product-breeder" style="font-size: 0.9rem; color: var(--primary-green); font-weight: 500; margin-top: 4px;"><i class="fas fa-seedling"></i> ${product.breeder}</div>` : '';
        
        // Atributos adicionales si existen
        let attributesDisplay = '';
        if (product.attributes) {
            try {
                const attrs = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
                if (attrs.strain_type) {
                    attributesDisplay += `<div class="product-strain" style="font-size: 0.85rem; color: var(--accent-black); margin-top: 4px;"><i class="fas fa-cannabis"></i> ${attrs.strain_type}</div>`;
                }
                if (attrs.rarity && product.category === 'semillas_coleccion') {
                    attributesDisplay += `<div class="product-rarity" style="font-size: 0.85rem; color: var(--primary-green); margin-top: 4px;"><i class="fas fa-gem"></i> ${attrs.rarity}</div>`;
                }
            } catch (e) {
                // Error silencioso al parsear atributos
            }
        }
        
        // Descripción truncada para la tarjeta
        const descriptionTruncated = descriptionDisplay.length > 100 
            ? descriptionDisplay.substring(0, 100) + '...' 
            : descriptionDisplay;
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.featured ? '<div class="product-badge">Destacado</div>' : ''}
                ${medicinalBadge}
                <div class="product-image" style="display: block; width: 100%; position: relative;">
                    <img src="${imageUrl}"
                         alt="${product.name}"
                         style="display: block; width: 100%; height: auto;"
                         onerror="this.src='./assets/images/placeholder.jpg';">
                </div>
                <div class="product-info">
                    <span class="product-category" style="display: block;">${categoryDisplay}</span>
                    <h3 class="product-name">${product.name}</h3>
                    ${breederDisplay}
                    ${attributesDisplay}
                    <p class="product-description" style="font-size: 0.9rem; line-height: 1.4;">${descriptionTruncated}</p>
                    ${skuDisplay}
                    <div class="product-price" style="font-size: 1.2rem; font-weight: 700; color: var(--primary-green); margin: 8px 0;">${priceDisplay}</div>
                    <div class="product-stock" style="${stockClass}; font-size: 0.9rem; margin-bottom: 8px;">${stockText}</div>
                    <div class="product-actions">
                        <button onclick="productManager.viewProduct(${product.id})" 
                                class="cta-button">
                            Ver Detalles
                        </button>
                        ${inStock ? `
                            <button onclick="cart.addProduct(${product.id})" 
                                    class="cta-button"
                                    title="Agregar al carrito">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Ver detalles del producto
    viewProduct(id) {
        if (typeof openProductModal === 'function') {
            openProductModal(id);
        } else {
            // Fallback: recargar página si el modal no está disponible
            setTimeout(() => {
                if (typeof openProductModal === 'function') {
                    openProductModal(id);
                } else {
                    notify.error('Error al cargar el sistema de detalles. Por favor recarga la página.');
                }
            }, 100);
        }
    }

    // Formatear precio
    formatPrice(price) {
        // Validar y convertir precio
        let numPrice = price;
        
        // Si es string, intentar convertir a número
        if (typeof price === 'string') {
            numPrice = parseFloat(price.replace(/[$,]/g, ''));
        }
        
        // Si no es un número válido, retornar 0
        if (isNaN(numPrice) || numPrice === null || numPrice === undefined) {
            numPrice = 0;
        }
        
        return new Intl.NumberFormat('es-CL').format(numPrice);
    }

    // Formatear stock
    formatStock(stock) {
        // Validar stock
        let numStock = stock;
        
        // Si es string, intentar convertir a número
        if (typeof stock === 'string') {
            numStock = parseInt(stock);
        }
        
        // Si no es un número válido, retornar 0
        if (isNaN(numStock) || numStock === null || numStock === undefined) {
            numStock = 0;
        }
        
        return numStock;
    }

    // Agregar listeners a productos
    attachProductEventListeners(container) {
        // Los eventos se manejan con onclick inline por simplicidad
    }

    // Mostrar mensaje de error
    showError(message) {
        if (typeof notify !== 'undefined') {
            notify.error(message);
        }
    }

    // Mostrar loading
    showLoading(containerId = 'productsGrid') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        `;
    }
}

/**
 * 🔧 FUNCIÓN TEMPORAL PARA ACTUALIZAR TOKEN JWT
 * Ejecuta esta función en consola si tienes problemas de acceso a productos medicinales
 */
async function refreshUserToken() {
    if (!window.authManager || !window.authManager.isAuthenticated()) {
        return false;
    }
    
    try {
        // Obtener perfil actual del servidor (forzar actualización)
        const response = await window.api.getProfile();
        
        if (response.success) {
            const updatedUser = response.data.user || response.data;
            
            // Actualizar datos en authManager
            window.authManager.currentUser = updatedUser;
            
            // Guardar en localStorage
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // Recargar productos
            if (window.productManager) {
                await window.productManager.loadProducts();
                window.productManager.renderProducts(window.productManager.products);
            }
            
            return true;
        } else {
            throw new Error(response.message || 'Error al obtener perfil');
        }
    } catch (error) {
        return false;
    }
}

// Crear instancia global
const productManager = new ProductManager();

// Exportar función de refresh al scope global
window.refreshUserToken = refreshUserToken;
window.productManager = productManager;