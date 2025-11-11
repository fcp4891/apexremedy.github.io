// ============================================
// USERS MAIN - Variables globales y funciones principales
// ============================================

// Variables globales
let allUsers = [];
let filteredUsers = [];
let allRoles = []; // Para almacenar todos los roles y mostrar nombres correctos

// Cargar todos los roles para tener los nombres disponibles
async function loadAllRoles() {
    try {
        const response = await api.request('/roles', { method: 'GET' });
        allRoles = response.data.roles || [];
    } catch (error) {
        console.error('Error cargando roles:', error);
        allRoles = [];
    }
}

// Obtener nombre del rol por código
function getRoleName(roleCode) {
    const role = allRoles.find(r => r.code === roleCode);
    return role ? role.name : (roleCode === 'admin' ? 'Admin' : roleCode === 'customer' ? 'Cliente' : roleCode);
}

// Obtener clase CSS para el badge del rol
function getRoleBadgeClass(roleCode) {
    if (roleCode === 'admin' || roleCode === 'super_admin') {
        return 'bg-purple-100 text-purple-800';
    } else if (roleCode === 'customer') {
        return 'bg-blue-100 text-blue-800';
    } else {
        return 'bg-green-100 text-green-800';
    }
}

// Cargar usuarios
async function loadUsers() {
    try {
        console.log('📥 Cargando usuarios...');
        console.log('🔍 API object:', window.api);
        
        // Asegurarse de que api está disponible
        if (typeof window.api === 'undefined') {
            console.error('❌ window.api no está definido');
            notify.error('Error: API no está disponible');
            return;
        }
        
        const response = await window.api.getUsers();
        
        console.log('📦 Respuesta del servidor:', response);
        
        if (response.success) {
            allUsers = response.data.users || [];
            console.log('👥 Usuarios obtenidos (raw):', allUsers);
            
            // 🔴 IMPORTANTE: Asegurarse de que todos tengan account_status
            allUsers = allUsers.map(user => {
                console.log('👤 Usuario sin procesar:', {
                    id: user.id,
                    name: user.name,
                    account_status: user.account_status,
                    is_forced_approval: user.is_forced_approval,
                    forced_approval: user.forced_approval
                });
                return {
                    ...user,
                    account_status: user.account_status || 'pending' // Default si no existe
                };
            });
            
            console.log('✅ Usuarios procesados:', allUsers);
            
            // Verificar usuarios con aprobación forzada
            const forcedUsers = allUsers.filter(u => u.is_forced_approval || u.forced_approval);
            if (forcedUsers.length > 0) {
                console.log('🔔 Usuarios con aprobación forzada:', forcedUsers);
            }
            
            // Preservar filtros actuales si existen, de lo contrario usar todos los usuarios
            const searchInput = document.getElementById('searchInput');
            const statusFilter = document.getElementById('statusFilter');
            const roleFilter = document.getElementById('roleFilter');
            
            const currentSearch = searchInput ? searchInput.value.toLowerCase() : '';
            const currentStatus = statusFilter ? statusFilter.value : '';
            const currentRole = roleFilter ? roleFilter.value : '';
            
            // Si hay filtros activos, aplicarlos; si no, mostrar todos
            if (currentSearch || currentStatus || currentRole) {
                filteredUsers = allUsers.filter(user => {
                    const matchSearch = !currentSearch || 
                        user.name.toLowerCase().includes(currentSearch) || 
                        user.email.toLowerCase().includes(currentSearch);
                    const matchStatus = !currentStatus || user.account_status === currentStatus;
                    const matchRole = !currentRole || user.role === currentRole;
                    return matchSearch && matchStatus && matchRole;
                });
            } else {
                filteredUsers = [...allUsers];
            }
            
            updateStats();
            displayUsers();
            
            console.log(`✅ Usuarios cargados: ${allUsers.length} total, ${filteredUsers.length} filtrados`);
        } else {
            throw new Error(response.message || 'Error al cargar usuarios');
        }
    } catch (error) {
        console.error('❌ Error al cargar usuarios:', error);
        notify.error('Error al cargar usuarios: ' + error.message);
    }
}

// Actualizar estadísticas
function updateStats() {
    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('pendingUsers').textContent = allUsers.filter(u => u.account_status === 'pending').length;
    document.getElementById('approvedUsers').textContent = allUsers.filter(u => u.account_status === 'approved' || u.account_status === 'forced_approved').length;
    document.getElementById('rejectedUsers').textContent = allUsers.filter(u => u.account_status === 'rejected').length;
}

