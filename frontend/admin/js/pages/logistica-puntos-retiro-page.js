(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allPoints = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    function getElement(id) {
        return document.getElementById(id);
    }

    async function loadPoints() {
        try {
            // Si no hay backend, intentar cargar desde JSON estático
            if (!apiClient.baseURL) {
                try {
                    const staticData = await apiClient.loadStaticJSON('pickup-points.json');
                    if (staticData && staticData.success && staticData.data) {
                        allPoints = staticData.data.points || staticData.data || [];
                        currentPage = 1;
                        renderPoints();
                        return;
                    }
                } catch (jsonError) {
                    console.warn('Error al cargar puntos desde JSON estático:', jsonError);
                }
            } else {
                // Modo con backend: usar API dinámica
                const response = await apiClient.request('/pickup-points-dispensary', { method: 'GET' });
                allPoints = response.data?.points || [];
                currentPage = 1;
                renderPoints();
                return;
            }
            throw new Error('No se pudieron cargar puntos desde ninguna fuente');
        } catch (error) {
            console.error('Error cargando puntos:', error);
            const tbody = getElement('pointsTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar puntos: ${error.message || 'Error desconocido'}</p>
                            ${!apiClient.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Los puntos se cargan desde pickup-points.json</p>' : ''}
                        </td>
                    </tr>
                `;
            }
        }
    }

    function togglePagination(visible) {
        const container = getElement('paginationContainer');
        if (container) {
            container.classList.toggle('hidden', !visible);
        }
    }

    function renderPoints() {
        const tbody = getElement('pointsTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allPoints.length / itemsPerPage) || 1;

        if (allPoints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay puntos registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pointsToShow = allPoints.slice(startIndex, endIndex);

        tbody.innerHTML = pointsToShow
            .map((point) => {
                const activeClass = point.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const activeLabel = point.is_active ? 'Activo' : 'Inactivo';
                const hours = point.operating_hours || 'N/A';
                return `
                    <tr class="hover:bg-gray-50" data-point-id="${point.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${point.id}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${point.name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${point.address || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${point.city || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${point.phone || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${hours}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeClass}">${activeLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar punto" data-action="edit-point" data-point-id="${point.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar punto" data-action="delete-point" data-point-id="${point.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join('');

        updatePagination(totalPages);
    }

    function updatePagination(totalPages) {
        if (allPoints.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allPoints.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allPoints.length;
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
        const totalPages = Math.ceil(allPoints.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderPoints();
        }
    }

    function openCreateModal() {
        const form = getElement('pointForm');
        if (form) {
            form.reset();
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nuevo Punto de Retiro';
        }
        const pointId = getElement('pointId');
        if (pointId) {
            pointId.value = '';
        }
        const activeCheckbox = getElement('pointActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        const modal = getElement('pointModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('pointModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(point) {
        getElement('pointId').value = point.id;
        getElement('pointName').value = point.name || '';
        getElement('pointAddress').value = point.address || '';
        getElement('pointCommune').value = point.commune || '';
        getElement('pointCity').value = point.city || '';
        getElement('pointRegion').value = point.region || '';
        getElement('pointPhone').value = point.phone || '';
        getElement('pointHours').value = point.operating_hours || '';
        getElement('pointActive').checked = point.is_active === 1 || point.is_active === true;
    }

    function editPoint(pointId) {
        const point = allPoints.find((item) => item.id === Number(pointId));
        if (!point) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Punto de Retiro';
        }
        populateForm(point);
        const modal = getElement('pointModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deletePoint(pointId) {
        if (!pointId) {
            return;
        }
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('este punto')
            : window.confirm('¿Eliminar este punto?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/pickup-points-dispensary/${pointId}`, { method: 'DELETE' });
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Punto eliminado exitosamente');
            }
            await loadPoints();
        } catch (error) {
            console.error('Error eliminando punto:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar punto: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    function generatePointCode() {
        return `PUNT-${Date.now()}`;
    }

    async function savePoint(event) {
        event.preventDefault();
        const id = getElement('pointId').value;
        const payload = {
            name: getElement('pointName').value,
            code: id ? undefined : generatePointCode(),
            address: getElement('pointAddress').value,
            commune: getElement('pointCommune').value,
            city: getElement('pointCity').value,
            region: getElement('pointRegion').value,
            phone: getElement('pointPhone').value || null,
            operating_hours: getElement('pointHours').value || null,
            is_active: getElement('pointActive').checked
        };

        // Evitar enviar código undefined en actualizaciones
        if (!payload.code) {
            delete payload.code;
        }

        try {
            if (id) {
                await apiClient.request(`/pickup-points-dispensary/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Punto actualizado exitosamente');
                }
            } else {
                await apiClient.request('/pickup-points-dispensary', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Punto creado exitosamente');
                }
            }
            closeModal();
            await loadPoints();
        } catch (error) {
            console.error('Error guardando punto:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar punto: ' + (error.message || 'Error desconocido'));
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
                case 'navigate':
                    event.preventDefault();
                    if (actionNode.dataset.href) {
                        window.location.href = actionNode.dataset.href;
                    }
                    break;
                case 'open-create-modal':
                    event.preventDefault();
                    openCreateModal();
                    break;
                case 'change-page': {
                    event.preventDefault();
                    const direction = Number(actionNode.dataset.direction || 0);
                    if (direction) {
                        changePage(direction);
                    }
                    break;
                }
                case 'edit-point':
                    event.preventDefault();
                    editPoint(actionNode.dataset.pointId);
                    break;
                case 'delete-point':
                    event.preventDefault();
                    deletePoint(actionNode.dataset.pointId);
                    break;
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
                default:
                    break;
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const modal = getElement('pointModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('pointForm');
        if (form) {
            form.addEventListener('submit', savePoint);
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
        await loadPoints();
    });
})();
