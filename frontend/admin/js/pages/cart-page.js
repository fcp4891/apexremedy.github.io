const CART_STORAGE_KEY = 'cart';

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Error leyendo el carrito:', error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (typeof window.actualizarContadorCarrito === 'function') {
        window.actualizarContadorCarrito();
    }
}

function formatCurrency(amount) {
    return amount.toLocaleString('es-CL');
}

function setCheckoutDisabled(disabled) {
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.disabled = disabled;
    }
}

function renderEmptyCart(container) {
    container.innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Tu carrito está vacío</h3>
            <p class="text-gray-500 mb-6">¡Agrega algunos productos para comenzar!</p>
            <a href="./productos.html" class="admin-btn admin-btn--primary admin-btn--compact justify-center">
                <i class="fas fa-shopping-bag admin-btn__icon"></i>Ver Productos
            </a>
        </div>
    `;
    setCheckoutDisabled(true);
}

function renderCartItems(cart) {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (cart.length === 0) {
        renderEmptyCart(container);
        return;
    }

    setCheckoutDisabled(false);

    const itemsHtml = cart.map((item, index) => `
        <div class="flex items-center gap-4 border-b pb-4" data-item-index="${index}">
            <div class="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="fas fa-box text-3xl text-gray-400"></i>
            </div>
            <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-1">${item.name}</h3>
                <p class="text-green-600 font-bold">$${formatCurrency(item.price)}</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="admin-icon-btn admin-icon-btn--muted" title="Reducir cantidad" data-action="decrement-item" data-item-index="${index}">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="w-12 text-center font-semibold">${item.quantity}</span>
                <button class="admin-icon-btn admin-icon-btn--muted" title="Aumentar cantidad" data-action="increment-item" data-item-index="${index}">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="text-right">
                <p class="font-bold text-gray-800">$${formatCurrency(item.price * item.quantity)}</p>
                <button class="admin-icon-btn admin-icon-btn--danger admin-mt-1" title="Eliminar del carrito" data-action="remove-item" data-item-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="space-y-4">${itemsHtml}</div>
        <div class="mt-6 flex justify-between items-center">
            <button class="admin-btn admin-btn--danger admin-btn--compact" data-action="clear-cart">
                <i class="fas fa-trash-alt admin-btn__icon"></i>Vaciar Carrito
            </button>
        </div>
    `;
}

function updateSummary(cart) {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const itemCountEl = document.getElementById('itemCount');
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (itemCountEl) itemCountEl.textContent = itemCount;
    if (subtotalEl) subtotalEl.textContent = `$${formatCurrency(subtotal)}`;
    if (taxEl) taxEl.textContent = `$${formatCurrency(tax)}`;
    if (totalEl) totalEl.textContent = `$${formatCurrency(total)}`;
}

function refreshCart() {
    const cart = getCart();
    renderCartItems(cart);
    updateSummary(cart);
}

function notifyWarning(message, title) {
    if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
        notify.warning(message, title);
    } else {
        alert(message);
    }
}

async function confirmAction(message, title = 'Confirmar') {
    if (typeof notify !== 'undefined' && typeof notify.confirm === 'function') {
        return await notify.confirm({
            title,
            message,
            type: 'warning',
            icon: 'question',
            confirmText: 'Sí',
            cancelText: 'No'
        });
    }
    return window.confirm(message);
}

async function handleCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        notifyWarning('Tu carrito está vacío', 'Carrito Vacío');
        return;
    }

    if (!window.authManager || typeof authManager.isAuthenticated !== 'function' || authManager.isAuthenticated()) {
        window.location.href = './checkout.html';
        return;
    }

    if (typeof notify !== 'undefined' && typeof notify.confirm === 'function') {
        const confirmed = await notify.confirm({
            type: 'info',
            icon: 'question',
            title: 'Iniciar Sesión Requerido',
            message: 'Debes iniciar sesión para continuar. ¿Deseas ir al login?',
            confirmText: 'Sí, Ir al Login',
            cancelText: 'Cancelar',
            confirmClass: 'primary'
        });
        if (confirmed) {
            window.location.href = './login.html?redirect=checkout';
        }
    } else if (window.confirm('Debes iniciar sesión para continuar. ¿Deseas ir al login?')) {
        window.location.href = './login.html?redirect=checkout';
    }
}

function updateItemQuantity(index, newQuantity) {
    if (newQuantity < 1) {
        return;
    }
    const cart = getCart();
    if (!cart[index]) {
        return;
    }
    cart[index].quantity = newQuantity;
    saveCart(cart);
    refreshCart();
}

async function removeItem(index) {
    const confirmed = await confirmAction('¿Eliminar este producto del carrito?');
    if (!confirmed) {
        return;
    }
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    refreshCart();
}

async function clearCart() {
    const confirmed = await confirmAction('¿Estás seguro de vaciar todo el carrito?');
    if (!confirmed) {
        return;
    }
    localStorage.removeItem(CART_STORAGE_KEY);
    if (typeof window.actualizarContadorCarrito === 'function') {
        window.actualizarContadorCarrito();
    }
    refreshCart();
}

document.addEventListener('DOMContentLoaded', () => {
    refreshCart();
});

document.addEventListener('click', async (event) => {
    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) {
        return;
    }

    const action = actionNode.dataset.action;
    switch (action) {
        case 'checkout':
            event.preventDefault();
            await handleCheckout();
            break;
        case 'decrement-item': {
            const index = parseInt(actionNode.dataset.itemIndex, 10);
            if (!Number.isNaN(index)) {
                const cart = getCart();
                const current = cart[index]?.quantity || 0;
                updateItemQuantity(index, current - 1);
            }
            break;
        }
        case 'increment-item': {
            const index = parseInt(actionNode.dataset.itemIndex, 10);
            if (!Number.isNaN(index)) {
                const cart = getCart();
                const current = cart[index]?.quantity || 0;
                updateItemQuantity(index, current + 1);
            }
            break;
        }
        case 'remove-item': {
            const index = parseInt(actionNode.dataset.itemIndex, 10);
            if (!Number.isNaN(index)) {
                await removeItem(index);
            }
            break;
        }
        case 'clear-cart':
            await clearCart();
            break;
        default:
            break;
    }
});