// Configurar filtros
async function setupFilters() {
    let searchTimeout;
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });

    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    // Cargar roles para el filtro
    await loadRolesForFilter();
    
    document.getElementById('roleFilter').addEventListener('change', applyFilters);
}

// Cargar roles para el filtro de la tabla
async function loadRolesForFilter() {
    try {
        const response = await api.request('/roles', { method: 'GET' });
        const roles = response.data.roles || [];
        
        const roleFilter = document.getElementById('roleFilter');
        
        if (roles.length === 0) {
            // Mantener opciones por defecto si no hay roles
            return;
        }
        
        // Ordenar roles: customer y admin primero
        const sortedRoles = [...roles].sort((a, b) => {
            const order = { 'customer': 1, 'admin': 2 };
            const orderA = order[a.code] || 999;
            const orderB = order[b.code] || 999;
            return orderA - orderB;
        });
        
        // Mantener "Todos los roles" y agregar todos los roles disponibles
        roleFilter.innerHTML = '<option value="">Todos los roles</option>' + 
            sortedRoles.map(role => 
                `<option value="${role.code}">${role.name}</option>`
            ).join('');
            
    } catch (error) {
        console.error('Error cargando roles para filtro:', error);
        // Mantener opciones por defecto en caso de error
    }
}

// Aplicar filtros
function applyFilters() {
    // Verificar que tenemos datos antes de filtrar
    if (!allUsers || allUsers.length === 0) {
        console.warn('⚠️ No hay usuarios en memoria para filtrar');
        // Si no hay datos, cargar desde la API
        loadUsers();
        return;
    }
    
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const role = document.getElementById('roleFilter').value;

    filteredUsers = allUsers.filter(user => {
        const matchSearch = !search || 
            user.name.toLowerCase().includes(search) || 
            user.email.toLowerCase().includes(search);
        const matchStatus = !status || user.account_status === status;
        const matchRole = !role || user.role === role;
        
        return matchSearch && matchStatus && matchRole;
    });

    // Asegurar que displayUsers se ejecute
    displayUsers();
}

