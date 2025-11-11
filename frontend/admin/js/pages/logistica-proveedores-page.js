(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allProviders = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    function getElement(id) {
        return document.getElementById(id);
    }

    function togglePagination(shouldShow) {
        const container = getElement('paginationContainer');
        if (!container) {
            return;
        }
        container.classList.toggle('hidden', !shouldShow);
    }

    async function loadProviders() {
        try {
            const response = await apiClient.request('/shipping-providers', { method: 'GET' });
            allProviders = response.data?.providers || [];
            currentPage = 1;
            renderProviders();
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            const tbody = getElement('providersTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar proveedores</p>
                        </td>
                    </tr>
                `;
            }
        }
    }

    function renderProviders() {
        const tbody = getElement('providersTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allProviders.length / itemsPerPage) || 1;

        if (allProviders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay proveedores registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const providersToShow = allProviders.slice(startIndex, endIndex);

        tbody.innerHTML = providersToShow
            .map((provider) => {
                const typeBadgeClass = provider.provider_type === 'external'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800';
                const typeLabel = provider.provider_type === 'external' ? 'Externo' : 'Interno';
                const activeBadgeClass = provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const activeLabel = provider.is_active ? 'Activo' : 'Inactivo';
                const trackingIcon = provider.supports_tracking
                    ? '<i class="fas fa-check text-green-600"></i>'
                    : '<i class="fas fa-times text-red-600"></i>';

                return `
                    <tr class="hover:bg-gray-50" data-provider-id="${provider.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${provider.id}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${provider.name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${provider.code || ''}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${typeBadgeClass}">
                                ${typeLabel}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm">${trackingIcon}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeBadgeClass}">
                                ${activeLabel}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-provider" data-provider-id="${provider.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-provider" data-provider-id="${provider.id}">
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
        const paginationContainer = getElement('paginationContainer');
        if (!paginationContainer) {
            return;
        }

        if (allProviders.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allProviders.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allProviders.length;
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
        const totalPages = Math.ceil(allProviders.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderProviders();
        }
    }

    function openCreateModal() {
        const form = getElement('providerForm');
        const modalTitle = getElement('modalTitle');
        if (form) {
            form.reset();
        }
        if (modalTitle) {
            modalTitle.textContent = 'Nuevo Proveedor';
        }
        const providerIdInput = getElement('providerId');
        if (providerIdInput) {
            providerIdInput.value = '';
        }
        const modal = getElement('providerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('providerModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(provider) {
        getElement('providerId').value = provider.id;
        getElement('providerName').value = provider.name || '';
        getElement('providerCode').value = provider.code || '';
        getElement('providerType').value = provider.provider_type || 'external';
        getElement('providerDescription').value = provider.description || '';
        getElement('providerWebsite').value = provider.website || '';
        getElement('providerPhone').value = provider.phone || '';
        getElement('providerEmail').value = provider.email || '';
        getElement('providerActive').checked = provider.is_active === 1 || provider.is_active === true;
        getElement('providerTracking').checked = provider.supports_tracking === 1 || provider.supports_tracking === true;
        getElement('providerLabels').checked = provider.supports_labels === 1 || provider.supports_labels === true;
    }

    function editProvider(providerId) {
        const provider = allProviders.find((item) => item.id === Number(providerId));
        if (!provider) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Proveedor';
        }
        populateForm(provider);
        const modal = getElement('providerModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteProvider(providerId) {
        if (!providerId) {
            return;
        }
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('este proveedor')
            : window.confirm('¿Eliminar este proveedor?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/shipping-providers/${providerId}`, { method: 'DELETE' });
            await loadProviders();
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Proveedor eliminado exitosamente');
            }
        } catch (error) {
            console.error('Error eliminando proveedor:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar proveedor: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function saveProvider(event) {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form) {
            return;
        }

        const id = getElement('providerId').value;
        const payload = {
            name: getElement('providerName').value,
            code: getElement('providerCode').value,
            provider_type: getElement('providerType').value,
            description: getElement('providerDescription').value,
            website: getElement('providerWebsite').value,
            phone: getElement('providerPhone').value,
            email: getElement('providerEmail').value,
            is_active: getElement('providerActive').checked,
            supports_tracking: getElement('providerTracking').checked,
            supports_labels: getElement('providerLabels').checked
        };

        try {
            if (id) {
                await apiClient.request(`/shipping-providers/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Proveedor actualizado exitosamente');
                }
            } else {
                await apiClient.request('/shipping-providers', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Proveedor creado exitosamente');
                }
            }
            closeModal();
            await loadProviders();
        } catch (error) {
            console.error('Error guardando proveedor:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar proveedor: ' + (error.message || 'Error desconocido'));
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
                case 'edit-provider':
                    event.preventDefault();
                    editProvider(actionNode.dataset.providerId);
                    break;
                case 'delete-provider':
                    event.preventDefault();
                    deleteProvider(actionNode.dataset.providerId);
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
                const modal = getElement('providerModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('providerForm');
        if (form) {
            form.addEventListener('submit', saveProvider);
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
        await loadProviders();
    });
})();
