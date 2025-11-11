// ============================================
// USERS MODALS - Funciones de modales de usuarios
// ============================================

// Almacenar datos originales del usuario para comparar cambios
let originalUserData = null;

// Ver documentos
async function viewDocuments(userId) {
    // Guardar userId en scope superior para poder usarlo en el catch
    const savedUserId = userId;
    
    try {
        console.log('📄 Cargando documentos del usuario:', userId);
        
        // ✅ USAR EL MÉTODO CORRECTO
        const response = await window.api.getUserDocuments(userId);

        if (response.success) {
            const documents = response.data.documents || [];
            
            // Obtener información del usuario
            const userResponse = await window.api.request(`/users/${userId}`, { method: 'GET' });
            const user = userResponse.data.user;
            
            // Mapear documentos a formato esperado
            const documentsMap = {};
            const requiredDocuments = ['receta_medica', 'carnet_identidad', 'certificado_antecedentes', 'poder_cultivo'];
            const missingDocuments = [];
            
            // Función helper para preparar el data URI
            const prepareDataURI = (base64Data, mimeType) => {
                if (!base64Data) {
                    console.warn('⚠️ prepareDataURI: base64Data es null o undefined');
                    return null;
                }
                
                // Si el dato es muy pequeño, podría estar vacío o corrupto
                if (base64Data.length < 50) {
                    console.warn('⚠️ prepareDataURI: base64Data es muy pequeño:', base64Data.length, 'caracteres');
                    console.warn('   Contenido:', base64Data.substring(0, 100));
                }
                
                // Si ya tiene el prefijo data:, retornar tal cual
                if (base64Data.startsWith('data:')) {
                    return base64Data;
                }
                
                // Si no tiene prefijo, agregarlo
                const dataURI = `data:${mimeType || 'application/pdf'};base64,${base64Data}`;
                return dataURI;
            };
            
            documents.forEach(doc => {
                console.log('📄 Procesando documento:', {
                    type: doc.document_type,
                    mime_type: doc.mime_type,
                    has_data: !!doc.file_data,
                    data_length: doc.file_data ? doc.file_data.length : 0,
                    data_preview: doc.file_data ? doc.file_data.substring(0, 100) : 'null'
                });
                
                const base64Data = doc.file_data;
                const mimeType = doc.mime_type || 'application/pdf';
                
                // Para poder_cultivo, verificar si el contenido está vacío o solo tiene el prefijo
                if (doc.document_type === 'poder_cultivo') {
                    console.log('🔍 Analizando poder_cultivo:', {
                        raw_length: base64Data ? base64Data.length : 0,
                        starts_with_data: base64Data ? base64Data.startsWith('data:') : false,
                        starts_with_base64: base64Data ? /^[A-Za-z0-9+/=]/.test(base64Data) : false,
                        preview: base64Data ? base64Data.substring(0, 50) : 'null'
                    });
                    
                    // Si el documento es muy pequeño, podría estar vacío
                    if (!base64Data || base64Data.length < 100) {
                        console.warn('⚠️ Poder de cultivo parece estar vacío o incompleto');
                    }
                }
                
                const dataURI = prepareDataURI(base64Data, mimeType);
                
                if (doc.document_type === 'receta_medica') {
                    documentsMap.medical_prescription = dataURI;
                } else if (doc.document_type === 'carnet_identidad') {
                    documentsMap.id_card = dataURI;
                } else if (doc.document_type === 'certificado_antecedentes') {
                    documentsMap.background_check = dataURI;
                } else if (doc.document_type === 'poder_cultivo') {
                    documentsMap.cultivation_power = dataURI;
                    console.log('✅ Poder de cultivo mapeado:', {
                        has_data: !!dataURI,
                        data_length: dataURI ? dataURI.length : 0,
                        is_html: dataURI && (dataURI.includes('text/html') || dataURI.includes('html')),
                        preview: dataURI ? dataURI.substring(0, 100) : 'null'
                    });
                } else {
                    console.warn('⚠️ Tipo de documento desconocido:', doc.document_type);
                }
            });
            
            console.log('📊 Documentos mapeados:', {
                medical_prescription: !!documentsMap.medical_prescription,
                id_card: !!documentsMap.id_card,
                background_check: !!documentsMap.background_check,
                cultivation_power: !!documentsMap.cultivation_power
            });
            
            // Verificar documentos faltantes
            if (!documentsMap.medical_prescription) missingDocuments.push('Receta Médica');
            if (!documentsMap.id_card) missingDocuments.push('Carnet de Identidad');
            if (!documentsMap.background_check) missingDocuments.push('Certificado de Antecedentes');
            if (!documentsMap.cultivation_power) missingDocuments.push('Poder de Cultivo');
            
            const allDocumentsPresent = missingDocuments.length === 0;
            
            const content = document.getElementById('documentsContent');
            
            console.log('✅ Documentos recibidos:', {
                userId: userId,
                totalDocuments: documents.length,
                documentsMap
            });
            
            const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
            
            content.innerHTML = `
                <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 class="text-lg font-bold text-gray-800 mb-2">${userName}</h3>
                    <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-2"></i>${user.email}</p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                            user.account_status === 'forced_approved' ? 'bg-orange-100 text-orange-800' :
                            user.account_status === 'approved' ? 'bg-green-100 text-green-800' :
                            user.account_status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }">
                            ${user.account_status === 'forced_approved' ? 'Aprobado Forzosamente' :
                              user.account_status === 'approved' ? 'Aprobado' : 
                              user.account_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                        ${allDocumentsPresent ? 
                            '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Todos los Documentos</span>' : 
                            documents.length > 0 ?
                            '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800"><i class="fas fa-exclamation-triangle mr-1"></i>Documentos Incompletos</span>' :
                            '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800"><i class="fas fa-clock mr-1"></i>Sin Documentos</span>'
                        }
                    </div>
                    ${!allDocumentsPresent && missingDocuments.length > 0 ? `
                        <div class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p class="text-sm text-orange-800">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                <strong>Documentos faltantes:</strong> ${missingDocuments.join(', ')}
                            </p>
                        </div>
                    ` : ''}
                </div>

                <div class="space-y-4">
                    <!-- Receta Médica -->
                    <div class="border rounded-lg p-4 bg-white">
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-prescription text-green-600 text-xl"></i>
                            <span>1. Receta Médica</span>
                            ${!documentsMap.medical_prescription ? '<span class="text-xs text-red-600 ml-2">(No cargado)</span>' : '<span class="text-xs text-green-600 ml-2">(✓ Cargado)</span>'}
                        </h4>
                        ${documentsMap.medical_prescription ? 
                            `${documentsMap.medical_prescription.includes('application/pdf') || documentsMap.medical_prescription.includes('text/html') ?
                                `<iframe src="${documentsMap.medical_prescription}" class="w-full h-96 border rounded"></iframe>` :
                                `<img src="${documentsMap.medical_prescription}" class="max-w-full h-auto border rounded shadow-lg">`
                            }` :
                            '<div class="text-center py-8 bg-gray-50 rounded"><i class="fas fa-file-excel text-gray-300 text-5xl mb-3"></i><p class="text-gray-500">Documento no disponible</p></div>'
                        }
                    </div>

                    <!-- Carnet de Identidad -->
                    <div class="border rounded-lg p-4 bg-white">
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-id-card text-blue-600 text-xl"></i>
                            <span>2. Carnet de Identidad</span>
                            ${!documentsMap.id_card ? '<span class="text-xs text-red-600 ml-2">(No cargado)</span>' : '<span class="text-xs text-green-600 ml-2">(✓ Cargado)</span>'}
                        </h4>
                        ${documentsMap.id_card ? 
                            `${documentsMap.id_card.includes('application/pdf') || documentsMap.id_card.includes('text/html') ?
                                `<iframe src="${documentsMap.id_card}" class="w-full h-96 border rounded"></iframe>` :
                                `<img src="${documentsMap.id_card}" class="max-w-full h-auto border rounded shadow-lg">`
                            }` :
                            '<div class="text-center py-8 bg-gray-50 rounded"><i class="fas fa-id-card text-gray-300 text-5xl mb-3"></i><p class="text-gray-500">Documento no disponible</p></div>'
                        }
                    </div>

                    <!-- Certificado de Antecedentes -->
                    <div class="border rounded-lg p-4 bg-white">
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-certificate text-purple-600 text-xl"></i>
                            <span>3. Certificado de Antecedentes</span>
                            ${!documentsMap.background_check ? '<span class="text-xs text-red-600 ml-2">(No cargado)</span>' : '<span class="text-xs text-green-600 ml-2">(✓ Cargado)</span>'}
                        </h4>
                        ${documentsMap.background_check ? 
                            `${documentsMap.background_check.includes('application/pdf') || documentsMap.background_check.includes('text/html') ?
                                `<iframe src="${documentsMap.background_check}" class="w-full h-96 border rounded"></iframe>` :
                                `<img src="${documentsMap.background_check}" class="max-w-full h-auto border rounded shadow-lg">`
                            }` :
                            '<div class="text-center py-8 bg-gray-50 rounded"><i class="fas fa-certificate text-gray-300 text-5xl mb-3"></i><p class="text-gray-500">Documento no disponible</p></div>'
                        }
                    </div>

                    <!-- Poder de Cultivo -->
                    <div class="border rounded-lg p-4 bg-white">
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-seedling text-green-600 text-xl"></i>
                            <span>4. Poder de Cultivo</span>
                            ${!documentsMap.cultivation_power ? '<span class="text-xs text-red-600 ml-2">(No cargado)</span>' : '<span class="text-xs text-green-600 ml-2">(✓ Cargado)</span>'}
                        </h4>
                        ${documentsMap.cultivation_power ? 
                            (() => {
                                const powerData = documentsMap.cultivation_power;
                                const isHTML = powerData.includes('text/html') || powerData.includes('html');
                                const isPDF = powerData.includes('application/pdf');
                                
                                // Si es HTML, intentar decodificar y mostrar directamente
                                if (isHTML && powerData.length > 100) {
                                    try {
                                        // Extraer el base64 si tiene prefijo data:
                                        let base64Content = powerData;
                                        if (base64Content.includes(',')) {
                                            base64Content = base64Content.split(',')[1];
                                        }
                                        
                                        // Decodificar base64 a HTML
                                        const htmlContent = decodeURIComponent(escape(atob(base64Content)));
                                        
                                        // Mostrar HTML directamente en un div con srcdoc
                                        // Mejorar visualización: iframe más alto y mejor estilo
                                        return `<div class="border rounded p-4 bg-white">
                                            <iframe srcdoc='${htmlContent.replace(/'/g, "&#39;")}' 
                                                    class="w-full border rounded shadow-sm" 
                                                    style="min-height: 800px; height: auto;"
                                                    sandbox="allow-same-origin allow-scripts"></iframe>
                                        </div>`;
                                    } catch (error) {
                                        console.error('Error decodificando HTML:', error);
                                        // Si falla, intentar mostrar como data URI
                                        return `<iframe src="${powerData}" class="w-full h-96 border rounded" sandbox="allow-same-origin allow-scripts"></iframe>`;
                                    }
                                } else if (isPDF || isHTML) {
                                    return `<iframe src="${powerData}" 
                                                    class="w-full border rounded shadow-sm" 
                                                    style="min-height: 800px; height: auto;"
                                                    sandbox="allow-same-origin allow-scripts"></iframe>`;
                                } else {
                                    return `<img src="${powerData}" class="max-w-full h-auto border rounded shadow-lg">`;
                                }
                            })() :
                            '<div class="text-center py-8 bg-gray-50 rounded"><i class="fas fa-seedling text-gray-300 text-5xl mb-3"></i><p class="text-gray-500">Documento no disponible</p><p class="text-xs text-gray-400 mt-2">El poder de cultivo aún no ha sido generado o cargado</p></div>'
                        }
                    </div>
                </div>

                <!-- Botones de acción -->
                ${user.account_status === 'pending' ? `
                    <div class="mt-6 flex gap-3">
                        ${allDocumentsPresent ? `
                            <button data-action="approve-from-documents" data-user-id="${userId}" data-user-name="${(userName || '').replace(/'/g, '&#39;')}" data-forced="false" 
                                    class="admin-btn admin-btn--primary flex-1">
                                <i class="fas fa-check admin-btn__icon"></i>Aprobar Cuenta
                            </button>
                        ` : `
                            <button data-action="approve-from-documents" data-user-id="${userId}" data-user-name="${(userName || '').replace(/'/g, '&#39;')}" data-forced="true" 
                                    class="admin-btn admin-btn--warning flex-1">
                                <i class="fas fa-exclamation-triangle admin-btn__icon"></i>Aprobar Forzadamente
                            </button>
                        `}
                        <button data-action="reject-from-documents" data-user-id="${userId}" data-user-name="${(userName || '').replace(/'/g, '&#39;')}" 
                                class="admin-btn admin-btn--danger flex-1">
                            <i class="fas fa-times admin-btn__icon"></i>Rechazar Cuenta
                        </button>
                    </div>
                ` : ''}
            `;

            document.getElementById('documentsModal').classList.remove('hidden');
        } else {
            throw new Error(response.message || 'Error al cargar documentos');
        }
    } catch (error) {
        console.error('❌ Error al cargar documentos:', error);
        
        // Usar el userId guardado
        if (savedUserId) {
            try {
                const userResponse = await window.api.getUserById(savedUserId);
                if (userResponse.success) {
                    const user = userResponse.data.user;
                    const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                    
                    const content = document.getElementById('documentsContent');
                    content.innerHTML = `
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 class="text-lg font-bold text-gray-800 mb-2">${userName}</h3>
                            <p class="text-sm text-gray-600 mb-1"><i class="fas fa-envelope mr-2"></i>${user.email}</p>
                            <span class="px-3 py-1 text-xs font-semibold rounded-full ${
                                user.account_status === 'forced_approved' ? 'bg-orange-100 text-orange-800' :
                                user.account_status === 'approved' ? 'bg-green-100 text-green-800' :
                                user.account_status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                            }">
                                ${user.account_status === 'forced_approved' ? 'Aprobado Forzosamente' :
                                  user.account_status === 'approved' ? 'Aprobado' : 
                                  user.account_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                            </span>
                        </div>
                        
                        <div class="text-center py-12">
                            <i class="fas fa-exclamation-triangle text-5xl text-yellow-500 mb-4"></i>
                            <h3 class="text-xl font-bold text-gray-800 mb-2">No se encontraron documentos</h3>
                            <p class="text-gray-600 mb-6">
                                Este usuario no tiene documentos cargados o hubo un error al recuperarlos.
                            </p>
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                                <p class="text-sm text-yellow-800">
                                    <i class="fas fa-info-circle mr-2"></i>
                                    <strong>Estado:</strong> El usuario está marcado como <span class="font-semibold">Pendiente</span> 
                                    hasta que se carguen todos los documentos requeridos (Receta Médica, Carnet de Identidad, Certificado de Antecedentes y Poder de Cultivo).
                                </p>
                            </div>
                        </div>
                        
                        ${user.account_status === 'pending' ? `
                            <div class="mt-6 flex gap-3">
                                <button data-action="approve-from-documents" data-user-id="${savedUserId}" data-user-name="${(userName || '').replace(/'/g, '&#39;')}" data-forced="true" 
                                        class="admin-btn admin-btn--warning flex-1">
                                    <i class="fas fa-exclamation-triangle admin-btn__icon"></i>Aprobar Forzadamente
                                </button>
                                <button data-action="reject-from-documents" data-user-id="${savedUserId}" data-user-name="${(userName || '').replace(/'/g, '&#39;')}" 
                                        class="admin-btn admin-btn--danger flex-1">
                                    <i class="fas fa-times admin-btn__icon"></i>Rechazar Cuenta
                                </button>
                            </div>
                        ` : ''}
                    `;
                    
                    document.getElementById('documentsModal').classList.remove('hidden');
                    return;
                }
            } catch (userError) {
                console.error('Error al obtener información del usuario:', userError);
            }
        }
        
        notify.error('Error al cargar documentos: ' + (error.message || 'Error desconocido'));
    }
}

