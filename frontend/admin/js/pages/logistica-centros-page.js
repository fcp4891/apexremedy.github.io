(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allCenters = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    function getElement(id) {
        return document.getElementById(id);
    }

    async function loadCenters() {
        try {
            // Si no hay backend, intentar cargar desde JSON estático
            if (!apiClient.baseURL) {
                try {
                    const staticData = await apiClient.loadStaticJSON('dispatch-centers.json');
                    if (staticData && staticData.success && staticData.data) {
                        allCenters = staticData.data.centers || staticData.data || [];
                        currentPage = 1;
                        renderCenters();
                        return;
                    }
                } catch (jsonError) {
                    console.warn('Error al cargar centros desde JSON estático:', jsonError);
                }
            } else {
                // Modo con backend: usar API dinámica
                const response = await apiClient.request('/dispatch-centers', { method: 'GET' });
                allCenters = response.data?.centers || [];
                currentPage = 1;
                renderCenters();
                return;
            }
            throw new Error('No se pudieron cargar centros desde ninguna fuente');
        } catch (error) {
            console.error('Error cargando centros:', error);
            const tbody = getElement('centersTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar centros: ${error.message || 'Error desconocido'}</p>
                            ${!apiClient.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Los centros se cargan desde dispatch-centers.json</p>' : ''}
                        </td>
                    </tr>
                `;
            }
        }
    }

    function togglePagination(visible) {
        const container = getElement('paginationContainer');
        if (!container) {
            return;
        }
        container.classList.toggle('hidden', !visible);
    }

    function renderCenters() {
        const tbody = getElement('centersTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allCenters.length / itemsPerPage) || 1;

        if (allCenters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay centros registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const centersToShow = allCenters.slice(startIndex, endIndex);

        tbody.innerHTML = centersToShow
            .map((center) => {
                const activeClass = center.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const activeLabel = center.is_active ? 'Activo' : 'Inactivo';
                return `
                    <tr class="hover:bg-gray-50" data-center-id="${center.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${center.id}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${center.code || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${center.name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${center.address || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${center.city || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${center.region || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${center.manager_name || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeClass}">${activeLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-center" data-center-id="${center.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-center" data-center-id="${center.id}">
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
        if (allCenters.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allCenters.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allCenters.length;
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
        const totalPages = Math.ceil(allCenters.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderCenters();
        }
    }

    function openCreateModal() {
        const form = getElement('centerForm');
        if (form) {
            form.reset();
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nuevo Centro de Despacho';
        }
        const centerId = getElement('centerId');
        if (centerId) {
            centerId.value = '';
        }
        const activeCheckbox = getElement('centerActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        const modal = getElement('centerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('centerModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(center) {
        getElement('centerId').value = center.id;
        getElement('centerCode').value = center.code || '';
        getElement('centerName').value = center.name || '';
        getElement('centerAddress').value = center.address || '';
        getElement('centerCommune').value = center.commune || '';
        getElement('centerCity').value = center.city || '';
        getElement('centerRegion').value = center.region || '';
        getElement('centerPhone').value = center.phone || '';
        getElement('centerEmail').value = center.email || '';
        getElement('centerManager').value = center.manager_name || '';
        getElement('centerHours').value = center.operating_hours || '';
        getElement('centerActive').checked = center.is_active === 1 || center.is_active === true;
    }

    function editCenter(centerId) {
        const center = allCenters.find((item) => item.id === Number(centerId));
        if (!center) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Centro de Despacho';
        }
        populateForm(center);
        const modal = getElement('centerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteCenter(centerId) {
        if (!centerId) {
            return;
        }
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar centros. Los cambios solo se aplican en entorno local con backend.');
            }
            return;
        }
        
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('este centro')
            : window.confirm('¿Eliminar este centro?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/dispatch-centers/${centerId}`, { method: 'DELETE' });
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Centro eliminado exitosamente');
            }
            await loadCenters();
        } catch (error) {
            console.error('Error eliminando centro:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar centro: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function saveCenter(event) {
        event.preventDefault();
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar centros. Los cambios solo se aplican en entorno local con backend.');
            }
            closeModal();
            return;
        }
        
        const id = getElement('centerId').value;
        const payload = {
            code: getElement('centerCode').value,
            name: getElement('centerName').value,
            address: getElement('centerAddress').value,
            commune: getElement('centerCommune').value,
            city: getElement('centerCity').value,
            region: getElement('centerRegion').value,
            phone: getElement('centerPhone').value || null,
            email: getElement('centerEmail').value || null,
            manager_name: getElement('centerManager').value || null,
            operating_hours: getElement('centerHours').value || null,
            is_active: getElement('centerActive').checked
        };

        try {
            if (id) {
                await apiClient.request(`/dispatch-centers/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Centro actualizado exitosamente');
                }
            } else {
                await apiClient.request('/dispatch-centers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Centro creado exitosamente');
                }
            }
            closeModal();
            await loadCenters();
        } catch (error) {
            console.error('Error guardando centro:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar centro: ' + (error.message || 'Error desconocido'));
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
                case 'edit-center':
                    event.preventDefault();
                    editCenter(actionNode.dataset.centerId);
                    break;
                case 'delete-center':
                    event.preventDefault();
                    deleteCenter(actionNode.dataset.centerId);
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
                const modal = getElement('centerModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('centerForm');
        if (form) {
            form.addEventListener('submit', saveCenter);
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
        await loadCenters();
    });
})();
