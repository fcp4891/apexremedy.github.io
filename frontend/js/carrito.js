// ============================================
// SISTEMA DE CARRITO DE COMPRAS - CORREGIDO
// ============================================

// Imagen por defecto
const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" text-anchor="middle" x="50" y="55"%3ESin Imagen%3C/text%3E%3C/svg%3E';

class ShoppingCart {
    constructor() {
        this.items = [];
        this.currentUserId = null;
        this._isUpdating = false; // ✅ Bandera para evitar recursión
        this.loadFromStorage();
    }

    // ============================================
    // GESTIÓN DE ITEMS
    // ============================================

    addItem(productId, name, price, quantity = 1, image = null) {
        const existingItem = this.items.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId,
                name,
                price,
                quantity,
                image,
                addedAt: new Date().toISOString()
            });
        }

        this.saveToStorage();
        this.updateUI();
        return true;
    }

    async addProduct(productId, quantity = 1) {
        try {
            // Obtener datos del producto desde la API
            const response = await api.getProductById(productId);
            
            if (response && response.success) {
                const product = response.data.product || response.data;
                
                // Obtener la imagen del producto (puede venir en diferentes formatos)
                let productImage = null;
                
                // Prioridad: images[0].url > image_url > image
                if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    // Buscar imagen primaria primero
                    const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
                    
                    if (typeof primaryImage === 'object' && primaryImage.url) {
                        productImage = primaryImage.url;
                    } else if (typeof primaryImage === 'string') {
                        productImage = primaryImage;
                    }
                } else if (product.image_url) {
                    productImage = product.image_url;
                } else if (product.image) {
                    productImage = product.image;
                }
                
                return this.addItem(
                    product.id,
                    product.name,
                    product.price,
                    quantity,
                    productImage
                );
            } else {
                throw new Error('No se pudo obtener el producto');
            }
        } catch (error) {
            alert('❌ Error al agregar el producto al carrito');
            return false;
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveToStorage();
        this.updateUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.productId === productId);
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateUI();
            }
        }
    }

    clearCart() {
        notify.confirmDelete('todos los productos del carrito').then(confirmed => {
            if (confirmed) {
                this.items = [];
                this.saveToStorage();
                this.updateUI();
                notify.success('Carrito vaciado correctamente');
            }
        });
    }

    // ✅ CORREGIDO: Limpiar carrito sin confirmación (para logout)
    clearCartSilently() {
        this.items = [];
        this.currentUserId = null;
        this.saveToStorage();
        
        // ✅ Solo actualizar badge, NO llamar updateUI completo
        this.updateCartBadge();
    }

    // ============================================
    // CÁLCULOS
    // ============================================

    getTotal() {
        return this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    getTotalItems() {
        return this.getItemCount();
    }

    getSubtotal() {
        return this.getTotal();
    }

    getTax(rate = 0.19) { // IVA 19%
        return this.getSubtotal() * rate;
    }

    getGrandTotal() {
        return this.getSubtotal() + this.getTax();
    }

    // ============================================
    // PERSISTENCIA
    // ============================================

    saveToStorage() {
        try {
            const cartData = {
                userId: this.currentUserId,
                items: this.items,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem('shopping_cart', JSON.stringify(cartData));
        } catch (error) {
            // Error silencioso al guardar carrito
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('shopping_cart');
            
            if (stored) {
                const cartData = JSON.parse(stored);
                
                // Verificar si hay un usuario autenticado
                const currentUser = this.getCurrentUser();
                const currentUserId = currentUser?.id || null;
                
                // Si el carrito pertenece a otro usuario, limpiarlo
                if (cartData.userId !== undefined && cartData.userId !== currentUserId) {
                    this.items = [];
                    this.currentUserId = currentUserId;
                    this.saveToStorage();
                } else {
                    this.items = cartData.items || cartData || [];
                    this.currentUserId = cartData.userId !== undefined ? cartData.userId : currentUserId;
                }
            } else {
                // Nuevo carrito
                const currentUser = this.getCurrentUser();
                this.currentUserId = currentUser?.id || null;
            }
        } catch (error) {
            this.items = [];
            const currentUser = this.getCurrentUser();
            this.currentUserId = currentUser?.id || null;
        }
    }

    // ✅ Obtener usuario actual
    getCurrentUser() {
        if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
            return authManager.getCurrentUser();
        }
        return null;
    }

    // ✅ CORREGIDO: Verificar y actualizar usuario sin recursión
    checkUserChange() {
        if (this._isUpdating) return; // ✅ Prevenir recursión
        
        const currentUser = this.getCurrentUser();
        const currentUserId = currentUser?.id || null;
        
        // Si el usuario cambió, limpiar el carrito
        if (this.currentUserId !== currentUserId) {
            this._isUpdating = true; // ✅ Activar bandera
            
            this.items = [];
            this.currentUserId = currentUserId;
            this.saveToStorage();
            this.updateCartBadge(); // Solo actualizar badge
            
            this._isUpdating = false; // ✅ Desactivar bandera
        }
    }

    // ============================================
    // ACTUALIZACIÓN DE UI
    // ============================================

    updateUI() {
        if (this._isUpdating) return; // ✅ Prevenir recursión
        
        this._isUpdating = true; // ✅ Activar bandera
        
        // ✅ Verificar cambio de usuario ANTES de actualizar
        this.checkUserChange();
        
        this.updateCartBadge();
        this.updateCartSidebar();
        this.updateCartPage();
        
        // Disparar evento personalizado para que template.js lo escuche
        window.dispatchEvent(new Event('cartUpdated'));
        
        // También actualizar usando el sistema de templates si existe
        if (typeof window.templateSystem !== 'undefined' && window.templateSystem.updateCartCount) {
            setTimeout(() => {
                window.templateSystem.updateCartCount();
            }, 50);
        }
        
        this._isUpdating = false; // ✅ Desactivar bandera
    }

    updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge, #cartBadge');
        const count = this.getItemCount();
    
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'flex';
                badge.classList.remove('hidden');
            } else {
                badge.style.display = 'none';
                badge.classList.add('hidden');
            }
        });
    }

    updateCartSidebar() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
    
        if (!cartItemsContainer) return;
    
        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #9ca3af;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
                    <p>Tu carrito está vacío</p>
                </div>
            `;
            if (cartTotal) cartTotal.textContent = 'Total: $0';
            return;
        }
    
        const defaultImg = DEFAULT_IMAGE;
    
        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #eee;">
                <img src="${item.image || defaultImg}" 
                     alt="${item.name}"
                     style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='${defaultImg}'">
                <div style="flex: 1;">
                    <h4 style="font-weight: 600; margin-bottom: 4px; font-size: 0.9rem;">${item.name}</h4>
                    <p style="color: #16a34a; font-weight: 700;">$${item.price.toLocaleString('es-CL')}</p>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <button onclick="cart.updateQuantity(${item.productId}, ${item.quantity - 1})" 
                                style="width: 24px; height: 24px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">
                            <i class="fas fa-minus" style="font-size: 0.7rem;"></i>
                        </button>
                        <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button onclick="cart.updateQuantity(${item.productId}, ${item.quantity + 1})" 
                                style="width: 24px; height: 24px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer;">
                            <i class="fas fa-plus" style="font-size: 0.7rem;"></i>
                        </button>
                        <button onclick="cart.removeItem(${item.productId})" 
                                style="margin-left: auto; color: #dc2626; background: none; border: none; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    
        if (cartTotal) {
            cartTotal.textContent = `Total: $${this.getTotal().toLocaleString('es-CL')}`;
        }
    }

    updateCartPage() {
        const cartPageContainer = document.getElementById('cartPageItems');
        if (!cartPageContainer) return;

        if (this.items.length === 0) {
            cartPageContainer.innerHTML = `
                <div style="text-align: center; padding: 80px 20px;">
                    <i class="fas fa-shopping-cart" style="font-size: 4rem; color: var(--medium-gray); margin-bottom: 20px; display: block;"></i>
                    <h3 style="font-size: 1.75rem; font-weight: 700; color: var(--accent-black); margin-bottom: 12px; font-family: var(--font-primary);">Tu carrito está vacío</h3>
                    <p style="color: var(--medium-gray); margin-bottom: 24px; font-family: var(--font-primary);">Agrega productos desde nuestra tienda</p>
                    <a href="./tienda.html" class="cta-button">
                        <i class="fas fa-store"></i>
                        <span>Ir a la Tienda</span>
                    </a>
                </div>
            `;
            return;
        }

        const defaultImg = DEFAULT_IMAGE;
        
        cartPageContainer.innerHTML = this.items.map(item => {
            // Normalizar la ruta de la imagen
            let imageUrl = item.image || defaultImg;
            
            // Si la imagen es relativa, asegurar que tenga la ruta correcta
            if (imageUrl && imageUrl !== defaultImg && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                // Si es una ruta relativa, agregar el prefijo correcto
                if (imageUrl.startsWith('./')) {
                    imageUrl = imageUrl.substring(2);
                }
                // Si no tiene prefijo de carpeta, intentar encontrar la imagen
                if (!imageUrl.startsWith('images/') && !imageUrl.startsWith('assets/') && !imageUrl.startsWith('/')) {
                    // Si la imagen parece ser solo un nombre de archivo, buscar en images/
                    if (!imageUrl.includes('/')) {
                        imageUrl = `images/${imageUrl}`;
                    }
                }
            }
            
            // Si después de normalizar aún no hay imagen válida, usar la por defecto
            if (!imageUrl || imageUrl === 'null' || imageUrl === 'undefined' || imageUrl === '') {
                imageUrl = defaultImg;
            }
            
            // Escapar comillas simples y dobles para evitar errores de sintaxis
            const escapedImageUrl = imageUrl.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedName = (item.name || '').replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            const escapedDefaultImg = defaultImg.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            
            return `
            <div style="background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow); padding: 24px; display: flex; gap: 24px; align-items: center; font-family: var(--font-primary);">
                <div style="flex-shrink: 0; width: 128px; height: 128px; min-width: 128px; min-height: 128px;">
                    <img src="${escapedImageUrl}" 
                         alt="${escapedName}"
                         style="width: 128px; height: 128px; min-width: 128px; min-height: 128px; object-fit: cover; border-radius: var(--border-radius); border: 2px solid var(--light-gray); display: block; background: var(--light-gray);"
                         onerror="this.onerror=null; this.src='${escapedDefaultImg}';">
                </div>
                <div style="flex: 1; min-width: 0;">
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--accent-black); margin-bottom: 8px; font-family: var(--font-primary);">${escapedName}</h3>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary-green); margin-bottom: 16px; font-family: var(--font-primary);">$${item.price.toLocaleString('es-CL')}</p>
                    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px; background: var(--light-gray); border-radius: var(--border-radius); padding: 8px;">
                            <button onclick="cart.updateQuantity(${item.productId}, ${item.quantity - 1})" 
                                    style="width: 32px; height: 32px; background: var(--white); border: 1px solid var(--medium-gray); border-radius: var(--border-radius); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); color: var(--accent-black);"
                                    onmouseover="this.style.background='var(--light-gray)'; this.style.borderColor='var(--primary-green)';"
                                    onmouseout="this.style.background='var(--white)'; this.style.borderColor='var(--medium-gray)';">
                                <i class="fas fa-minus" style="font-size: 0.75rem;"></i>
                            </button>
                            <span style="font-size: 1.125rem; font-weight: 700; min-width: 40px; text-align: center; color: var(--accent-black); font-family: var(--font-primary);">${item.quantity}</span>
                            <button onclick="cart.updateQuantity(${item.productId}, ${item.quantity + 1})" 
                                    style="width: 32px; height: 32px; background: var(--white); border: 1px solid var(--medium-gray); border-radius: var(--border-radius); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); color: var(--accent-black);"
                                    onmouseover="this.style.background='var(--light-gray)'; this.style.borderColor='var(--primary-green)';"
                                    onmouseout="this.style.background='var(--white)'; this.style.borderColor='var(--medium-gray)';">
                                <i class="fas fa-plus" style="font-size: 0.75rem;"></i>
                            </button>
                        </div>
                        <button onclick="cart.removeItem(${item.productId})" 
                                class="secondary-button danger"
                                style="padding: 8px 16px; font-size: 0.875rem;">
                            <i class="fas fa-trash"></i>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
                <div style="text-align: right; flex-shrink: 0;">
                    <p style="font-size: 0.875rem; color: var(--medium-gray); margin-bottom: 4px; font-family: var(--font-primary);">Subtotal</p>
                    <p style="font-size: 1.5rem; font-weight: 700; color: var(--accent-black); font-family: var(--font-primary);">$${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                </div>
            </div>
        `;
        }).join('');

        this.updateCartSummary();
    }

    updateCartSummary() {
        const summaryElements = {
            subtotal: document.getElementById('cartSubtotal'),
            tax: document.getElementById('cartTax'),
            total: document.getElementById('cartGrandTotal')
        };

        if (summaryElements.subtotal) {
            summaryElements.subtotal.textContent = `$${this.getSubtotal().toLocaleString()}`;
        }
        if (summaryElements.tax) {
            summaryElements.tax.textContent = `$${Math.round(this.getTax()).toLocaleString()}`;
        }
        if (summaryElements.total) {
            summaryElements.total.textContent = `$${Math.round(this.getGrandTotal()).toLocaleString()}`;
        }
    }

    // ============================================
    // MÉTODOS PÚBLICOS PARA COMPATIBILIDAD
    // ============================================

    getItems() {
        return this.items;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// ============================================
// INSTANCIA GLOBAL
// ============================================

const cart = new ShoppingCart();
window.cart = cart;

// Función global para agregar al carrito (compatibilidad)
window.agregarAlCarrito = function(productId, name, price, quantity = 1, image = null) {
    cart.addItem(productId, name, price, quantity, image);
};

// ✅ Escuchar eventos de logout para limpiar el carrito
window.addEventListener('userLoggedOut', () => {
    cart.clearCartSilently();
});

// ✅ Escuchar eventos de login para verificar usuario
window.addEventListener('userLoggedIn', () => {
    cart.checkUserChange();
});

// Actualizar UI al cargar
document.addEventListener('DOMContentLoaded', () => {
    cart.updateUI();
});

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCart, cart };
}