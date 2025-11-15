(function () {
    const ITEMS_PER_PAGE = 20;
    const WAIT_DELAY = 100;
    const MAX_DEPENDENCY_RETRIES = 100;

    let apiClient = null;
    let allZones = [];
    let currentPage = 1;

    let selectedRegions = new Set();
    let selectedCommunes = new Map();
    let regionSelectListenerAttached = false;

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

    function resetCoverageState() {
        selectedRegions = new Set();
        selectedCommunes = new Map();
        const container = document.getElementById('selectedCommunes');
        if (container) {
            container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No hay comunas seleccionadas</p>';
        }
        const coverageInput = document.getElementById('zoneCoverage');
        if (coverageInput) {
            coverageInput.value = '';
        }
    }

    function populateRegionSelect() {
        const regionSelect = document.getElementById('zoneRegionSelect');
        if (!regionSelect) {
            return;
        }

        regionSelect.innerHTML = '<option value="">Selecciona una región</option>';

        const regions = Object.keys(window.CHILE_REGIONS || {});
        regions.forEach((region) => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });
    }

    function initRegionSelectors() {
        const regionSelect = document.getElementById('zoneRegionSelect');
        const communeSelect = document.getElementById('zoneCommuneSelect');

        if (!regionSelect || !communeSelect) {
            return;
        }

        populateRegionSelect();

        if (!regionSelectListenerAttached) {
            regionSelect.addEventListener('change', (event) => {
                updateCommuneSelect(event.target.value);
            });
            regionSelectListenerAttached = true;
        }
    }

    function updateCommuneSelect(region) {
        const communeSelect = document.getElementById('zoneCommuneSelect');
        if (!communeSelect) {
            return;
        }

        if (!region || !window.CHILE_REGIONS || !window.CHILE_REGIONS[region]) {
            communeSelect.innerHTML = '<option value="">Selecciona una región primero</option>';
            return;
        }

        const communes = window.CHILE_REGIONS[region];
        const alreadySelected = selectedCommunes.get(region) || new Set();

        communeSelect.innerHTML = '<option value="">Selecciona una comuna</option>';
        communes.forEach((commune) => {
            if (!alreadySelected.has(commune)) {
                const option = document.createElement('option');
                option.value = commune;
                option.textContent = commune;
                communeSelect.appendChild(option);
            }
        });
    }

    function escapeAttribute(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function updateSelectedCommunesDisplay() {
        const container = document.getElementById('selectedCommunes');
        if (!container) {
            return;
        }

        if (selectedRegions.size === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No hay comunas seleccionadas</p>';
            return;
        }

        let html = '';
        selectedRegions.forEach((region) => {
            const communes = selectedCommunes.get(region) || new Set();
            if (communes.size === 0) {
                return;
            }

            const regionEscaped = escapeAttribute(region);
            const communesHtml = Array.from(communes)
                .map((commune) => {
                    const communeEscaped = escapeAttribute(commune);
                    return `
                        <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded" data-region="${regionEscaped}" data-commune="${communeEscaped}">
                            ${communeEscaped}
                            <button type="button" class="remove-commune-btn ml-1 admin-icon-btn admin-icon-btn--danger" data-action="remove-commune" data-region="${regionEscaped}" data-commune="${communeEscaped}" title="Quitar comuna">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                        </span>
                    `;
                })
                .join('');

            html += `
                <div class="mb-3 pb-3 border-b border-gray-200 last:border-0">
                    <div class="flex items-center justify-between mb-2">
                        <span class="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded">
                            ${regionEscaped}
                        </span>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${communesHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function updateCoverageJSON() {
        const coverageInput = document.getElementById('zoneCoverage');
        if (!coverageInput) {
            return;
        }

        const regions = Array.from(selectedRegions);
        const communes = [];

        selectedCommunes.forEach((communeSet) => {
            communeSet.forEach((commune) => communes.push(commune));
        });

        const coverageData = {
            regions,
            communes,
        };

        coverageInput.value = JSON.stringify(coverageData);
    }

    function addCommune() {
        const regionSelect = document.getElementById('zoneRegionSelect');
        const communeSelect = document.getElementById('zoneCommuneSelect');
        if (!regionSelect || !communeSelect) {
            return;
        }

        const region = regionSelect.value;
        const commune = communeSelect.value;

        if (!region || !commune) {
            if (typeof notify !== 'undefined' && notify.warning) {
                notify.warning('Por favor selecciona una región y una comuna');
            }
            return;
        }

        selectedRegions.add(region);
        if (!selectedCommunes.has(region)) {
            selectedCommunes.set(region, new Set());
        }
        selectedCommunes.get(region).add(commune);

        updateSelectedCommunesDisplay();
        updateCommuneSelect(region);
        communeSelect.value = '';
        updateCoverageJSON();
    }

    function removeCommune(region, commune) {
        if (!region || !commune) {
            return;
        }
        const regionCommunes = selectedCommunes.get(region);
        if (regionCommunes) {
            regionCommunes.delete(commune);
            if (regionCommunes.size === 0) {
                selectedCommunes.delete(region);
                selectedRegions.delete(region);
            }
        }
        updateSelectedCommunesDisplay();
        const regionSelect = document.getElementById('zoneRegionSelect');
        if (regionSelect && regionSelect.value) {
            updateCommuneSelect(regionSelect.value);
        }
        updateCoverageJSON();
    }

    function loadCoverageData(coverageDataStr) {
        selectedRegions = new Set();
        selectedCommunes = new Map();

        try {
            const coverageData = typeof coverageDataStr === 'string' ? JSON.parse(coverageDataStr) : coverageDataStr;
            if (coverageData && Array.isArray(coverageData.regions)) {
                coverageData.regions.forEach((region) => {
                    selectedRegions.add(region);
                    selectedCommunes.set(region, new Set());
                });
            }
            if (coverageData && Array.isArray(coverageData.communes)) {
                coverageData.communes.forEach((commune) => {
                    const regionEntry = Object.entries(window.CHILE_REGIONS || {}).find(([, communes]) => communes.includes(commune));
                    if (regionEntry) {
                        const [region] = regionEntry;
                        if (!selectedCommunes.has(region)) {
                            selectedRegions.add(region);
                            selectedCommunes.set(region, new Set());
                        }
                        selectedCommunes.get(region).add(commune);
                    }
                });
            }
        } catch (error) {
            console.error('Error cargando datos de cobertura:', error);
        }

        updateSelectedCommunesDisplay();

        const regionSelect = document.getElementById('zoneRegionSelect');
        if (regionSelect && selectedRegions.size > 0) {
            const firstRegion = Array.from(selectedRegions)[0];
            regionSelect.value = firstRegion;
            updateCommuneSelect(firstRegion);
        }
    }

    function formatCurrency(value) {
        if (!value) {
            return '$0';
        }
        return `$${Number(value).toLocaleString('es-CL')}`;
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
                    <td colspan="8" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay zonas registradas</p>
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
                let coverageHTML = '<span class="text-gray-400">N/A</span>';
                try {
                    const coverageData = typeof zone.coverage_data === 'string' ? JSON.parse(zone.coverage_data) : zone.coverage_data;
                    if (coverageData && Array.isArray(coverageData.regions) && coverageData.regions.length > 0) {
                        coverageHTML = coverageData.regions
                            .map((region) => {
                                const communes = (coverageData.communes || []).filter((commune) => {
                                    return window.CHILE_REGIONS && window.CHILE_REGIONS[region] && window.CHILE_REGIONS[region].includes(commune);
                                });
                                const communesHTML = communes
                                    .map(
                                        (commune) => `
                                            <span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                ${escapeAttribute(commune)}
                                            </span>
                                        `,
                                    )
                                    .join('');
                                return `
                                    <div class="mb-2">
                                        <span class="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded mb-1">
                                            ${escapeAttribute(region)}
                                        </span>
                                        <div class="flex flex-wrap gap-1 mt-1">
                                            ${communesHTML}
                                        </div>
                                    </div>
                                `;
                            })
                            .join('');
                    }
                } catch (error) {
                    coverageHTML = '<span class="text-red-500">Error al parsear</span>';
                }

                const isActive = zone.is_active === 1 || zone.is_active === true;

                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 text-sm text-gray-900">${escapeAttribute(zone.id)}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeAttribute(zone.zone_name)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600 max-w-md">${coverageHTML}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${zone.max_distance_km ? `${escapeAttribute(zone.max_distance_km)} km` : 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${formatCurrency(zone.delivery_fee)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">
                            ${zone.estimated_days_min && zone.estimated_days_max ? `${escapeAttribute(zone.estimated_days_min)}-${escapeAttribute(zone.estimated_days_max)} días` : 'N/A'}
                        </td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${isActive ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-zone" data-zone-id="${escapeAttribute(zone.id)}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-zone" data-zone-id="${escapeAttribute(zone.id)}">
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
        document.getElementById('modalTitle').textContent = 'Nueva Zona de Envío';
        resetCoverageState();
        initRegionSelectors();
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

        document.getElementById('modalTitle').textContent = 'Editar Zona de Envío';
        document.getElementById('zoneId').value = zone.id;
        document.getElementById('zoneName').value = zone.zone_name || '';
        document.getElementById('zoneDescription').value = zone.description || '';
        document.getElementById('zoneMaxDistance').value = zone.max_distance_km || '';
        document.getElementById('zoneDeliveryFee').value = zone.delivery_fee || 0;
        document.getElementById('zoneDaysMin').value = zone.estimated_days_min || '';
        document.getElementById('zoneDaysMax').value = zone.estimated_days_max || '';
        document.getElementById('zoneActive').checked = zone.is_active === 1 || zone.is_active === true;

        const coverageData = typeof zone.coverage_data === 'string' ? zone.coverage_data : JSON.stringify(zone.coverage_data || {});
        loadCoverageData(coverageData);
        initRegionSelectors();

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
            await api.request(`/internal-delivery-zones/${id}`, { method: 'DELETE' });
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
            // Usar getInternalDeliveryZones que tiene soporte para modo estático
            const response = await api.getInternalDeliveryZones();
            allZones = response?.data?.zones || response?.data || [];
            currentPage = 1;
            renderZones();
        } catch (error) {
            console.error('Error cargando zonas:', error);
            const tbody = document.getElementById('zonesTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar zonas: ${error.message || 'Error desconocido'}</p>
                            ${!api.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Las zonas se cargan desde internal-delivery-zones.json</p>' : ''}
                        </td>
                    </tr>
                `;
            }
        }
    }

    async function handleFormSubmit(event) {
        event.preventDefault();

        if (selectedRegions.size === 0 || selectedCommunes.size === 0) {
            if (typeof notify !== 'undefined' && notify.error) {
                notify.error('Por favor selecciona al menos una región y una comuna');
            }
            return;
        }

        updateCoverageJSON();

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
            description: document.getElementById('zoneDescription').value,
            coverage_data: coverageValue,
            max_distance_km: document.getElementById('zoneMaxDistance').value ? parseFloat(document.getElementById('zoneMaxDistance').value) : null,
            delivery_fee: document.getElementById('zoneDeliveryFee').value ? parseFloat(document.getElementById('zoneDeliveryFee').value) : 0,
            estimated_days_min: document.getElementById('zoneDaysMin').value ? parseInt(document.getElementById('zoneDaysMin').value, 10) : null,
            estimated_days_max: document.getElementById('zoneDaysMax').value ? parseInt(document.getElementById('zoneDaysMax').value, 10) : null,
            is_active: document.getElementById('zoneActive').checked,
        };

        const id = document.getElementById('zoneId').value;

        try {
            const api = ensureApiClient();
            if (id) {
                await api.request(`/internal-delivery-zones/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                if (typeof notify !== 'undefined' && notify.success) {
                    notify.success('Zona actualizada exitosamente');
                }
            } else {
                await api.request('/internal-delivery-zones', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                if (typeof notify !== 'undefined' && notify.success) {
                    notify.success('Zona creada exitosamente');
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
            case 'add-commune': {
                event.preventDefault();
                addCommune();
                break;
            }
            case 'remove-commune': {
                event.preventDefault();
                const { region, commune } = actionNode.dataset;
                removeCommune(region, commune);
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
            case 'navigate': {
                event.preventDefault();
                const { href } = actionNode.dataset;
                if (href) {
                    window.location.href = href;
                }
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
            console.error('Dependencias no disponibles para logistica zonas');
            return;
        }

        if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
            return;
        }

        ensureApiClient();
        initRegionSelectors();
        setupModalPropagation();

        const form = document.getElementById('zoneForm');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);

        await loadZones();

        // Inicializar el selector tras un breve retraso para asegurar datos
        setTimeout(() => {
            initRegionSelectors();
        }, 500);
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
