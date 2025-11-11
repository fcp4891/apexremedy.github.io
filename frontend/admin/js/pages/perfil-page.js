// frontend/admin/js/pages/perfil-page.js
// Página de perfil de usuario - Event delegation y manejo de eventos

// Log inmediato para verificar que el script se carga
try {
    console.log('📦 [PERFIL-PAGE] Script perfil-page.js cargado');
    console.log('📦 [PERFIL-PAGE] Timestamp:', new Date().toISOString());
    console.log('📦 [PERFIL-PAGE] URL actual:', window.location.href);
} catch (e) {
    console.error('❌ [PERFIL-PAGE] Error en log inicial:', e);
}

(function() {
    'use strict';
    
    console.log('📦 [PERFIL-PAGE] IIFE ejecutado');

    // Verificar autenticación al cargar - MEJORADO: Esperar a que bootstrap termine
    async function checkAuth() {
        console.log('🔒 Iniciando verificación de autenticación...');
        
        if (typeof authManager === 'undefined') {
            console.error('❌ authManager no disponible');
            window.location.href = '../login.html';
            return false;
        }

        // Esperar a que bootstrap termine si aún no está listo
        if (!authManager.sessionReady) {
            console.log('⏳ [perfil-page] Esperando a que authManager termine de inicializar...');
            try {
                if (authManager.bootstrapPromise) {
                    await authManager.bootstrapPromise;
                    console.log('✅ [perfil-page] Bootstrap completado');
                } else {
                    // Si no hay promise, esperar más tiempo (bootstrap puede estar en progreso)
                    console.log('⏳ [perfil-page] No hay promise, esperando 1 segundo...');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    // Verificar de nuevo
                    if (!authManager.sessionReady) {
                        console.log('⏳ [perfil-page] Aún no está listo, esperando otros 500ms...');
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            } catch (error) {
                console.error('❌ [perfil-page] Error en bootstrap:', error);
            }
        }

        // NOTA: No verificamos cookies httpOnly porque no son accesibles desde JavaScript
        // El bootstrap() ya verificó la sesión con el servidor, así que confiamos en isAuthenticated()
        console.log('👤 Usuario actual:', authManager.getCurrentUser()?.email || 'null');
        console.log('✅ Sesión lista:', authManager.sessionReady);
        console.log('🔐 Autenticado:', authManager.isAuthenticated());

        if (!authManager.isAuthenticated()) {
            console.log('❌ Usuario no autenticado, redirigiendo a login...');
            if (typeof notify !== 'undefined') {
                notify.warning('Debes iniciar sesión para acceder a tu perfil', 'Autenticación Requerida');
            }
            window.location.href = '../login.html?redirect=admin/perfil';
            return false;
        }
        
        const user = authManager.getCurrentUser();
        console.log('✅ Usuario autenticado:', user?.email, 'Rol:', user?.role);
        return true;
    }

    // Cargar perfil del usuario
    async function loadProfile() {
        try {
            console.log('📥 Cargando perfil del usuario...');
            
            const response = await api.getProfile();
            
            if (response && response.success) {
                const user = response.data.user || response.data;
                console.log('✅ Perfil cargado desde API:', user);
                updateUIWithUser(user);
            } else {
                throw new Error('No se pudo cargar el perfil');
            }
        } catch (error) {
            console.warn('⚠️ Error al cargar desde API:', error.message);
            
            // Fallback: usar datos del authManager
            const currentUser = authManager.getCurrentUser();
            if (currentUser) {
                console.log('✅ Usando perfil desde authManager:', currentUser);
                updateUIWithUser(currentUser);
            } else {
                showNotification('Error al cargar perfil. Por favor, inicia sesión nuevamente.', 'error');
                setTimeout(() => {
                    authManager.logout();
                }, 2000);
            }
        }
    }

    // Actualizar UI con datos del usuario
    function updateUIWithUser(user) {
        const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario';
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) userNameEl.textContent = userName;
        if (userEmailEl) userEmailEl.textContent = user.email || '';
        if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Cliente';
        
        // Actualizar navbar
        const adminNameNav = document.getElementById('adminNameNav');
        if (adminNameNav) {
            const firstName = userName.split(' ')[0];
            adminNameNav.textContent = firstName;
        }
        
        // Actualizar campos del formulario
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const rutInput = document.getElementById('rut');
        
        if (nameInput) nameInput.value = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '';
        if (emailInput) emailInput.value = user.email || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (rutInput) rutInput.value = user.rut || '';
    }

    // Actualizar perfil
    async function updateProfile(event) {
        event.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const rutInput = document.getElementById('rut');

        const data = {
            name: nameInput ? nameInput.value.trim() : '',
            email: emailInput ? emailInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : '',
            rut: rutInput ? rutInput.value.trim() : ''
        };

        if (!data.name || !data.email) {
            showNotification('El nombre y email son obligatorios', 'error');
            return;
        }

        try {
            const response = await api.updateProfile(data);

            if (response && response.success) {
                showNotification('Perfil actualizado correctamente', 'success');
                
                const updatedUser = response.data.user || response.data;
                const currentUser = authManager.getCurrentUser();
                authManager.currentUser = { ...currentUser, ...updatedUser };
                
                loadProfile();
                
                if (authManager.updateUI) {
                    authManager.updateUI();
                }
            } else {
                throw new Error(response.message || 'Error al actualizar perfil');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Error al actualizar perfil: ' + error.message, 'error');
        }
    }

    // Cambiar contraseña
    async function changePassword(event) {
        event.preventDefault();

        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Todos los campos son obligatorios', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        try {
            const response = await api.request('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (response && response.success) {
                showNotification('Contraseña cambiada correctamente', 'success');
                const passwordForm = document.getElementById('passwordForm');
                if (passwordForm) passwordForm.reset();
            } else {
                throw new Error(response.message || 'Error al cambiar contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                showNotification('La funcionalidad de cambio de contraseña aún no está implementada. Contacta al administrador.', 'warning');
            } else {
                showNotification('Error al cambiar contraseña: ' + error.message, 'error');
            }
        }
    }

    // Cambiar sección visible
    function showSection(sectionName) {
        const infoSection = document.getElementById('infoSection');
        const passwordSection = document.getElementById('passwordSection');

        if (infoSection) infoSection.classList.add('hidden');
        if (passwordSection) passwordSection.classList.add('hidden');

        // Remover estilos activos de todos los botones
        document.querySelectorAll('.section-btn').forEach(btn => {
            btn.classList.remove('active', 'font-semibold');
            btn.style.background = '';
            btn.style.color = '';
        });

        // Activar sección correspondiente
        if (sectionName === 'info' && infoSection) {
            infoSection.classList.remove('hidden');
        } else if (sectionName === 'password' && passwordSection) {
            passwordSection.classList.remove('hidden');
        }

        // Activar botón correspondiente
        document.querySelectorAll('.section-btn').forEach(btn => {
            const btnSection = btn.dataset.sectionName;
            if (btnSection === sectionName) {
                btn.classList.add('active', 'font-semibold');
                btn.style.background = 'linear-gradient(135deg, rgba(192, 86, 33, 0.1), rgba(192, 86, 33, 0.05))';
                btn.style.color = 'var(--admin-primary-red)';
            }
        });
    }

    // Resetear formulario de contraseña
    function resetPasswordForm() {
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.reset();
        }
    }

    // Mostrar notificación
    function showNotification(message, type = 'info') {
        if (typeof notify !== 'undefined') {
            notify[type](message);
        } else {
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            alert(`${icons[type]} ${message}`);
        }
    }

    // Manejar eventos de click
    function handleActionClick(event) {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;

        const action = actionEl.dataset.action;

        switch (action) {
            case 'show-section':
                const sectionName = actionEl.dataset.sectionName;
                if (sectionName) {
                    showSection(sectionName);
                }
                break;
            case 'load-profile':
                loadProfile();
                break;
            case 'reset-password-form':
                resetPasswordForm();
                break;
            default:
                break;
        }
    }

    // Inicializar página - MEJORADO: Esperar autenticación
    async function initializePage() {
        console.log('🚀 Inicializando página de perfil...');
        
        // Verificar autenticación (ahora es async)
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            console.log('❌ Autenticación fallida, deteniendo inicialización');
            return;
        }

        console.log('✅ Autenticación verificada, cargando perfil...');

        // Cargar perfil
        loadProfile();

        // Registrar event listeners
        document.addEventListener('click', handleActionClick);

        // Registrar submit de formularios
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', updateProfile);
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', changePassword);
        }
    }

    // Inicializar cuando el DOM esté listo
    console.log('📦 [PERFIL-PAGE] Estado del DOM:', document.readyState);
    if (document.readyState === 'loading') {
        console.log('📦 [PERFIL-PAGE] DOM cargando, esperando DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📦 [PERFIL-PAGE] DOMContentLoaded disparado, inicializando página...');
            initializePage();
        });
    } else {
        console.log('📦 [PERFIL-PAGE] DOM ya listo, inicializando página inmediatamente...');
        initializePage();
    }

    // Exponer funciones en window para compatibilidad
    window.loadProfile = loadProfile;
    window.showSection = showSection;
})();