function closeDocumentsModal() {
    document.getElementById('documentsModal').classList.add('hidden');
}

// Aprobar usuario
function openApproveModal(userId, userName, isForced = false) {
    document.getElementById('approveUserId').value = userId;
    document.getElementById('approveUserName').textContent = userName;
    
    // Si es forzada, marcar el checkbox
    const forceCheckbox = document.getElementById('forceApprove');
    forceCheckbox.checked = isForced;
    toggleForceApproveNotes();
    
    document.getElementById('approveModal').classList.remove('hidden');
}

function toggleForceApproveNotes() {
    const forceCheckbox = document.getElementById('forceApprove');
    const notesTextarea = document.getElementById('approveNotes');
    const notesRequired = document.getElementById('approveNotesRequired');
    const notesHelper = document.getElementById('approveNotesHelper');
    
    if (forceCheckbox.checked) {
        // Aprobación forzada - notas obligatorias
        notesTextarea.required = true;
        notesRequired.classList.remove('hidden');
        notesHelper.textContent = 'Las notas son obligatorias para aprobaciones forzadas. Explica el motivo de la aprobación.';
        notesHelper.classList.remove('text-gray-500');
        notesHelper.classList.add('text-orange-600', 'font-medium');
        notesTextarea.classList.add('border-orange-300');
        notesTextarea.classList.remove('border-gray-300');
    } else {
        // Aprobación normal - notas opcionales
        notesTextarea.required = false;
        notesRequired.classList.add('hidden');
        notesHelper.textContent = 'Notas opcionales para la aprobación estándar.';
        notesHelper.classList.remove('text-orange-600', 'font-medium');
        notesHelper.classList.add('text-gray-500');
        notesTextarea.classList.remove('border-orange-300');
        notesTextarea.classList.add('border-gray-300');
    }
}

