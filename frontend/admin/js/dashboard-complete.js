// ============================================
// DASHBOARD COMPLETO - Lógica de Carga y Gráficos
// ============================================
// Nota: charts y currentPeriod están declarados en dashboard.html
// Asegurarnos de que existan como variables globales
if (typeof window.charts === 'undefined') {
    window.charts = {};
}
if (typeof window.currentPeriod === 'undefined') {
    window.currentPeriod = '30d';
}
// Referencias para uso en este archivo
var charts = window.charts;
var currentPeriod = window.currentPeriod;

// ============================================
// 1. EXECUTIVE DASHBOARD
// ============================================
async function loadExecutiveDashboard() {
    try {
        // Verificar si hay backend configurado
        if (!api || !api.baseURL) {
            console.warn('⚠️ [Dashboard] Backend no configurado, mostrando mensaje informativo');
            showDashboardUnavailable('executive');
            return;
        }

        const response = await api.getExecutiveDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        // KPIs
        document.getElementById('exec-revenue').textContent = formatCurrency(data.revenue.total);
        document.getElementById('exec-revenue-growth').textContent = formatPercent(data.revenue.growth);
        document.getElementById('exec-cac').textContent = formatCurrency(data.cac);
        document.getElementById('exec-ltv').textContent = formatCurrency(data.ltv);
        document.getElementById('exec-ltv-cac-ratio').textContent = `${data.ltv_cac_ratio.toFixed(1)}:1`;
        document.getElementById('exec-conversion').textContent = formatPercent(data.conversion_rate);
        document.getElementById('exec-new-customers').textContent = data.new_customers;
        document.getElementById('exec-gmv').textContent = formatCurrency(data.gmv);
        document.getElementById('exec-gross-margin').textContent = formatCurrency(data.gross_margin);
        document.getElementById('exec-cash-flow').textContent = formatCurrency(data.cash_flow);

        // Revenue Trend Chart
        const trendResponse = await api.getRevenueTrend('daily', currentPeriod);
        if (trendResponse.success) {
            createRevenueTrendChart('chart-exec-revenue-trend', trendResponse.data);
        }

        // Heatmap RM
        loadHeatmapRM('chart-exec-heatmap-rm');
    } catch (error) {
        console.error('Error loading executive dashboard:', error);
        if (error.code === 'NO_BACKEND_CONFIGURED' || error.message.includes('Backend no configurado')) {
            showDashboardUnavailable('executive');
        }
    }
}

// Función helper para verificar si hay backend disponible
function checkBackendAvailable() {
    return api && api.baseURL;
}

// Función helper para mostrar mensaje cuando el dashboard no está disponible
function showDashboardUnavailable(dashboardType) {
    const container = document.querySelector(`[data-dashboard="${dashboardType}"]`) || 
                      document.querySelector('.dashboard-content') ||
                      document.querySelector('.dashboard-tab-content') ||
                      document.body;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-center max-w-2xl mx-auto mt-8';
    messageDiv.innerHTML = `
        <i class="fas fa-info-circle text-yellow-600 text-4xl mb-4"></i>
        <h3 class="text-xl font-semibold text-yellow-800 mb-2">Dashboard no disponible</h3>
        <p class="text-yellow-700 mb-4">
            Este dashboard requiere un backend configurado para funcionar.
        </p>
        <p class="text-sm text-yellow-600">
            En modo estático (GitHub Pages), los dashboards analíticos no están disponibles.
            <br>
            Para ver los dashboards completos, ejecuta la aplicación en modo de desarrollo con el backend activo.
        </p>
    `;
    
    // Limpiar contenido existente del dashboard
    const dashboardContent = container.querySelector('.dashboard-grid') || 
                            container.querySelector('.dashboard-content') ||
                            container.querySelector('.grid');
    if (dashboardContent) {
        dashboardContent.innerHTML = '';
        dashboardContent.appendChild(messageDiv);
    } else {
        container.appendChild(messageDiv);
    }
}

