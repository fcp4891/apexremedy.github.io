// ============================================
// USERS FORMS - Funciones de formularios de usuarios
// ============================================

let currentUserTab = 'customer';
let availableRoles = [];

// Cargar formulario de poder cultivo en el modal
async function loadPoderCultivoFormInModal() {
    try {
        const response = await fetch('../components/poder-cultivo-form.html');
        if (response.ok) {
            const html = await response.text();
            const container = document.getElementById('poderCultivoContainerModal');
            if (container) {
                container.innerHTML = html;
                // Ejecutar scripts del componente
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    if (oldScript.src) {
                        newScript.src = oldScript.src;
                    } else {
                        newScript.textContent = oldScript.textContent;
                    }
                    document.body.appendChild(newScript);
                    oldScript.remove();
                });
                // Inicializar el formulario
                if (window.initPoderCultivoForm) {
                    window.initPoderCultivoForm();
                }
            }
        }
    } catch (error) {
        console.error('Error cargando formulario de poder cultivo:', error);
    }
}

// Escuchar evento cuando se genera el documento en el modal
document.addEventListener('poderCultivoGenerated', function(event) {
    const { htmlBase64, fileName } = event.detail;
    
    // Guardar en el input hidden del modal
    const poderCultivoData = document.getElementById('poderCultivoData');
    const poderCultivoFileName = document.getElementById('poderCultivoFileName');
    
    if (poderCultivoData) poderCultivoData.value = htmlBase64;
    if (poderCultivoFileName) poderCultivoFileName.value = fileName;
    
    // Mostrar estado en el modal
    const statusDiv = document.getElementById('poderCultivoStatusModal');
    const fileNameDisplay = document.getElementById('poderCultivoFileNameDisplayModal');
    if (statusDiv) {
        statusDiv.classList.remove('hidden');
    }
    if (fileNameDisplay) {
        fileNameDisplay.textContent = `Archivo: ${fileName}`;
    }
    
    notify.success('Documento de cesión generado correctamente');
});

// Cargar roles disponibles para el selector
async function loadRolesForSelector() {
    try {
        const response = await api.request('/roles', { method: 'GET' });
        availableRoles = response.data.roles || [];
        
        const roleSelector = document.getElementById('userTypeSelect');
        const roleDescription = document.getElementById('roleDescription');
        
        if (availableRoles.length === 0) {
            roleSelector.innerHTML = '<option value="">No hay roles disponibles</option>';
            return;
        }
        
        // Ordenar roles: customer y admin primero, luego los demás
        const sortedRoles = [...availableRoles].sort((a, b) => {
            const order = { 'customer': 1, 'admin': 2 };
            const orderA = order[a.code] || 999;
            const orderB = order[b.code] || 999;
            return orderA - orderB;
        });
        
        roleSelector.innerHTML = sortedRoles.map(role => 
            `<option value="${role.code}" data-description="${role.description || ''}">${role.name}</option>`
        ).join('');
        
        // Establecer valor por defecto
        roleSelector.value = 'customer';
        updateRoleDescription();
        
    } catch (error) {
        console.error('Error cargando roles:', error);
        const roleSelector = document.getElementById('userTypeSelect');
        roleSelector.innerHTML = `
            <option value="customer">Cliente</option>
            <option value="admin">Administrador</option>
        `;
        notify.warning('No se pudieron cargar todos los roles. Usando roles por defecto.');
    }
}

function updateRoleDescription() {
    const roleSelector = document.getElementById('userTypeSelect');
    const roleDescription = document.getElementById('roleDescription');
    const selectedOption = roleSelector.options[roleSelector.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.description) {
        roleDescription.textContent = selectedOption.dataset.description || 'Selecciona el rol que tendrá el usuario en el sistema';
    } else {
        roleDescription.textContent = 'Selecciona el rol que tendrá el usuario en el sistema';
    }
}