function closeApproveModal() {
    document.getElementById('approveModal').classList.add('hidden');
    document.getElementById('approveForm').reset();
}

// Rechazar usuario
function openRejectModal(userId, userName) {
    document.getElementById('rejectUserId').value = userId;
    document.getElementById('rejectUserName').textContent = userName;
    document.getElementById('rejectModal').classList.remove('hidden');
}

function closeRejectModal() {
    document.getElementById('rejectModal').classList.add('hidden');
    document.getElementById('rejectForm').reset();
}

// Abrir modal de edición
async function openEditModal(userId) {
    try {
        // ✅ USAR EL NUEVO MÉTODO
        const response = await window.api.getUserById(userId);

        if (response.success) {
            const user = response.data.user;
            
            // Guardar datos originales para comparar cambios
            originalUserData = {
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                rut: user.rut || '',
                role: user.role || 'customer',
                account_status: user.account_status || 'pending'
            };
            
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editName').value = user.name;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editPhone').value = user.phone || '';
            document.getElementById('editRut').value = user.rut || '';
            
            // Cargar roles en el selector de edición
            await loadRolesForEdit();
            document.getElementById('editRole').value = user.role;
            
            // Establecer el estado desde la base de datos (no valores hardcodeados)
            const accountStatus = user.account_status || 'pending';
            console.log('📊 Estado del usuario desde BD:', accountStatus);
            document.getElementById('editAccountStatus').value = accountStatus;
            
            // Verificar que el estado existe en el selector
            const statusSelect = document.getElementById('editAccountStatus');
            const optionExists = Array.from(statusSelect.options).some(opt => opt.value === accountStatus);
            if (!optionExists && accountStatus !== 'pending') {
                console.warn(`⚠️ Estado "${accountStatus}" no existe en el selector, agregando...`);
                const option = document.createElement('option');
                option.value = accountStatus;
                option.textContent = accountStatus === 'forced_approved' ? 'Aprobado Forzosamente' : accountStatus;
                statusSelect.appendChild(option);
            }
            
            // Cargar direcciones del usuario
            await loadUserAddresses(user.id);
            
            document.getElementById('editModal').classList.remove('hidden');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
        notify.error('Error al cargar datos del usuario');
    }
}

