// ============================================
// PAYMENTS MANAGEMENT - Sistema de Pagos
// ============================================

// Usar la instancia global de API o crear una nueva si es necesario
let api;
function initPaymentsAPI() {
    if (typeof window !== 'undefined' && window.api) {
        api = window.api;
        return true;
    }
    // Si la clase está disponible, crear instancia
    if (typeof window !== 'undefined' && window.APIClient) {
        api = new window.APIClient();
        return true;
    }
    return false;
}

let currentTab = 'payments';

// ============================================
// NAVEGACIÓN DE PESTAÑAS
// ============================================

function switchPaymentsTab(tabName) {
    currentTab = tabName;
    
    // Ocultar todas las pestañas
    document.querySelectorAll('.payments-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-green-600', 'text-green-600');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Mostrar pestaña seleccionada
    const tabContent = document.getElementById(`content-${tabName}`);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Activar botón seleccionado
    const tabButton = document.getElementById(`tab-${tabName}`);
    if (tabButton) {
        tabButton.classList.add('active', 'border-green-600', 'text-green-600');
        tabButton.classList.remove('border-transparent', 'text-gray-500');
    }
    
    // Cargar datos de la pestaña
    loadTabData(tabName);
}

function refreshCurrentTab() {
    loadTabData(currentTab);
}

function loadTabData(tabName) {
    switch(tabName) {
        case 'payments':
            loadPayments(1);
            break;
        case 'refunds':
            loadRefunds(1);
            break;
        case 'gift-cards':
            loadGiftCards(1);
            break;
        case 'gift-card-transactions':
            loadGiftCardTransactions(1);
            break;
        case 'refund-reasons':
            loadRefundReasons();
            break;
        case 'gift-card-campaigns':
            loadGiftCardCampaigns();
            break;
        case 'payment-methods':
            loadPaymentMethods();
            break;
        case 'payment-providers':
            loadPaymentProviders();
            break;
        case 'chargebacks':
            loadChargebacks(1);
            break;
        case 'settlements':
            loadSettlements(1);
            break;
        case 'webhooks':
            loadWebhooks(1);
            break;
    }
    updateStats();
}

// ============================================
// PAGINACIÓN
// ============================================
let currentPage = {};
const ITEMS_PER_PAGE = 20;