// Abrir modal
function openAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
    // Cargar formulario de poder cultivo
    loadPoderCultivoFormInModal();
    // Cargar roles y resetear formulario
    loadRolesForSelector().then(() => {
        // Resetear selector de rol a customer por defecto
        const roleSelector = document.getElementById('userTypeSelect');
        if (roleSelector) {
            roleSelector.value = 'customer';
            updateRoleDescription();
            // Mostrar ambas pestañas inicialmente (se ocultarán según el rol)
            const tabCustomer = document.getElementById('tabCustomer');
            const tabAdmin = document.getElementById('tabAdmin');
            if (tabCustomer) tabCustomer.style.display = 'flex';
            if (tabAdmin) tabAdmin.style.display = 'flex';
            // Actualizar pestañas según el rol por defecto
            handleRoleChange();
        } else {
            switchUserTab('customer'); // Fallback si no hay selector
        }
    });
}

// Cerrar modal
function closeAddUserModal() {
    document.getElementById('addUserModal').classList.add('hidden');
    // Limpiar formularios
    document.getElementById('addCustomerForm').reset();
    document.getElementById('addAdminForm').reset();
    // Limpiar documentos
    clearAllDocuments();
}

// Manejar cambio de rol
function handleRoleChange() {
    const roleSelector = document.getElementById('userTypeSelect');
    const selectedRole = roleSelector.value;
    const selectedOption = roleSelector.options[roleSelector.selectedIndex];
    const roleName = selectedOption ? selectedOption.text : selectedRole;
    
    // Actualizar descripción
    updateRoleDescription();
    
    // Determinar qué formulario mostrar según el rol
    // Roles que requieren documentos (customer y similares)
    const rolesRequiringDocuments = ['customer'];
    
    // Roles administrativos (admin, manager, pharmacist, gerente, etc.)
    const adminRoles = ['admin', 'super_admin', 'manager', 'pharmacist', 'gerente'];
    
    // Obtener icono según el rol
    const roleIcon = getRoleIcon(selectedRole);
    
    // Obtener referencias a las pestañas
    const tabCustomer = document.getElementById('tabCustomer');
    const tabAdmin = document.getElementById('tabAdmin');
    
    if (rolesRequiringDocuments.includes(selectedRole)) {
        // Usar pestaña de cliente - OCULTAR pestaña de admin
        if (tabAdmin) tabAdmin.style.display = 'none';
        if (tabCustomer) tabCustomer.style.display = 'flex';
        
        switchUserTab('customer');
        updateTabLabel('tabCustomer', roleName, roleIcon);
        // Mostrar sección de documentos
        const documentsSection = document.querySelector('#addCustomerForm .space-y-6 > div:last-child');
        if (documentsSection) {
            documentsSection.style.display = 'block';
        }
    } else {
        // Usar pestaña de admin - OCULTAR pestaña de cliente
        if (tabCustomer) tabCustomer.style.display = 'none';
        if (tabAdmin) tabAdmin.style.display = 'flex';
        
        switchUserTab('admin');
        updateTabLabel('tabAdmin', roleName, roleIcon);
        // Ocultar sección de documentos si existe en formulario admin
    }
    
    // Actualizar nota según el rol
    updateRoleNote(selectedRole, roleName);
    
    // Ajustar campos requeridos según el rol
    adjustFormFieldsForRole(selectedRole);
    
    // Validar permisos del rol
    validateRolePermissions(selectedRole);
}

// Obtener icono según el rol
function getRoleIcon(roleCode) {
    const iconMap = {
        'customer': 'fa-user',
        'admin': 'fa-user-shield',
        'super_admin': 'fa-crown',
        'manager': 'fa-user-tie',
        'pharmacist': 'fa-user-md',
        'gerente': 'fa-user-tie',
        'vendedor': 'fa-user-tag',
        'almacen': 'fa-warehouse',
        'logistica': 'fa-truck'
    };
    return iconMap[roleCode] || 'fa-user-shield';
}

