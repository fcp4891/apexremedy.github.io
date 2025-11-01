/**
 * ============================================
 * SISTEMA DE NOTIFICACIONES PERSONALIZADO
 * Archivo: frontend/js/notifications.js
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // ESTILOS CSS
    // ============================================
    
    const styles = `
        /* Contenedor de notificaciones */
        #notificationContainer {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
            pointer-events: none;
        }

        /* Notificación individual */
        .notification {
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            padding: 16px 20px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideInRight 0.3s ease-out;
            pointer-events: auto;
            border-left: 4px solid #3b82f6;
            max-width: 400px;
        }

        .notification.success { border-left-color: #10b981; }
        .notification.error { border-left-color: #ef4444; }
        .notification.warning { border-left-color: #f59e0b; }
        .notification.info { border-left-color: #3b82f6; }

        .notification-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 14px;
        }

        .notification.success .notification-icon {
            background: #d1fae5;
            color: #10b981;
        }

        .notification.error .notification-icon {
            background: #fee2e2;
            color: #ef4444;
        }

        .notification.warning .notification-icon {
            background: #fef3c7;
            color: #f59e0b;
        }

        .notification.info .notification-icon {
            background: #dbeafe;
            color: #3b82f6;
        }

        .notification-content {
            flex: 1;
        }

        .notification-title {
            font-weight: 600;
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 4px;
        }

        .notification-message {
            font-size: 13px;
            color: #6b7280;
            line-height: 1.4;
        }

        .notification-close {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #f3f4f6;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            transition: all 0.2s;
            flex-shrink: 0;
        }

        .notification-close:hover {
            background: #e5e7eb;
            color: #1f2937;
        }

        /* Modal de confirmación */
        .confirm-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 99998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
            padding: 20px;
        }

        .confirm-modal {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 440px;
            width: 100%;
            animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
        }

        .confirm-modal-header {
            padding: 24px 24px 16px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }

        .confirm-modal-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 24px;
        }

        .confirm-modal.danger .confirm-modal-icon {
            background: #fee2e2;
            color: #ef4444;
        }

        .confirm-modal.warning .confirm-modal-icon {
            background: #fef3c7;
            color: #f59e0b;
        }

        .confirm-modal.info .confirm-modal-icon {
            background: #dbeafe;
            color: #3b82f6;
        }

        .confirm-modal-text {
            flex: 1;
        }

        .confirm-modal-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }

        .confirm-modal-message {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
        }

        .confirm-modal-footer {
            padding: 16px 24px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .confirm-modal-button {
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .confirm-modal-button.cancel {
            background: #f3f4f6;
            color: #6b7280;
        }

        .confirm-modal-button.cancel:hover {
            background: #e5e7eb;
            color: #1f2937;
        }

        .confirm-modal-button.confirm {
            background: #ef4444;
            color: white;
        }

        .confirm-modal-button.confirm:hover {
            background: #dc2626;
        }

        .confirm-modal-button.confirm.primary {
            background: #10b981;
        }

        .confirm-modal-button.confirm.primary:hover {
            background: #059669;
        }

        /* Animaciones */
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes scaleIn {
            from {
                transform: scale(0.9);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            to {
                transform: translateX(120%);
                opacity: 0;
            }
        }

        /* Responsive */
        @media (max-width: 640px) {
            #notificationContainer {
                left: 12px;
                right: 12px;
                top: 12px;
            }

            .notification {
                max-width: 100%;
            }

            .confirm-modal {
                margin: 0 12px;
            }
        }
    `;

    // Inyectar estilos
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // ============================================
    // CREAR CONTENEDOR DE NOTIFICACIONES
    // ============================================
    
    let notificationContainer = null;

    function ensureContainer() {
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            document.body.appendChild(notificationContainer);
        }
        return notificationContainer;
    }

    // ============================================
    // ICONOS
    // ============================================
    
    const icons = {
        success: '<i class="fas fa-check"></i>',
        error: '<i class="fas fa-times"></i>',
        warning: '<i class="fas fa-exclamation"></i>',
        info: '<i class="fas fa-info"></i>',
        question: '<i class="fas fa-question"></i>',
        logout: '<i class="fas fa-sign-out-alt"></i>',
        trash: '<i class="fas fa-trash-alt"></i>'
    };

    // ============================================
    // MOSTRAR NOTIFICACIÓN
    // ============================================
    
    function showNotification(options) {
        const container = ensureContainer();

        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000,
            closable = true
        } = options;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            ${closable ? '<button class="notification-close"><i class="fas fa-times" style="font-size: 10px;"></i></button>' : ''}
        `;

        container.appendChild(notification);

        // Cerrar al hacer clic
        if (closable) {
            const closeBtn = notification.querySelector('.notification-close');
            closeBtn.addEventListener('click', () => {
                closeNotification(notification);
            });
        }

        // Auto-cerrar
        if (duration > 0) {
            setTimeout(() => {
                closeNotification(notification);
            }, duration);
        }

        return notification;
    }

    function closeNotification(notification) {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    // ============================================
    // MODAL DE CONFIRMACIÓN
    // ============================================
    
    function showConfirm(options) {
        return new Promise((resolve) => {
            const {
                type = 'warning',
                icon = 'question',
                title = '¿Estás seguro?',
                message = '',
                confirmText = 'Confirmar',
                cancelText = 'Cancelar',
                confirmClass = 'danger'
            } = options;

            const overlay = document.createElement('div');
            overlay.className = 'confirm-modal-overlay';
            
            overlay.innerHTML = `
                <div class="confirm-modal ${type}">
                    <div class="confirm-modal-header">
                        <div class="confirm-modal-icon">${icons[icon] || icons.question}</div>
                        <div class="confirm-modal-text">
                            <div class="confirm-modal-title">${title}</div>
                            <div class="confirm-modal-message">${message}</div>
                        </div>
                    </div>
                    <div class="confirm-modal-footer">
                        <button class="confirm-modal-button cancel">${cancelText}</button>
                        <button class="confirm-modal-button confirm ${confirmClass}">${confirmText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const modal = overlay.querySelector('.confirm-modal');
            const cancelBtn = modal.querySelector('.cancel');
            const confirmBtn = modal.querySelector('.confirm');

            function close(result) {
                overlay.style.animation = 'fadeIn 0.2s ease-out reverse';
                modal.style.animation = 'scaleIn 0.2s ease-out reverse';
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            }

            cancelBtn.addEventListener('click', () => close(false));
            confirmBtn.addEventListener('click', () => close(true));
            
            // Cerrar al hacer clic fuera
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    close(false);
                }
            });

            // Cerrar con ESC
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // ============================================
    // API PÚBLICA
    // ============================================
    
    window.notify = {
        // Notificaciones básicas
        success: (message, title = '¡Éxito!') => {
            return showNotification({ type: 'success', title, message });
        },
        
        error: (message, title = 'Error') => {
            return showNotification({ type: 'error', title, message, duration: 6000 });
        },
        
        warning: (message, title = 'Advertencia') => {
            return showNotification({ type: 'warning', title, message, duration: 5000 });
        },
        
        info: (message, title = 'Información') => {
            return showNotification({ type: 'info', title, message });
        },

        // Notificación personalizada
        show: (options) => {
            return showNotification(options);
        },

        // Confirmación
        confirm: (options) => {
            return showConfirm(options);
        },

        // Atajos comunes
        confirmDelete: (itemName = 'este elemento') => {
            return showConfirm({
                type: 'danger',
                icon: 'trash',
                title: '¿Eliminar elemento?',
                message: `¿Estás seguro de eliminar ${itemName}? Esta acción no se puede deshacer.`,
                confirmText: 'Eliminar',
                cancelText: 'Cancelar',
                confirmClass: 'danger'
            });
        },

        confirmLogout: () => {
            return showConfirm({
                type: 'warning',
                icon: 'logout',
                title: '¿Cerrar sesión?',
                message: '¿Estás seguro que deseas cerrar tu sesión?',
                confirmText: 'Cerrar sesión',
                cancelText: 'Cancelar',
                confirmClass: 'danger'
            });
        },

        confirmAction: (title, message) => {
            return showConfirm({
                type: 'info',
                icon: 'question',
                title,
                message,
                confirmText: 'Continuar',
                cancelText: 'Cancelar',
                confirmClass: 'primary'
            });
        }
    };

    console.log('✅ Sistema de notificaciones cargado');

})();