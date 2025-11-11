(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allShipments = [];
    let filteredShipments = [];
    let currentPage = 1;
    const itemsPerPage = 20;
    let currentShipmentId = null;

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        in_transit: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
        pending: 'Pendiente',
        processing: 'Procesando',
        shipped: 'Enviado',
        in_transit: 'En Tránsito',
        delivered: 'Entregado',
        cancelled: 'Cancelado'
    };

    function getValueOrFallback(value, fallback = 'N/A') {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        return value;
    }

    function formatCurrency(value) {
        if (!value) {
            return '$0';
        }
        try {
            return `$${Number(value).toLocaleString('es-CL')}`;
        } catch (error) {
            return `$${value}`;
        }
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    async function loadShipments() {
        try {
            const response = await apiClient.request('/shipments', { method: 'GET' });
            allShipments = response.data?.shipments || [];
            currentPage = 1;
            applyFilters();
        } catch (error) {
            console.error('Error cargando envíos:', error);
            const tbody = getElement('shipmentsTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar envíos</p>
                        </td>
                    </tr>
                `;
            }
        }
    }

    function applyFilters() {
        const statusFilter = getElement('statusFilter')?.value || '';
        const trackingFilter = getElement('trackingFilter')?.value.toLowerCase() || '';
        const orderFilter = getElement('orderFilter')?.value.toLowerCase() || '';

        filteredShipments = allShipments.filter((shipment) => {
            const matchesStatus = !statusFilter || shipment.status === statusFilter;
            const tracking = shipment.tracking_number || '';
            const order = shipment.order_number || '';
            const matchesTracking = !trackingFilter || tracking.toLowerCase().includes(trackingFilter);
            const matchesOrder = !orderFilter || order.toLowerCase().includes(orderFilter);
            return matchesStatus && matchesTracking && matchesOrder;
        });

        currentPage = 1;
        renderShipments();
    }

    function renderShipments() {
        const tbody = getElement('shipmentsTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(filteredShipments.length / itemsPerPage) || 1;

        if (filteredShipments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay envíos registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const shipmentsToShow = filteredShipments.slice(startIndex, endIndex);

        tbody.innerHTML = shipmentsToShow
            .map((shipment) => {
                const statusClass = statusColors[shipment.status] || 'bg-gray-100 text-gray-800';
                const statusLabel = statusLabels[shipment.status] || shipment.status || 'Sin estado';
                return `
                    <tr class="hover:bg-gray-50" data-shipment-id="${shipment.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${getValueOrFallback(shipment.id)}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${getValueOrFallback(shipment.order_number)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${getValueOrFallback(shipment.tracking_number)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${getValueOrFallback(shipment.provider_name || shipment.carrier)}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">${formatCurrency(shipment.shipping_cost)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${shipment.created_at ? new Date(shipment.created_at).toLocaleDateString('es-CL') : 'N/A'}</td>
                        <td class="px-6 py-4 text-sm">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Ver detalles y actualizar estado" data-action="view-shipment" data-shipment-id="${shipment.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join('');

        updatePagination(totalPages);
    }

    function togglePagination(shouldShow) {
        const container = getElement('paginationContainer');
        if (!container) {
            return;
        }
        container.classList.toggle('hidden', !shouldShow);
    }

    function updatePagination(totalPages) {
        const paginationContainer = getElement('paginationContainer');
        if (!paginationContainer) {
            return;
        }

        if (filteredShipments.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredShipments.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = filteredShipments.length;
        getElement('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;

        const prevButton = getElement('prevPage');
        const nextButton = getElement('nextPage');
        if (prevButton) {
            prevButton.disabled = currentPage === 1;
        }
        if (nextButton) {
            nextButton.disabled = currentPage === totalPages;
        }
    }

    function changePage(direction) {
        const totalPages = Math.ceil(filteredShipments.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderShipments();
        }
    }

    function closeModal() {
        const modal = getElement('shipmentModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        currentShipmentId = null;
    }

    function handleOverlayClick(event, overlayElement) {
        if (event.target === overlayElement) {
            closeModal();
        }
    }

    async function viewShipment(shipmentId) {
        if (!shipmentId) {
            return;
        }
        currentShipmentId = Number(shipmentId);

        try {
            const response = await apiClient.request(`/shipments/${shipmentId}`, { method: 'GET' });
            const shipment = response.data?.shipment;
            if (!shipment) {
                return;
            }

            getElement('modalShipmentId').textContent = shipment.id;
            getElement('modalTracking').textContent = getValueOrFallback(shipment.tracking_number);

            const statusSelect = getElement('modalStatusSelect');
            if (statusSelect) {
                statusSelect.value = shipment.status || 'pending';
            }

            const detailsContainer = getElement('shipmentDetails');
            if (detailsContainer) {
                const productsHTML = Array.isArray(shipment.items) && shipment.items.length
                    ? `
                        <div class="mb-4">
                            <h4 class="font-semibold text-gray-700 mb-3">Productos</h4>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <table class="w-full">
                                    <thead class="text-sm text-gray-500 border-b">
                                        <tr>
                                            <th class="text-left pb-2">Producto</th>
                                            <th class="text-right pb-2">Cantidad</th>
                                            <th class="text-right pb-2">Peso</th>
                                        </tr>
                                    </thead>
                                    <tbody id="shipmentItemsTable" class="text-sm">
                                        ${shipment.items
                                            .map(
                                                (item) => `
                                                    <tr class="border-b">
                                                        <td class="py-2">${getValueOrFallback(item.product_name || item.product_name_full || 'Producto')}</td>
                                                        <td class="text-right">${getValueOrFallback(item.quantity, 0)}</td>
                                                        <td class="text-right">${item.weight_kg ? `${item.weight_kg} kg` : 'N/A'}</td>
                                                    </tr>
                                                `
                                            )
                                            .join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `
                    : '';

                const eventsHTML = Array.isArray(shipment.events) && shipment.events.length
                    ? `
                        <div class="mt-4">
                            <h4 class="font-semibold text-gray-700 mb-3">Historial de Eventos</h4>
                            <div class="space-y-2">
                                ${shipment.events
                                    .map(
                                        (event) => `
                                            <div class="border-l-2 border-blue-500 pl-4 py-2">
                                                <p class="text-sm font-medium">${getValueOrFallback(event.status)}</p>
                                                <p class="text-xs text-gray-600">${getValueOrFallback(event.description, '')}</p>
                                                <p class="text-xs text-gray-500">${event.event_at ? new Date(event.event_at).toLocaleString('es-CL') : ''}</p>
                                                ${event.location ? `<p class="text-xs text-gray-500">📍 ${event.location}</p>` : ''}
                                            </div>
                                        `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    `
                    : '';

                detailsContainer.innerHTML = `
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="text-sm font-medium text-gray-700">Orden:</label>
                            <p class="text-gray-900">${getValueOrFallback(shipment.order_number)}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">Proveedor:</label>
                            <p class="text-gray-900">${getValueOrFallback(shipment.provider_name || shipment.carrier)}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">Costo:</label>
                            <p class="text-gray-900">${formatCurrency(shipment.shipping_cost)}</p>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-700">Peso:</label>
                            <p class="text-gray-900">${shipment.weight ? `${shipment.weight} kg` : 'N/A'}</p>
                        </div>
                    </div>
                    ${productsHTML}
                    ${eventsHTML}
                `;
            }

            const modal = getElement('shipmentModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error cargando envío:', error);
            if (typeof notify !== 'undefined' && notify?.error) {
                notify.error('Error al cargar detalles del envío: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function updateShipmentStatus() {
        if (!currentShipmentId) {
            return;
        }

        const statusSelect = getElement('modalStatusSelect');
        const newStatus = statusSelect ? statusSelect.value : null;
        if (!newStatus) {
            return;
        }

        try {
            await apiClient.request(`/shipments/${currentShipmentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            if (typeof notify !== 'undefined' && notify?.success) {
                notify.success('Estado actualizado correctamente');
            }
            closeModal();
            await loadShipments();
        } catch (error) {
            console.error('Error actualizando estado:', error);
            if (typeof notify !== 'undefined' && notify?.error) {
                notify.error('Error al actualizar estado: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    function setupEventHandlers() {
        document.addEventListener('click', (event) => {
            const actionNode = event.target.closest('[data-action]');
            if (!actionNode) {
                return;
            }

            const action = actionNode.dataset.action;
            switch (action) {
                case 'navigate': {
                    event.preventDefault();
                    const href = actionNode.dataset.href;
                    if (href) {
                        window.location.href = href;
                    }
                    break;
                }
                case 'apply-filters':
                    event.preventDefault();
                    applyFilters();
                    break;
                case 'change-page': {
                    event.preventDefault();
                    const direction = Number(actionNode.dataset.direction || 0);
                    if (direction) {
                        changePage(direction);
                    }
                    break;
                }
                case 'view-shipment': {
                    event.preventDefault();
                    const shipmentId = actionNode.dataset.shipmentId;
                    viewShipment(shipmentId);
                    break;
                }
                case 'close-modal':
                    event.preventDefault();
                    closeModal();
                    break;
                case 'close-modal-overlay': {
                    const overlay = actionNode;
                    if (event.target === overlay) {
                        closeModal();
                    }
                    break;
                }
                case 'update-status':
                    event.preventDefault();
                    updateShipmentStatus();
                    break;
                default:
                    break;
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const modal = getElement('shipmentModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const statusFilter = getElement('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }

        const trackingFilter = getElement('trackingFilter');
        if (trackingFilter) {
            trackingFilter.addEventListener('input', applyFilters);
        }

        const orderFilter = getElement('orderFilter');
        if (orderFilter) {
            orderFilter.addEventListener('input', applyFilters);
        }

        const modalContent = document.querySelector('[data-role="modal-content"]');
        if (modalContent) {
            modalContent.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
            return;
        }
        setupEventHandlers();
        await loadShipments();
    });
})();