// ============================================
// 2. COMMERCIAL DASHBOARD
// ============================================
async function loadCommercialDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('commercial');
            return;
        }
        const response = await api.getCommercialDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        // Daily Sales Chart
        createLineChart('chart-comm-daily-sales', {
            labels: data.daily_sales.map(d => d.date),
            datasets: [{
                label: 'Revenue',
                data: data.daily_sales.map(d => d.revenue),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4
            }]
        });

        // Orders by Status
        createDoughnutChart('chart-comm-orders-status', {
            labels: data.orders_by_status.map(o => o.status),
            data: data.orders_by_status.map(o => o.count)
        });

        // Sales by Category
        createBarChart('chart-comm-sales-category', {
            labels: data.sales_by_category.map(c => c.category),
            data: data.sales_by_category.map(c => c.revenue)
        });

        // Payment Methods
        createPieChart('chart-comm-payment-methods', {
            labels: data.sales_by_payment.map(p => p.method || 'Otro'),
            data: data.sales_by_payment.map(p => p.revenue)
        });

        // Top Products
        loadTopProducts();

        // Temporal Performance
        const temporalResponse = await api.getTemporalPerformance(currentPeriod);
        if (temporalResponse.success) {
            const tempData = temporalResponse.data;
            
            // By Hour
            createBarChart('chart-comm-by-hour', {
                labels: tempData.by_hour.map(h => `${h.hour}:00`),
                data: tempData.by_hour.map(h => h.revenue)
            });

            // By Day of Week
            createBarChart('chart-comm-by-day', {
                labels: tempData.by_day_of_week.map(d => d.day_name),
                data: tempData.by_day_of_week.map(d => d.revenue)
            });

            // Heatmap
            createHeatmapChart('chart-comm-heatmap', tempData.heatmap);
        }
    } catch (error) {
        console.error('Error loading commercial dashboard:', error);
    }
}

