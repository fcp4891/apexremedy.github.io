/**
 * ============================================
 * GESTOR DE SESIÓN - Apexremedy
 * Maneja inactividad y cierre de sesión automático
 * ============================================
 */

(function() {
    'use strict';

    class SessionManager {
        constructor() {
            this.inactivityTimeout = 60000; // 1 minuto en milisegundos
            this.warningTimeout = 30000; // 30 segundos para responder
            this.inactivityTimer = null;
            this.warningTimer = null;
            this.lastActivity = Date.now();
            this.isWarningShown = false;
            this.isActive = true;
            
            this.init();
        }

        init() {
            // Solo inicializar si hay usuario autenticado
            if (!this.isAuthenticated()) {
                return;
            }
            
            // Eventos que resetean el timer de inactividad
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
            events.forEach(event => {
                document.addEventListener(event, () => this.resetInactivityTimer(), { passive: true });
            });

            // Detectar cuando la página se oculta/visible (pero NO cerrar sesión en navegación)
            document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

            // Iniciar el timer de inactividad
            this.resetInactivityTimer();
        }

        isAuthenticated() {
            return typeof authManager !== 'undefined' && authManager.isAuthenticated();
        }

        resetInactivityTimer() {
            if (!this.isAuthenticated()) {
                return;
            }

            this.lastActivity = Date.now();
            
            // Limpiar timers existentes
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            if (this.warningTimer) {
                clearTimeout(this.warningTimer);
            }

            // Ocultar warning si está visible
            if (this.isWarningShown) {
                this.hideWarning();
            }

            // Configurar nuevo timer de inactividad
            this.inactivityTimer = setTimeout(() => {
                this.showInactivityWarning();
            }, this.inactivityTimeout);
        }

        showInactivityWarning() {
            if (!this.isAuthenticated() || this.isWarningShown) {
                return;
            }

            this.isWarningShown = true;

            // Crear modal de advertencia
            const modal = this.createWarningModal();
            document.body.appendChild(modal);

            // Iniciar countdown
            let secondsLeft = this.warningTimeout / 1000;
            const countdownEl = modal.querySelector('#sessionCountdown');
            
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                if (countdownEl) {
                    countdownEl.textContent = secondsLeft;
                }

                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    this.forceLogout();
                }
            }, 1000);

            // Guardar referencia al interval para poder limpiarlo
            modal.dataset.countdownInterval = countdownInterval;

            // Función para cerrar y mantener conexión (por defecto)
            const closeAndStayConnected = () => {
                clearInterval(countdownInterval);
                this.hideWarning();
                this.resetInactivityTimer();
            };

            // Función para cerrar y salir
            const closeAndLogout = () => {
                clearInterval(countdownInterval);
                this.hideWarning();
                this.forceLogout();
            };

            // Botón "Mantenerme conectado"
            const stayConnectedBtn = modal.querySelector('#stayConnectedBtn');
            if (stayConnectedBtn) {
                stayConnectedBtn.addEventListener('click', closeAndStayConnected);
            }

            // Botón "Cerrar sesión"
            const logoutBtn = modal.querySelector('#logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', closeAndLogout);
            }

            // Cerrar con tecla ESC
            const handleEscapeKey = (e) => {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    closeAndStayConnected();
                    document.removeEventListener('keydown', handleEscapeKey);
                }
            };
            document.addEventListener('keydown', handleEscapeKey);

            // Cerrar haciendo click fuera del modal (backdrop)
            modal.addEventListener('click', (e) => {
                // Si el click fue directamente en el backdrop (no en el contenido)
                if (e.target === modal) {
                    closeAndStayConnected();
                    document.removeEventListener('keydown', handleEscapeKey);
                }
            });

            // Guardar referencia al handler ESC para limpiarlo después
            modal.dataset.escapeHandler = handleEscapeKey.toString();
        }

        createWarningModal() {
            const modal = document.createElement('div');
            modal.id = 'sessionWarningModal';
            modal.className = 'session-warning-modal';
            modal.innerHTML = `
                <div class="session-warning-content">
                    <div class="session-warning-header">
                        <i class="fas fa-clock"></i>
                        <h3>Sesión por expirar</h3>
                    </div>
                    <div class="session-warning-body">
                        <p>Has estado inactivo por un tiempo. ¿Deseas mantener tu sesión activa?</p>
                        <p class="session-warning-countdown">
                            Tu sesión se cerrará automáticamente en <span id="sessionCountdown">30</span> segundos
                        </p>
                    </div>
                    <div class="session-warning-actions">
                        <button id="stayConnectedBtn" class="session-btn-stay">
                            <i class="fas fa-check"></i>
                            Mantenerme conectado
                        </button>
                        <button id="logoutBtn" class="session-btn-logout">
                            <i class="fas fa-sign-out-alt"></i>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            `;
            return modal;
        }

        hideWarning() {
            const modal = document.getElementById('sessionWarningModal');
            if (modal) {
                const countdownInterval = modal.dataset.countdownInterval;
                if (countdownInterval) {
                    clearInterval(parseInt(countdownInterval));
                }
                
                // Remover listener de ESC si existe
                const allEscapeListeners = document.querySelectorAll('[data-escape-handler]');
                // Limpiar cualquier listener relacionado
                document.removeEventListener('keydown', () => {});
                
                modal.remove();
            }
            this.isWarningShown = false;
        }

        forceLogout() {
            this.hideWarning();
            
            if (typeof notify !== 'undefined') {
                notify.warning('Tu sesión ha expirado por inactividad', 'Sesión cerrada');
            }
            
            if (typeof authManager !== 'undefined') {
                authManager.logout();
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = './login.html';
            }
        }

        handleVisibilityChange() {
            if (!document.hidden) {
                // Cuando vuelve a ser visible, resetear timer si está autenticado
                if (this.isAuthenticated()) {
                    this.resetInactivityTimer();
                }
            }
        }

        destroy() {
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            if (this.warningTimer) {
                clearTimeout(this.warningTimer);
            }
            this.hideWarning();
        }
    }

    // Inicializar cuando el DOM esté listo y authManager esté disponible
    function initSessionManager() {
        if (typeof authManager === 'undefined') {
            setTimeout(initSessionManager, 100);
            return;
        }

        // Solo inicializar si hay usuario autenticado
        if (!authManager.isAuthenticated()) {
            return;
        }

        // Crear instancia global
        if (typeof sessionManager === 'undefined') {
            window.sessionManager = new SessionManager();
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSessionManager);
    } else {
        initSessionManager();
    }

    // Reinicializar cuando el usuario inicie sesión
    window.addEventListener('userLoggedIn', () => {
        if (typeof sessionManager !== 'undefined') {
            sessionManager.destroy();
        }
        setTimeout(() => {
            window.sessionManager = new SessionManager();
        }, 500);
    });

    // Destruir cuando el usuario cierre sesión
    window.addEventListener('userLoggedOut', () => {
        if (typeof sessionManager !== 'undefined') {
            sessionManager.destroy();
            window.sessionManager = undefined;
        }
    });

})();

