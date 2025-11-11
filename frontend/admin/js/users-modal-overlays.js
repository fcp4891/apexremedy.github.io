// ============================================
// USERS MODAL OVERLAYS - Utilidades para cerrar modales
// ============================================

(function () {
    'use strict';

    // Utilidad: cierra al clickear overlay y evita cierre al click interno
    function enableOverlayToClose(modalId, closeFn) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Cierra si clic es sobre el overlay (fondo oscuro)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (typeof closeFn === 'function') {
                    closeFn();
                } else {
                    modal.classList.add('hidden');
                }
            }
        });

        // Evita que clics dentro del contenido cierren el modal
        const dialog = modal.firstElementChild;
        if (dialog) {
            dialog.addEventListener('click', (e) => e.stopPropagation());
        }
    }

    // Configurar overlays cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        // Users (users.html)
        if (document.getElementById('documentsModal')) {
            enableOverlayToClose('documentsModal', window.closeDocumentsModal);
        }
        if (document.getElementById('approveModal')) {
            enableOverlayToClose('approveModal', window.closeApproveModal);
        }
        if (document.getElementById('rejectModal')) {
            enableOverlayToClose('rejectModal', window.closeRejectModal);
        }
        if (document.getElementById('editModal')) {
            enableOverlayToClose('editModal', window.closeEditModal);
        }
        if (document.getElementById('addUserModal')) {
            enableOverlayToClose('addUserModal', window.closeAddUserModal);
        }
    });
})();