async function loadTopProducts() {
    try {
        const sort = document.getElementById('topProductsSort')?.value || 'revenue';
        const response = await api.getTopProducts(currentPeriod, sort, 10);
        if (!response.success) throw new Error(response.message);

        const tbody = document.getElementById('topProductsBody');
        tbody.innerHTML = response.data.map((p, i) => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">${i + 1}</td>
                <td class="px-4 py-3 font-semibold">${p.name}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">${formatCurrency(p.revenue)}</td>
                <td class="px-4 py-3 text-center">${p.units}</td>
                <td class="px-4 py-3 text-right font-semibold text-blue-600">${formatCurrency(p.margin)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading top products:', error);
    }
}

// ============================================
// 3. CUSTOMERS DASHBOARD
// ============================================
async function loadCustomersDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('customers');
            return;
        }
        const response = await api.getCustomersDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        document.getElementById('cust-new-customers').textContent = data.new_customers;
        document.getElementById('cust-repeat-customers').textContent = data.repeat_customers;
        document.getElementById('cust-aov').textContent = formatCurrency(data.aov);

        // By Channel
        createBarChart('chart-cust-by-channel', {
            labels: data.by_channel.map(c => c.channel),
            data: data.by_channel.map(c => c.customers)
        });

        // Top Customers
        const tbody = document.getElementById('topCustomersBody');
        tbody.innerHTML = data.top_customers.slice(0, 20).map(c => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">${c.name || c.email}</td>
                <td class="px-4 py-3 text-center">${c.order_count}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">${formatCurrency(c.total_revenue)}</td>
                <td class="px-4 py-3">${formatDate(c.first_order)}</td>
                <td class="px-4 py-3">${formatDate(c.last_order)}</td>
            </tr>
        `).join('');

        // RFM
        const rfmResponse = await api.getRFMSegmentation();
        if (rfmResponse.success) {
            const rfmBody = document.getElementById('rfmBody');
            rfmBody.innerHTML = rfmResponse.data.map(c => `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">${c.name || c.email}</td>
                    <td class="px-4 py-3 text-center">${c.rfm_recency || 'N/A'}</td>
                    <td class="px-4 py-3 text-center">${c.rfm_frequency || 'N/A'}</td>
                    <td class="px-4 py-3 text-center">${c.rfm_monetary || 'N/A'}</td>
                    <td class="px-4 py-3 text-center font-bold">${c.rfm_score || 'N/A'}</td>
                    <td class="px-4 py-3 text-center">
                        <span class="px-2 py-1 rounded text-xs ${getSegmentClass(c.segment_code)}">${c.segment_code || 'N/A'}</span>
                    </td>
                </tr>
            `).join('');
        }

        // Cohort
        const cohortResponse = await api.getCohortAnalysis();
        if (cohortResponse.success) {
            createCohortChart('chart-cust-cohort', cohortResponse.data);
        }
    } catch (error) {
        console.error('Error loading customers dashboard:', error);
    }
}

function getSegmentClass(segment) {
    const classes = {
        'VIP': 'bg-purple-100 text-purple-800',
        'Champion': 'bg-green-100 text-green-800',
        'Loyal': 'bg-blue-100 text-blue-800',
        'At Risk': 'bg-red-100 text-red-800',
        'Lost': 'bg-gray-100 text-gray-800'
    };
    return classes[segment] || 'bg-gray-100 text-gray-800';
}

// ============================================
// 4. MARKETING DASHBOARD
// ============================================
async function loadMarketingDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('marketing');
            return;
        }
        const response = await api.getMarketingDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        // Campaigns Table
        const campaignsBody = document.getElementById('campaignsBody');
        campaignsBody.innerHTML = data.campaigns.map(c => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${c.name}</td>
                <td class="px-4 py-3 text-center">${c.channel}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(c.spent)}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">${formatCurrency(c.revenue)}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs ${c.roas > 3 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${c.roas.toFixed(2)}x
                    </span>
                </td>
                <td class="px-4 py-3 text-center">${c.conversions}</td>
            </tr>
        `).join('');

        // Channels
        createBarChart('chart-marketing-channels', {
            labels: data.channels.map(c => `${c.source} - ${c.medium}`),
            data: data.channels.map(c => c.revenue)
        });

        // Funnel
        createFunnelChart('chart-marketing-funnel', data.channels);

        // Email Stats
        const emailBody = document.getElementById('emailStatsBody');
        emailBody.innerHTML = data.email.map(e => {
            const openRate = e.sent > 0 ? (e.opened / e.sent * 100) : 0;
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">${e.topic}</td>
                    <td class="px-4 py-3 text-center">${e.sent}</td>
                    <td class="px-4 py-3 text-center">${e.opened}</td>
                    <td class="px-4 py-3 text-center">${openRate.toFixed(1)}%</td>
                    <td class="px-4 py-3 text-center">${e.delivered}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading marketing dashboard:', error);
    }
}

// ============================================
// 5. PRODUCTS DASHBOARD
// ============================================
async function loadProductsDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('products');
            return;
        }
        const response = await api.getProductsDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        // By Category
        createBarChart('chart-prod-category-revenue', {
            labels: data.by_category.map(c => c.category),
            data: data.by_category.map(c => c.revenue)
        });

        createBarChart('chart-prod-category-units', {
            labels: data.by_category.map(c => c.category),
            data: data.by_category.map(c => c.units_sold)
        });

        // No Sales
        const noSalesBody = document.getElementById('noSalesBody');
        noSalesBody.innerHTML = data.no_sales.map(p => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${p.name}</td>
                <td class="px-4 py-3">${p.sku || 'N/A'}</td>
                <td class="px-4 py-3 text-right">${formatCurrency(p.base_price)}</td>
                <td class="px-4 py-3 text-center">${p.stock_quantity}</td>
                <td class="px-4 py-3">${formatDate(p.created_at)}</td>
            </tr>
        `).join('');

        // High Returns
        const highReturnsBody = document.getElementById('highReturnsBody');
        highReturnsBody.innerHTML = data.high_returns.map(p => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${p.name}</td>
                <td class="px-4 py-3 text-center">${p.return_count}</td>
                <td class="px-4 py-3 text-center">${p.units_returned}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products dashboard:', error);
    }
}

// ============================================
// 6. INVENTORY DASHBOARD
// ============================================
async function loadInventoryDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('inventory');
            return;
        }
        const response = await api.getInventoryDashboard();
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        document.getElementById('inv-value').textContent = formatCurrency(data.inventory_value);
        
        const lowStock = data.low_stock.filter(s => s.available <= s.low_stock_threshold && s.available > 0);
        const outStock = data.low_stock.filter(s => s.available === 0);
        
        document.getElementById('inv-low-stock-count').textContent = lowStock.length;
        document.getElementById('inv-out-stock-count').textContent = outStock.length;
        document.getElementById('inv-active-products').textContent = data.low_stock.length;

        // Low Stock Table
        const lowStockBody = document.getElementById('lowStockBody');
        lowStockBody.innerHTML = data.low_stock.slice(0, 50).map(p => `
            <tr class="hover:bg-gray-50 ${p.available === 0 ? 'bg-red-50' : ''}">
                <td class="px-4 py-3 font-semibold">${p.name}</td>
                <td class="px-4 py-3">${p.sku || 'N/A'}</td>
                <td class="px-4 py-3 text-center ${p.available === 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-bold'}">
                    ${p.available}
                </td>
                <td class="px-4 py-3 text-center">${p.reserved || 0}</td>
                <td class="px-4 py-3 text-center">${p.low_stock_threshold}</td>
            </tr>
        `).join('');

        // Turnover Table
        const turnoverBody = document.getElementById('turnoverBody');
        turnoverBody.innerHTML = data.turnover.map(p => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${p.name}</td>
                <td class="px-4 py-3 text-center">${p.orders_count}</td>
                <td class="px-4 py-3 text-center">${p.units_sold}</td>
                <td class="px-4 py-3 text-center">${p.avg_stock.toFixed(0)}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading inventory dashboard:', error);
    }
}

// ============================================
// 7. OPERATIONS DASHBOARD
// ============================================
async function loadOperationsDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('operations');
            return;
        }
        const response = await api.getOperationsDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        // Fulfillment Chart
        createBarChart('chart-ops-fulfillment', {
            labels: data.fulfillment.map(f => `${f.status} - ${f.fulfillment_status}`),
            data: data.fulfillment.map(f => f.count)
        });

        // Shipping Table
        const shippingBody = document.getElementById('shippingBody');
        shippingBody.innerHTML = data.shipping.map(s => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${s.carrier || 'N/A'}</td>
                <td class="px-4 py-3 text-center">${s.shipments}</td>
                <td class="px-4 py-3 text-center">${s.avg_delivery_days ? s.avg_delivery_days.toFixed(1) : 'N/A'}</td>
            </tr>
        `).join('');

        // Returns Chart
        createDoughnutChart('chart-ops-returns', {
            labels: data.returns.map(r => r.status),
            data: data.returns.map(r => r.count)
        });
    } catch (error) {
        console.error('Error loading operations dashboard:', error);
    }
}

