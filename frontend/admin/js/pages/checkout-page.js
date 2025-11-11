const CHECKOUT_STORAGE_KEY = 'cart';

function getCartItems() {
    try {
        return JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || '[]');
    } catch (error) {
        console.error('Error leyendo el carrito:', error);
        return [];
    }
}

function formatPrice(amount) {
    return amount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function ensureAuth() {
    const redirectToLogin = () => {
        if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
            notify.warning('Debes iniciar sesión para continuar con tu compra', 'Autenticación Requerida');
        }
        setTimeout(() => {
            window.location.href = './login.html?redirect=checkout';
        }, 1500);
    };

    if (typeof window.authManager === 'undefined') {
        console.warn('⚠️ authManager no disponible');
        redirectToLogin();
        return false;
    }

    if (!authManager.isAuthenticated()) {
        redirectToLogin();
        return false;
    }

    return true;
}

function renderOrderItems(cart) {
    const container = document.getElementById('orderItems');
    if (!container) {
        return;
    }

    if (!Array.isArray(cart) || cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-shopping-basket text-4xl mb-2"></i>
                <p>No hay productos en el resumen.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
                <p class="font-semibold">${item.name}</p>
                <p class="text-xs text-gray-500">Cantidad: ${item.quantity}</p>
            </div>
            <div class="font-semibold text-gray-800">${formatPrice(item.price * item.quantity)}</div>
        </div>
    `).join('');
}

function updateSummary(cart) {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;

    const subtotalEl = document.getElementById('summarySubtotal');
    const taxEl = document.getElementById('summaryTax');
    const totalEl = document.getElementById('summaryTotal');
    const itemCountEl = document.getElementById('summaryItemCount');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (taxEl) taxEl.textContent = formatPrice(tax);
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (itemCountEl) itemCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0).toString();
}

function populateFormWithUserData() {
    if (typeof authManager === 'undefined' || typeof authManager.getCurrentUser !== 'function') {
        return;
    }

    const user = authManager.getCurrentUser();
    if (!user) {
        return;
    }

    const nameInput = document.getElementById('customerName');
    const emailInput = document.getElementById('customerEmail');
    const phoneInput = document.getElementById('customerPhone');

    if (nameInput && !nameInput.value) {
        nameInput.value = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || '';
    }

    if (emailInput && !emailInput.value) {
        emailInput.value = user.email || '';
    }

    if (phoneInput && !phoneInput.value) {
        phoneInput.value = user.phone || '';
    }
}

function openSuccessModal(orderId) {
    const modal = document.getElementById('successModal');
    const orderIdEl = document.getElementById('orderId');

    if (orderIdEl) {
        orderIdEl.textContent = orderId;
    }

    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function submitOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form) {
        return;
    }

    const cart = getCartItems();
    if (!cart.length) {
        if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
            notify.warning('Tu carrito está vacío', 'Carrito vacío');
        }
        return;
    }

    const formData = new FormData(form);
    const payload = {
        name: formData.get('customerName') || document.getElementById('customerName')?.value || '',
        email: formData.get('customerEmail') || document.getElementById('customerEmail')?.value || '',
        phone: formData.get('customerPhone') || document.getElementById('customerPhone')?.value || '',
        address: formData.get('customerAddress') || document.getElementById('customerAddress')?.value || '',
        notes: formData.get('orderNotes') || document.getElementById('orderNotes')?.value || '',
        payment: form.payment?.value || document.querySelector('input[name="payment"]:checked')?.value || 'transfer',
        items: cart
    };

    if (!payload.name || !payload.email || !payload.phone || !payload.address) {
        if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
            notify.warning('Por favor completa todos los campos obligatorios', 'Formulario incompleto');
        }
        return;
    }

    try {
        const response = await api.post('/orders/checkout', payload);
        if (response.success) {
            openSuccessModal(response.data.order_id || response.data.id || '0000');
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
            if (typeof window.actualizarContadorCarrito === 'function') {
                window.actualizarContadorCarrito();
            }
        } else {
            throw new Error(response.message || 'No se pudo completar el pedido');
        }
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
            notify.error(error.message || 'Error al procesar pedido');
        }
    }
}

function initCheckoutPage() {
    if (!ensureAuth()) {
        return;
    }

    populateFormWithUserData();

    const cart = getCartItems();
    renderOrderItems(cart);
    updateSummary(cart);
}

document.addEventListener('DOMContentLoaded', () => {
    initCheckoutPage();
});

document.addEventListener('click', async (event) => {
    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) {
        return;
    }

    const action = actionNode.dataset.action;
    switch (action) {
        case 'submit-order':
            event.preventDefault();
            await submitOrder();
            break;
        case 'close-success-modal':
            event.preventDefault();
            closeSuccessModal();
            break;
        case 'checkout-help-call':
            if (typeof notify !== 'undefined' && typeof notify.info === 'function') {
                notify.info('Puedes escribirnos a soporte@apexremedy.com', 'Soporte');
            }
            break;
        default:
            break;
    }
});
