(function () {
    const DASHBOARD_FUNCTIONS = {
        executive: 'loadExecutiveDashboard',
        commercial: 'loadCommercialDashboard',
        customers: 'loadCustomersDashboard',
        marketing: 'loadMarketingDashboard',
        products: 'loadProductsDashboard',
        inventory: 'loadInventoryDashboard',
        operations: 'loadOperationsDashboard',
        ux: 'loadUXDashboard',
        financial: 'loadFinancialDashboard',
        service: 'loadServiceDashboard'
    };

    window.charts = window.charts || {};
    window.currentPeriod = window.currentPeriod || '30d';

    function setActiveTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.toggle('active', tab.id === `tab-${tabName}`);
        });

        document.querySelectorAll('.tab-button').forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
        });
    }

    function getActiveTabName() {
        const activeButton = document.querySelector('.tab-button.active');
        return activeButton ? activeButton.dataset.tab : null;
    }

    function ensureCurrentPeriodAlias(value) {
        window.currentPeriod = value;
        if (typeof window.currentPeriod !== 'undefined') {
            window.currentPeriod = value;
        }
        if (typeof currentPeriod !== 'undefined') {
            currentPeriod = value;
        }
    }

    async function loadTabData(tabName) {
        if (!tabName) {
            return;
        }
        const fnName = DASHBOARD_FUNCTIONS[tabName];
        const loader = fnName && typeof window[fnName] === 'function' ? window[fnName] : null;
        if (!loader) {
            console.warn(`No loader disponible para la pestaña ${tabName}`);
            return;
        }
        try {
            await loader();
        } catch (error) {
            console.error(`Error loading ${tabName}:`, error);
        }
    }

    function switchTab(tabName) {
        setActiveTab(tabName);
        loadTabData(tabName);
    }

    function loadCurrentTab() {
        const tabName = getActiveTabName() || 'executive';
        setActiveTab(tabName);
        loadTabData(tabName);
    }

    function refreshAllDashboards() {
        loadCurrentTab();
    }

    function handlePeriodChange(value) {
        const newPeriod = value || '30d';
        ensureCurrentPeriodAlias(newPeriod);
        refreshAllDashboards();
    }

    function updateCurrentDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date().toLocaleDateString('es-CL', options);
        const formatted = date.charAt(0).toUpperCase() + date.slice(1);
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {
            dateEl.textContent = formatted;
        }
    }

    function startClock() {
        function updateTime() {
            const now = new Date();
            const time = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const timeEl = document.getElementById('currentTime');
            if (timeEl) {
                timeEl.textContent = time;
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    function setupEventHandlers() {
        document.addEventListener('click', (event) => {
            const actionNode = event.target.closest('[data-action]');
            if (!actionNode) {
                return;
            }
            const action = actionNode.dataset.action;
            switch (action) {
                case 'refresh-dashboards':
                    event.preventDefault();
                    refreshAllDashboards();
                    break;
                case 'switch-tab': {
                    event.preventDefault();
                    const tabName = actionNode.dataset.tab;
                    if (tabName) {
                        switchTab(tabName);
                    }
                    break;
                }
                default:
                    break;
            }
        });

        const periodSelector = document.getElementById('periodSelector');
        if (periodSelector) {
            ensureCurrentPeriodAlias(periodSelector.value || '30d');
            periodSelector.addEventListener('change', (event) => {
                handlePeriodChange(event.target.value);
            });
        }

        const topProductsSort = document.getElementById('topProductsSort');
        if (topProductsSort) {
            topProductsSort.addEventListener('change', () => {
                if (typeof window.loadTopProducts === 'function') {
                    window.loadTopProducts();
                }
            });
        }
    }

    function waitForDashboardFunctions() {
        if (typeof window.loadExecutiveDashboard === 'function') {
            loadCurrentTab();
            return;
        }
        let attempts = 0;
        const interval = setInterval(() => {
            attempts += 1;
            if (typeof window.loadExecutiveDashboard === 'function') {
                clearInterval(interval);
                loadCurrentTab();
            } else if (attempts > 20) {
                clearInterval(interval);
                console.warn('Funciones de dashboard no disponibles');
            }
        }, 500);
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof authManager !== 'undefined' && !authManager.requireAdmin()) {
            return;
        }
        updateCurrentDate();
        startClock();
        setupEventHandlers();
        waitForDashboardFunctions();
    });

    // Exponer funciones globalmente para compatibilidad
    window.switchTab = switchTab;
    window.loadTabData = loadTabData;
    window.refreshAllDashboards = refreshAllDashboards;
    window.changePeriod = handlePeriodChange;
})();
