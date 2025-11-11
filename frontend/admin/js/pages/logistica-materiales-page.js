(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allMaterials = [];
    let currentPage = 1;
    const itemsPerPage = 20;

    function getElement(id) {
        return document.getElementById(id);
    }

    function formatCurrency(value) {
        if (value === null || value === undefined || value === '') {
            return '$0';
        }
        try {
            return `$${Number(value).toLocaleString('es-CL')}`;
        } catch (error) {
            return `$${value}`;
        }
    }

    async function loadMaterials() {
        try {
            const response = await apiClient.request('/packing-materials', { method: 'GET' });
            allMaterials = response.data?.materials || [];
            currentPage = 1;
            renderMaterials();
        } catch (error) {
            console.error('Error cargando materiales:', error);
            const tbody = getElement('materialsTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar materiales</p>
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

    function renderMaterials() {
        const tbody = getElement('materialsTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allMaterials.length / itemsPerPage) || 1;

        if (allMaterials.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay materiales registrados</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const materialsToShow = allMaterials.slice(startIndex, endIndex);

        tbody.innerHTML = materialsToShow
            .map((material) => {
                const activeBadge = material.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800';
                const activeLabel = material.is_active ? 'Activo' : 'Inactivo';
                const typeLabel = mapMaterialType(material.material_type);

                return `
                    <tr class="hover:bg-gray-50" data-material-id="${material.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${material.id}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${material.code || ''}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${material.name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${typeLabel}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${material.stock ?? 0}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${material.min_stock ?? 0}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${formatCurrency(material.unit_cost)}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeBadge}">${activeLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-material" data-material-id="${material.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-material" data-material-id="${material.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join('');

        updatePagination(totalPages);
    }

    function mapMaterialType(type) {
        const mapping = {
            bag: 'Bolsa',
            box: 'Caja',
            seal: 'Sello',
            tape: 'Cinta',
            bubble_wrap: 'Burbuja',
            other: 'Otro'
        };
        return mapping[type] || 'Otro';
    }

    function updatePagination(totalPages) {
        if (allMaterials.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allMaterials.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allMaterials.length;
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
        const totalPages = Math.ceil(allMaterials.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderMaterials();
        }
    }

    function openCreateModal() {
        const form = getElement('materialForm');
        if (form) {
            form.reset();
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nuevo Material';
        }
        const materialId = getElement('materialId');
        if (materialId) {
            materialId.value = '';
        }
        const activeCheckbox = getElement('materialActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        const modal = getElement('materialModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('materialModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(material) {
        getElement('materialId').value = material.id;
        getElement('materialCode').value = material.code || '';
        getElement('materialName').value = material.name || '';
        getElement('materialType').value = material.material_type || 'bag';
        getElement('materialStock').value = material.stock ?? 0;
        getElement('materialMinStock').value = material.min_stock ?? 0;
        getElement('materialCost').value = material.unit_cost ?? 0;
        getElement('materialUnit').value = material.unit || 'unidad';
        getElement('materialSupplier').value = material.supplier || '';
        getElement('materialActive').checked = material.is_active === 1 || material.is_active === true;
    }

    function editMaterial(materialId) {
        const material = allMaterials.find((item) => item.id === Number(materialId));
        if (!material) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Material';
        }
        populateForm(material);
        const modal = getElement('materialModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteMaterial(materialId) {
        if (!materialId) {
            return;
        }
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('este material')
            : window.confirm('¿Eliminar este material?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/packing-materials/${materialId}`, { method: 'DELETE' });
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Material eliminado correctamente');
            }
            await loadMaterials();
        } catch (error) {
            console.error('Error eliminando material:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar material: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function saveMaterial(event) {
        event.preventDefault();
        const id = getElement('materialId').value;

        const payload = {
            code: getElement('materialCode').value,
            name: getElement('materialName').value,
            material_type: getElement('materialType').value,
            stock: Number(getElement('materialStock').value || 0),
            min_stock: Number(getElement('materialMinStock').value || 0),
            unit_cost: Number(getElement('materialCost').value || 0),
            unit: getElement('materialUnit').value,
            supplier: getElement('materialSupplier').value,
            is_active: getElement('materialActive').checked
        };

        try {
            if (id) {
                await apiClient.request(`/packing-materials/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Material actualizado correctamente');
                }
            } else {
                await apiClient.request('/packing-materials', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Material creado correctamente');
                }
            }
            closeModal();
            await loadMaterials();
        } catch (error) {
            console.error('Error guardando material:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar material: ' + (error.message || 'Error desconocido'));
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
                case 'edit-material':
                    event.preventDefault();
                    editMaterial(actionNode.dataset.materialId);
                    break;
                case 'delete-material':
                    event.preventDefault();
                    deleteMaterial(actionNode.dataset.materialId);
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
                const modal = getElement('materialModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('materialForm');
        if (form) {
            form.addEventListener('submit', saveMaterial);
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
        await loadMaterials();
    });
})();