// Actualizar etiqueta de la pestaña
function updateTabLabel(tabId, roleName, iconClass) {
    const tab = document.getElementById(tabId);
    if (tab) {
        const icon = tab.querySelector('i');
        const label = tab.querySelector(`#${tabId}Label`);
        
        if (icon) {
            // Actualizar clase del icono
            icon.className = `fas ${iconClass} mr-2`;
        }
        
        if (label) {
            // Actualizar texto de la etiqueta
            label.textContent = roleName;
        } else {
            // Si no existe el span, crear uno o actualizar el texto directamente
            const textNode = Array.from(tab.childNodes).find(node => node.nodeType === 3);
            if (textNode) {
                textNode.textContent = roleName;
            }
        }
    }
}

// Ajustar campos del formulario según el rol
function adjustFormFieldsForRole(roleCode) {
    const role = availableRoles.find(r => r.code === roleCode);
    
    // Roles que requieren documentos
    const requiresDocuments = ['customer'];
    const requiresDocumentsSection = requiresDocuments.includes(roleCode);
    
    // Mostrar/ocultar sección de documentos en formulario de cliente
    const customerForm = document.getElementById('addCustomerForm');
    if (customerForm) {
        const allSections = customerForm.querySelectorAll('.space-y-6 > div');
        
        // Buscar la sección de documentos
        let documentsSection = null;
        for (let section of allSections) {
            const title = section.querySelector('h3');
            if (title && title.textContent.includes('Documentación')) {
                documentsSection = section;
                break;
            }
        }
        
        // Si no se encuentra por título, usar la última sección
        if (!documentsSection && allSections.length > 0) {
            documentsSection = allSections[allSections.length - 1];
        }
        
        if (documentsSection) {
            if (requiresDocumentsSection) {
                documentsSection.style.display = 'block';
                // Marcar documentos como requeridos
                const requiredDocs = documentsSection.querySelectorAll('input[type="file"]');
                requiredDocs.forEach(doc => {
                    doc.required = true;
                });
            } else {
                documentsSection.style.display = 'none';
                // Quitar requerido de documentos
                const requiredDocs = documentsSection.querySelectorAll('input[type="file"]');
                requiredDocs.forEach(doc => {
                    doc.required = false;
                });
            }
        }
    }
}

// Cambiar pestaña
function switchUserTab(tab) {
    currentUserTab = tab;
    
    // Actualizar botones de pestaña
    const tabCustomer = document.getElementById('tabCustomer');
    const tabAdmin = document.getElementById('tabAdmin');
    
    if (tab === 'customer') {
        tabCustomer.classList.add('border-green-600', 'text-gray-700');
        tabCustomer.classList.remove('border-transparent', 'text-gray-500');
        tabAdmin.classList.add('border-transparent', 'text-gray-500');
        tabAdmin.classList.remove('border-red-600', 'text-gray-700');
        
        document.getElementById('addCustomerForm').classList.remove('hidden');
        document.getElementById('addAdminForm').classList.add('hidden');
    } else {
        tabAdmin.classList.add('border-red-600', 'text-gray-700');
        tabAdmin.classList.remove('border-transparent', 'text-gray-500');
        tabCustomer.classList.add('border-transparent', 'text-gray-500');
        tabCustomer.classList.remove('border-green-600', 'text-gray-700');
        
        document.getElementById('addAdminForm').classList.remove('hidden');
        document.getElementById('addCustomerForm').classList.add('hidden');
    }
    
    // Actualizar las etiquetas de las pestañas según el rol seleccionado
    const roleSelector = document.getElementById('userTypeSelect');
    if (roleSelector && roleSelector.value) {
        const selectedRole = roleSelector.value;
        const selectedOption = roleSelector.options[roleSelector.selectedIndex];
        const roleName = selectedOption ? selectedOption.text : selectedRole;
        const roleIcon = getRoleIcon(selectedRole);
        
        // Actualizar la pestaña activa con el nombre del rol
        if (tab === 'customer') {
            updateTabLabel('tabCustomer', roleName, roleIcon);
            // Resetear la otra pestaña a su valor por defecto
            updateTabLabel('tabAdmin', 'Administrador', 'fa-user-shield');
        } else {
            updateTabLabel('tabAdmin', roleName, roleIcon);
            // Resetear la otra pestaña a su valor por defecto
            updateTabLabel('tabCustomer', 'Cliente', 'fa-user');
        }
    }
}