// Cargar direcciones del usuario para el modal de edición
async function loadUserAddresses(userId) {
    try {
        const addressesList = document.getElementById('editAddressesList');
        addressesList.innerHTML = '<p class="text-sm text-gray-500">Cargando direcciones...</p>';
        
        // Intentar obtener direcciones del usuario
        // Por ahora, mostramos un mensaje indicando que el usuario no tiene direcciones
        // TODO: Implementar endpoint GET /api/admin/users/:id/addresses cuando sea necesario
        setTimeout(() => {
            addressesList.innerHTML = `
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-600 flex items-center gap-2 mb-2">
                        <i class="fas fa-map-marker-alt text-gray-400"></i>
                        Direcciones registradas
                    </p>
                    <p class="text-xs text-gray-500">
                        <span class="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                            <i class="fas fa-exclamation-triangle mr-1"></i>Sin direcciones registradas
                        </span>
                    </p>
                </div>
            `;
        }, 300);
        
    } catch (error) {
        console.error('Error cargando direcciones:', error);
        const addressesList = document.getElementById('editAddressesList');
        addressesList.innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p class="text-sm text-gray-600 flex items-center gap-2">
                    <i class="fas fa-exclamation-triangle text-yellow-500"></i>
                    No se pudieron cargar las direcciones
                </p>
                <p class="text-xs text-gray-500 mt-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-1"></i>Sin direcciones registradas
                    </span>
                </p>
            </div>
        `;
    }
}

// Cargar roles para el selector de edición
async function loadRolesForEdit() {
    try {
        const response = await api.request('/roles', { method: 'GET' });
        const roles = response.data.roles || [];
        
        const roleSelector = document.getElementById('editRole');
        
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
        
        roleSelector.innerHTML = sortedRoles.map(role => 
            `<option value="${role.code}">${role.name}</option>`
        ).join('');
            
    } catch (error) {
        console.error('Error cargando roles para edición:', error);
        // Mantener opciones por defecto en caso de error
    }
}

// Cerrar modal de edición
function closeEditModal() {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    
    if (editModal) {
        editModal.classList.add('hidden');
    }
    
    // Solo resetear el formulario de edición, no afectar otros formularios
    if (editForm) {
        editForm.reset();
    }
    
    originalUserData = null; // Limpiar datos originales
}

// Exponer funciones globalmente
window.viewDocuments = viewDocuments;
window.closeDocumentsModal = closeDocumentsModal;
window.openApproveModal = openApproveModal;
window.toggleForceApproveNotes = toggleForceApproveNotes;
window.closeApproveModal = closeApproveModal;
window.openRejectModal = openRejectModal;
window.closeRejectModal = closeRejectModal;
window.openEditModal = openEditModal;
window.loadUserAddresses = loadUserAddresses;
window.loadRolesForEdit = loadRolesForEdit;
window.closeEditModal = closeEditModal;
window.originalUserData = originalUserData;

// Configurar event listeners para formularios cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Formulario de aprobación
    const approveForm = document.getElementById('approveForm');
    if (approveForm) {
        approveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('approveUserId').value;
            const notes = document.getElementById('approveNotes').value.trim();
            const isForced = document.getElementById('forceApprove').checked;
            
            // Validar que si es forzada, tenga notas
            if (isForced && !notes) {
                notify.error('Las notas son obligatorias para aprobaciones forzadas');
                document.getElementById('approveNotes').focus();
                return;
            }
            
            try {
                // ✅ USAR EL NUEVO MÉTODO con información de aprobación forzada
                const response = await window.api.approveUser(userId, notes, isForced);

                if (response.success) {
                    const message = isForced ? 
                        'Cuenta aprobada forzadamente. La nota ha sido registrada.' : 
                        'Cuenta aprobada exitosamente';
                    notify.success(message);
                    closeApproveModal();
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    }
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('Error al aprobar:', error);
                notify.error('Error al aprobar cuenta');
            }
        });
    }

    // Formulario de rechazo
    const rejectForm = document.getElementById('rejectForm');
    if (rejectForm) {
        rejectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('rejectUserId').value;
            const reason = document.getElementById('rejectReason').value;
            const notes = document.getElementById('rejectNotes').value;
            
            try {
                // ✅ USAR EL NUEVO MÉTODO
                const response = await window.api.rejectUser(userId, reason, notes);

                if (response.success) {
                    notify.success('Cuenta rechazada');
                    closeRejectModal();
                    if (typeof window.loadUsers === 'function') {
                        window.loadUsers();
                    }
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('Error al rechazar:', error);
                notify.error('Error al rechazar cuenta');
            }
        });
    }

    // Formulario de edición
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('editUserId').value;
            const userData = {
                name: document.getElementById('editName').value.trim(),
                email: document.getElementById('editEmail').value.trim(),
                phone: document.getElementById('editPhone').value.trim(),
                rut: document.getElementById('editRut').value.trim(),
                role: document.getElementById('editRole').value,
                account_status: document.getElementById('editAccountStatus').value
            };
            
            console.log('📤 Datos del formulario:', userData);
            console.log('📋 Datos originales:', originalUserData);
            
            if (!userData.name || !userData.email) {
                notify.error('Nombre y email son obligatorios');
                return;
            }
            
            // Comparar con datos originales para detectar cambios
            if (!originalUserData) {
                console.warn('⚠️ No hay datos originales guardados, procediendo con actualización');
                notify.warning('No se pudieron comparar los cambios. Se actualizará toda la información.');
            } else {
                // Verificar si hay cambios reales
                const hasChanges = 
                    userData.name !== originalUserData.name ||
                    userData.email !== originalUserData.email ||
                    userData.phone !== originalUserData.phone ||
                    userData.rut !== originalUserData.rut ||
                    userData.role !== originalUserData.role ||
                    userData.account_status !== originalUserData.account_status;
                
                if (!hasChanges) {
                    console.log('ℹ️ No hay cambios detectados');
                    notify.info('No se detectaron cambios. La información se mantiene inalterable.');
                    closeEditModal();
                    return;
                }
                
                console.log('✅ Cambios detectados, procediendo con actualización');
            }
            
            try {
                // ✅ USAR EL NUEVO MÉTODO - Solo actualizar si hay cambios
                const response = await window.api.updateUser(userId, userData);

                console.log('📥 Respuesta del servidor:', response);

                if (response.success) {
                    console.log('✅ Usuario actualizado, recargando lista...');
                    notify.success('Usuario actualizado exitosamente');
                    closeEditModal();
                    if (typeof window.loadUsers === 'function') {
                        await window.loadUsers();
                    }
                    console.log('✅ Lista de usuarios recargada');
                } else {
                    throw new Error(response.message);
                }
            } catch (error) {
                console.error('❌ Error al actualizar usuario:', error);
                notify.error('Error al actualizar usuario: ' + error.message);
            }
        });
    }
    // Nota: El evento 'change' para 'forceApprove' se maneja mediante event delegation en users-page.js
});
