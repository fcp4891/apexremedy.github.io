// ============================================
// USERS PAGE - Event Delegation and Initialization
// ============================================

(function () {
    'use strict';

    // Route protection - Admin only
    function checkAdminAccess() {
        if (typeof authManager === 'undefined') {
            window.location.href = '../login.html';
            return false;
        }
        if (!authManager.requireAdmin()) {
            return false;
        }
        return true;
    }

    // Wait for DOM and dependencies
    function initializePage() {
        // Verificar que las funciones necesarias estén cargadas
        if (typeof window.openEditModal === 'undefined' || typeof window.viewDocuments === 'undefined') {
            // Esperar un poco más para que users-modals.js se cargue
            console.log('⏳ Esperando que users-modals.js se cargue...');
            setTimeout(() => {
                if (typeof window.openEditModal === 'undefined' || typeof window.viewDocuments === 'undefined') {
                    console.error('❌ users-modals.js no se cargó correctamente. Las funciones de editar/ver documentos no estarán disponibles.');
                } else {
                    console.log('✅ users-modals.js cargado correctamente');
                    setupPage();
                }
            }, 100);
        } else {
            setupPage();
        }
    }
    
    function setupPage() {
        // Check admin access first
        if (!checkAdminAccess()) {
            return;
        }

        setupEventDelegation();
        setupModalOverlays();
    }

    // Wait for DOM and dependencies
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePage);
    } else {
        // DOM already loaded, initialize immediately
        initializePage();
    }

    function setupEventDelegation() {
        // Centralized click event delegation
        document.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const userId = target.dataset.userId;
            const userName = target.dataset.userName;

            event.preventDefault();
            event.stopPropagation();

            switch (action) {
                case 'edit-user':
                    if (userId) {
                        if (typeof window.openEditModal === 'function') {
                            await window.openEditModal(parseInt(userId));
                        } else {
                            console.error('❌ openEditModal no está disponible. Verifica que users-modals.js esté cargado.');
                            if (typeof notify !== 'undefined') {
                                notify.error('Error: Función de edición no disponible. Recarga la página.');
                            }
                        }
                    }
                    break;

                case 'view-documents':
                    if (userId) {
                        if (typeof window.viewDocuments === 'function') {
                            await window.viewDocuments(parseInt(userId));
                        } else {
                            console.error('❌ viewDocuments no está disponible. Verifica que users-modals.js esté cargado.');
                            if (typeof notify !== 'undefined') {
                                notify.error('Error: Función de documentos no disponible. Recarga la página.');
                            }
                        }
                    }
                    break;

                case 'approve-user':
                case 'approve-from-documents':
                    if (userId && typeof window.openApproveModal === 'function') {
                        const isForced = target.dataset.forced === 'true';
                        if (action === 'approve-from-documents' && typeof window.closeDocumentsModal === 'function') {
                            window.closeDocumentsModal();
                        }
                        window.openApproveModal(parseInt(userId), userName || '', isForced);
                    }
                    break;

                case 'reject-user':
                case 'reject-from-documents':
                    if (userId && typeof window.openRejectModal === 'function') {
                        if (action === 'reject-from-documents' && typeof window.closeDocumentsModal === 'function') {
                            window.closeDocumentsModal();
                        }
                        window.openRejectModal(parseInt(userId), userName || '');
                    }
                    break;

                case 'delete-user':
                    if (userId && typeof window.deleteUser === 'function') {
                        await window.deleteUser(parseInt(userId), userName || '');
                    }
                    break;

                case 'set-pending':
                    if (userId && typeof window.setUserPending === 'function') {
                        await window.setUserPending(parseInt(userId));
                    }
                    break;

                case 'open-add-user-modal':
                    if (typeof window.openAddUserModal === 'function') {
                        window.openAddUserModal();
                    }
                    break;

                case 'close-add-user-modal':
                    if (typeof window.closeAddUserModal === 'function') {
                        window.closeAddUserModal();
                    }
                    break;

                case 'show-approval-guide':
                    if (typeof window.showApprovalGuide === 'function') {
                        window.showApprovalGuide();
                    }
                    break;

                case 'close-approval-guide':
                case 'approval-guide-overlay':
                    if (event.target.id === 'approvalGuideModal' || action === 'close-approval-guide') {
                        if (typeof window.closeApprovalGuide === 'function') {
                            window.closeApprovalGuide();
                        }
                    }
                    break;

                case 'show-role-modal':
                    if (typeof window.showRoleModalInUsers === 'function') {
                        window.showRoleModalInUsers();
                    }
                    break;

                case 'close-role-modal':
                    if (typeof window.closeRoleModalInUsers === 'function') {
                        window.closeRoleModalInUsers();
                    }
                    break;

                case 'show-permission-modal':
                    if (typeof window.showPermissionModalInUsers === 'function') {
                        window.showPermissionModalInUsers();
                    }
                    break;

                case 'close-permission-modal':
                    if (typeof window.closePermissionModalInUsers === 'function') {
                        window.closePermissionModalInUsers();
                    }
                    break;

                case 'switch-users-tab':
                    const tabName = target.dataset.tabName;
                    if (tabName && typeof window.switchUsersTab === 'function') {
                        window.switchUsersTab(tabName);
                    }
                    break;

                case 'toggle-password-visibility':
                    const inputId = target.dataset.targetInput;
                    const iconId = target.dataset.toggleIcon;
                    if (inputId && iconId && typeof window.togglePasswordVisibility === 'function') {
                        window.togglePasswordVisibility(inputId, iconId);
                    }
                    break;

                case 'trigger-file-input':
                    const targetInput = target.dataset.targetInput;
                    if (targetInput) {
                        const fileInput = document.getElementById(targetInput);
                        if (fileInput) {
                            fileInput.click();
                        }
                    }
                    break;

                case 'remove-document':
                    const docType = target.dataset.documentType;
                    if (docType && typeof window.removeDocument === 'function') {
                        window.removeDocument(docType);
                    }
                    break;

                case 'open-add-user-modal':
                    if (typeof window.openAddUserModal === 'function') {
                        window.openAddUserModal();
                    }
                    break;

                case 'close-add-user-modal':
                    if (typeof window.closeAddUserModal === 'function') {
                        window.closeAddUserModal();
                    }
                    break;

                case 'show-approval-guide':
                    if (typeof window.showApprovalGuide === 'function') {
                        window.showApprovalGuide();
                    }
                    break;

                case 'close-approval-guide':
                    if (typeof window.closeApprovalGuide === 'function') {
                        window.closeApprovalGuide();
                    }
                    break;

                case 'close-modal-overlay':
                    // Cerrar modal cuando se hace clic en el overlay
                    if (target.dataset.action === 'close-modal-overlay') {
                        const modal = target;
                        if (modal) {
                            modal.classList.add('hidden');
                        }
                    }
                    break;

                case 'switch-user-modal-tab':
                    const modalTab = target.dataset.tabName;
                    if (modalTab && typeof window.switchUserTab === 'function') {
                        window.switchUserTab(modalTab);
                    }
                    break;


                case 'edit-role':
                    if (target.dataset.roleId && typeof window.editRoleInUsers === 'function') {
                        await window.editRoleInUsers(parseInt(target.dataset.roleId));
                    }
                    break;

                case 'delete-role':
                    if (target.dataset.roleId && typeof window.deleteRoleInUsers === 'function') {
                        await window.deleteRoleInUsers(parseInt(target.dataset.roleId));
                    }
                    break;

                case 'edit-permission':
                    if (target.dataset.permissionId && typeof window.editPermissionInUsers === 'function') {
                        await window.editPermissionInUsers(parseInt(target.dataset.permissionId));
                    }
                    break;

                case 'delete-permission':
                    if (target.dataset.permissionId && typeof window.deletePermissionInUsers === 'function') {
                        await window.deletePermissionInUsers(parseInt(target.dataset.permissionId));
                    }
                    break;

                case 'close-modal':
                case 'close-modal-overlay':
                    // Handle modal closes - check which modal is open
                    if (event.target.id === 'documentsModal' || event.target.closest('#documentsModal')) {
                        if (typeof window.closeDocumentsModal === 'function') {
                            window.closeDocumentsModal();
                        }
                    } else if (event.target.id === 'approveModal' || event.target.closest('#approveModal')) {
                        if (typeof window.closeApproveModal === 'function') {
                            window.closeApproveModal();
                        }
                    } else if (event.target.id === 'rejectModal' || event.target.closest('#rejectModal')) {
                        if (typeof window.closeRejectModal === 'function') {
                            window.closeRejectModal();
                        }
                    } else if (event.target.id === 'editModal' || event.target.closest('#editModal')) {
                        if (typeof window.closeEditModal === 'function') {
                            window.closeEditModal();
                        }
                    }
                    break;

                case 'close-documents-modal':
                    if (typeof window.closeDocumentsModal === 'function') {
                        window.closeDocumentsModal();
                    }
                    break;

                case 'close-edit-modal':
                    if (typeof window.closeEditModal === 'function') {
                        window.closeEditModal();
                    }
                    break;

                case 'close-approve-modal':
                    if (typeof window.closeApproveModal === 'function') {
                        window.closeApproveModal();
                    }
                    break;

                case 'close-reject-modal':
                    if (typeof window.closeRejectModal === 'function') {
                        window.closeRejectModal();
                    }
                    break;

                default:
                    console.warn('Unhandled data-action:', action);
            }
        });

        // Form submission delegation
        document.addEventListener('submit', async (event) => {
            const form = event.target.closest('form[data-action]');
            if (!form) return;

            const action = form.dataset.action;
            event.preventDefault();

            switch (action) {
                case 'save-role':
                    if (typeof window.saveRoleInUsers === 'function') {
                        await window.saveRoleInUsers(event);
                    }
                    break;

                case 'save-permission':
                    if (typeof window.savePermissionInUsers === 'function') {
                        await window.savePermissionInUsers(event);
                    }
                    break;

                default:
                    console.warn('Unhandled form data-action:', action);
            }
        });

        // Change event delegation
        document.addEventListener('change', (event) => {
            const target = event.target;

            // Manejar cambios en el selector de rol
            if (target.id === 'userTypeSelect' && typeof window.handleRoleChange === 'function') {
                window.handleRoleChange();
            }

            // Manejar cambios en el checkbox de aprobación forzada
            if (target.id === 'forceApprove' && typeof window.toggleForceApproveNotes === 'function') {
                window.toggleForceApproveNotes();
            }

            // Manejar cambios en inputs de archivos para documentos
            if (target.hasAttribute('data-action') && target.dataset.action === 'document-input') {
                const documentType = target.dataset.documentType;
                if (documentType && typeof window.handleDocumentUpload === 'function') {
                    window.handleDocumentUpload(event, documentType);
                }
            }
        });
    }

    function setupModalOverlays() {
        // Setup modal overlay clicks (already handled in main script, but ensure compatibility)
        const modals = ['documentsModal', 'approveModal', 'rejectModal', 'editModal', 'addUserModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        const closeFn = window[`close${modalId.charAt(0).toUpperCase() + modalId.slice(1).replace(/Modal$/, '')}Modal`];
                        if (typeof closeFn === 'function') {
                            closeFn();
                        }
                    }
                });
            }
        });
    }

    // Keyboard events (ESC key)
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        // Close modals in priority order
        const modals = [
            { id: 'approvalGuideModal', close: window.closeApprovalGuide },
            { id: 'documentsModal', close: window.closeDocumentsModal },
            { id: 'approveModal', close: window.closeApproveModal },
            { id: 'rejectModal', close: window.closeRejectModal },
            { id: 'editModal', close: window.closeEditModal },
            { id: 'addUserModal', close: window.closeAddUserModal },
            { id: 'roleModalInUsers', close: window.closeRoleModalInUsers },
            { id: 'permissionModalInUsers', close: window.closePermissionModalInUsers }
        ];

        for (const { id, close } of modals) {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                if (typeof close === 'function') {
                    close();
                } else {
                    modal.classList.add('hidden');
                }
                break;
            }
        }
    });
})();

