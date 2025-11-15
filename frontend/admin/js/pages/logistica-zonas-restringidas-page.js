(function () {
    const ITEMS_PER_PAGE = 20;
    const MAX_DEPENDENCY_RETRIES = 100;
    const WAIT_DELAY = 100;

    let apiClient = null;
    let allZones = [];
    let currentPage = 1;

    function ensureApiClient() {
        if (!apiClient) {
            if (typeof window.api !== 'undefined') {
                apiClient = window.api;
            } else if (typeof APIClient === 'function') {
                apiClient = new APIClient();
                window.api = apiClient;
            } else {
                throw new Error('APIClient no disponible');
            }
        }
        return apiClient;
    }

    async function waitForDependencies() {
        let retries = 0;
        while (retries < MAX_DEPENDENCY_RETRIES) {
            if (typeof APIClient !== 'undefined' && typeof authManager !== 'undefined') {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, WAIT_DELAY));
            retries += 1;
        }
        return typeof APIClient !== 'undefined' && typeof authManager !== 'undefined';
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function renderZones() {
        const tbody = document.getElementById('zonesTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allZones.length / ITEMS_PER_PAGE) || 1;

        if (allZones.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay zonas restringidas registradas</p>
                    </td>
                </tr>
            `;
            const paginationContainer = document.getElementById('paginationContainer');
            if (paginationContainer) {
                paginationContainer.classList.add('hidden');
            }
            return;
        }

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const zonesToShow = allZones.slice(startIndex, endIndex);

        tbody.innerHTML = zonesToShow
            .map((zone) => {
                let coverage = 'N/A';
                try {
                    const coverageData = typeof zone.coverage_data === 'string' ? JSON.parse(zone.coverage_data) : zone.coverage_data;
                    if (coverageData) {
                        const regions = Array.isArray(coverageData.regions) ? coverageData.regions.join(', ') : '';
                        const communes = Array.isArray(coverageData.communes) ? coverageData.communes.slice(0, 3).join(', ') : '';
                        const postalCodes = Array.isArray(coverageData.postal_codes) ? coverageData.postal_codes.slice(0, 3).join(', ') : '';
                        coverage = regions || communes || postalCodes || 'N/A';
                    }
                } catch (error) {
                    coverage = zone.coverage_data || 'N/A';
                }

                const isActive = zone.is_active === 1 || zone.is_active === true;
                const typeLabels = {
                    complete: 'Completa',
                    partial: 'Parcial',
                };

                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(zone.id)}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeHtml(zone.zone_name)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(typeLabels[zone.restriction_type] || zone.restriction_type)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(coverage)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${escapeHtml(zone.reason || 'N/A')}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${isActive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}">
                                ${isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-zone" data-zone-id="${escapeHtml(zone.id)}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-zone" data-zone-id="${escapeHtml(zone.id)}">
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
        const paginationContainer = document.getElementById('paginationContainer');
        if (!paginationContainer) {
            return;
        }

        if (allZones.length <= ITEMS_PER_PAGE) {
            paginationContainer.classList.add('hidden');
            return;
        }

        paginationContainer.classList.remove('hidden');

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allZones.length);

        const showingFrom = document.getElementById('showingFrom');
        const showingTo = document.getElementById('showingTo');
        const totalRecords = document.getElementById('totalRecords');
        const pageInfo = document.getElementById('pageInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (showingFrom) showingFrom.textContent = String(startIndex + 1);
        if (showingTo) showingTo.textContent = String(endIndex);
        if (totalRecords) totalRecords.textContent = String(allZones.length);
        if (pageInfo) pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        if (prevPage) prevPage.disabled = currentPage === 1;
        if (nextPage) nextPage.disabled = currentPage === totalPages;
    }

    function changePage(direction) {
        const totalPages = Math.ceil(allZones.length / ITEMS_PER_PAGE) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderZones();
        }
    }

    function openCreateModal() {
        const form = document.getElementById('zoneForm');
        if (form) {
            form.reset();
        }
        document.getElementById('zoneId').value = '';
        document.getElementById('modalTitle').textContent = 'Nueva Zona Restringida';
        const modal = document.getElementById('zoneModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = document.getElementById('zoneModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async function editZone(id) {
        const zone = allZones.find((z) => String(z.id) === String(id));
        if (!zone) {
            return;
        }

        document.getElementById('modalTitle').textContent = 'Editar Zona Restringida';
        document.getElementById('zoneId').value = zone.id;
        document.getElementById('zoneName').value = zone.zone_name || '';
        document.getElementById('zoneType').value = zone.restriction_type || 'complete';
        document.getElementById('zoneCoverage').value = typeof zone.coverage_data === 'string' ? zone.coverage_data : JSON.stringify(zone.coverage_data || {}, null, 2);
        document.getElementById('zoneReason').value = zone.reason || '';
        document.getElementById('zoneActive').checked = zone.is_active === 1 || zone.is_active === true;

        const modal = document.getElementById('zoneModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteZone(id) {
        if (typeof notify !== 'undefined' && notify.confirmDelete) {
            const confirmed = await notify.confirmDelete('esta zona');
            if (!confirmed) {
                return;
            }
        }

        try {
            const api = ensureApiClient();
            await api.request(`/restricted-zones/${id}`, { method: 'DELETE' });
            await loadZones();
            if (typeof notify !== 'undefined' && notify.success) {
                notify.success('Zona eliminada exitosamente');
            }
        } catch (error) {
            console.error('Error eliminando zona:', error);
            if (typeof notify !== 'undefined' && notify.error) {
                notify.error('Error al eliminar zona: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function loadZones() {
        try {
            const api = ensureApiClient();
            // Si no hay backend, intentar cargar desde JSON estático
            if (!api.baseURL) {
                try {
                    const staticData = await api.loadStaticJSON('restricted-zones.json');
                    if (staticData && staticData.success && staticData.data) {
                        allZones = staticData.data.zones || staticData.data || [];
                        currentPage = 1;
                        renderZones();
                        return;
                    }
                } catch (jsonError) {
                    console.warn('Error al cargar zonas desde JSON estático:', jsonError);
                }
            } else {
                // Modo con backend: usar API dinámica
                const response = await api.request('/restricted-zones', { method: 'GET' });
                allZones = response?.data?.zones || [];
                currentPage = 1;
                renderZones();
                return;
            }
            throw new Error('No se pudieron cargar zonas desde ninguna fuente');
        } catch (error) {
            console.error('Error cargando zonas:', error);
            const tbody = document.getElementById('zonesTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar zonas: ${error.message || 'Error desconocido'}</p>
                            ${!api.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Las zonas se cargan desde restricted-zones.json</p>' : ''}
                        </td>
                    </tr>
                `;
            }
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        const id = document.getElementById('zoneId').value;
        const coverageValue = document.getElementById('zoneCoverage').value;
        try {
            JSON.parse(coverageValue);
        } catch (error) {
            if (typeof notify !== 'undefined' && notify.error) {
                notify.error('El formato de cobertura no es válido JSON');
            }
            return;
        }

        const data = {
            zone_name: document.getElementById('zoneName').value,
            restriction_type: document.getElementById('zoneType').value,
            coverage_data: coverageValue,
            reason: document.getElementById('zoneReason').value || null,
            is_active: document.getElementById('zoneActive').checked,
        };

        try {
            const api = ensureApiClient();
            if (id) {
                await api.request(`/restricted-zones/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                if (typeof notify !== 'undefined' && notify.success) {
                    notify.success('Zona restringida actualizada exitosamente');
                }
            } else {
                await api.request('/restricted-zones', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                if (typeof notify !== 'undefined' && notify.success) {
                    notify.success('Zona restringida creada exitosamente');
                }
            }
            closeModal();
            await loadZones();
        } catch (error) {
            console.error('Error guardando zona:', error);
            if (typeof notify !== 'undefined' && notify.error) {
                notify.error('Error al guardar zona: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    function handleDocumentClick(event) {
        const actionNode = event.target.closest('[data-action]');
        if (!actionNode) {
            return;
        }

        const action = actionNode.dataset.action;
        switch (action) {
            case 'navigate': {
                event.preventDefault();
                const { href } = actionNode.dataset;
                if (href) {
                    window.location.href = href;
                }
                break;
            }
            case 'open-create-modal': {
                event.preventDefault();
                openCreateModal();
                break;
            }
            case 'change-page': {
                event.preventDefault();
                const direction = parseInt(actionNode.dataset.direction, 10) || 0;
                changePage(direction);
                break;
            }
            case 'close-modal-overlay': {
                if (event.target === actionNode) {
                    closeModal();
                }
                break;
            }
            case 'close-modal': {
                event.preventDefault();
                closeModal();
                break;
            }
            case 'edit-zone': {
                event.preventDefault();
                editZone(actionNode.dataset.zoneId);
                break;
            }
            case 'delete-zone': {
                event.preventDefault();
                deleteZone(actionNode.dataset.zoneId);
                break;
            }
            default:
                break;
        }
    }

    function setupModalPropagation() {
        const modalContent = document.querySelector('#zoneModal [data-role="modal-content"]');
        if (modalContent) {
            modalContent.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('zoneModal');
            if (modal && !modal.classList.contains('hidden')) {
                closeModal();
            }
        }
    }

    async function initialize() {
        if (!(await waitForDependencies())) {
            console.error('Dependencias no disponibles para logistica zonas restringidas');
            return;
        }

        if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
            return;
        }

        ensureApiClient();
        setupModalPropagation();

        const form = document.getElementById('zoneForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);

        await loadZones();
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
