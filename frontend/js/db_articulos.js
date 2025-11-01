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
            
            if (response.success) {
                this.products = this.mapProductFields(response.data.products);
                return this.products;
            }
            
            throw new Error(response.message || 'Error al cargar productos');
        } catch (error) {
            this.showError('Error al cargar productos');
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
            
            if (response.success) {
                // Mapear campos del backend al formato esperado por el frontend
                const products = this.mapProductFields(response.data.products.slice(0, limit));
                return products;
            }
            
            return [];
        } catch (error) {
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
            
            return [];
        } catch (error) {
            return [];
        }
    }

    // Filtrar productos localmente (después de cargar)
    filterProducts(filters) {
        let filtered = [...this.products];
        
        if (filters.category && filters.category !== 'all') {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= filters.minPrice);
        }
        
        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= filters.maxPrice);
        }
        
        if (filters.inStock) {
            filtered = filtered.filter(p => this.formatStock(p.stock) > 0);
        }
        
        if (filters.featured !== undefined) {
            filtered = filtered.filter(p => p.featured === filters.featured);
        }
        
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(search) ||
                (p.description && p.description.toLowerCase().includes(search))
            );
        }
        
        // 🆕 Filtrar productos medicinales si el usuario no tiene acceso
        if (!this.canViewMedicinal()) {
            filtered = filtered.filter(p => !p.requires_prescription);
        }
        
        return filtered;
    }

    // Renderizar productos en grid
    renderProducts(products, containerId = 'productsGrid') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (products.length === 0) {
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
        
        container.innerHTML = products.map(product => this.createProductCard(product)).join('');
        
        // Agregar event listeners a botones
        this.attachProductEventListeners(container);
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
                    <p class="product-description">${descriptionDisplay}</p>
                    <div class="product-price">${priceDisplay}</div>
                    <div class="product-stock" style="${stockClass}">${stockText}</div>
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