// ============================================
// 8. UX DASHBOARD
// ============================================
async function loadUXDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('ux');
            return;
        }
        const response = await api.getUXDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        document.getElementById('ux-sessions-total').textContent = data.sessions.total || 0;
        document.getElementById('ux-users-unique').textContent = data.sessions.unique_users || 0;
        document.getElementById('ux-avg-duration').textContent = formatSeconds(data.sessions.avg_duration || 0);
        document.getElementById('ux-bounce-rate').textContent = formatPercent(data.sessions.bounce_rate || 0);

        // Funnel
        createFunnelChart('chart-ux-funnel', data.funnel);

        // Top Pages
        const topPagesBody = document.getElementById('topPagesBody');
        topPagesBody.innerHTML = data.top_pages.slice(0, 20).map(p => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-semibold">${p.page_path}</td>
                <td class="px-4 py-3 text-center">${p.views}</td>
                <td class="px-4 py-3 text-center">${p.unique_sessions}</td>
                <td class="px-4 py-3 text-center">${formatSeconds(p.avg_time || 0)}</td>
            </tr>
        `).join('');

        // Cart Abandonment
        document.getElementById('ux-abandoned').textContent = data.cart_abandonment.abandoned || 0;
        document.getElementById('ux-recovered').textContent = data.cart_abandonment.recovered || 0;
        document.getElementById('ux-cart-value').textContent = formatCurrency(data.cart_abandonment.avg_cart_value || 0);
    } catch (error) {
        console.error('Error loading UX dashboard:', error);
    }
}

// ============================================
// 9. FINANCIAL DASHBOARD
// ============================================
async function loadFinancialDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('financial');
            return;
        }
        const response = await api.getFinancialDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        document.getElementById('fin-revenue').textContent = formatCurrency(data.revenue);
        document.getElementById('fin-cogs').textContent = formatCurrency(data.cogs);
        document.getElementById('fin-gross-profit').textContent = formatCurrency(data.gross_profit);
        document.getElementById('fin-gross-margin').textContent = formatPercent(data.gross_margin);
        document.getElementById('fin-marketing').textContent = formatCurrency(data.expenses.marketing);
        document.getElementById('fin-shipping').textContent = formatCurrency(data.expenses.shipping);
        document.getElementById('fin-payment-fees').textContent = formatCurrency(data.expenses.payment_fees);
        document.getElementById('fin-total-expenses').textContent = formatCurrency(data.expenses.total);
        document.getElementById('fin-net-profit').textContent = formatCurrency(data.net_profit);
        document.getElementById('fin-net-margin').textContent = formatPercent(data.net_margin);
        document.getElementById('fin-rev-per-order').textContent = formatCurrency(data.unit_economics.revenue_per_order);
        document.getElementById('fin-cogs-per-order').textContent = formatCurrency(data.unit_economics.cogs_per_order);
        document.getElementById('fin-contribution-margin').textContent = formatCurrency(data.unit_economics.contribution_margin);
    } catch (error) {
        console.error('Error loading financial dashboard:', error);
    }
}

// ============================================
// 10. SERVICE DASHBOARD
// ============================================
async function loadServiceDashboard() {
    try {
        if (!checkBackendAvailable()) {
            showDashboardUnavailable('service');
            return;
        }
        const response = await api.getCustomerServiceDashboard(currentPeriod);
        if (!response.success) throw new Error(response.message);

        const data = response.data;

        const totalTickets = data.tickets.reduce((sum, t) => sum + t.count, 0);
        document.getElementById('svc-total-tickets').textContent = totalTickets;
        document.getElementById('svc-avg-response').textContent = `${data.avg_response_time_hours}h`;
        
        const resolved = data.tickets.find(t => t.type === 'return')?.count || 0;
        const resolutionRate = totalTickets > 0 ? (resolved / totalTickets * 100) : 0;
        document.getElementById('svc-resolution-rate').textContent = formatPercent(resolutionRate);

        // Tickets Chart
        createDoughnutChart('chart-svc-tickets', {
            labels: data.tickets.map(t => t.type),
            data: data.tickets.map(t => t.count)
        });
    } catch (error) {
        console.error('Error loading service dashboard:', error);
    }
}

// ============================================
// CHART HELPERS
// ============================================
function createLineChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createBarChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Valor',
                data: chartData.data,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function createDoughnutChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    'rgb(234, 179, 8)',
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createPieChart(canvasId, chartData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)',
                    'rgb(234, 179, 8)',
                    'rgb(239, 68, 68)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function createFunnelChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (charts[canvasId]) charts[canvasId].destroy();

    const labels = data.map(d => d.step || d.name);
    const values = data.map(d => d.count || d.value);

    charts[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Conversión',
                data: values,
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { beginAtZero: true }
            }
        }
    });
}

function createRevenueTrendChart(canvasId, data) {
    createLineChart(canvasId, {
        labels: data.map(d => d.period),
        datasets: [{
            label: 'Revenue',
            data: data.map(d => d.revenue),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true
        }, {
            label: 'Orders',
            data: data.map(d => d.orders),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
        }]
    });
}

function createCohortChart(canvasId, data) {
    createBarChart(canvasId, {
        labels: data.map(d => d.cohort_period),
        data: data.map(d => d.total_revenue)
    });
}

function createHeatmapChart(canvasId, heatmapData) {
    const container = document.getElementById(canvasId);
    if (!container || typeof echarts === 'undefined') return;

    const chart = echarts.init(container);
    
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hours = Array.from({length: 24}, (_, i) => i);
    
    const data = heatmapData.map(d => [d.day_of_week, d.hour, d.orders]);
    
    const option = {
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return `${days[params.data[0]]} ${params.data[1]}:00<br/>Órdenes: ${params.data[2]}`;
            }
        },
        grid: {
            height: '50%',
            top: '10%'
        },
        xAxis: {
            type: 'category',
            data: hours,
            splitArea: { show: true }
        },
        yAxis: {
            type: 'category',
            data: days,
            splitArea: { show: true }
        },
        visualMap: {
            min: 0,
            max: Math.max(...data.map(d => d[2])),
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '15%',
            inRange: {
                color: ['#e0f2fe', '#0284c7', '#0c4a6e']
            }
        },
        series: [{
            name: 'Órdenes',
            type: 'heatmap',
            data: data,
            label: { show: true },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    
    chart.setOption(option);
    charts[canvasId] = chart;
}

async function loadHeatmapRM(canvasId) {
    try {
        const geoJson = await api.getRMComunasGeoJson();
        if (typeof echarts !== 'undefined' && geoJson) {
            echarts.registerMap('rm_comunas', geoJson);
        }

        const response = await api.getOrdersByComuna({});
        if (response && response.success && response.data) {
            const data = response.data.totals?.RM || [];
            
            const container = document.getElementById(canvasId);
            if (!container) return;

            const chart = echarts.init(container);
            const dataMap = data.map(d => ({
                name: d.comuna,
                value: parseInt(d.orders) || 0
            })).filter(d => d.name && d.value > 0);

            const maxVal = Math.max(1, ...dataMap.map(d => d.value || 0));

            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: p => `<strong>${p.name}</strong><br/>Pedidos: ${(p.value ?? 0).toLocaleString()}`
                },
                visualMap: {
                    min: 0,
                    max: maxVal,
                    left: 'left',
                    bottom: 20,
                    calculable: true,
                    inRange: {
                        color: ['#e0f2fe', '#0284c7', '#0c4a6e']
                    },
                    text: ['Alto', 'Bajo'],
                    textStyle: { color: '#333' }
                },
                series: [{
                    name: 'Pedidos',
                    type: 'map',
                    map: 'rm_comunas',
                    roam: true,
                    scaleLimit: { min: 1, max: 3 },
                    emphasis: {
                        label: { show: true, color: '#fff', fontWeight: 'bold' },
                        itemStyle: { areaColor: '#fbbf24', borderColor: '#fff', borderWidth: 2 }
                    },
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 1
                    },
                    data: dataMap
                }]
            };

            chart.setOption(option);
            charts[canvasId] = chart;
        }
    } catch (error) {
        console.error('Error loading heatmap RM:', error);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value || 0);
}

function formatPercent(value) {
    return `${(value || 0).toFixed(1)}%`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function formatSeconds(seconds) {
    if (!seconds) return '0s';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
}