// Mostrar usuarios
function displayUsers() {
    const tbody = document.getElementById('usersTable');
    
    if (!tbody) {
        console.error('❌ No se encontró el elemento usersTable');
        return;
    }
    
    // Verificar que tenemos datos
    if (!filteredUsers || filteredUsers.length === 0) {
        console.log('ℹ️ No hay usuarios filtrados para mostrar');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center">
                    <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <p class="text-xl text-gray-500">No se encontraron usuarios</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log(`🖨️ Renderizando ${filteredUsers.length} usuarios en la tabla`);
    
    // Generar el HTML de los usuarios
    const usersHTML = filteredUsers.map(user => {
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'forced_approved': 'bg-orange-100 text-orange-800',
            'rejected': 'bg-red-100 text-red-800'
        };

        const statusIcons = {
            'pending': 'fa-clock',
            'approved': 'fa-check-circle',
            'forced_approved': 'fa-exclamation-triangle',
            'rejected': 'fa-times-circle'
        };

        const statusLabels = {
            'pending': 'Pendiente',
            'approved': 'Aprobado',
            'forced_approved': 'Aprobado Forzosamente',
            'rejected': 'Rechazado'
        };
        
        // Debug: verificar flags de aprobación forzada
        const isForced = user.is_forced_approval || user.forced_approval;
        const isApproved = user.account_status === 'approved';
        if (isForced && isApproved) {
            console.log(`🔔 Usuario ${user.id} (${user.name}) tiene aprobación forzada`);
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">#${user.id}</td>
                <td class="px-6 py-4">
                    <div>
                        <p class="text-sm font-medium text-gray-900">${user.name}</p>
                        <p class="text-sm text-gray-500">${user.email}</p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">
                        ${user.phone ? `<p><i class="fas fa-phone mr-1"></i>${user.phone}</p>` : ''}
                        ${user.rut ? `<p class="text-gray-500"><i class="fas fa-id-card mr-1"></i>${user.rut}</p>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}">
                        ${getRoleName(user.role)}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${statusColors[user.account_status] || statusColors.pending}">
                            <i class="fas ${statusIcons[user.account_status] || statusIcons.pending} mr-1"></i>${statusLabels[user.account_status] || statusLabels.pending}
                        </span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                    ${new Date(user.created_at).toLocaleDateString('es-CL')}
                </td>
                <td class="px-6 py-4 text-sm">
                    <div class="flex gap-2">
                        ${user.role !== 'admin' ? `
                            <!-- Editar siempre visible -->
                            <button data-action="edit-user" data-user-id="${user.id}" class="admin-icon-btn admin-icon-btn--primary" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            
                            <!-- Ver documentos - siempre visible para clientes -->
                            <button data-action="view-documents" data-user-id="${user.id}" class="admin-icon-btn admin-icon-btn--primary" title="Ver documentos">
                                <i class="fas fa-file-alt"></i>
                            </button>
                            
                            ${user.account_status === 'pending' ? `
                                <button data-action="approve-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--success" title="Aprobar">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button data-action="reject-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--danger" title="Rechazar">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button data-action="delete-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--danger" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            
                            ${(user.account_status === 'approved' || user.account_status === 'forced_approved') ? `
                                <button data-action="reject-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--danger" title="Rechazar">
                                    <i class="fas fa-times"></i>
                                </button>
                                <button data-action="set-pending" data-user-id="${user.id}" class="admin-icon-btn admin-icon-btn--warning" title="Marcar como Pendiente">
                                    <i class="fas fa-clock"></i>
                                </button>
                                <button data-action="delete-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--danger" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                            
                            ${user.account_status === 'rejected' ? `
                                <button data-action="approve-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--success" title="Aprobar">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button data-action="set-pending" data-user-id="${user.id}" class="admin-icon-btn admin-icon-btn--warning" title="Marcar como Pendiente">
                                    <i class="fas fa-clock"></i>
                                </button>
                                <button data-action="delete-user" data-user-id="${user.id}" data-user-name="${(user.name || '').replace(/'/g, '&#39;')}" class="admin-icon-btn admin-icon-btn--danger" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        ` : `
                            <button data-action="edit-user" data-user-id="${user.id}" class="admin-icon-btn admin-icon-btn--primary" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Renderizar el HTML
    tbody.innerHTML = usersHTML;
    
    // Verificar que se renderizó correctamente
    const renderedRows = tbody.querySelectorAll('tr').length;
    console.log(`✅ Se renderizaron ${renderedRows} filas en la tabla`);
    
    if (renderedRows === 0 && filteredUsers.length > 0) {
        console.error('❌ ERROR: No se renderizaron filas aunque hay usuarios');
        console.error('filteredUsers:', filteredUsers);
        console.error('usersHTML length:', usersHTML.length);
    }
}

// Marcar usuario como pendiente
async function setUserPending(userId) {
    const confirmed = await notify.confirm({
        type: 'warning',
        icon: 'clock',
        title: '¿Marcar como pendiente?',
        message: 'El usuario volverá al estado de aprobación pendiente',
        confirmText: 'Sí, marcar como pendiente',
        cancelText: 'Cancelar',
        confirmClass: 'warning'
    });
    if (!confirmed) return;
    
    try {
        const response = await window.api.updateUser(userId, {
            account_status: 'pending'
        });

        if (response.success) {
            notify.success('Usuario marcado como pendiente');
            loadUsers();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        notify.error('Error al cambiar estado del usuario');
    }
}

// Eliminar usuario
async function deleteUser(userId, userName) {
    const confirmed = await notify.confirmDelete(`al usuario "${userName}"`);
    if (!confirmed) return;
    
    try {
        // ✅ USAR EL MÉTODO CORRECTO
        const response = await window.api.deleteUser(userId);

        if (response.success) {
            notify.success('Usuario eliminado');
            loadUsers();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        notify.error('Error al eliminar usuario');
    }
}

// Exponer funciones globalmente
window.allUsers = allUsers;
window.filteredUsers = filteredUsers;
window.allRoles = allRoles;
window.loadAllRoles = loadAllRoles;
window.getRoleName = getRoleName;
window.getRoleBadgeClass = getRoleBadgeClass;
window.loadUsers = loadUsers;
window.updateStats = updateStats;
window.setupFilters = setupFilters;
window.loadRolesForFilter = loadRolesForFilter;
window.applyFilters = applyFilters;
window.displayUsers = displayUsers;
window.setUserPending = setUserPending;
window.deleteUser = deleteUser;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
        return;
    }
    // Cargar roles primero para tener los nombres disponibles
    loadAllRoles().then(() => {
        loadUsers();
        setupFilters();
    });
});
