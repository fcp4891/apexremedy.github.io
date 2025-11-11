// ============================================
// USERS RBAC - Funciones de roles y permisos
// ============================================

// ============================================
// ROLES FUNCTIONS FOR USERS PAGE
// ============================================
async function loadRolesInUsers() {
    try {
        const response = await api.request('/roles', { method: 'GET' });
        const roles = response.data.roles || [];
        displayRolesInUsers(roles);
    } catch (error) {
        console.error('Error cargando roles:', error);
        document.getElementById('rolesListInUsers').innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Error cargando roles</p>
            </div>
        `;
    }
}

function displayRolesInUsers(roles) {
    const container = document.getElementById('rolesListInUsers');
    
    if (roles.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-user-shield text-3xl mb-2"></i>
                <p>No hay roles configurados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = roles.map(role => `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-bold text-gray-800">${role.name}</h4>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                            ${role.code}
                        </span>
                        <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ${role.permissions ? role.permissions.length : 0} permisos
                        </span>
                    </div>
                    <p class="text-sm text-gray-600">${role.description || 'Sin descripción'}</p>
                </div>
                <div class="flex gap-2">
                    <button data-action="edit-role" data-role-id="${role.id}" class="admin-btn admin-btn--accent admin-btn--compact">
                        <i class="fas fa-edit admin-btn__icon"></i>Editar
                    </button>
                    ${role.code !== 'super_admin' && role.code !== 'admin' && role.code !== 'customer' ? `
                        <button data-action="delete-role" data-role-id="${role.id}" class="admin-btn admin-btn--danger admin-btn--compact">
                            <i class="fas fa-trash admin-btn__icon"></i>Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function showRoleModalInUsers(roleId = null) {
    const modal = document.getElementById('roleModalInUsers');
    const form = document.getElementById('roleFormInUsers');
    
    if (!modal) {
        // Create modal if it doesn't exist
        createRoleModalInUsers();
        return showRoleModalInUsers(roleId);
    }
    
    if (roleId) {
        document.getElementById('roleModalTitleInUsers').textContent = 'Editar Rol';
        document.getElementById('roleIdInUsers').value = roleId;
    } else {
        document.getElementById('roleModalTitleInUsers').textContent = 'Nuevo Rol';
        document.getElementById('roleIdInUsers').value = '';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

function createRoleModalInUsers() {
    const modalHTML = `
        <div id="roleModalInUsers" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" data-action="close-modal-overlay">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-role="modal-content">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800" id="roleModalTitleInUsers">Nuevo Rol</h3>
                </div>
                <div class="p-6">
                    <form id="roleFormInUsers" data-action="save-role">
                        <input type="hidden" id="roleIdInUsers" value="">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Código</label>
                            <input type="text" id="roleCodeInUsers" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <p class="text-xs text-gray-500 mt-1">Ejemplo: manager, pharmacist</p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                            <input type="text" id="roleNameInUsers" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                            <textarea id="roleDescriptionInUsers" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" class="admin-btn admin-btn--muted admin-btn--compact" data-action="close-role-modal">
                                Cancelar
                            </button>
                            <button type="submit" class="admin-btn admin-btn--accent admin-btn--compact">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeRoleModalInUsers() {
    const modal = document.getElementById('roleModalInUsers');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function saveRoleInUsers(event) {
    event.preventDefault();
    const roleId = document.getElementById('roleIdInUsers').value;
    const code = document.getElementById('roleCodeInUsers').value;
    const name = document.getElementById('roleNameInUsers').value;
    const description = document.getElementById('roleDescriptionInUsers').value;
    
    try {
        if (roleId) {
            await api.request(`/roles/${roleId}`, { method: 'PUT', body: JSON.stringify({ name, description }) });
            notify.success('Rol actualizado exitosamente');
        } else {
            await api.request('/roles', { method: 'POST', body: JSON.stringify({ code, name, description }) });
            notify.success('Rol creado exitosamente');
        }
        
        closeRoleModalInUsers();
        loadRolesInUsers();
    } catch (error) {
        console.error('Error guardando rol:', error);
        notify.error(error.message || 'Error al guardar rol');
    }
}

async function editRoleInUsers(roleId) {
    try {
        const response = await api.request(`/roles/${roleId}`, { method: 'GET' });
        const role = response.data.role;
        
        document.getElementById('roleIdInUsers').value = role.id;
        document.getElementById('roleCodeInUsers').value = role.code;
        document.getElementById('roleCodeInUsers').disabled = true;
        document.getElementById('roleNameInUsers').value = role.name;
        document.getElementById('roleDescriptionInUsers').value = role.description || '';
        document.getElementById('roleModalTitleInUsers').textContent = 'Editar Rol';
        
        // Make sure modal exists first
        let modal = document.getElementById('roleModalInUsers');
        if (!modal) {
            createRoleModalInUsers();
            modal = document.getElementById('roleModalInUsers');
        }
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando rol:', error);
        notify.error('Error al cargar el rol');
    }
}

async function deleteRoleInUsers(roleId) {
    let confirmed = false;
    
    if (typeof notify !== 'undefined' && notify.confirmDelete) {
        confirmed = await notify.confirmDelete({
            title: '¿Eliminar rol?',
            message: '¿Estás seguro que deseas eliminar este rol? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    } else if (typeof notify !== 'undefined' && notify.confirm) {
        confirmed = await notify.confirm({
            title: '¿Eliminar rol?',
            message: '¿Estás seguro que deseas eliminar este rol? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    } else {
        confirmed = confirm('¿Estás seguro que deseas eliminar este rol?');
    }
    
    if (!confirmed) {
        return;
    }
    
    try {
        await api.request(`/roles/${roleId}`, { method: 'DELETE' });
        notify.success('Rol eliminado exitosamente');
        loadRolesInUsers();
    } catch (error) {
        console.error('Error eliminando rol:', error);
        notify.error(error.message || 'Error al eliminar rol');
    }
}

// ============================================
// PERMISSIONS FUNCTIONS FOR USERS PAGE
// ============================================
async function loadPermissionsInUsers() {
    try {
        const response = await api.request('/permissions', { method: 'GET' });
        const permissions = response.data.permissions || [];
        displayPermissionsInUsers(permissions);
    } catch (error) {
        console.error('Error cargando permisos:', error);
        document.getElementById('permissionsListInUsers').innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Error cargando permisos</p>
            </div>
        `;
    }
}

function displayPermissionsInUsers(permissions) {
    const container = document.getElementById('permissionsListInUsers');
    
    if (permissions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <i class="fas fa-key text-3xl mb-2"></i>
                <p>No hay permisos configurados</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = permissions.map(permission => `
        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h4 class="font-bold text-gray-800">${permission.code}</h4>
                        ${permission.module ? `
                            <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                                ${permission.module}
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-sm text-gray-600">${permission.description || 'Sin descripción'}</p>
                </div>
                <div class="flex gap-2">
                    <button data-action="edit-permission" data-permission-id="${permission.id}" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-edit mr-2"></i>Editar
                    </button>
                    <button data-action="delete-permission" data-permission-id="${permission.id}" class="admin-btn admin-btn--danger admin-btn--compact">
                        <i class="fas fa-trash admin-btn__icon"></i>Eliminar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showPermissionModalInUsers(permissionId = null) {
    const modal = document.getElementById('permissionModalInUsers');
    const form = document.getElementById('permissionFormInUsers');
    
    if (!modal) {
        createPermissionModalInUsers();
        return showPermissionModalInUsers(permissionId);
    }
    
    if (permissionId) {
        document.getElementById('permissionModalTitleInUsers').textContent = 'Editar Permiso';
        document.getElementById('permissionIdInUsers').value = permissionId;
    } else {
        document.getElementById('permissionModalTitleInUsers').textContent = 'Nuevo Permiso';
        document.getElementById('permissionIdInUsers').value = '';
        form.reset();
    }
    
    modal.classList.remove('hidden');
}

function createPermissionModalInUsers() {
    const modalHTML = `
        <div id="permissionModalInUsers" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" data-action="close-modal-overlay">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-role="modal-content">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800" id="permissionModalTitleInUsers">Nuevo Permiso</h3>
                </div>
                <div class="p-6">
                    <form id="permissionFormInUsers" data-action="save-permission">
                        <input type="hidden" id="permissionIdInUsers" value="">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Código</label>
                            <input type="text" id="permissionCodeInUsers" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-500 mt-1">Ejemplo: manage_products, view_orders</p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Módulo</label>
                            <input type="text" id="permissionModuleInUsers" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-500 mt-1">Ejemplo: Products, Orders, Users</p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                            <textarea id="permissionDescriptionInUsers" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" data-action="close-permission-modal">
                                Cancelar
                            </button>
                            <button type="submit" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePermissionModalInUsers() {
    const modal = document.getElementById('permissionModalInUsers');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function savePermissionInUsers(event) {
    event.preventDefault();
    const permissionId = document.getElementById('permissionIdInUsers').value;
    const code = document.getElementById('permissionCodeInUsers').value;
    const module = document.getElementById('permissionModuleInUsers').value;
    const description = document.getElementById('permissionDescriptionInUsers').value;
    
    try {
        if (permissionId) {
            await api.request(`/permissions/${permissionId}`, { method: 'PUT', body: JSON.stringify({ module, description }) });
            notify.success('Permiso actualizado exitosamente');
        } else {
            await api.request('/permissions', { method: 'POST', body: JSON.stringify({ code, module, description }) });
            notify.success('Permiso creado exitosamente');
        }
        
        closePermissionModalInUsers();
        loadPermissionsInUsers();
    } catch (error) {
        console.error('Error guardando permiso:', error);
        notify.error(error.message || 'Error al guardar permiso');
    }
}

async function editPermissionInUsers(permissionId) {
    try {
        const response = await api.request(`/permissions/${permissionId}`, { method: 'GET' });
        const permission = response.data.permission;
        
        document.getElementById('permissionIdInUsers').value = permission.id;
        document.getElementById('permissionCodeInUsers').value = permission.code;
        document.getElementById('permissionCodeInUsers').disabled = true;
        document.getElementById('permissionModuleInUsers').value = permission.module || '';
        document.getElementById('permissionDescriptionInUsers').value = permission.description || '';
        document.getElementById('permissionModalTitleInUsers').textContent = 'Editar Permiso';
        
        let modal = document.getElementById('permissionModalInUsers');
        if (!modal) {
            createPermissionModalInUsers();
            modal = document.getElementById('permissionModalInUsers');
        }
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando permiso:', error);
        notify.error('Error al cargar el permiso');
    }
}

async function deletePermissionInUsers(permissionId) {
    let confirmed = false;
    
    if (typeof notify !== 'undefined' && notify.confirmDelete) {
        confirmed = await notify.confirmDelete({
            title: '¿Eliminar permiso?',
            message: '¿Estás seguro que deseas eliminar este permiso? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    } else if (typeof notify !== 'undefined' && notify.confirm) {
        confirmed = await notify.confirm({
            title: '¿Eliminar permiso?',
            message: '¿Estás seguro que deseas eliminar este permiso? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar'
        });
    } else {
        confirmed = confirm('¿Estás seguro que deseas eliminar este permiso?');
    }
    
    if (!confirmed) {
        return;
    }
    
    try {
        await api.request(`/permissions/${permissionId}`, { method: 'DELETE' });
        notify.success('Permiso eliminado exitosamente');
        loadPermissionsInUsers();
    } catch (error) {
        console.error('Error eliminando permiso:', error);
        notify.error(error.message || 'Error al eliminar permiso');
    }
}

// TAB SWITCHING FUNCTIONS FOR USERS PAGE
function switchUsersTab(tabName) {
    console.log(`🔄 Cambiando a pestaña: ${tabName}`);
    
    // Hide all tab contents
    document.querySelectorAll('.users-tab-content').forEach(content => {
        content.classList.add('hidden');
        content.style.display = 'none'; // Forzar ocultamiento
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'border-green-600', 'text-green-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content PRIMERO y forzar visibilidad
    const selectedContent = document.getElementById('content-' + tabName);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        // Forzar display para asegurar visibilidad (block o el display original)
        selectedContent.style.display = 'block';
        console.log(`👁️ Mostrando contenido de pestaña: ${tabName}`);
        
        // Verificar que realmente está visible
        const computedStyle = window.getComputedStyle(selectedContent);
        console.log(`📊 Estado de visibilidad: display=${computedStyle.display}, visibility=${computedStyle.visibility}, hidden=${selectedContent.classList.contains('hidden')}`);
    }
    
    // Add active class to selected tab
    const selectedTab = document.getElementById('tab-' + (tabName === 'manage' ? 'manage-users' : 'rbac'));
    if (selectedTab) {
        selectedTab.classList.add('active', 'border-green-600', 'text-green-600');
        selectedTab.classList.remove('border-transparent', 'text-gray-500');
    }
    
    // Load data for RBAC tab
    if (tabName === 'rbac') {
        loadRolesInUsers();
        loadPermissionsInUsers();
    }
    
    // Load data for manage users tab - preservar datos y solo actualizar vista
    if (tabName === 'manage') {
        // Obtener referencias al contenedor y tabla
        const manageContent = document.getElementById('content-manage-users');
        const usersTable = document.getElementById('usersTable');
        
        if (!manageContent) {
            console.error('❌ No se encontró el contenedor content-manage-users');
            return;
        }
        
        if (!usersTable) {
            console.error('❌ No se encontró el elemento usersTable');
            return;
        }
        
        // Asegurar que el contenido esté visible ANTES de procesar datos
        manageContent.classList.remove('hidden');
        manageContent.style.display = 'block';
        
        // Verificar visibilidad después de forzar display
        const isVisible = !manageContent.classList.contains('hidden') && 
                         window.getComputedStyle(manageContent).display !== 'none';
        console.log(`👀 Contenedor visible después de forzar: ${isVisible}`);
        
        // Solo recargar desde API si no hay datos en memoria
        if (!window.allUsers || window.allUsers.length === 0) {
            console.log('📥 No hay datos en memoria, cargando desde API...');
            if (typeof window.loadUsers === 'function') {
                window.loadUsers();
            }
        } else {
            // Si ya hay datos, preservar filtros actuales y solo actualizar la vista
            console.log(`✅ Usando ${window.allUsers.length} usuarios en memoria`);
            
            // Asegurar que filteredUsers tenga datos válidos
            if (!window.filteredUsers || window.filteredUsers.length === 0) {
                window.filteredUsers = [...window.allUsers];
                console.log(`📊 Inicializando filteredUsers con ${window.filteredUsers.length} usuarios`);
            }
            
            console.log(`📊 Tenemos ${window.filteredUsers.length} usuarios filtrados para mostrar`);
            
            // Función para forzar el renderizado
            const forceRender = () => {
                // Verificar visibilidad real usando getComputedStyle
                const computedStyle = window.getComputedStyle(manageContent);
                const isContentVisible = computedStyle.display !== 'none' && 
                                        !manageContent.classList.contains('hidden');
                
                if (!isContentVisible) {
                    console.warn('⚠️ El contenedor está oculto, forzando visibilidad...');
                    manageContent.classList.remove('hidden');
                    manageContent.style.display = 'block';
                    // Verificar de nuevo
                    const newComputedStyle = window.getComputedStyle(manageContent);
                    if (newComputedStyle.display === 'none' || manageContent.classList.contains('hidden')) {
                        console.error('❌ No se pudo hacer visible el contenedor');
                        return false;
                    }
                    console.log('✅ Contenedor forzado a visible');
                }
                
                // Verificar que el tbody existe
                const tbody = document.getElementById('usersTable');
                if (!tbody) {
                    console.error('❌ usersTable no existe en el DOM');
                    return false;
                }
                
                // Verificar que tenemos datos
                if (!window.filteredUsers || window.filteredUsers.length === 0) {
                    console.warn('⚠️ No hay usuarios filtrados para renderizar');
                    return false;
                }
                
                console.log(`🔄 Forzando renderizado de ${window.filteredUsers.length} usuarios`);
                
                // Actualizar estadísticas
                if (typeof window.updateStats === 'function') {
                    window.updateStats();
                }
                
                // Renderizar usuarios
                if (typeof window.displayUsers === 'function') {
                    window.displayUsers();
                }
                
                // Verificar que se renderizó correctamente
                const rows = tbody.querySelectorAll('tr').length;
                
                // Verificar también que el contenedor padre esté visible
                const tableContainer = tbody.closest('.bg-white');
                const isTableVisible = tableContainer && !tableContainer.classList.contains('hidden');
                
                if (rows > 0) {
                    console.log(`✅ Renderizado exitoso: ${rows} filas, tabla visible: ${isTableVisible}`);
                    
                    // Si la tabla no está visible, forzar visibilidad
                    if (!isTableVisible && tableContainer) {
                        console.warn('⚠️ La tabla está oculta, forzando visibilidad');
                        tableContainer.classList.remove('hidden');
                        manageContent.classList.remove('hidden');
                    }
                    
                    return true;
                } else {
                    console.error('❌ ERROR: No se renderizaron filas');
                    return false;
                }
            };
            
            // Usar requestAnimationFrame doble para asegurar que el navegador procese el cambio de display
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Doble RAF para asegurar que el navegador haya procesado el cambio de display
                    if (!forceRender()) {
                        // Si falla, intentar de nuevo con un pequeño delay
                        setTimeout(() => {
                            forceRender();
                        }, 50);
                    }
                });
            });
        }
    }
}

// Exponer funciones globalmente
window.loadRolesInUsers = loadRolesInUsers;
window.displayRolesInUsers = displayRolesInUsers;
window.showRoleModalInUsers = showRoleModalInUsers;
window.createRoleModalInUsers = createRoleModalInUsers;
window.closeRoleModalInUsers = closeRoleModalInUsers;
window.saveRoleInUsers = saveRoleInUsers;
window.editRoleInUsers = editRoleInUsers;
window.deleteRoleInUsers = deleteRoleInUsers;
window.loadPermissionsInUsers = loadPermissionsInUsers;
window.displayPermissionsInUsers = displayPermissionsInUsers;
window.showPermissionModalInUsers = showPermissionModalInUsers;
window.createPermissionModalInUsers = createPermissionModalInUsers;
window.closePermissionModalInUsers = closePermissionModalInUsers;
window.savePermissionInUsers = savePermissionInUsers;
window.editPermissionInUsers = editPermissionInUsers;
window.deletePermissionInUsers = deletePermissionInUsers;
window.switchUsersTab = switchUsersTab;
