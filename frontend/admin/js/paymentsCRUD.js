// ============================================
// CRUD Y ACCIONES PARA SISTEMA DE PAGOS
// ============================================

// ============================================
// PROVEEDORES DE PAGO
// ============================================

async function openCreateProviderModal() {
    const modalHTML = `
        <div id="providerModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeProviderModal(event)">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Nuevo Proveedor de Pago</h2>
                        <button onclick="closeProviderModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <form id="providerForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                            <input type="text" id="providerName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Clave del Proveedor *</label>
                            <input type="text" id="providerKey" required class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Canal</label>
                            <select id="providerChannel" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="web">Web</option>
                                <option value="mobile">Mobile</option>
                                <option value="pos">POS</option>
                            </select>
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="providerIsActive" checked class="mr-2">
                                <span class="text-sm font-semibold text-gray-700">Activo</span>
                            </label>
                        </div>
                        <div class="flex gap-2 pt-4">
                            <button type="submit" class="admin-btn admin-btn--accent flex-1">Guardar</button>
                            <button type="button" onclick="closeProviderModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('providerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePaymentProvider();
    });
}

async function editPaymentProvider(id) {
    try {
        const response = await api.get(`/payment-providers/${id}`);
        const provider = response.data;
        
        const modalHTML = `
            <div id="providerModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeProviderModal(event)">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Editar Proveedor</h2>
                            <button onclick="closeProviderModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="providerForm" class="space-y-4">
                            <input type="hidden" id="providerId" value="${provider.id}">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                <input type="text" id="providerName" required value="${provider.name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Clave del Proveedor *</label>
                                <input type="text" id="providerKey" required value="${provider.provider_key}" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Canal</label>
                                <select id="providerChannel" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="web" ${provider.channel === 'web' ? 'selected' : ''}>Web</option>
                                    <option value="mobile" ${provider.channel === 'mobile' ? 'selected' : ''}>Mobile</option>
                                    <option value="pos" ${provider.channel === 'pos' ? 'selected' : ''}>POS</option>
                                </select>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="providerIsActive" ${provider.is_active ? 'checked' : ''} class="mr-2">
                                    <span class="text-sm font-semibold text-gray-700">Activo</span>
                                </label>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--accent flex-1">Guardar</button>
                                <button type="button" onclick="closeProviderModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('providerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePaymentProvider(provider.id);
        });
    } catch (error) {
        showNotification('Error al cargar proveedor: ' + error.message, 'error');
    }
}

async function savePaymentProvider(id = null) {
    try {
        const data = {
            name: document.getElementById('providerName').value,
            provider_key: document.getElementById('providerKey').value,
            channel: document.getElementById('providerChannel').value,
            is_active: document.getElementById('providerIsActive').checked ? 1 : 0
        };
        
        if (id) {
            await api.patch(`/payment-providers/${id}`, data);
            showNotification('Proveedor actualizado', 'success');
        } else {
            await api.post('/payment-providers', data);
            showNotification('Proveedor creado', 'success');
        }
        
        closeProviderModal();
        loadPaymentProviders();
    } catch (error) {
        showNotification('Error al guardar: ' + error.message, 'error');
    }
}