// Actualizar nota según el rol seleccionado
function updateRoleNote(roleCode, roleName) {
    // Buscar nota en formulario de admin
    let noteContainer = document.querySelector('#addAdminForm .text-red-800');
    
    // Si es cliente, buscar nota en formulario de cliente (si existe)
    if (roleCode === 'customer') {
        const customerNoteContainer = document.querySelector('#addCustomerForm .text-green-800, #addCustomerForm .text-blue-800, #addCustomerForm .text-gray-800');
        if (customerNoteContainer) {
            noteContainer = customerNoteContainer;
        }
    }
    
    if (!noteContainer) return;
    
    const noteTitle = noteContainer.querySelector('p.font-semibold');
    const noteList = noteContainer.querySelector('ul');
    
    if (!noteTitle || !noteList) return;
    
    // Definir notas según el rol
    const roleNotes = {
        'customer': {
            title: 'Nota sobre Clientes',
            items: [
                'Los clientes requieren aprobación antes de poder iniciar sesión',
                'Deben cargar documentos obligatorios (Receta Médica, Carnet, Certificado de Antecedentes, Poder de Cultivo)',
                'Tienen acceso limitado al panel de cliente para realizar compras',
                'Pueden ver su historial de pedidos y perfil personal'
            ]
        },
        'admin': {
            title: 'Nota sobre Administradores',
            items: [
                'Los administradores tienen acceso completo al panel de administración',
                'No requieren aprobación para iniciar sesión',
                'Pueden gestionar productos, pedidos y usuarios',
                'Tienen permisos para aprobar/rechazar cuentas de clientes'
            ]
        },
        'super_admin': {
            title: 'Nota sobre Super Administradores',
            items: [
                'Los super administradores tienen acceso total al sistema',
                'Pueden gestionar roles, permisos y configuraciones del sistema',
                'No requieren aprobación para iniciar sesión',
                'Tienen todos los permisos administrativos'
            ]
        },
        'manager': {
            title: 'Nota sobre Gerentes',
            items: [
                'Los gerentes tienen acceso al panel de administración',
                'Pueden gestionar productos, pedidos y usuarios',
                'No requieren aprobación para iniciar sesión',
                'Tienen permisos de gestión operativa'
            ]
        },
        'pharmacist': {
            title: 'Nota sobre Farmacéuticos',
            items: [
                'Los farmacéuticos tienen acceso al panel de administración',
                'Pueden gestionar productos y ver pedidos',
                'No requieren aprobación para iniciar sesión',
                'Tienen permisos relacionados con productos medicinales'
            ]
        },
        'gerente': {
            title: 'Nota sobre Gerentes',
            items: [
                'Los gerentes tienen acceso al panel de administración',
                'Pueden gestionar productos, pedidos y usuarios',
                'No requieren aprobación para iniciar sesión',
                'Tienen permisos de gestión operativa'
            ]
        }
    };
    
    // Obtener nota del rol o usar genérica
    const note = roleNotes[roleCode] || {
        title: `Nota sobre ${roleName}`,
        items: [
            `Los ${roleName.toLowerCase()} tienen acceso según sus permisos asignados`,
            'Los permisos específicos dependen de la configuración del rol',
            'Contacta al administrador para más información sobre permisos'
        ]
    };
    
    // Actualizar título
    noteTitle.textContent = note.title;
    
    // Actualizar lista
    noteList.innerHTML = note.items.map(item => `<li>• ${item}</li>`).join('');
}

