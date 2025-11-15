(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allDrivers = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    const vehicleLabels = {
        bicycle: 'Bicicleta',
        motorcycle: 'Motocicleta',
        car: 'Auto',
        van: 'Van',
        truck: 'Camión'
    };

    function getElement(id) {
        return document.getElementById(id);
    }

    async function loadDrivers() {
        try {
            // Si no hay backend, intentar cargar desde JSON estático
            if (!apiClient.baseURL) {
                try {
                    const staticData = await apiClient.loadStaticJSON('fleet-drivers.json');
                    if (staticData && staticData.success && staticData.data) {
                        allDrivers = staticData.data.drivers || staticData.data || [];
                        currentPage = 1;
                        renderDrivers();
                        return;
                    }
                } catch (jsonError) {
                    console.warn('Error al cargar conductores desde JSON estático:', jsonError);
                }
            } else {
                // Modo con backend: usar API dinámica
                const response = await apiClient.request('/fleet-drivers', { method: 'GET' });
                allDrivers = response.data?.drivers || [];
                currentPage = 1;
                renderDrivers();
                return;
            }
            throw new Error('No se pudieron cargar conductores desde ninguna fuente');
        } catch (error) {
            console.error('Error cargando conductores:', error);
            const tbody = getElement('driversTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar conductores: ${error.message || 'Error desconocido'}</p>
                            ${!apiClient.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Los conductores se cargan desde fleet-drivers.json</p>' : ''}
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

    function renderDrivers() {
        const tbody = getElement('driversTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allDrivers.length / itemsPerPage) || 1;

        if (allDrivers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay conductores registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const driversToShow = allDrivers.slice(startIndex, endIndex);

        tbody.innerHTML = driversToShow
            .map((driver) => {
                const activeClass = driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const activeLabel = driver.is_active ? 'Activo' : 'Inactivo';
                const vehicleLabel = vehicleLabels[driver.vehicle_type] || driver.vehicle_type || 'N/A';
                const capacity = driver.vehicle_capacity_kg ? `${driver.vehicle_capacity_kg} kg` : 'N/A';
                return `
                    <tr class="hover:bg-gray-50" data-driver-id="${driver.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${driver.id}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${driver.name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${driver.license_number || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${driver.phone || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${vehicleLabel}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${driver.vehicle_plate || 'N/A'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${capacity}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeClass}">${activeLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-driver" data-driver-id="${driver.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-driver" data-driver-id="${driver.id}">
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
        if (allDrivers.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allDrivers.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allDrivers.length;
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
        const totalPages = Math.ceil(allDrivers.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderDrivers();
        }
    }

    function openCreateModal() {
        const form = getElement('driverForm');
        if (form) {
            form.reset();
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nuevo Conductor';
        }
        const driverId = getElement('driverId');
        if (driverId) {
            driverId.value = '';
        }
        const activeCheckbox = getElement('driverActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        const modal = getElement('driverModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('driverModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(driver) {
        getElement('driverId').value = driver.id;
        getElement('driverName').value = driver.name || '';
        getElement('driverRut').value = driver.license_number || '';
        getElement('driverPhone').value = driver.phone || '';
        getElement('driverEmail').value = driver.email || '';
        getElement('driverVehicleType').value = driver.vehicle_type || 'bicycle';
        getElement('driverLicensePlate').value = driver.vehicle_plate || '';
        getElement('driverCapacity').value = driver.vehicle_capacity_kg || '';
        getElement('driverActive').checked = driver.is_active === 1 || driver.is_active === true;
    }

    function editDriver(driverId) {
        const driver = allDrivers.find((item) => item.id === Number(driverId));
        if (!driver) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Conductor';
        }
        populateForm(driver);
        const modal = getElement('driverModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteDriver(driverId) {
        if (!driverId) {
            return;
        }
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar conductores. Los cambios solo se aplican en entorno local con backend.');
            }
            return;
        }
        
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('este conductor')
            : window.confirm('¿Eliminar este conductor?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/fleet-drivers/${driverId}`, { method: 'DELETE' });
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Conductor eliminado exitosamente');
            }
            await loadDrivers();
        } catch (error) {
            console.error('Error eliminando conductor:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar conductor: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function saveDriver(event) {
        event.preventDefault();
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar conductores. Los cambios solo se aplican en entorno local con backend.');
            }
            closeModal();
            return;
        }
        
        const id = getElement('driverId').value;
        const payload = {
            name: getElement('driverName').value,
            license_number: getElement('driverRut').value,
            phone: getElement('driverPhone').value,
            email: getElement('driverEmail').value || null,
            vehicle_type: getElement('driverVehicleType').value,
            vehicle_plate: getElement('driverLicensePlate').value,
            vehicle_capacity_kg: getElement('driverCapacity').value ? parseFloat(getElement('driverCapacity').value) : null,
            is_active: getElement('driverActive').checked
        };

        try {
            if (id) {
                await apiClient.request(`/fleet-drivers/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Conductor actualizado exitosamente');
                }
            } else {
                await apiClient.request('/fleet-drivers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Conductor creado exitosamente');
                }
            }
            closeModal();
            await loadDrivers();
        } catch (error) {
            console.error('Error guardando conductor:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar conductor: ' + (error.message || 'Error desconocido'));
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
                case 'edit-driver':
                    event.preventDefault();
                    editDriver(actionNode.dataset.driverId);
                    break;
                case 'delete-driver':
                    event.preventDefault();
                    deleteDriver(actionNode.dataset.driverId);
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
                const modal = getElement('driverModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('driverForm');
        if (form) {
            form.addEventListener('submit', saveDriver);
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
        await loadDrivers();
    });
})();
