// Helper para modales de logística - Cerrar con click fuera o ESC
function setupLogisticsModal(modalId, closeFunction) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Cerrar con click fuera del modal
    modal.addEventListener('click', (e) => {
        if (e.target.id === modalId) {
            if (closeFunction) {
                closeFunction();
            } else {
                modal.classList.add('hidden');
            }
        }
    });

    // Evitar que el click dentro del contenido cierre el modal
    const modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            if (closeFunction) {
                closeFunction();
            } else {
                modal.classList.add('hidden');
            }
        }
    });
}