// Validar permisos del rol
async function validateRolePermissions(roleCode) {
    try {
        // Buscar el rol en los roles disponibles
        const role = availableRoles.find(r => r.code === roleCode);
        
        if (!role) {
            console.warn(`⚠️ Rol ${roleCode} no encontrado en roles disponibles`);
            return;
        }
        
        // Verificar si el rol tiene permisos asociados
        if (!role.permissions || role.permissions.length === 0) {
            console.warn(`⚠️ El rol ${roleCode} no tiene permisos asociados`);
            
            // Mostrar advertencia visual si es necesario
            const roleDescription = document.getElementById('roleDescription');
            if (roleDescription) {
                const warningText = `⚠️ Este rol no tiene permisos configurados. Se recomienda configurar permisos antes de crear usuarios con este rol.`;
                if (!roleDescription.textContent.includes('⚠️')) {
                    roleDescription.textContent = warningText;
                    roleDescription.classList.add('text-yellow-600', 'font-semibold');
                }
            }
        } else {
            // Limpiar advertencia si el rol tiene permisos
            const roleDescription = document.getElementById('roleDescription');
            if (roleDescription && roleDescription.textContent.includes('⚠️')) {
                roleDescription.textContent = 'Selecciona el rol que tendrá el usuario en el sistema';
                roleDescription.classList.remove('text-yellow-600', 'font-semibold');
            }
            
            console.log(`✅ Rol ${roleCode} tiene ${role.permissions.length} permisos asociados:`, role.permissions);
        }
    } catch (error) {
        console.error('Error validando permisos del rol:', error);
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Manejar upload de documentos
function handleDocumentUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        notify.error('Formato no válido. Solo se permiten PDF, JPG y PNG');
        return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        notify.error('El archivo no debe superar 5MB');
        return;
    }

    // Leer como Base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        document.getElementById(`${type}Data`).value = base64;
        
        // Mostrar preview
        document.getElementById(`${type}PlaceholderContent`).classList.add('hidden');
        document.getElementById(`${type}PreviewContent`).classList.remove('hidden');
        document.getElementById(`${type}FileName`).textContent = file.name;
        document.getElementById(`${type}FileSize`).textContent = formatFileSize(file.size);
        
        notify.success(`${getDocumentName(type)} cargado correctamente`);
    };
    reader.readAsDataURL(file);
}

// Remover documento
function removeDocument(type) {
    // Solo eliminar documentos si estamos en el modal de agregar usuario
    // Verificar que el modal de agregar usuario esté visible antes de eliminar
    const addUserModal = document.getElementById('addUserModal');
    if (addUserModal && !addUserModal.classList.contains('hidden')) {
        const fileInput = document.getElementById(`${type}FileInput`);
        const dataInput = document.getElementById(`${type}Data`);
        const placeholder = document.getElementById(`${type}PlaceholderContent`);
        const preview = document.getElementById(`${type}PreviewContent`);
        
        if (fileInput) fileInput.value = '';
        if (dataInput) dataInput.value = '';
        if (placeholder) placeholder.classList.remove('hidden');
        if (preview) preview.classList.add('hidden');
        notify.info(`${getDocumentName(type)} eliminado`);
    }
}

// Limpiar todos los documentos
function clearAllDocuments() {
    ['receta', 'carnet', 'certificado'].forEach(type => {
        removeDocument(type);
    });
}