async function deletePaymentProvider(id) {
    if (!await showConfirm('¿Eliminar este proveedor?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.delete(`/payment-providers/${id}`);
        showNotification('Proveedor eliminado', 'success');
        loadPaymentProviders();
    } catch (error) {
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
}

function closeProviderModal(event) {
    if (event && event.target.id !== 'providerModal') return;
    const modal = document.getElementById('providerModal');
    if (modal) modal.remove();
}

// ============================================
// MÉTODOS DE PAGO
// ============================================

async function openCreatePaymentMethodModal() {
    try {
        const providersResponse = await api.get('/payment-providers');
        const providers = providersResponse.data || [];
        
        const modalHTML = `
            <div id="methodModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeMethodModal(event)">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Nuevo Método de Pago</h2>
                            <button onclick="closeMethodModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="methodForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                <input type="text" id="methodName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                                <select id="methodProviderId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin proveedor</option>
                                    ${providers.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Canal</label>
                                <select id="methodChannel" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="web">Web</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="pos">POS</option>
                                </select>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="methodIsActive" checked class="mr-2">
                                    <span class="text-sm font-semibold text-gray-700">Activo</span>
                                </label>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--primary flex-1">Guardar</button>
                                <button type="button" onclick="closeMethodModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('methodForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePaymentMethod();
        });
    } catch (error) {
        showNotification('Error al cargar proveedores: ' + error.message, 'error');
    }
}

async function editPaymentMethod(id) {
    try {
        const [methodResponse, providersResponse] = await Promise.all([
            api.get(`/payment-methods/${id}`),
            api.get('/payment-providers')
        ]);
        const method = methodResponse.data;
        const providers = providersResponse.data || [];
        
        const modalHTML = `
            <div id="methodModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeMethodModal(event)">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Editar Método</h2>
                            <button onclick="closeMethodModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="methodForm" class="space-y-4">
                            <input type="hidden" id="methodId" value="${method.id}">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                <input type="text" id="methodName" required value="${method.name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
                                <select id="methodProviderId" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="">Sin proveedor</option>
                                    ${providers.map(p => `<option value="${p.id}" ${method.provider_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Canal</label>
                                <select id="methodChannel" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="web" ${method.channel === 'web' ? 'selected' : ''}>Web</option>
                                    <option value="mobile" ${method.channel === 'mobile' ? 'selected' : ''}>Mobile</option>
                                    <option value="pos" ${method.channel === 'pos' ? 'selected' : ''}>POS</option>
                                </select>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="methodIsActive" ${method.is_active ? 'checked' : ''} class="mr-2">
                                    <span class="text-sm font-semibold text-gray-700">Activo</span>
                                </label>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--primary flex-1">Guardar</button>
                                <button type="button" onclick="closeMethodModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('methodForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePaymentMethod(method.id);
        });
    } catch (error) {
        showNotification('Error al cargar método: ' + error.message, 'error');
    }
}

async function savePaymentMethod(id = null) {
    try {
        const data = {
            name: document.getElementById('methodName').value,
            provider_id: document.getElementById('methodProviderId').value || null,
            channel: document.getElementById('methodChannel').value,
            is_active: document.getElementById('methodIsActive').checked ? 1 : 0
        };
        
        if (id) {
            await api.patch(`/payment-methods/${id}`, data);
            showNotification('Método actualizado', 'success');
        } else {
            await api.post('/payment-methods', data);
            showNotification('Método creado', 'success');
        }
        
        closeMethodModal();
        loadPaymentMethods();
    } catch (error) {
        showNotification('Error al guardar: ' + error.message, 'error');
    }
}

async function deletePaymentMethod(id) {
    if (!await showConfirm('¿Eliminar este método?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.delete(`/payment-methods/${id}`);
        showNotification('Método eliminado', 'success');
        loadPaymentMethods();
    } catch (error) {
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
}

function closeMethodModal(event) {
    if (event && event.target.id !== 'methodModal') return;
    const modal = document.getElementById('methodModal');
    if (modal) modal.remove();
}

// ============================================
// MOTIVOS DE REEMBOLSO
// ============================================

async function openCreateRefundReasonModal() {
    const modalHTML = `
        <div id="refundReasonModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeRefundReasonModal(event)">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex-shrink-0">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Nuevo Motivo de Reembolso</h2>
                        <button onclick="closeRefundReasonModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <form id="refundReasonForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
                            <input type="text" id="reasonCode" required class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                            <input type="text" id="reasonName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Orden</label>
                            <input type="number" id="reasonSortOrder" value="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="reasonIsActive" checked class="mr-2">
                                <span class="text-sm font-semibold text-gray-700">Activo</span>
                            </label>
                        </div>
                        <div class="flex gap-2 pt-4">
                            <button type="submit" class="admin-btn admin-btn--warning flex-1">Guardar</button>
                            <button type="button" onclick="closeRefundReasonModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                        </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--warning flex-1">Guardar</button>
                                <button type="button" onclick="closeRefundReasonModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('refundReasonForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRefundReason();
    });
}

async function editRefundReason(id) {
    try {
        const response = await api.get(`/refund-reasons/${id}`);
        const reason = response.data;
        
        const modalHTML = `
            <div id="refundReasonModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeRefundReasonModal(event)">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Editar Motivo</h2>
                            <button onclick="closeRefundReasonModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="refundReasonForm" class="space-y-4">
                            <input type="hidden" id="reasonId" value="${reason.id}">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
                                <input type="text" id="reasonCode" required value="${reason.code}" class="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                <input type="text" id="reasonName" required value="${reason.name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Orden</label>
                                <input type="number" id="reasonSortOrder" value="${reason.sort_order || 0}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="reasonIsActive" ${reason.is_active ? 'checked' : ''} class="mr-2">
                                    <span class="text-sm font-semibold text-gray-700">Activo</span>
                                </label>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--warning flex-1">Guardar</button>
                                <button type="button" onclick="closeRefundReasonModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                                <button type="submit" class="admin-btn admin-btn--warning flex-1">Guardar</button>
                                <button type="button" onclick="closeRefundReasonModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('refundReasonForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveRefundReason(reason.id);
        });
    } catch (error) {
        showNotification('Error al cargar motivo: ' + error.message, 'error');
    }
}

async function saveRefundReason(id = null) {
    try {
        const data = {
            code: document.getElementById('reasonCode').value,
            name: document.getElementById('reasonName').value,
            sort_order: parseInt(document.getElementById('reasonSortOrder').value) || 0,
            is_active: document.getElementById('reasonIsActive').checked ? 1 : 0
        };
        
        if (id) {
            await api.patch(`/refund-reasons/${id}`, data);
            showNotification('Motivo actualizado', 'success');
        } else {
            await api.post('/refund-reasons', data);
            showNotification('Motivo creado', 'success');
        }
        
        closeRefundReasonModal();
        loadRefundReasons();
    } catch (error) {
        showNotification('Error al guardar: ' + error.message, 'error');
    }
}

async function deleteRefundReason(id) {
    if (!await showConfirm('¿Eliminar este motivo?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.delete(`/refund-reasons/${id}`);
        showNotification('Motivo eliminado', 'success');
        loadRefundReasons();
    } catch (error) {
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
}

function closeRefundReasonModal(event) {
    if (event && event.target.id !== 'refundReasonModal') return;
    const modal = document.getElementById('refundReasonModal');
    if (modal) modal.remove();
}

// ============================================
// CAMPAÑAS DE GIFT CARDS
// ============================================

async function openCreateCampaignModal() {
    const modalHTML = `
        <div id="campaignModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeCampaignModal(event)">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex-shrink-0">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-white">Nueva Campaña de Gift Cards</h2>
                        <button onclick="closeCampaignModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <form id="campaignForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                            <input type="text" id="campaignName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                            <textarea id="campaignDescription" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                                <input type="date" id="campaignStartAt" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
                                <input type="date" id="campaignEndAt" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                        </div>
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" id="campaignIsActive" checked class="mr-2">
                                <span class="text-sm font-semibold text-gray-700">Activa</span>
                            </label>
                        </div>
                        <div class="flex gap-2 pt-4">
                            <button type="submit" class="admin-btn admin-btn--accent flex-1">Guardar</button>
                            <button type="button" onclick="closeCampaignModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('campaignForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGiftCardCampaign();
    });
}

async function editGiftCardCampaign(id) {
    try {
        const response = await api.get(`/gift-card-campaigns/${id}`);
        const campaign = response.data;
        
        const modalHTML = `
            <div id="campaignModal" class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onclick="closeCampaignModal(event)">
                <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex-shrink-0">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold text-white">Editar Campaña</h2>
                            <button onclick="closeCampaignModal()" class="text-white hover:text-red-200"><i class="fas fa-times text-2xl"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6">
                        <form id="campaignForm" class="space-y-4">
                            <input type="hidden" id="campaignId" value="${campaign.id}">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                <input type="text" id="campaignName" required value="${campaign.name}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                                <textarea id="campaignDescription" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg">${campaign.description || ''}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                                    <input type="date" id="campaignStartAt" value="${campaign.start_at ? campaign.start_at.split('T')[0] : ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
                                    <input type="date" id="campaignEndAt" value="${campaign.end_at ? campaign.end_at.split('T')[0] : ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="campaignIsActive" ${campaign.is_active ? 'checked' : ''} class="mr-2">
                                    <span class="text-sm font-semibold text-gray-700">Activa</span>
                                </label>
                            </div>
                            <div class="flex gap-2 pt-4">
                                <button type="submit" class="admin-btn admin-btn--accent flex-1">Guardar</button>
                                <button type="button" onclick="closeCampaignModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                                <button type="submit" class="admin-btn admin-btn--accent flex-1">Guardar</button>
                                <button type="button" onclick="closeCampaignModal()" class="admin-btn admin-btn--muted flex-1">Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('campaignForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveGiftCardCampaign(campaign.id);
        });
    } catch (error) {
        showNotification('Error al cargar campaña: ' + error.message, 'error');
    }
}

async function saveGiftCardCampaign(id = null) {
    try {
        const data = {
            name: document.getElementById('campaignName').value,
            description: document.getElementById('campaignDescription').value || null,
            start_at: document.getElementById('campaignStartAt').value || null,
            end_at: document.getElementById('campaignEndAt').value || null,
            is_active: document.getElementById('campaignIsActive').checked ? 1 : 0
        };
        
        if (id) {
            await api.patch(`/gift-card-campaigns/${id}`, data);
            showNotification('Campaña actualizada', 'success');
        } else {
            await api.post('/gift-card-campaigns', data);
            showNotification('Campaña creada', 'success');
        }
        
        closeCampaignModal();
        loadGiftCardCampaigns();
    } catch (error) {
        showNotification('Error al guardar: ' + error.message, 'error');
    }
}

async function deleteGiftCardCampaign(id) {
    if (!await showConfirm('¿Eliminar esta campaña?', 'Esta acción no se puede deshacer')) return;
    
    try {
        await api.delete(`/gift-card-campaigns/${id}`);
        showNotification('Campaña eliminada', 'success');
        loadGiftCardCampaigns();
    } catch (error) {
        showNotification('Error al eliminar: ' + error.message, 'error');
    }
}

function closeCampaignModal(event) {
    if (event && event.target.id !== 'campaignModal') return;
    const modal = document.getElementById('campaignModal');
    if (modal) modal.remove();
}