function renderPagination(containerId, currentPageNum, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Contenedor de paginación ${containerId} no encontrado`);
        return;
    }
    
    // Si hay menos de 20 registros o solo 1 página, ocultar paginación
    if (totalPages <= 1) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    
    // Mostrar contenedor
    container.style.display = 'block';
    
    const parts = ['<div class="flex justify-center items-center gap-2 mt-4 p-4">'];

    const makeButton = (page, label, extraClasses = '', disabled = false, icon = '') => {
        const disabledAttr = disabled ? 'disabled' : '';
        const disabledClasses = disabled ? ' cursor-not-allowed opacity-50' : '';
        const iconHtml = icon ? `<i class="${icon} admin-btn__icon"></i>` : label;
        return `<button class="admin-btn admin-btn--compact ${extraClasses}${disabledClasses}" data-action="change-page" data-handler="${onPageChange}" data-page="${page}" ${disabledAttr}>${iconHtml}${icon ? '' : ''}</button>`;
    };

    // Botón anterior
    parts.push(makeButton(currentPageNum - 1, '', 'admin-btn--muted', currentPageNum === 1, 'fas fa-chevron-left'));

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPageNum - 2 && i <= currentPageNum + 2)) {
            parts.push(makeButton(i, i.toString(), i === currentPageNum ? 'admin-btn--accent' : 'admin-btn--muted', false));
        } else if (i === currentPageNum - 3 || i === currentPageNum + 3) {
            parts.push('<span class="px-2">...</span>');
        }
    }

    // Botón siguiente
    parts.push(makeButton(currentPageNum + 1, '', 'admin-btn--muted', currentPageNum === totalPages, 'fas fa-chevron-right'));

    parts.push('</div>');
    container.innerHTML = parts.join('');
}

// ============================================
// PAGOS
// ============================================

async function loadPayments(page = 1) {
    try {
        const filters = {
            status: document.getElementById('filterPaymentStatus')?.value || '',
            method: document.getElementById('filterPaymentMethod')?.value || '',
            date_from: document.getElementById('filterPaymentDateFrom')?.value || '',
            date_to: document.getElementById('filterPaymentDateTo')?.value || ''
        };
        
        // Agregar paginación a los filtros
        filters.limit = ITEMS_PER_PAGE;
        filters.offset = (page - 1) * ITEMS_PER_PAGE;
        
        // Usar el método getPayments() que maneja JSON estático y API dinámica
        const response = await api.getPayments(filters);
        const payments = response.data || [];
        const total = response.pagination?.total || payments.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['payments'] = page;
        
        const tbody = document.getElementById('paymentsTable');
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-12 text-center text-gray-500">No hay pagos</td></tr>';
            // Ocultar paginación si no hay registros
            const paginationContainer = document.getElementById('paymentsPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">#${payment.id}</td>
                <td class="px-6 py-4 whitespace-nowrap">#${payment.order_id || 'N/A'}</td>
                <td class="px-6 py-4">${payment.customer_name || payment.customer_email || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">$${formatCurrency(payment.amount_gross || payment.amount || 0)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${formatMethod(payment.method)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${formatStatus(payment.status)}</td>
                <td class="px-6 py-4 whitespace-nowrap">${formatDate(payment.created_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex gap-2">
                        ${payment.status === 'authorized' ? `<button class="admin-icon-btn admin-icon-btn--success" title="Capturar" data-action="capture-payment" data-payment-id="${payment.id}"><i class="fas fa-check"></i></button>` : ''}
                        ${['authorized', 'pending'].includes(payment.status) ? `<button class="admin-icon-btn admin-icon-btn--danger" title="Anular" data-action="void-payment" data-payment-id="${payment.id}"><i class="fas fa-times"></i></button>` : ''}
                        ${payment.status === 'failed' ? `<button class="admin-icon-btn admin-icon-btn--primary" title="Reintentar" data-action="retry-payment" data-payment-id="${payment.id}"><i class="fas fa-redo"></i></button>` : ''}
                        <button class="admin-icon-btn admin-icon-btn--primary" title="Ver" data-action="view-payment" data-payment-id="${payment.id}"><i class="fas fa-eye"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('paymentsPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'paymentsPagination';
            paginationContainer.className = 'mt-4';
            // Insertar después de la tabla
            const tableContainer = tbody.closest('.overflow-x-auto').parentElement;
            tableContainer.appendChild(paginationContainer);
        }
        
        renderPagination('paymentsPagination', page, totalPages, 'loadPayments');
    } catch (error) {
        console.error('Error al cargar pagos:', error);
        const errorMessage = error.message || 'Error al cargar pagos. Verifica que el servidor esté corriendo.';
        showNotification(errorMessage, 'error', 'Error al cargar pagos');
    }
}

function applyPaymentFilters() {
    loadPayments(1);
}

function clearPaymentFilters() {
    document.getElementById('filterPaymentStatus').value = '';
    document.getElementById('filterPaymentMethod').value = '';
    document.getElementById('filterPaymentDateFrom').value = '';
    document.getElementById('filterPaymentDateTo').value = '';
    loadPayments(1);
}

async function viewPayment(id) {
    try {
        const response = await api.get(`/payments/${id}`);
        if (!response.success || !response.data) {
            throw new Error(response.message || 'Pago no encontrado');
        }
        const payment = response.data;
        
        const modalHTML = `
            <div id="paymentDetailModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="payment-detail-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Detalles del Pago #${payment.id}</h2>
                            <button class="text-white hover:text-red-200" data-action="close-payment-detail"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><strong>Estado:</strong> ${formatPaymentStatus(payment.status)}</div>
                            <div><strong>Método:</strong> ${payment.method || payment.payment_method}</div>
                            <div><strong>Monto:</strong> $${formatCurrency(payment.amount_gross || payment.amount)}</div>
                            <div><strong>Fee:</strong> $${formatCurrency(payment.fee || 0)}</div>
                            <div><strong>Neto:</strong> $${formatCurrency(payment.amount_net || payment.amount)}</div>
                            <div><strong>Cliente:</strong> ${payment.customer_name || 'N/A'}</div>
                            <div><strong>Fecha:</strong> ${formatDate(payment.created_at)}</div>
                            <div><strong>Proveedor:</strong> ${payment.provider_name || 'N/A'}</div>
                        </div>
                        ${payment.failure_message ? `<div class="bg-red-50 border border-red-200 rounded p-4 mb-4"><strong>Error:</strong> ${payment.failure_message}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        console.error('Error al cargar pago:', error);
        showNotification('Error al cargar pago: ' + (error.message || 'Error desconocido'), 'error');
    }
}

function closePaymentDetailModal() {
    const modal = document.getElementById('paymentDetailModal');
    if (modal) modal.remove();
}

async function capturePayment(id) {
    if (!await showConfirm('¿Capturar este pago?', 'El pago será procesado y cobrado')) return;
    
    try {
        await api.post(`/payments/${id}/capture`);
        showNotification('Pago capturado exitosamente', 'success');
        loadPayments(currentPage['payments'] || 1);
    } catch (error) {
        showNotification('Error al capturar: ' + error.message, 'error');
    }
}

async function voidPayment(id) {
    if (!await showConfirm('¿Anular este pago?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.post(`/payments/${id}/void`);
        showNotification('Pago anulado', 'success');
        loadPayments(currentPage['payments'] || 1);
    } catch (error) {
        showNotification('Error al anular: ' + error.message, 'error');
    }
}

async function retryPayment(id) {
    if (!await showConfirm('¿Reintentar este pago?', 'Se intentará procesar nuevamente')) return;
    
    try {
        await api.post(`/payments/${id}/retry`);
        showNotification('Pago reintentado', 'success');
        loadPayments(currentPage['payments'] || 1);
    } catch (error) {
        showNotification('Error al reintentar: ' + error.message, 'error');
    }
}

// ============================================
// REEMBOLSOS
// ============================================

async function loadRefunds(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/refunds?${queryParams.toString()}`);
        const refunds = response.data || [];
        const total = response.pagination?.total || refunds.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['refunds'] = page;
        
        const tbody = document.getElementById('refundsTable');
        if (refunds.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No hay reembolsos</td></tr>';
            const paginationContainer = document.getElementById('refundsPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        tbody.innerHTML = refunds.map(refund => `
            <tr>
                <td class="px-6 py-4">#${refund.id}</td>
                <td class="px-6 py-4">#${refund.payment_id}</td>
                <td class="px-6 py-4">$${formatCurrency(refund.amount)}</td>
                <td class="px-6 py-4">${refund.reason_name || 'N/A'}</td>
                <td class="px-6 py-4">${formatRefundStatus(refund.status)}</td>
                <td class="px-6 py-4">${formatDate(refund.created_at)}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        ${refund.status === 'approved' ? `<button class="text-green-600" data-action="process-refund" data-refund-id="${refund.id}"><i class="fas fa-play"></i></button>` : ''}
                        ${['draft', 'pending'].includes(refund.status) ? `<button class="text-blue-600" data-action="approve-refund" data-refund-id="${refund.id}"><i class="fas fa-check"></i></button>` : ''}
                        ${refund.status === 'failed' ? `<button class="text-orange-600" data-action="reverse-refund" data-refund-id="${refund.id}"><i class="fas fa-undo"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('refundsPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'refundsPagination';
            paginationContainer.className = 'mt-4';
            const tableContainer = tbody.closest('.overflow-x-auto').parentElement;
            tableContainer.appendChild(paginationContainer);
        }
        
        renderPagination('refundsPagination', page, totalPages, 'loadRefunds');
    } catch (error) {
        console.error('Error al cargar reembolsos:', error);
        showNotification('Error al cargar reembolsos: ' + error.message, 'error');
    }
}

async function openCreateRefundModal() {
    try {
        const [paymentsResponse, reasonsResponse] = await Promise.all([
            api.get('/payments?limit=100'),
            api.get('/refund-reasons?active_only=true')
        ]);
        const payments = paymentsResponse.data || [];
        const reasons = reasonsResponse.data || [];
        
        const modalHTML = `
            <div id="refundModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="refund-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Nuevo Reembolso</h2>
                            <button class="text-white hover:text-red-200" data-action="close-refund-modal"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="refundForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Pago *</label>
                                <select id="refundPaymentId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Seleccionar pago...</option>
                                    ${payments.map(p => `<option value="${p.id}" data-amount="${p.amount_gross || p.amount}">#${p.id} - $${formatCurrency(p.amount_gross || p.amount)} - ${p.customer_name || 'Cliente'}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Monto *</label>
                                <input type="number" id="refundAmount" required step="0.01" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Motivo</label>
                                <select id="refundReasonId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin motivo</option>
                                    ${reasons.map(r => `<option value="${r.id}">${r.name} (${r.code})</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                                <textarea id="refundNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--warning flex-1">Crear Reembolso</button>
                                <button type="button" class="admin-btn admin-btn--muted flex-1" data-action="close-refund-modal">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Actualizar monto cuando se selecciona un pago
        document.getElementById('refundPaymentId').addEventListener('change', (e) => {
            const option = e.target.options[e.target.selectedIndex];
            if (option.dataset.amount) {
                document.getElementById('refundAmount').value = option.dataset.amount / 100; // Convertir de centavos
            }
        });
        
        document.getElementById('refundForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveRefund();
        });
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

async function saveRefund() {
    try {
        const data = {
            payment_id: parseInt(document.getElementById('refundPaymentId').value),
            amount: Math.round(parseFloat(document.getElementById('refundAmount').value) * 100), // Convertir a centavos
            reason_id: document.getElementById('refundReasonId').value || null,
            notes: document.getElementById('refundNotes').value || null
        };
        
        await api.post('/refunds', data);
        showNotification('Reembolso creado', 'success');
        closeRefundModal();
        loadRefunds(1);
    } catch (error) {
        showNotification('Error al crear reembolso: ' + error.message, 'error');
    }
}

async function viewRefund(id) {
    try {
        const response = await api.get(`/refunds/${id}`);
        const refund = response.data;
        
        showNotification(`Reembolso #${refund.id}: ${refund.status} - $${formatCurrency(refund.amount)}`, 'info');
    } catch (error) {
        showNotification('Error al cargar reembolso: ' + error.message, 'error');
    }
}

async function deleteRefund(id) {
    if (!await showConfirm('¿Eliminar este reembolso?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.delete(`/refunds/${id}`);
        showNotification('Reembolso eliminado', 'success');
        loadRefunds(currentPage['refunds'] || 1);
    } catch (error) {
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
}

function closeRefundModal() {
    const modal = document.getElementById('refundModal');
    if (modal) modal.remove();
}

async function approveRefund(id) {
    try {
        await api.post(`/refunds/${id}/approve`);
        showNotification('Reembolso aprobado', 'success');
        loadRefunds(currentPage['refunds'] || 1);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function processRefund(id) {
    try {
        await api.post(`/refunds/${id}/process`);
        showNotification('Reembolso procesado', 'success');
        loadRefunds(currentPage['refunds'] || 1);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function reverseRefund(id) {
    try {
        await api.post(`/refunds/${id}/reverse`);
        showNotification('Reembolso revertido', 'success');
        loadRefunds(currentPage['refunds'] || 1);
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ============================================
// GIFT CARDS
// ============================================

async function loadGiftCards(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/gift-cards?${queryParams.toString()}`);
        const cards = response.data || [];
        const total = response.pagination?.total || cards.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['giftCards'] = page;
        
        const tbody = document.getElementById('giftCardsTable');
        if (cards.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500">No hay gift cards</td></tr>';
            const paginationContainer = document.getElementById('giftCardsPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        tbody.innerHTML = cards.map(card => `
            <tr>
                <td class="px-6 py-4 font-mono">${card.code}</td>
                <td class="px-6 py-4">$${formatCurrency(card.initial_value || card.initial_balance)}</td>
                <td class="px-6 py-4">$${formatCurrency(card.balance)}</td>
                <td class="px-6 py-4">${formatGiftCardState(card.state || card.status)}</td>
                <td class="px-6 py-4">${card.customer_name || 'N/A'}</td>
                <td class="px-6 py-4">${card.expires_at ? formatDate(card.expires_at) : 'N/A'}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        ${(card.state === 'active' || card.status === 'active') ? `<button class="text-red-600" data-action="disable-gift-card" data-gift-card-id="${card.id}"><i class="fas fa-ban"></i></button>` : `<button class="text-green-600" data-action="activate-gift-card" data-gift-card-id="${card.id}"><i class="fas fa-check"></i></button>`}
                        <button class="text-blue-600" data-action="topup-gift-card" data-gift-card-id="${card.id}"><i class="fas fa-plus"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('giftCardsPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'giftCardsPagination';
            paginationContainer.className = 'mt-4';
            const tableContainer = tbody.closest('.overflow-x-auto').parentElement;
            tableContainer.appendChild(paginationContainer);
        }
        
        renderPagination('giftCardsPagination', page, totalPages, 'loadGiftCards');
    } catch (error) {
        console.error('Error al cargar gift cards:', error);
        showNotification('Error al cargar gift cards: ' + error.message, 'error');
    }
}

async function openCreateGiftCardModal() {
    try {
        const [usersResponse, campaignsResponse] = await Promise.all([
            api.get('/users?limit=100'),
            api.get('/gift-card-campaigns?active_only=true')
        ]);
        // Asegurar que users sea un array
        let users = [];
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
            users = usersResponse.data;
        } else if (usersResponse.users && Array.isArray(usersResponse.users)) {
            users = usersResponse.users;
        } else if (Array.isArray(usersResponse)) {
            users = usersResponse;
        }
        
        const campaigns = campaignsResponse.data || campaignsResponse.campaigns || [];
        
        const modalHTML = `
            <div id="giftCardModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="gift-card-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Nueva Gift Card</h2>
                            <button class="text-white hover:text-red-200" data-action="close-gift-card-modal"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="giftCardForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Valor Inicial (CLP) *</label>
                                <input type="number" id="giftCardInitialValue" required min="1000" step="1000" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
                                <select id="giftCardCustomerId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin asignar</option>
                                    ${users.map(u => `<option value="${u.id}">${u.name || u.email} (${u.email})</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Campaña</label>
                                <select id="giftCardCampaignId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin campaña</option>
                                    ${campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha de Expiración</label>
                                    <input type="date" id="giftCardExpiresAt" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                                    <select id="giftCardState" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option value="issued">Emitida</option>
                                        <option value="active">Activa</option>
                                        <option value="inactive">Inactiva</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                                <textarea id="giftCardNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--accent flex-1">Crear Gift Card</button>
                                <button type="button" class="admin-btn admin-btn--muted flex-1" data-action="close-gift-card-modal">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('giftCardForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveGiftCard();
        });
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

async function openBatchGiftCardModal() {
    try {
        const [usersResponse, campaignsResponse] = await Promise.all([
            api.get('/users?limit=100'),
            api.get('/gift-card-campaigns?active_only=true')
        ]);
        const users = usersResponse.data || [];
        const campaigns = campaignsResponse.data || [];
        
        const modalHTML = `
            <div id="batchGiftCardModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="batch-gift-card-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Crear Gift Cards en Lote</h2>
                            <button class="text-white hover:text-red-200" data-action="close-batch-gift-card-modal"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="batchGiftCardForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Cantidad *</label>
                                    <input type="number" id="batchQuantity" required min="1" max="1000" value="10" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Valor por Gift Card (CLP) *</label>
                                    <input type="number" id="batchInitialValue" required min="1000" step="1000" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Campaña</label>
                                <select id="batchCampaignId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin campaña</option>
                                    ${campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha de Expiración</label>
                                    <input type="date" id="batchExpiresAt" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                                    <select id="batchState" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option value="issued">Emitidas</option>
                                        <option value="active">Activas</option>
                                        <option value="inactive">Inactivas</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                                <textarea id="batchNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Notas para todas las gift cards"></textarea>
                            </div>
                            <div class="bg-blue-50 border border-blue-200 rounded p-4">
                                <p class="text-sm text-blue-800">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    Se crearán <span id="batchPreview">10</span> gift cards con valor de $<span id="batchValuePreview">0</span> CLP cada una.
                                </p>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--accent flex-1">Crear en Lote</button>
                                <button type="button" class="admin-btn admin-btn--muted flex-1" data-action="close-batch-gift-card-modal">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Actualizar preview
        const updatePreview = () => {
            const qty = parseInt(document.getElementById('batchQuantity').value) || 0;
            const value = parseInt(document.getElementById('batchInitialValue').value) || 0;
            document.getElementById('batchPreview').textContent = qty;
            document.getElementById('batchValuePreview').textContent = formatCurrency(value);
        };
        
        document.getElementById('batchQuantity').addEventListener('input', updatePreview);
        document.getElementById('batchInitialValue').addEventListener('input', updatePreview);
        
        document.getElementById('batchGiftCardForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBatchGiftCards();
        });
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

async function saveGiftCard() {
    try {
        const data = {
            initial_value: Math.round(parseFloat(document.getElementById('giftCardInitialValue').value) * 100), // Convertir a centavos
            balance: Math.round(parseFloat(document.getElementById('giftCardInitialValue').value) * 100),
            issued_to_customer_id: document.getElementById('giftCardCustomerId').value || null,
            campaign_id: document.getElementById('giftCardCampaignId').value || null,
            expires_at: document.getElementById('giftCardExpiresAt').value || null,
            state: document.getElementById('giftCardState').value,
            notes: document.getElementById('giftCardNotes').value || null
        };
        
        await api.post('/gift-cards', data);
        showNotification('Gift card creada', 'success');
        closeGiftCardModal();
        loadGiftCards(1);
    } catch (error) {
        showNotification('Error al crear gift card: ' + error.message, 'error');
    }
}

async function saveBatchGiftCards() {
    try {
        const quantity = parseInt(document.getElementById('batchQuantity').value);
        const data = {
            count: quantity, // El backend espera 'count'
            initial_value: Math.round(parseFloat(document.getElementById('batchInitialValue').value) * 100),
            campaign_id: document.getElementById('batchCampaignId').value || null,
            expires_at: document.getElementById('batchExpiresAt').value || null,
            state: document.getElementById('batchState').value,
            notes: document.getElementById('batchNotes').value || null
        };
        
        await api.post('/gift-cards/batch', data);
        showNotification(`${quantity} gift cards creadas exitosamente`, 'success');
        closeBatchGiftCardModal();
        loadGiftCards(1);
    } catch (error) {
        showNotification('Error al crear gift cards: ' + error.message, 'error');
    }
}

function closeGiftCardModal() {
    const modal = document.getElementById('giftCardModal');
    if (modal) modal.remove();
}

function closeBatchGiftCardModal() {
    const modal = document.getElementById('batchGiftCardModal');
    if (modal) modal.remove();
}

async function activateGiftCard(id) {
    try {
        await api.post(`/gift-cards/${id}/activate`);
        showNotification('Gift card activada', 'success');
        loadGiftCards();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function disableGiftCard(id) {
    try {
        await api.post(`/gift-cards/${id}/disable`);
        showNotification('Gift card desactivada', 'success');
        loadGiftCards();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function topUpGiftCard(id) {
    // Crear modal de input personalizado
    const confirmed = await showConfirm('Ingrese el monto a recargar (en CLP)', 'Recargar Gift Card');
    if (!confirmed) return;
    
    // Por ahora mostrar notificación de desarrollo
    showNotification('Modal de recarga - En desarrollo. Use el campo de ajuste de saldo.', 'info', 'En desarrollo');
    
    // TODO: Implementar modal de input personalizado
    // const amount = await showInputModal('Monto a recargar', 'number');
    // if (!amount || isNaN(amount)) return;
    // try {
    //     await api.post(`/gift-cards/${id}/top-up`, { amount: parseInt(amount) });
    //     showNotification('Gift card recargada', 'success');
    //     loadGiftCards();
    // } catch (error) {
    //     showNotification(error.message, 'error');
    // }
}

// ============================================
// OTRAS FUNCIONES
// ============================================

async function loadGiftCardTransactions(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/gift-card-transactions?${queryParams.toString()}`);
        const transactions = response.data || [];
        const total = response.pagination?.total || transactions.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['giftCardTransactions'] = page;
        
        const container = document.getElementById('giftCardTransactionsTable');
        if (transactions.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay transacciones de gift cards</p>';
            const paginationContainer = document.getElementById('giftCardTransactionsPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Gift Card</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Monto</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Balance Antes</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Balance Después</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Operador</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${transactions.map(t => {
                            const type = t.transaction_type || t.type || 'N/A';
                            const typeLabels = {
                                'spend': 'Gasto',
                                'topup': 'Recarga',
                                'adjustment': 'Ajuste',
                                'reversal': 'Reversión'
                            };
                            const balanceBefore = t.current_balance ? (t.current_balance - (t.amount || 0)) : 0;
                            return `
                            <tr>
                                <td class="px-6 py-4">#${t.id}</td>
                                <td class="px-6 py-4 font-mono text-sm">${t.gift_card_code || 'N/A'}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 rounded text-xs ${
                                        type === 'spend' ? 'bg-red-100 text-red-800' :
                                        type === 'topup' ? 'bg-green-100 text-green-800' :
                                        type === 'adjustment' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }">${typeLabels[type] || type}</span>
                                </td>
                                <td class="px-6 py-4">$${formatCurrency(t.amount || 0)}</td>
                                <td class="px-6 py-4">$${formatCurrency(balanceBefore)}</td>
                                <td class="px-6 py-4">$${formatCurrency(t.balance_after || t.current_balance || 0)}</td>
                                <td class="px-6 py-4">${t.operator_name || 'N/A'}</td>
                                <td class="px-6 py-4 text-sm">${formatDate(t.created_at)}</td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        ${type === 'spend' ? `<button class="text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50" title="Revertir transacción" data-action="reverse-transaction" data-transaction-id="${t.id}"><i class="fas fa-undo"></i></button>` : '-'}
                                    </div>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('giftCardTransactionsPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'giftCardTransactionsPagination';
            paginationContainer.className = 'mt-4';
            const parentContainer = container.closest('.bg-white');
            if (parentContainer) {
                parentContainer.appendChild(paginationContainer);
            } else {
                container.appendChild(paginationContainer);
            }
        }
        
        renderPagination('giftCardTransactionsPagination', page, totalPages, 'loadGiftCardTransactions');
    } catch (error) {
        console.error('Error al cargar transacciones:', error);
        document.getElementById('giftCardTransactionsTable').innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
}

async function reverseTransaction(id) {
    if (!await showConfirm('¿Revertir esta transacción?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.post(`/gift-card-transactions/${id}/reverse`);
        showNotification('Transacción revertida', 'success');
        loadGiftCardTransactions(currentPage['giftCardTransactions'] || 1);
    } catch (error) {
        showNotification('Error al revertir: ' + error.message, 'error');
    }
}

async function loadRefundReasons() {
    try {
        const response = await api.get('/refund-reasons');
        const reasons = response.data || [];
        
        const container = document.getElementById('refundReasonsTable');
        if (reasons.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay motivos de reembolso</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Orden</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${reasons.map(reason => `
                            <tr>
                                <td class="px-6 py-4">#${reason.id}</td>
                                <td class="px-6 py-4 font-mono text-sm">${reason.code}</td>
                                <td class="px-6 py-4 font-medium">${reason.name}</td>
                                <td class="px-6 py-4">${reason.sort_order || 0}</td>
                                <td class="px-6 py-4">${reason.is_active ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Activo</span>' : '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Inactivo</span>'}</td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-refund-reason" data-refund-reason-id="${reason.id}"><i class="fas fa-edit"></i></button>
                                        <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-refund-reason" data-refund-reason-id="${reason.id}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar motivos:', error);
        document.getElementById('refundReasonsTable').innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
}

async function loadGiftCardCampaigns() {
    try {
        const response = await api.get('/gift-card-campaigns');
        const campaigns = response.data || [];
        
        const container = document.getElementById('campaignsTable');
        if (campaigns.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay campañas de gift cards</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Inicio</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fin</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${campaigns.map(campaign => `
                            <tr>
                                <td class="px-6 py-4">#${campaign.id}</td>
                                <td class="px-6 py-4 font-medium">${campaign.name}</td>
                                <td class="px-6 py-4 text-sm text-gray-600">${(campaign.description || '').substring(0, 50)}${campaign.description && campaign.description.length > 50 ? '...' : ''}</td>
                                <td class="px-6 py-4 text-sm">${campaign.start_at ? formatDate(campaign.start_at) : 'N/A'}</td>
                                <td class="px-6 py-4 text-sm">${campaign.end_at ? formatDate(campaign.end_at) : 'N/A'}</td>
                                <td class="px-6 py-4">${campaign.is_active ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Activa</span>' : '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Inactiva</span>'}</td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-gift-card-campaign" data-campaign-id="${campaign.id}"><i class="fas fa-edit"></i></button>
                                        <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-gift-card-campaign" data-campaign-id="${campaign.id}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar campañas:', error);
        document.getElementById('campaignsTable').innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
}

async function loadPaymentMethods() {
    try {
        const response = await api.get('/payment-methods');
        const methods = response.data || [];
        
        const container = document.getElementById('paymentMethodsTable');
        if (methods.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay métodos de pago</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Canal</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${methods.map(method => `
                            <tr>
                                <td class="px-6 py-4">#${method.id}</td>
                                <td class="px-6 py-4 font-medium">${method.name}</td>
                                <td class="px-6 py-4">${method.provider_name || 'N/A'}</td>
                                <td class="px-6 py-4">${method.channel || 'web'}</td>
                                <td class="px-6 py-4">${method.is_active ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Activo</span>' : '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Inactivo</span>'}</td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-payment-method" data-payment-method-id="${method.id}"><i class="fas fa-edit"></i></button>
                                        <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-payment-method" data-payment-method-id="${method.id}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar métodos:', error);
        document.getElementById('paymentMethodsTable').innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
}

async function loadPaymentProviders() {
    try {
        const response = await api.get('/payment-providers');
        const providers = response.data || [];
        
        const container = document.getElementById('providersTable');
        if (providers.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay proveedores de pago</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Clave</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Canal</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${providers.map(provider => `
                            <tr>
                                <td class="px-6 py-4">#${provider.id}</td>
                                <td class="px-6 py-4 font-medium">${provider.name}</td>
                                <td class="px-6 py-4 font-mono text-sm">${provider.provider_key}</td>
                                <td class="px-6 py-4">${provider.channel || 'web'}</td>
                                <td class="px-6 py-4">${provider.is_active ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Activo</span>' : '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Inactivo</span>'}</td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-2">
                                        <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-payment-provider" data-payment-provider-id="${provider.id}"><i class="fas fa-edit"></i></button>
                                        <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-payment-provider" data-payment-provider-id="${provider.id}"><i class="fas fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        document.getElementById('providersTable').innerHTML = `<p class="text-red-500">Error al cargar: ${error.message}</p>`;
    }
}

async function loadChargebacks(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/chargebacks?${queryParams.toString()}`);
        const chargebacks = response.data || [];
        const total = response.pagination?.total || chargebacks.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['chargebacks'] = page;
        
        const container = document.getElementById('chargebacksTable');
        if (chargebacks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay chargebacks</p>';
            const paginationContainer = document.getElementById('chargebacksPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Caso</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pago</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Etapa</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Resultado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${chargebacks.map(cb => `
                            <tr>
                                <td class="px-6 py-4">#${cb.id}</td>
                                <td class="px-6 py-4 font-mono text-sm">${cb.case_id || 'N/A'}</td>
                                <td class="px-6 py-4">#${cb.payment_id || 'N/A'}</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">${cb.stage || 'N/A'}</span></td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${cb.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">${cb.status || 'N/A'}</span></td>
                                <td class="px-6 py-4">${cb.outcome ? `<span class="px-2 py-1 rounded text-xs ${cb.outcome === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${cb.outcome}</span>` : '-'}</td>
                                <td class="px-6 py-4">${formatDate(cb.created_at)}</td>
                                <td class="px-6 py-4">
                                    <button class="admin-icon-btn admin-icon-btn--primary" title="Ver detalles" data-action="view-chargeback" data-chargeback-id="${cb.id}"><i class="fas fa-eye"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('chargebacksPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'chargebacksPagination';
            paginationContainer.className = 'mt-4';
            const parentContainer = container.closest('.bg-white');
            if (parentContainer) {
                parentContainer.appendChild(paginationContainer);
            } else {
                container.appendChild(paginationContainer);
            }
        }
        
        renderPagination('chargebacksPagination', page, totalPages, 'loadChargebacks');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar chargebacks: ' + error.message, 'error');
    }
}

async function loadSettlements(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/settlements?${queryParams.toString()}`);
        const settlements = response.data || [];
        const total = response.pagination?.total || settlements.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['settlements'] = page;
        
        const container = document.getElementById('settlementsTable');
        if (settlements.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay conciliaciones</p>';
            const paginationContainer = document.getElementById('settlementsPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Número</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Proveedor</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Período</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Archivo</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${settlements.map(s => `
                            <tr>
                                <td class="px-6 py-4">#${s.id}</td>
                                <td class="px-6 py-4 font-mono text-sm">${s.settlement_number || s.id}</td>
                                <td class="px-6 py-4">${s.provider_name || 'N/A'}</td>
                                <td class="px-6 py-4">${s.period || 'N/A'}</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${s.status === 'completed' ? 'bg-green-100 text-green-800' : s.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${s.status || 'pending'}</span></td>
                                <td class="px-6 py-4">${s.file_name ? `<i class="fas fa-file text-blue-600"></i> ${s.file_name}` : '-'}</td>
                                <td class="px-6 py-4">${formatDate(s.created_at)}</td>
                                <td class="px-6 py-4">
                                    <button class="admin-icon-btn admin-icon-btn--primary" title="Ver detalles" data-action="view-settlement" data-settlement-id="${s.id}"><i class="fas fa-eye"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('settlementsPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'settlementsPagination';
            paginationContainer.className = 'mt-4';
            const parentContainer = container.closest('.bg-white');
            if (parentContainer) {
                parentContainer.appendChild(paginationContainer);
            } else {
                container.appendChild(paginationContainer);
            }
        }
        
        renderPagination('settlementsPagination', page, totalPages, 'loadSettlements');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar conciliaciones: ' + error.message, 'error');
    }
}

async function loadWebhooks(page = 1) {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', ITEMS_PER_PAGE);
        queryParams.append('offset', (page - 1) * ITEMS_PER_PAGE);
        
        const response = await api.get(`/webhook-deliveries?${queryParams.toString()}`);
        const webhooks = response.data || [];
        const total = response.pagination?.total || webhooks.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage['webhooks'] = page;
        
        const container = document.getElementById('webhooksTable');
        if (webhooks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No hay entregas de webhooks</p>';
            const paginationContainer = document.getElementById('webhooksPagination');
            if (paginationContainer) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
            }
            return;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Evento</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Código Resp.</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reintentos</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Entregado</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                            <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${webhooks.map(w => `
                            <tr>
                                <td class="px-6 py-4">#${w.id}</td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800 font-mono text-xs">${w.event_type || 'N/A'}</span></td>
                                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${w.status === 'delivered' ? 'bg-green-100 text-green-800' : w.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${w.status || 'pending'}</span></td>
                                <td class="px-6 py-4">${w.response_code ? `<span class="px-2 py-1 rounded text-xs ${w.response_code === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${w.response_code}</span>` : '-'}</td>
                                <td class="px-6 py-4">${w.retry_count || 0}</td>
                                <td class="px-6 py-4">${w.delivered_at ? formatDate(w.delivered_at) : '-'}</td>
                                <td class="px-6 py-4">${formatDate(w.created_at)}</td>
                                <td class="px-6 py-4">
                                    <button class="admin-icon-btn admin-icon-btn--primary" title="Ver detalles" data-action="view-webhook" data-webhook-id="${w.id}"><i class="fas fa-eye"></i></button>
                                    ${w.status === 'failed' ? `<button class="text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50 ml-2" title="Reintentar" data-action="retry-webhook" data-webhook-id="${w.id}"><i class="fas fa-redo"></i></button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        // Crear o encontrar contenedor de paginación
        let paginationContainer = document.getElementById('webhooksPagination');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'webhooksPagination';
            paginationContainer.className = 'mt-4';
            const parentContainer = container.closest('.bg-white');
            if (parentContainer) {
                parentContainer.appendChild(paginationContainer);
            } else {
                container.appendChild(paginationContainer);
            }
        }
        
        renderPagination('webhooksPagination', page, totalPages, 'loadWebhooks');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al cargar webhooks: ' + error.message, 'error');
    }
}

async function updateStats() {
    try {
        // Usar el método getPaymentStats() que maneja JSON estático y API dinámica
        const stats = await api.getPaymentStats();
        
        document.getElementById('statsTotalPayments').textContent = stats.total || 0;
        document.getElementById('statsCapturedPayments').textContent = stats.captured || 0;
        
        // Intentar cargar refunds y gift-cards solo si hay backend
        try {
            if (api.baseURL) {
                const refundsResponse = await api.get('/refunds');
                document.getElementById('statsTotalRefunds').textContent = (refundsResponse.data || []).length;
                
                const cardsResponse = await api.get('/gift-cards');
                document.getElementById('statsGiftCards').textContent = (cardsResponse.data || []).length;
            } else {
                // Si no hay backend, usar valores por defecto
                document.getElementById('statsTotalRefunds').textContent = '0';
                document.getElementById('statsGiftCards').textContent = '0';
            }
        } catch (error) {
            // Si falla, usar valores por defecto
            console.warn('⚠️ Error al cargar estadísticas adicionales:', error.message);
            document.getElementById('statsTotalRefunds').textContent = '0';
            document.getElementById('statsGiftCards').textContent = '0';
        }
    } catch (error) {
        console.error('Error al actualizar estadísticas:', error);
        // En caso de error, mostrar 0 en las estadísticas
        document.getElementById('statsTotalPayments').textContent = '0';
        document.getElementById('statsCapturedPayments').textContent = '0';
        document.getElementById('statsTotalRefunds').textContent = '0';
        document.getElementById('statsGiftCards').textContent = '0';
    }
}

// ============================================
// FUNCIONES DE FORMATO
// ============================================

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'decimal', minimumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function formatMethod(method) {
    const methods = {
        'credit': 'Tarjeta Crédito',
        'debit': 'Tarjeta Débito',
        'credit_card': 'Tarjeta Crédito',
        'debit_card': 'Tarjeta Débito',
        'transfer': 'Transferencia',
        'cash': 'Efectivo',
        'gift_card': 'Gift Card'
    };
    return methods[method] || method;
}

function formatStatus(status) {
    const statuses = {
        'authorized': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Autorizado</span>',
        'captured': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Capturado</span>',
        'failed': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Fallido</span>',
        'voided': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Anulado</span>',
        'pending': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Pendiente</span>'
    };
    return statuses[status] || status;
}

function formatPaymentStatus(status) {
    const statuses = {
        'authorized': 'Autorizado',
        'captured': 'Capturado',
        'failed': 'Fallido',
        'voided': 'Anulado',
        'pending': 'Pendiente'
    };
    return statuses[status] || status;
}

function formatRefundStatus(status) {
    const statuses = {
        'draft': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Borrador</span>',
        'pending': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Pendiente</span>',
        'approved': '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Aprobado</span>',
        'processed': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Procesado</span>',
        'failed': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Fallido</span>'
    };
    return statuses[status] || status;
}

function formatGiftCardState(state) {
    const states = {
        'active': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Activa</span>',
        'disabled': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">Desactivada</span>',
        'expired': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded">Expirada</span>'
    };
    return states[state] || state;
}

function showNotification(message, type = 'info', title = '') {
    // Usar sistema de notificaciones personalizado
    if (typeof window.notify !== 'undefined') {
        if (title) {
            window.notify.show({
                type: type,
                title: title,
                message: message
            });
        } else {
            window.notify[type](message);
        }
    } else if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Función de confirmación personalizada
async function showConfirm(message, title = 'Confirmar') {
    if (typeof window.notify !== 'undefined' && window.notify.confirm) {
        return await window.notify.confirm({
            title: title,
            message: message,
            type: 'warning',
            icon: 'question',
            confirmText: 'Sí',
            cancelText: 'No'
        });
    } else if (typeof Utils !== 'undefined' && Utils.confirm) {
        return await Utils.confirm(message, title);
    } else {
        return confirm(message);
    }
}

// Funciones de modales (implementar)
function openCreateRefundReasonModal() {}
function openCreateCampaignModal() {}
function openCreatePaymentMethodModal() {}
function openCreateProviderModal() {}
async function openCreateChargebackModal() {
    try {
        const paymentsResponse = await api.get('/payments?status=captured&limit=50');
        const payments = paymentsResponse.data || [];
        
        const modalHTML = `
            <div id="chargebackModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="chargeback-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-red-600 to-orange-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Nuevo Chargeback</h2>
                            <button class="text-white hover:text-red-200" data-action="close-chargeback-modal"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="chargebackForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Pago *</label>
                                <select id="chargebackPaymentId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Seleccionar pago</option>
                                    ${payments.map(p => `<option value="${p.id}">#${p.id} - $${formatCurrency(p.amount_gross || p.amount || 0)} - ${p.status}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Etapa *</label>
                                <select id="chargebackStage" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="notification">Notificación</option>
                                    <option value="chargeback">Chargeback</option>
                                    <option value="pre-arbitration">Pre-arbitraje</option>
                                    <option value="arbitration">Arbitraje</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Límite</label>
                                <input type="datetime-local" id="chargebackDeadline" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                                <textarea id="chargebackNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--danger flex-1">Crear Chargeback</button>
                                <button type="button" class="admin-btn admin-btn--muted flex-1" data-action="close-chargeback-modal">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('chargebackForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveChargeback();
        });
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

function closeChargebackModal() {
    const modal = document.getElementById('chargebackModal');
    if (modal) modal.remove();
}

async function saveChargeback() {
    try {
        const data = {
            payment_id: document.getElementById('chargebackPaymentId').value,
            stage: document.getElementById('chargebackStage').value,
            deadline_at: document.getElementById('chargebackDeadline').value || null,
            notes: document.getElementById('chargebackNotes').value || null,
            status: 'open'
        };
        
        await api.post('/chargebacks', data);
        showNotification('Chargeback creado exitosamente', 'success');
        closeChargebackModal();
        loadChargebacks(1);
    } catch (error) {
        showNotification('Error al crear chargeback: ' + error.message, 'error');
    }
}

async function openCreateSettlementModal() {
    try {
        const providersResponse = await api.get('/payment-providers?is_active=true');
        const providers = providersResponse.data || [];
        
        const modalHTML = `
            <div id="settlementModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="settlement-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Nueva Conciliación</h2>
                            <button class="text-white hover:text-red-200" data-action="close-settlement-modal"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="settlementForm" class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Proveedor *</label>
                                    <select id="settlementProviderId" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option value="">Seleccionar proveedor</option>
                                        ${providers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Monto (CLP) *</label>
                                    <input type="number" id="settlementAmount" required min="1000" step="1000" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Desde *</label>
                                    <input type="date" id="settlementDateFrom" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Hasta *</label>
                                    <input type="date" id="settlementDateTo" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Método de Pago</label>
                                <select id="settlementMethod" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="transfer">Transferencia</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="check">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Notas</label>
                                <textarea id="settlementNotes" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Detalle de la conciliación"></textarea>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--primary flex-1">Registrar Conciliación</button>
                                <button type="button" class="admin-btn admin-btn--muted flex-1" data-action="close-settlement-modal">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('settlementForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettlement();
        });
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
    }
}

function closeSettlementModal() {
    const modal = document.getElementById('settlementModal');
    if (modal) modal.remove();
}

async function saveSettlement() {
    try {
        const period = document.getElementById('settlementPeriod').value;
        const data = {
            provider_id: document.getElementById('settlementProviderId').value,
            period: period,
            status: document.getElementById('settlementStatus').value
        };
        
        await api.post('/settlements', data);
        showNotification('Conciliación creada exitosamente', 'success');
        closeSettlementModal();
        loadSettlements(1);
    } catch (error) {
        showNotification('Error al crear conciliación: ' + error.message, 'error');
    }
}

async function viewChargeback(id) {
    try {
        const response = await api.get(`/chargebacks/${id}`);
        const cb = response.data;
        
        const modalHTML = `
            <div id="chargebackDetailModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="chargeback-detail-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-red-600 to-orange-600 p-6 flex-shrink-0 flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Detalle Chargeback #${cb.id}</h2>
                        <button class="text-white hover:text-red-200" data-action="close-chargeback-detail"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><strong>Caso ID:</strong> <span class="font-mono">${cb.case_id || 'N/A'}</span></div>
                            <div><strong>Pago:</strong> #${cb.payment_id || 'N/A'}</div>
                            <div><strong>Etapa:</strong> <span class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">${cb.stage || 'N/A'}</span></div>
                            <div><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${cb.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">${cb.status || 'N/A'}</span></div>
                            <div><strong>Resultado:</strong> ${cb.outcome ? `<span class="px-2 py-1 rounded text-xs ${cb.outcome === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${cb.outcome}</span>` : '-'}</div>
                            <div><strong>Fecha Límite:</strong> ${cb.deadline_at ? formatDate(cb.deadline_at) : '-'}</div>
                            <div><strong>Creado:</strong> ${formatDate(cb.created_at)}</div>
                            <div><strong>Actualizado:</strong> ${formatDate(cb.updated_at)}</div>
                        </div>
                        ${cb.notes ? `<div class="bg-gray-50 border border-gray-200 rounded p-4 mb-4"><strong>Notas:</strong><br>${cb.notes}</div>` : ''}
                        ${cb.evidence_links ? `<div class="bg-blue-50 border border-blue-200 rounded p-4"><strong>Evidencias:</strong><br>${JSON.parse(cb.evidence_links || '[]').map((link, i) => `<a href="${link}" target="_blank" class="text-blue-600 hover:underline">Evidencia ${i + 1}</a>`).join(', ')}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        showNotification('Error al cargar chargeback: ' + error.message, 'error');
    }
}

function closeChargebackDetailModal() {
    const modal = document.getElementById('chargebackDetailModal');
    if (modal) modal.remove();
}

async function viewSettlement(id) {
    try {
        const response = await api.get(`/settlements/${id}`);
        const settlement = response.data;
        
        const modalHTML = `
            <div id="settlementDetailModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="settlement-detail-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0 flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Detalle Conciliación #${settlement.id}</h2>
                        <button class="text-white hover:text-red-200" data-action="close-settlement-detail"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><strong>Número:</strong> <span class="font-mono">${settlement.settlement_number || settlement.id}</span></div>
                            <div><strong>Proveedor:</strong> ${settlement.provider_name || 'N/A'}</div>
                            <div><strong>Período:</strong> ${settlement.period || 'N/A'}</div>
                            <div><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${settlement.status === 'completed' ? 'bg-green-100 text-green-800' : settlement.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${settlement.status || 'pending'}</span></div>
                            <div><strong>Archivo:</strong> ${settlement.file_name ? `<i class="fas fa-file text-blue-600"></i> ${settlement.file_name}` : '-'}</div>
                            <div><strong>Subido:</strong> ${settlement.uploaded_at ? formatDate(settlement.uploaded_at) : '-'}</div>
                            <div><strong>Creado:</strong> ${formatDate(settlement.created_at)}</div>
                            <div><strong>Actualizado:</strong> ${formatDate(settlement.updated_at)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        showNotification('Error al cargar conciliación: ' + error.message, 'error');
    }
}

function closeSettlementDetailModal() {
    const modal = document.getElementById('settlementDetailModal');
    if (modal) modal.remove();
}

async function viewWebhook(id) {
    try {
        const response = await api.get(`/webhook-deliveries/${id}`);
        const webhook = response.data;
        
        const payload = JSON.parse(webhook.payload || '{}');
        
        const modalHTML = `
            <div id="webhookDetailModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" data-action="webhook-detail-overlay">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-stop-propagation="true">
                    <div class="bg-gradient-to-r from-slate-600 to-slate-800 p-6 flex-shrink-0 flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Detalle Webhook #${webhook.id}</h2>
                        <button class="text-white hover:text-red-200" data-action="close-webhook-detail"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div><strong>Evento:</strong> <span class="font-mono text-xs">${webhook.event_type || 'N/A'}</span></div>
                            <div><strong>Estado:</strong> <span class="px-2 py-1 rounded text-xs ${webhook.status === 'delivered' ? 'bg-green-100 text-green-800' : webhook.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">${webhook.status || 'pending'}</span></div>
                            <div><strong>Código Respuesta:</strong> ${webhook.response_code ? `<span class="px-2 py-1 rounded text-xs ${webhook.response_code === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${webhook.response_code}</span>` : '-'}</div>
                            <div><strong>Reintentos:</strong> ${webhook.retry_count || 0}</div>
                            <div><strong>Entregado:</strong> ${webhook.delivered_at ? formatDate(webhook.delivered_at) : '-'}</div>
                            <div><strong>Creado:</strong> ${formatDate(webhook.created_at)}</div>
                        </div>
                        <div class="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                            <strong>Payload:</strong>
                            <pre class="mt-2 text-xs overflow-x-auto">${JSON.stringify(payload, null, 2)}</pre>
                        </div>
                        ${webhook.response_body ? `<div class="bg-blue-50 border border-blue-200 rounded p-4"><strong>Respuesta:</strong><pre class="mt-2 text-xs overflow-x-auto">${webhook.response_body}</pre></div>` : ''}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    } catch (error) {
        showNotification('Error al cargar webhook: ' + error.message, 'error');
    }
}

function closeWebhookDetailModal() {
    const modal = document.getElementById('webhookDetailModal');
    if (modal) modal.remove();
}

async function retryWebhook(id) {
    try {
        await api.post(`/webhook-deliveries/${id}/retry`);
        showNotification('Webhook reintentado', 'success');
        loadWebhooks(currentPage['webhooks'] || 1);
    } catch (error) {
        showNotification('Error al reintentar webhook: ' + error.message, 'error');
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que apiClient esté disponible
    const checkAPI = setInterval(() => {
        if (initPaymentsAPI()) {
            clearInterval(checkAPI);
            switchPaymentsTab('payments');
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(checkAPI);
        if (!api) {
            console.error('❌ No se pudo inicializar API Client');
            // Intentar usar window.api directamente
            if (window.api) {
                api = window.api;
                switchPaymentsTab('payments');
            }
        }
    }, 5000);
});

