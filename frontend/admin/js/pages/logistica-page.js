(function () {
    async function waitForDependencies(maxRetries = 100, delay = 100) {
        let retries = 0;
        while (retries < maxRetries) {
            if (typeof APIClient !== 'undefined' && typeof authManager !== 'undefined') {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries += 1;
        }
        return typeof APIClient !== 'undefined' && typeof authManager !== 'undefined';
    }

    function attachNavigationHandler() {
        document.addEventListener('click', (event) => {
            const actionNode = event.target.closest('[data-action]');
            if (!actionNode) {
                return;
            }

            const { action, href } = actionNode.dataset;
            if (action === 'navigate' && href) {
                event.preventDefault();
                window.location.href = href;
            }
        });
    }

    function setStatValue(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) {
            el.textContent = value;
        }
    }

    async function loadStats() {
        const dependenciesReady = await waitForDependencies();
        if (!dependenciesReady || typeof APIClient === 'undefined') {
            console.error('APIClient no disponible para cargar estadísticas');
            return;
        }

        if (typeof authManager === 'undefined' || !authManager.isAuthenticated()) {
            console.warn('Usuario no autenticado, no se pueden cargar estadísticas');
            return;
        }

        try {
            if (typeof window.api === 'undefined') {
                window.api = new APIClient();
            }
            const apiClient = window.api || new APIClient();

            try {
                // Usar el método getShippingProviders() que maneja JSON estático y API dinámica
                const providers = await apiClient.getShippingProviders();
                const count = providers?.data?.providers?.length || providers?.count || 0;
                setStatValue('totalProviders', count);
            } catch (error) {
                console.error('Error cargando proveedores:', error);
                setStatValue('totalProviders', '0');
            }

            try {
                // Usar el método getShipments() que maneja JSON estático y API dinámica
                const shipments = await apiClient.getShipments();
                const allShipments = shipments?.data?.shipments || [];
                const activeShipments = allShipments.filter((s) =>
                    ['pending', 'processing', 'shipped', 'in_transit'].includes(s.status)
                );
                setStatValue('activeShipments', activeShipments.length);
            } catch (error) {
                console.error('Error cargando envíos:', error);
                setStatValue('activeShipments', '0');
            }

            try {
                // Usar el método getInternalDeliveryZones() que maneja JSON estático y API dinámica
                const zones = await apiClient.getInternalDeliveryZones();
                const count = zones?.data?.zones?.length || zones?.count || 0;
                setStatValue('totalZones', count);
            } catch (error) {
                console.error('Error cargando zonas:', error);
                setStatValue('totalZones', '0');
            }

            try {
                // Usar el método getPackingMaterials() que maneja JSON estático y API dinámica
                const materials = await apiClient.getPackingMaterials();
                const count = materials?.data?.materials?.length || materials?.count || 0;
                setStatValue('totalMaterials', count);
            } catch (error) {
                console.error('Error cargando materiales:', error);
                setStatValue('totalMaterials', '0');
            }
        } catch (error) {
            console.error('Error cargando estadísticas de logística:', error);
        }
    }

    async function initialize() {
        if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
            return;
        }
        attachNavigationHandler();
        // Dar tiempo a que adminTemplate.js y dependencias inicialicen
        setTimeout(() => {
            loadStats().catch((error) => console.error('Error en carga diferida de estadísticas:', error));
        }, 1000);
    }

    document.addEventListener('DOMContentLoaded', initialize);
})();