// Nombre del documento
function getDocumentName(type) {
    const names = {
        'receta': 'Receta Médica',
        'carnet': 'Carnet de Identidad',
        'certificado': 'Certificado de Antecedentes'
    };
    return names[type] || 'Documento';
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Exponer funciones globalmente
window.loadPoderCultivoFormInModal = loadPoderCultivoFormInModal;
window.loadRolesForSelector = loadRolesForSelector;
window.updateRoleDescription = updateRoleDescription;
window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.handleRoleChange = handleRoleChange;
window.getRoleIcon = getRoleIcon;
window.updateTabLabel = updateTabLabel;
window.adjustFormFieldsForRole = adjustFormFieldsForRole;
window.switchUserTab = switchUserTab;
window.togglePasswordVisibility = togglePasswordVisibility;
window.handleDocumentUpload = handleDocumentUpload;
window.removeDocument = removeDocument;
window.clearAllDocuments = clearAllDocuments;
window.getDocumentName = getDocumentName;
window.formatFileSize = formatFileSize;
window.currentUserTab = currentUserTab;
window.availableRoles = availableRoles;

// Configurar event listeners cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Nota: El evento 'change' para 'userTypeSelect' se maneja mediante event delegation en users-page.js
    // Nota: Los eventos 'change' para inputs de archivos se manejan mediante event delegation en users-page.js

    // Formulario de cliente
    const addCustomerForm = document.getElementById('addCustomerForm');
    if (addCustomerForm) {
        addCustomerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('customerName').value.trim();
            const email = document.getElementById('customerEmail').value.trim();
            const password = document.getElementById('customerPassword').value;
            const confirmPassword = document.getElementById('customerConfirmPassword').value;
            const phone = document.getElementById('customerPhone').value.trim();
            const rut = document.getElementById('customerRut').value.trim();
            
            // Obtener dirección (opcional)
            const addressLine1 = document.getElementById('customerAddressLine1')?.value.trim() || '';
            const addressType = document.getElementById('customerAddressType')?.value || '';
            const addressReference = document.getElementById('customerAddressReference')?.value.trim() || '';
            // Combinar tipo y referencia en addressLine2 si existe alguno
            let addressLine2 = '';
            if (addressType && addressReference) {
                addressLine2 = `${addressType} ${addressReference}`;
            } else if (addressType) {
                addressLine2 = addressType;
            } else if (addressReference) {
                addressLine2 = addressReference;
            }
            const commune = document.getElementById('customerCommune')?.value.trim() || '';
            const city = document.getElementById('customerCity')?.value.trim() || '';
            const region = document.getElementById('customerRegion')?.value.trim() || '';
            
            // Validaciones
            if (!name || !email || !password || !phone) {
                notify.error('Por favor completa todos los campos requeridos (nombre, email, teléfono y contraseña)');
                if (!phone) {
                    document.getElementById('customerPhone').focus();
                }
                return;
            }
            
            if (password.length < 6) {
                notify.error('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            if (password !== confirmPassword) {
                notify.error('Las contraseñas no coinciden');
                return;
            }
            
            // Obtener rol seleccionado
            const selectedRole = document.getElementById('userTypeSelect').value || 'customer';
            const rolesRequiringDocuments = ['customer'];
            
            let receta = '', carnet = '', certificado = '';
            
            if (rolesRequiringDocuments.includes(selectedRole)) {
                receta = document.getElementById('recetaData').value;
                carnet = document.getElementById('carnetData').value;
                certificado = document.getElementById('certificadoData').value;
                
                const poderCultivo = document.getElementById('poderCultivoData')?.value || '';
                if (!receta || !carnet || !certificado || !poderCultivo) {
                    notify.error('Debes cargar los 4 documentos requeridos para clientes (Receta Médica, Carnet de Identidad, Certificado de Antecedentes y Poder de Cultivo)');
                    return;
                }
            }
            
            // Separar nombre
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            try {
                // Crear usuario
                const selectedRole = document.getElementById('userTypeSelect').value || 'customer';
                
                // Roles que se aprueban automáticamente
                const autoApprovedRoles = ['admin', 'super_admin', 'manager', 'pharmacist'];
                
                const userData = {
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || undefined,
                    rut: rut || undefined,
                    role: selectedRole,
                    account_status: autoApprovedRoles.includes(selectedRole) ? 'approved' : 'pending'
                };
                
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
                
                const response = await window.api.createUser(userData);
                
                if (response.success) {
                    const userId = response.data.user.id;
                    
                    // Obtener poder de cultivo si existe
                    const poderCultivo = document.getElementById('poderCultivoData')?.value || '';
                    
                    // Guardar documentos solo si el rol lo requiere
                    if (rolesRequiringDocuments.includes(selectedRole) && receta && carnet && certificado && poderCultivo) {
                        const documentsData = [
                            {
                                document_type: 'receta_medica',
                                file_data: receta,
                                file_name: 'receta_medica.pdf'
                            },
                            {
                                document_type: 'carnet_identidad',
                                file_data: carnet,
                                file_name: 'carnet_identidad.pdf'
                            },
                            {
                                document_type: 'certificado_antecedentes',
                                file_data: certificado,
                                file_name: 'certificado_antecedentes.pdf'
                            },
                            {
                                document_type: 'poder_cultivo',
                                file_data: poderCultivo || '',
                                file_name: 'poder_cultivo.html'
                            }
                        ];
                        
                        await window.api.saveUserDocuments(userId, documentsData);
                    }
                    
                    // Guardar dirección si se proporcionó
                    if (addressLine1 && commune && city && region) {
                        try {
                            const addressData = {
                                full_name: name,
                                line1: addressLine1,
                                line2: addressLine2 || null,
                                commune: commune,
                                city: city,
                                region: region,
                                country: 'Chile',
                                phone: phone || undefined,
                                is_default_shipping: 1,
                                is_default_billing: 0
                            };
                            
                            // Necesitamos crear la dirección como admin
                            // Por ahora, solo intentamos si el usuario tiene permisos
                            // TODO: Implementar endpoint POST /api/admin/users/:id/addresses
                            console.log('📦 Dirección a guardar:', addressData);
                        } catch (addressError) {
                            console.warn('⚠️ No se pudo guardar la dirección:', addressError);
                            // No fallar la creación del usuario si falla la dirección
                        }
                    }
                    
                    const roleName = availableRoles.find(r => r.code === selectedRole)?.name || selectedRole;
                    notify.success(`${roleName} creado exitosamente`);
                    closeAddUserModal();
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    }
                } else {
                    throw new Error(response.message || 'Error al crear usuario');
                }
            } catch (error) {
                console.error('Error al crear cliente:', error);
                notify.error('Error al crear cliente: ' + error.message);
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus admin-btn__icon"></i>Crear Cliente';
            }
        });
    }

    // Formulario de administrador
    const addAdminForm = document.getElementById('addAdminForm');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('adminName').value.trim();
            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value;
            const confirmPassword = document.getElementById('adminConfirmPassword').value;
            const phone = document.getElementById('adminPhone').value.trim();
            
            // Validaciones
            if (!name || !email || !password) {
                notify.error('Por favor completa todos los campos requeridos');
                return;
            }
            
            if (password.length < 6) {
                notify.error('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            if (password !== confirmPassword) {
                notify.error('Las contraseñas no coinciden');
                return;
            }
            
            // Separar nombre
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            try {
                const selectedRole = document.getElementById('userTypeSelect').value || 'admin';
                
                // Roles que se aprueban automáticamente
                const autoApprovedRoles = ['admin', 'super_admin', 'manager', 'pharmacist'];
                
                const userData = {
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || undefined,
                    role: selectedRole,
                    account_status: autoApprovedRoles.includes(selectedRole) ? 'approved' : 'pending'
                };
                
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
                
                const response = await window.api.createUser(userData);
                
                if (response.success) {
                    const selectedRole = document.getElementById('userTypeSelect').value;
                    const roleName = availableRoles.find(r => r.code === selectedRole)?.name || selectedRole;
                    notify.success(`${roleName} creado exitosamente`);
                    closeAddUserModal();
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    }
                } else {
                    throw new Error(response.message || 'Error al crear usuario');
                }
            } catch (error) {
                console.error('Error al crear administrador:', error);
                notify.error('Error al crear administrador: ' + error.message);
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-shield mr-2"></i>Crear Administrador';
            }
        });
    }

    // Cerrar modal al hacer clic fuera
    const addUserModal = document.getElementById('addUserModal');
    if (addUserModal) {
        addUserModal.addEventListener('click', (e) => {
            if (e.target.id === 'addUserModal') {
                closeAddUserModal();
            }
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addUserModal && !addUserModal.classList.contains('hidden')) {
            closeAddUserModal();
        }
    });
});
