(function () {
    const apiClient = typeof window.api !== 'undefined' ? window.api : new APIClient();
    let allRules = [];
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

    async function loadRules() {
        try {
            // Si no hay backend, intentar cargar desde JSON estático
            if (!apiClient.baseURL) {
                try {
                    const staticData = await apiClient.loadStaticJSON('free-shipping-rules.json');
                    if (staticData && staticData.success && staticData.data) {
                        allRules = staticData.data.rules || staticData.data || [];
                        currentPage = 1;
                        renderRules();
                        return;
                    }
                } catch (jsonError) {
                    console.warn('Error al cargar reglas desde JSON estático:', jsonError);
                }
            } else {
                // Modo con backend: usar API dinámica
                const response = await apiClient.request('/free-shipping-rules', { method: 'GET' });
                allRules = response.data?.rules || [];
                currentPage = 1;
                renderRules();
                return;
            }
            throw new Error('No se pudieron cargar reglas desde ninguna fuente');
        } catch (error) {
            console.error('Error cargando reglas:', error);
            const tbody = getElement('rulesTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-6 py-12 text-center text-red-600">
                            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                            <p>Error al cargar reglas: ${error.message || 'Error desconocido'}</p>
                            ${!apiClient.baseURL ? '<p class="text-sm text-gray-500 mt-2">Modo QA: Las reglas se cargan desde free-shipping-rules.json</p>' : ''}
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

    function renderRules() {
        const tbody = getElement('rulesTableBody');
        if (!tbody) {
            return;
        }

        const totalPages = Math.ceil(allRules.length / itemsPerPage) || 1;

        if (allRules.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-12 text-center text-gray-400">
                        <i class="fas fa-inbox text-3xl mb-2"></i>
                        <p>No hay reglas registradas</p>
                    </td>
                </tr>
            `;
            togglePagination(false);
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const rulesToShow = allRules.slice(startIndex, endIndex);

        tbody.innerHTML = rulesToShow
            .map((rule) => {
                const startDate = rule.start_date ? new Date(rule.start_date).toLocaleDateString('es-CL') : 'Sin límite';
                const endDate = rule.end_date ? new Date(rule.end_date).toLocaleDateString('es-CL') : 'Sin límite';
                const activeClass = rule.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                const activeLabel = rule.is_active ? 'Activa' : 'Inactiva';
                return `
                    <tr class="hover:bg-gray-50" data-rule-id="${rule.id}">
                        <td class="px-6 py-4 text-sm text-gray-900">${rule.id}</td>
                        <td class="px-6 py-4 text-sm font-medium text-gray-900">${rule.rule_name || ''}</td>
                        <td class="px-6 py-4 text-sm text-gray-900">${formatCurrency(rule.min_order_amount)}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${rule.applies_to_regions || 'Todas'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${rule.applies_to_zones || 'Todas'}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${startDate}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">${endDate}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded text-xs ${activeClass}">${activeLabel}</span>
                        </td>
                        <td class="px-6 py-4 text-sm flex gap-2">
                            <button class="admin-icon-btn admin-icon-btn--primary" title="Editar" data-action="edit-rule" data-rule-id="${rule.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="admin-icon-btn admin-icon-btn--danger" title="Eliminar" data-action="delete-rule" data-rule-id="${rule.id}">
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
        if (allRules.length <= itemsPerPage) {
            togglePagination(false);
            return;
        }

        togglePagination(true);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, allRules.length);

        getElement('showingFrom').textContent = startIndex + 1;
        getElement('showingTo').textContent = endIndex;
        getElement('totalRecords').textContent = allRules.length;
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
        const totalPages = Math.ceil(allRules.length / itemsPerPage) || 1;
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderRules();
        }
    }

    function openCreateModal() {
        const form = getElement('ruleForm');
        if (form) {
            form.reset();
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Nueva Regla de Envío Gratis';
        }
        const ruleId = getElement('ruleId');
        if (ruleId) {
            ruleId.value = '';
        }
        const activeCheckbox = getElement('ruleActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        const modal = getElement('ruleModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    function closeModal() {
        const modal = getElement('ruleModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function populateForm(rule) {
        getElement('ruleId').value = rule.id;
        getElement('ruleName').value = rule.rule_name || '';
        getElement('ruleMinAmount').value = rule.min_order_amount || 0;
        getElement('ruleRegions').value = rule.applies_to_regions || '';
        getElement('ruleZones').value = rule.applies_to_zones || '';
        getElement('ruleStartDate').value = rule.start_date ? rule.start_date.split('T')[0] : '';
        getElement('ruleEndDate').value = rule.end_date ? rule.end_date.split('T')[0] : '';
        getElement('ruleActive').checked = rule.is_active === 1 || rule.is_active === true;
    }

    function editRule(ruleId) {
        const rule = allRules.find((item) => item.id === Number(ruleId));
        if (!rule) {
            return;
        }
        const modalTitle = getElement('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Editar Regla de Envío Gratis';
        }
        populateForm(rule);
        const modal = getElement('ruleModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    async function deleteRule(ruleId) {
        if (!ruleId) {
            return;
        }
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar reglas. Los cambios solo se aplican en entorno local con backend.');
            }
            return;
        }
        
        const confirmed = typeof notify !== 'undefined' && typeof notify.confirmDelete === 'function'
            ? await notify.confirmDelete('esta regla')
            : window.confirm('¿Eliminar esta regla?');
        if (!confirmed) {
            return;
        }
        try {
            await apiClient.request(`/free-shipping-rules/${ruleId}`, { method: 'DELETE' });
            if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                notify.success('Regla eliminada exitosamente');
            }
            await loadRules();
        } catch (error) {
            console.error('Error eliminando regla:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al eliminar regla: ' + (error.message || 'Error desconocido'));
            }
        }
    }

    async function saveRule(event) {
        event.preventDefault();
        
        // Si no hay backend, mostrar mensaje de modo QA
        if (!apiClient.baseURL) {
            if (typeof notify !== 'undefined' && typeof notify.warning === 'function') {
                notify.warning('⚠️ Modo QA: No se pueden modificar reglas. Los cambios solo se aplican en entorno local con backend.');
            }
            closeModal();
            return;
        }
        
        const id = getElement('ruleId').value;
        const payload = {
            rule_name: getElement('ruleName').value,
            min_order_amount: Number(getElement('ruleMinAmount').value || 0),
            applies_to_regions: getElement('ruleRegions').value || null,
            applies_to_zones: getElement('ruleZones').value || null,
            start_date: getElement('ruleStartDate').value || null,
            end_date: getElement('ruleEndDate').value || null,
            is_active: getElement('ruleActive').checked
        };

        try {
            if (id) {
                await apiClient.request(`/free-shipping-rules/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Regla actualizada exitosamente');
                }
            } else {
                await apiClient.request('/free-shipping-rules', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                if (typeof notify !== 'undefined' && typeof notify.success === 'function') {
                    notify.success('Regla creada exitosamente');
                }
            }
            closeModal();
            await loadRules();
        } catch (error) {
            console.error('Error guardando regla:', error);
            if (typeof notify !== 'undefined' && typeof notify.error === 'function') {
                notify.error('Error al guardar regla: ' + (error.message || 'Error desconocido'));
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
                case 'edit-rule':
                    event.preventDefault();
                    editRule(actionNode.dataset.ruleId);
                    break;
                case 'delete-rule':
                    event.preventDefault();
                    deleteRule(actionNode.dataset.ruleId);
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
                const modal = getElement('ruleModal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            }
        });

        const form = getElement('ruleForm');
        if (form) {
            form.addEventListener('submit', saveRule);
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
        await loadRules();
    });
})();
