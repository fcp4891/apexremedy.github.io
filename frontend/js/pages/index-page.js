document.addEventListener('DOMContentLoaded', async () => {
    await loadFeaturedProducts();
    setupContactForm();
    toggleSectionsByAuth();
});

async function loadFeaturedProducts() {
    if (typeof productManager === 'undefined') {
        console.warn('productManager no disponible, omitiendo destacados');
        return;
    }

    try {
        console.log('Cargando productos destacados...');
        const products = await productManager.getFeaturedProducts(6);

        if (products && products.length > 0) {
            productManager.renderProducts(products, 'featuredProducts');
            console.log(`✅ ${products.length} productos destacados cargados`);

            setTimeout(() => {
                if (window.authManager && window.authManager.isAuthenticated()) {
                    const user = window.authManager.getCurrentUser();
                    if (user && user.role !== 'admin' && typeof user.account_status === 'undefined') {
                        console.log('💡 Token desactualizado detectado. Ejecuta: refreshUserToken() si es necesario');
                    }
                }
            }, 2000);
        } else {
            renderEmptyFeaturedProducts();
        }
    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        renderErrorFeaturedProducts();
    }
}

function renderEmptyFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <i class="fas fa-box-open" style="font-size: 3rem; color: var(--medium-gray); margin-bottom: 16px;"></i>
            <p style="color: var(--medium-gray);">No hay productos destacados disponibles</p>
            <a href="./tienda.html" class="cta-button app-button app-button--primary" style="margin-top: 16px; display: inline-flex;">
              Ver Toda la Tienda
            </a>
        </div>
    `;
}

function renderErrorFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error); margin-bottom: 16px;"></i>
            <p style="color: var(--medium-gray);">Error al cargar productos</p>
            <button type="button" class="cta-button app-button app-button--primary" style="margin-top: 16px;">
                Reintentar
            </button>
        </div>
    `;

    const retryButton = container.querySelector('button');
    if (retryButton) {
        retryButton.addEventListener('click', loadFeaturedProducts);
    }
}

function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const submitBtn = document.getElementById('contactSubmitBtn');
    const btnText = document.getElementById('contactBtnText');
    const btnLoader = document.getElementById('contactBtnLoader');
    const formMessage = document.getElementById('contactFormMessage');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('contactName')?.value.trim();
        const email = document.getElementById('contactEmail')?.value.trim();
        const message = document.getElementById('contactMessage')?.value.trim();

        if (!name || !email || !message) {
            notify?.warning?.('Por favor completa todos los campos', 'Campos Requeridos');
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'Enviando...';
        btnLoader?.classList.remove('hidden');
        formMessage?.classList.add('hidden');

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            notify?.success?.('¡Mensaje enviado con éxito! Te contactaremos pronto.', '✅ Enviado');
            form.reset();
        } catch (error) {
            notify?.error?.('Error al enviar el mensaje. Intenta nuevamente.', 'Error de Envío');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.textContent = 'Enviar';
            btnLoader?.classList.add('hidden');
        }
    });
}

function toggleSectionsByAuth() {
    // Esperar a que authManager esté listo
    if (!window.authManager || typeof window.authManager.isAuthenticated !== 'function') {
        // Reintentar después de un breve delay
        setTimeout(toggleSectionsByAuth, 200);
        return;
    }

    // Esperar a que la sesión esté lista
    if (!window.authManager.sessionReady) {
        if (window.authManager.bootstrapPromise) {
            window.authManager.bootstrapPromise.finally(() => {
                setTimeout(toggleSectionsByAuth, 100);
            });
        } else {
            setTimeout(toggleSectionsByAuth, 200);
        }
        return;
    }

    const registroSection = document.getElementById('registro-catalogo');
    const userNotice = document.getElementById('unregistered-user-notice');
    
    // Verificar autenticación de forma segura
    const isLoggedIn = window.authManager.isAuthenticated();
    
    // Validar que si está logueado, NO sea admin (en index solo customer)
    if (isLoggedIn) {
        const user = window.authManager.getCurrentUser();
        if (user && user.role === 'admin') {
            // Admin no debería estar en index, limpiar sesión
            console.warn('⚠️ Admin detectado en index, limpiando sesión...');
            window.authManager.clearSession();
            window.authManager.updateUI();
            // No redirigir, solo limpiar y mostrar como no logueado
        }
    }

    const finalIsLoggedIn = window.authManager.isAuthenticated();

    if (registroSection) {
        registroSection.style.display = finalIsLoggedIn ? 'none' : 'block';
    }

    if (userNotice) {
        userNotice.style.display = finalIsLoggedIn ? 'none' : 'block';
    }

    console.log('Estado de autenticación:', finalIsLoggedIn ? '✅ Logueado' : '❌ No logueado');
}

window.checkout = async function checkout() {
    if (typeof authManager !== 'undefined' && !authManager.isAuthenticated()) {
        const confirmed = await notify?.confirm?.({
            type: 'info',
            icon: 'question',
            title: 'Iniciar Sesión Requerido',
            message: 'Debes iniciar sesión para completar la compra. ¿Deseas ir a la página de login?',
            confirmText: 'Sí, Ir al Login',
            cancelText: 'Cancelar',
            confirmClass: 'primary'
        });

        if (confirmed) {
            window.location.href = './login.html?redirect=checkout';
        }
        return;
    }

    window.location.href = './checkout.html';
};

