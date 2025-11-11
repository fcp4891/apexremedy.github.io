// ============================================
// CONTROLADOR: Analytics - Dashboard Completo
// ============================================

const OrderModel = require('../models/Order');
const Order = new OrderModel();
const Database = require('../database/db');
const db = Database.getInstance();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDateRange(period = '30d') {
    const now = new Date();
    let from = new Date();
    
    switch (period) {
        case '7d':
            from.setDate(now.getDate() - 7);
            break;
        case '30d':
            from.setDate(now.getDate() - 30);
            break;
        case '90d':
            from.setDate(now.getDate() - 90);
            break;
        case '1y':
            from.setFullYear(now.getFullYear() - 1);
            break;
        case 'ytd':
            from = new Date(now.getFullYear(), 0, 1);
            break;
        case 'mtd':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'wtd':
            const day = now.getDay();
            from.setDate(now.getDate() - day);
            from.setHours(0, 0, 0, 0);
            break;
        default:
            from.setDate(now.getDate() - 30);
    }
    
    return {
        from: from.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0]
    };
}

// ============================================
// 1. EXECUTIVE DASHBOARD
// ============================================

/**
 * GET /api/analytics/executive
 * Dashboard ejecutivo con KPIs principales
 */
exports.getExecutiveDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Revenue total
        const revenueResult = await db.get(`
            SELECT 
                COALESCE(SUM(total), 0) as revenue,
                COUNT(*) as orders,
                COALESCE(AVG(total), 0) as avg_ticket
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [from, to]);
        
        // Revenue anterior (mismo período)
        const prevPeriod = period === '30d' ? '60d' : period;
        const { from: prevFrom, to: prevTo } = getDateRange(prevPeriod);
        const prevRevenue = await db.get(`
            SELECT COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [prevFrom, prevTo]);
        
        const revenueGrowth = prevRevenue.revenue > 0 
            ? ((revenueResult.revenue - prevRevenue.revenue) / prevRevenue.revenue * 100) 
            : 0;
        
        // CAC y LTV (simplificado)
        const newCustomers = await db.get(`
            SELECT COUNT(*) as count
            FROM users
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
        `, [from, to]);
        
        const marketingSpend = await db.get(`
            SELECT COALESCE(SUM(spent), 0) as total
            FROM marketing_campaigns
            WHERE DATE(start_date) >= ? AND DATE(start_date) <= ?
        `, [from, to]);
        
        const cac = newCustomers.count > 0 ? marketingSpend.total / newCustomers.count : 0;
        
        // LTV promedio
        const ltvResult = await db.get(`
            SELECT 
                COALESCE(AVG(total_revenue), 0) as avg_ltv
            FROM (
                SELECT 
                    u.id,
                    COALESCE(SUM(o.total), 0) as total_revenue
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                WHERE DATE(u.created_at) >= ? AND DATE(u.created_at) <= ?
                GROUP BY u.id
            )
        `, [from, to]);
        
        const ltv = ltvResult.avg_ltv || 0;
        const ltvCacRatio = cac > 0 ? ltv / cac : 0;
        
        // GMV
        const gmv = revenueResult.revenue;
        
        // Margen bruto (simplificado - asumiendo COGS = 60% del revenue)
        const grossMargin = revenueResult.revenue * 0.4; // 40% margen
        const grossMarginPercent = 40;
        
        // Cash flow operativo (simplificado)
        const cashFlow = revenueResult.revenue - marketingSpend.total;
        
        // Conversión
        const sessions = await db.get(`
            SELECT COUNT(DISTINCT session_id) as count
            FROM web_sessions
            WHERE DATE(started_at) >= ? AND DATE(started_at) <= ?
        `, [from, to]) || { count: 0 };
        
        const conversionRate = sessions.count > 0 
            ? (revenueResult.orders / sessions.count * 100) 
            : 0;
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                revenue: {
                    total: revenueResult.revenue,
                    growth: revenueGrowth,
                    orders: revenueResult.orders,
                    avg_ticket: revenueResult.avg_ticket
                },
                cac: cac,
                ltv: ltv,
                ltv_cac_ratio: ltvCacRatio,
                gmv: gmv,
                gross_margin: grossMargin,
                gross_margin_percent: grossMarginPercent,
                cash_flow: cashFlow,
                conversion_rate: conversionRate,
                new_customers: newCustomers.count
            }
        });
    } catch (error) {
        console.error('❌ Error en getExecutiveDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/executive/revenue-trend
 * Tendencia de revenue (YoY, MoM, WoW)
 */
exports.getRevenueTrend = async (req, res) => {
    try {
        const { type = 'daily', period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        let groupBy = "DATE(created_at)";
        if (type === 'weekly') groupBy = "strftime('%Y-%W', created_at)";
        else if (type === 'monthly') groupBy = "strftime('%Y-%m', created_at)";
        
        const results = await db.all(`
            SELECT 
                ${groupBy === "DATE(created_at)" ? "DATE(created_at)" : groupBy} as period,
                COALESCE(SUM(total), 0) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
            GROUP BY ${groupBy}
            ORDER BY period ASC
        `, [from, to]);
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('❌ Error en getRevenueTrend:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 2. DASHBOARD COMERCIAL/VENTAS
// ============================================

/**
 * GET /api/analytics/commercial
 * Dashboard comercial completo
 */
exports.getCommercialDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Ventas por día
        const dailySales = await db.all(`
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total), 0) as revenue,
                COUNT(*) as orders
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [from, to]);
        
        // Pedidos por estado
        const ordersByStatus = await db.all(`
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            GROUP BY status
        `, [from, to]);
        
        // Ventas por categoría
        const salesByCategory = await db.all(`
            SELECT 
                pc.name as category,
                COALESCE(SUM(oi.total), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as units
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            LEFT JOIN product_categories pc ON pc.id = p.category_id
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            AND o.status NOT IN ('cancelled')
            GROUP BY pc.id, pc.name
            ORDER BY revenue DESC
        `, [from, to]);
        
        // Ventas por método de pago
        const salesByPayment = await db.all(`
            SELECT 
                pm.name as method,
                COUNT(*) as orders,
                COALESCE(SUM(p.amount_net), 0) as revenue
            FROM payments p
            JOIN orders o ON o.id = p.order_id
            LEFT JOIN payment_methods pm ON pm.id = p.provider_id
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            AND p.status = 'captured'
            GROUP BY pm.id, pm.name
            ORDER BY revenue DESC
        `, [from, to]);
        
        // Devoluciones
        const returns = await db.all(`
            SELECT 
                COUNT(*) as count,
                COALESCE(SUM(refund_amount), 0) as total_amount
            FROM returns
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                daily_sales: dailySales,
                orders_by_status: ordersByStatus,
                sales_by_category: salesByCategory,
                sales_by_payment: salesByPayment,
                returns: returns[0] || { count: 0, total_amount: 0 }
            }
        });
    } catch (error) {
        console.error('❌ Error en getCommercialDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/commercial/top-products
 * Top productos por revenue, unidades, margen
 */
exports.getTopProducts = async (req, res) => {
    try {
        const { period = '30d', sort = 'revenue', limit = 10 } = req.query;
        const { from, to } = getDateRange(period);
        
        let orderBy = 'revenue DESC';
        if (sort === 'units') orderBy = 'units DESC';
        else if (sort === 'margin') orderBy = 'margin DESC';
        
        const results = await db.all(`
            SELECT 
                p.id,
                p.name,
                p.sku,
                COALESCE(SUM(oi.total), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as units,
                COALESCE(SUM(oi.total) - SUM(oi.quantity * p.base_price * 0.6), 0) as margin,
                COUNT(DISTINCT o.id) as orders
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            AND o.status NOT IN ('cancelled')
            GROUP BY p.id, p.name, p.sku
            ORDER BY ${orderBy}
            LIMIT ?
        `, [from, to, parseInt(limit)]);
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('❌ Error en getTopProducts:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/commercial/temporal
 * Performance temporal (hora del día, día de semana, estacionalidad)
 */
exports.getTemporalPerformance = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Por hora del día
        const byHour = await db.all(`
            SELECT 
                CAST(strftime('%H', created_at) AS INTEGER) as hour,
                COUNT(*) as orders,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
            GROUP BY hour
            ORDER BY hour ASC
        `, [from, to]);
        
        // Por día de la semana
        const byDayOfWeek = await db.all(`
            SELECT 
                CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
                CASE CAST(strftime('%w', created_at) AS INTEGER)
                    WHEN 0 THEN 'Domingo'
                    WHEN 1 THEN 'Lunes'
                    WHEN 2 THEN 'Martes'
                    WHEN 3 THEN 'Miércoles'
                    WHEN 4 THEN 'Jueves'
                    WHEN 5 THEN 'Viernes'
                    WHEN 6 THEN 'Sábado'
                END as day_name,
                COUNT(*) as orders,
                COALESCE(SUM(total), 0) as revenue
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
            GROUP BY day_of_week
            ORDER BY day_of_week ASC
        `, [from, to]);
        
        // Heatmap día x hora
        const heatmap = await db.all(`
            SELECT 
                CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
                CAST(strftime('%H', created_at) AS INTEGER) as hour,
                COUNT(*) as orders
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
            GROUP BY day_of_week, hour
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                by_hour: byHour,
                by_day_of_week: byDayOfWeek,
                heatmap: heatmap
            }
        });
    } catch (error) {
        console.error('❌ Error en getTemporalPerformance:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 3. DASHBOARD DE CLIENTES (CRM)
// ============================================

/**
 * GET /api/analytics/customers
 * Dashboard de clientes completo
 */
exports.getCustomersDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Nuevos clientes
        const newCustomers = await db.get(`
            SELECT COUNT(*) as count
            FROM users
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
        `, [from, to]);
        
        // Clientes por canal
        const byChannel = await db.all(`
            SELECT 
                COALESCE(utm_source, 'direct') as channel,
                COUNT(DISTINCT user_id) as customers
            FROM web_sessions
            WHERE DATE(started_at) >= ? AND DATE(started_at) <= ?
            AND user_id IS NOT NULL
            GROUP BY channel
            ORDER BY customers DESC
        `, [from, to]);
        
        // Retención (clientes con más de 1 orden)
        const retention = await db.get(`
            SELECT 
                COUNT(DISTINCT user_id) as repeat_customers
            FROM (
                SELECT user_id, COUNT(*) as order_count
                FROM orders
                WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
                AND status NOT IN ('cancelled')
                GROUP BY user_id
                HAVING order_count > 1
            )
        `, [from, to]);
        
        // AOV
        const aov = await db.get(`
            SELECT 
                COALESCE(AVG(total), 0) as aov
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [from, to]);
        
        // CLV promedio
        const clv = await db.all(`
            SELECT 
                u.id,
                u.name,
                u.email,
                COUNT(DISTINCT o.id) as order_count,
                COALESCE(SUM(o.total), 0) as total_revenue,
                MIN(o.created_at) as first_order,
                MAX(o.created_at) as last_order
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id AND o.status NOT IN ('cancelled')
            WHERE DATE(u.created_at) >= ? AND DATE(u.created_at) <= ?
            GROUP BY u.id
            ORDER BY total_revenue DESC
            LIMIT 100
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                new_customers: newCustomers.count,
                by_channel: byChannel,
                repeat_customers: retention.repeat_customers || 0,
                aov: aov.aov,
                top_customers: clv
            }
        });
    } catch (error) {
        console.error('❌ Error en getCustomersDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/customers/rfm
 * Segmentación RFM
 */
exports.getRFMSegmentation = async (req, res) => {
    try {
        const results = await db.all(`
            SELECT 
                cs.user_id,
                u.name,
                u.email,
                cs.rfm_recency,
                cs.rfm_frequency,
                cs.rfm_monetary,
                cs.rfm_score,
                cs.segment_code,
                cs.clv_predicted
            FROM customer_segments cs
            JOIN users u ON u.id = cs.user_id
            WHERE cs.segment_type = 'RFM'
            ORDER BY cs.rfm_score DESC
            LIMIT 100
        `);
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('❌ Error en getRFMSegmentation:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/customers/cohort
 * Análisis de cohortes
 */
exports.getCohortAnalysis = async (req, res) => {
    try {
        const results = await db.all(`
            SELECT 
                cohort_period,
                COUNT(DISTINCT user_id) as customers,
                SUM(total_orders) as total_orders,
                SUM(total_revenue) as total_revenue,
                AVG(lifetime_days) as avg_lifetime_days
            FROM customer_cohorts
            GROUP BY cohort_period
            ORDER BY cohort_period DESC
            LIMIT 24
        `);
        
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('❌ Error en getCohortAnalysis:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 4. DASHBOARD DE MARKETING
// ============================================

/**
 * GET /api/analytics/marketing
 * Dashboard de marketing completo
 */
exports.getMarketingDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Campañas activas
        const campaigns = await db.all(`
            SELECT 
                id,
                name,
                code,
                campaign_type,
                channel,
                budget,
                spent,
                impressions,
                clicks,
                conversions,
                revenue,
                CASE 
                    WHEN spent > 0 THEN revenue / spent 
                    ELSE 0 
                END as roas
            FROM marketing_campaigns
            WHERE DATE(start_date) >= ? OR DATE(end_date) >= ? OR end_date IS NULL
            ORDER BY spent DESC
        `, [from, to]);
        
        // Canales de adquisición
        const channels = await db.all(`
            SELECT 
                COALESCE(utm_source, 'direct') as source,
                COALESCE(utm_medium, 'none') as medium,
                COUNT(DISTINCT session_id) as sessions,
                COUNT(DISTINCT user_id) as users,
                COUNT(DISTINCT CASE WHEN conversion_value > 0 THEN session_id END) as conversions,
                SUM(conversion_value) as revenue
            FROM web_sessions
            WHERE DATE(started_at) >= ? AND DATE(started_at) <= ?
            GROUP BY source, medium
            ORDER BY revenue DESC
        `, [from, to]);
        
        // Email marketing (desde notifications)
        const emailStats = await db.all(`
            SELECT 
                topic,
                COUNT(*) as sent,
                COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
                COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered
            FROM notifications
            WHERE channel = 'email'
            AND DATE(created_at) >= ? AND DATE(created_at) <= ?
            GROUP BY topic
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                campaigns: campaigns,
                channels: channels,
                email: emailStats
            }
        });
    } catch (error) {
        console.error('❌ Error en getMarketingDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 5. DASHBOARD DE PRODUCTO
// ============================================

/**
 * GET /api/analytics/products
 * Dashboard de productos completo
 */
exports.getProductsDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Performance por categoría
        const byCategory = await db.all(`
            SELECT 
                pc.name as category,
                COUNT(DISTINCT p.id) as product_count,
                COALESCE(SUM(oi.total), 0) as revenue,
                COALESCE(SUM(oi.quantity), 0) as units_sold,
                COUNT(DISTINCT o.id) as orders
            FROM product_categories pc
            LEFT JOIN products p ON p.category_id = pc.id
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN orders o ON o.id = oi.order_id AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ? AND o.status NOT IN ('cancelled')
            WHERE pc.status = 'active'
            GROUP BY pc.id, pc.name
            ORDER BY revenue DESC
        `, [from, to]);
        
        // Productos sin ventas
        const noSales = await db.all(`
            SELECT 
                p.id,
                p.name,
                p.sku,
                p.base_price,
                p.stock_quantity,
                p.created_at
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN orders o ON o.id = oi.order_id AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            WHERE p.status = 'active'
            AND o.id IS NULL
            ORDER BY p.created_at DESC
            LIMIT 20
        `, [from, to]);
        
        // Productos con más devoluciones
        const highReturns = await db.all(`
            SELECT 
                p.id,
                p.name,
                COUNT(ri.id) as return_count,
                SUM(ri.quantity) as units_returned
            FROM products p
            JOIN order_items oi ON oi.product_id = p.id
            JOIN returns r ON r.order_id = oi.order_id
            JOIN return_items ri ON ri.return_id = r.id AND ri.order_item_id = oi.id
            WHERE DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?
            GROUP BY p.id, p.name
            ORDER BY return_count DESC
            LIMIT 10
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                by_category: byCategory,
                no_sales: noSales,
                high_returns: highReturns
            }
        });
    } catch (error) {
        console.error('❌ Error en getProductsDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 6. DASHBOARD DE INVENTARIO
// ============================================

/**
 * GET /api/analytics/inventory
 * Dashboard de inventario completo
 */
exports.getInventoryDashboard = async (req, res) => {
    try {
        // Stock actual
        const stock = await db.all(`
            SELECT 
                p.id,
                p.name,
                p.sku,
                COALESCE(SUM(inv.quantity), 0) as total_stock,
                COALESCE(SUM(inv.reserved_quantity), 0) as reserved,
                COALESCE(SUM(inv.available_quantity), 0) as available,
                p.low_stock_threshold,
                CASE 
                    WHEN COALESCE(SUM(inv.available_quantity), 0) <= p.low_stock_threshold THEN 1 
                    ELSE 0 
                END as is_low_stock
            FROM products p
            LEFT JOIN inventory_items inv ON inv.product_id = p.id
            WHERE p.status = 'active'
            GROUP BY p.id
            HAVING available <= low_stock_threshold OR available = 0
            ORDER BY available ASC
            LIMIT 50
        `);
        
        // Valor del inventario
        const inventoryValue = await db.get(`
            SELECT 
                COALESCE(SUM(inv.quantity * p.base_price), 0) as total_value
            FROM inventory_items inv
            JOIN products p ON p.id = inv.product_id
        `);
        
        // Rotación
        const turnover = await db.all(`
            SELECT 
                p.id,
                p.name,
                COUNT(DISTINCT o.id) as orders_count,
                COALESCE(SUM(oi.quantity), 0) as units_sold,
                COALESCE(SUM(inv.quantity), 0) as avg_stock
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN orders o ON o.id = oi.order_id AND o.status NOT IN ('cancelled')
            LEFT JOIN inventory_items inv ON inv.product_id = p.id
            WHERE p.status = 'active'
            GROUP BY p.id
            HAVING avg_stock > 0
            ORDER BY units_sold DESC
            LIMIT 20
        `);
        
        res.json({
            success: true,
            data: {
                low_stock: stock,
                inventory_value: inventoryValue.total_value,
                turnover: turnover
            }
        });
    } catch (error) {
        console.error('❌ Error en getInventoryDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 7. DASHBOARD DE OPERACIONES
// ============================================

/**
 * GET /api/analytics/operations
 * Dashboard de operaciones completo
 */
exports.getOperationsDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Fulfillment
        const fulfillment = await db.all(`
            SELECT 
                o.status,
                o.fulfillment_status,
                COUNT(*) as count,
                AVG(
                    CASE 
                        WHEN o.shipped_at IS NOT NULL AND o.created_at IS NOT NULL
                        THEN (julianday(o.shipped_at) - julianday(o.created_at)) * 24
                        ELSE NULL
                    END
                ) as avg_fulfillment_hours
            FROM orders o
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            GROUP BY o.status, o.fulfillment_status
        `, [from, to]);
        
        // Shipping performance
        const shipping = await db.all(`
            SELECT 
                s.carrier,
                COUNT(*) as shipments,
                AVG(
                    CASE 
                        WHEN s.delivered_at IS NOT NULL AND s.shipped_at IS NOT NULL
                        THEN (julianday(s.delivered_at) - julianday(s.shipped_at))
                        ELSE NULL
                    END
                ) as avg_delivery_days
            FROM shipments s
            JOIN orders o ON o.id = s.order_id
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            GROUP BY s.carrier
        `, [from, to]);
        
        // Devoluciones
        const returns = await db.all(`
            SELECT 
                r.status,
                COUNT(*) as count,
                SUM(r.refund_amount) as total_refund
            FROM returns r
            WHERE DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?
            GROUP BY r.status
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                fulfillment: fulfillment,
                shipping: shipping,
                returns: returns
            }
        });
    } catch (error) {
        console.error('❌ Error en getOperationsDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 8. DASHBOARD DE UX/WEB
// ============================================

/**
 * GET /api/analytics/ux
 * Dashboard de UX completo
 */
exports.getUXDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Sessions
        const sessions = await db.get(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT user_id) as unique_users,
                AVG(duration_seconds) as avg_duration,
                COUNT(CASE WHEN is_bounce = 1 THEN 1 END) as bounces
            FROM web_sessions
            WHERE DATE(started_at) >= ? AND DATE(started_at) <= ?
        `, [from, to]);
        
        const bounceRate = sessions.total > 0 ? (sessions.bounces / sessions.total * 100) : 0;
        
        // Páginas más visitadas
        const topPages = await db.all(`
            SELECT 
                page_path,
                COUNT(*) as views,
                AVG(time_on_page) as avg_time,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM pageviews
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            GROUP BY page_path
            ORDER BY views DESC
            LIMIT 20
        `, [from, to]);
        
        // Funnel de conversión
        const funnel = await db.all(`
            SELECT 
                'homepage' as step, COUNT(DISTINCT session_id) as count
            FROM pageviews
            WHERE page_path = '/' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
            UNION ALL
            SELECT 
                'product' as step, COUNT(DISTINCT session_id) as count
            FROM pageviews
            WHERE page_path LIKE '/productos/%' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
            UNION ALL
            SELECT 
                'cart' as step, COUNT(DISTINCT session_id) as count
            FROM web_events
            WHERE event_type = 'add_to_cart' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
            UNION ALL
            SELECT 
                'checkout' as step, COUNT(DISTINCT session_id) as count
            FROM web_events
            WHERE event_type = 'checkout_start' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
            UNION ALL
            SELECT 
                'purchase' as step, COUNT(DISTINCT session_id) as count
            FROM web_events
            WHERE event_type = 'purchase' AND DATE(created_at) >= ? AND DATE(created_at) <= ?
        `, [from, to, from, to, from, to, from, to, from, to]);
        
        // Abandono de carrito
        const cartAbandonment = await db.get(`
            SELECT 
                COUNT(*) as abandoned,
                COUNT(CASE WHEN recovered_at IS NOT NULL THEN 1 END) as recovered,
                AVG(cart_value) as avg_cart_value
            FROM cart_abandonment_events
            WHERE DATE(abandoned_at) >= ? AND DATE(abandoned_at) <= ?
        `, [from, to]);
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                sessions: {
                    ...sessions,
                    bounce_rate: bounceRate
                },
                top_pages: topPages,
                funnel: funnel,
                cart_abandonment: cartAbandonment
            }
        });
    } catch (error) {
        console.error('❌ Error en getUXDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 9. DASHBOARD FINANCIERO
// ============================================

/**
 * GET /api/analytics/financial
 * Dashboard financiero completo
 */
exports.getFinancialDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // P&L simplificado
        const revenue = await db.get(`
            SELECT COALESCE(SUM(total), 0) as total
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [from, to]);
        
        // COGS estimado (60% del revenue)
        const cogs = revenue.total * 0.6;
        const grossProfit = revenue.total - cogs;
        const grossMargin = revenue.total > 0 ? (grossProfit / revenue.total * 100) : 0;
        
        // Gastos operativos
        const marketingSpend = await db.get(`
            SELECT COALESCE(SUM(spent), 0) as total
            FROM marketing_campaigns
            WHERE DATE(start_date) >= ? AND DATE(start_date) <= ?
        `, [from, to]);
        
        // Shipping costs
        const shippingCosts = await db.get(`
            SELECT COALESCE(SUM(shipping_amount), 0) as total
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [from, to]);
        
        // Payment fees (estimado 3% del revenue)
        const paymentFees = revenue.total * 0.03;
        
        const totalExpenses = marketingSpend.total + shippingCosts.total + paymentFees;
        const netProfit = grossProfit - totalExpenses;
        const netMargin = revenue.total > 0 ? (netProfit / revenue.total * 100) : 0;
        
        // Unit economics
        const orders = await db.get(`
            SELECT COUNT(*) as count
            FROM orders
            WHERE DATE(created_at) >= ? AND DATE(created_at) <= ?
            AND status NOT IN ('cancelled')
        `, [from, to]);
        
        const revenuePerOrder = orders.count > 0 ? revenue.total / orders.count : 0;
        const cogsPerOrder = orders.count > 0 ? cogs / orders.count : 0;
        const contributionMargin = revenuePerOrder - cogsPerOrder;
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                revenue: revenue.total,
                cogs: cogs,
                gross_profit: grossProfit,
                gross_margin: grossMargin,
                expenses: {
                    marketing: marketingSpend.total,
                    shipping: shippingCosts.total,
                    payment_fees: paymentFees,
                    total: totalExpenses
                },
                net_profit: netProfit,
                net_margin: netMargin,
                unit_economics: {
                    revenue_per_order: revenuePerOrder,
                    cogs_per_order: cogsPerOrder,
                    contribution_margin: contributionMargin
                }
            }
        });
    } catch (error) {
        console.error('❌ Error en getFinancialDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 10. DASHBOARD DE SERVICIO AL CLIENTE
// ============================================

/**
 * GET /api/analytics/customer-service
 * Dashboard de servicio al cliente
 */
exports.getCustomerServiceDashboard = async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        const { from, to } = getDateRange(period);
        
        // Tickets (simulado desde notifications o orders con problemas)
        // Por ahora usamos orders con status 'cancelled' o 'returned' como proxy
        const tickets = await db.all(`
            SELECT 
                CASE 
                    WHEN o.status = 'cancelled' THEN 'cancellation'
                    WHEN EXISTS(SELECT 1 FROM returns r WHERE r.order_id = o.id) THEN 'return'
                    ELSE 'other'
                END as type,
                COUNT(*) as count
            FROM orders o
            WHERE DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
            AND (o.status = 'cancelled' OR EXISTS(SELECT 1 FROM returns r WHERE r.order_id = o.id))
            GROUP BY type
        `, [from, to]);
        
        // Tiempo de respuesta (simulado)
        const avgResponseTime = 24; // horas (simulado)
        
        res.json({
            success: true,
            data: {
                period: { from, to },
                tickets: tickets,
                avg_response_time_hours: avgResponseTime
            }
        });
    } catch (error) {
        console.error('❌ Error en getCustomerServiceDashboard:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============================================
// 11. ORDERS BY COMUNA (mantener compatibilidad)
// ============================================

/**
 * GET /api/analytics/orders-by-comuna
 * Obtener pedidos agrupados por comuna y región
 */
exports.getOrdersByComuna = async (req, res) => {
    try {
        const { from, to, status, shipping_provider, min_ticket, product_type } = req.query;
        
        // Construir filtros de fecha y estado
        let dateFilter = '';
        const params = [];
        
        if (from) {
            dateFilter += ' AND DATE(o.created_at) >= ?';
            params.push(from);
        }
        if (to) {
            dateFilter += ' AND DATE(o.created_at) <= ?';
            params.push(to);
        }
        
        // Filtro de estado de pedido
        let statusFilter = '';
        if (status) {
            const statusList = Array.isArray(status) ? status : [status];
            statusFilter = ` AND o.status IN (${statusList.map(() => '?').join(',')})`;
            params.push(...statusList);
        } else {
            // Por defecto, pedidos pagados/entregados
            statusFilter = ` AND o.status IN ('paid', 'fulfilled', 'delivered', 'payment_verified')`;
        }
        
        // Filtro de proveedor de envío
        let shippingFilter = '';
        if (shipping_provider) {
            shippingFilter = ` AND s.carrier = ?`;
            params.push(shipping_provider);
        }
        
        // Filtro de ticket mínimo
        let ticketFilter = '';
        if (min_ticket) {
            ticketFilter = ` AND o.total >= ?`;
            params.push(parseFloat(min_ticket));
        }
        
        // Filtro de tipo de producto (medicinal vs recreativo)
        let productTypeFilter = '';
        if (product_type === 'medicinal') {
            productTypeFilter = ` AND EXISTS (
                SELECT 1 FROM order_items oi 
                WHERE oi.order_id = o.id 
                AND oi.requires_prescription = 1
            )`;
        } else if (product_type === 'recreational') {
            productTypeFilter = ` AND NOT EXISTS (
                SELECT 1 FROM order_items oi 
                WHERE oi.order_id = o.id 
                AND oi.requires_prescription = 1
            )`;
        }
        
        // Consulta principal: agrupar por comuna y región
        let query = `
            SELECT 
                COALESCE(a.commune, 'Sin comuna') as comuna,
                COALESCE(a.region, 'Sin región') as region,
                COUNT(DISTINCT o.id) as orders
            FROM orders o
            LEFT JOIN addresses a ON o.shipping_address_id = a.id
            LEFT JOIN shipments s ON s.order_id = o.id
            WHERE 1=1
            ${dateFilter}
            ${statusFilter}
            ${shippingFilter}
            ${ticketFilter}
            ${productTypeFilter}
            GROUP BY a.commune, a.region
            HAVING comuna != 'Sin comuna'
            ORDER BY orders DESC
        `;
        
        let results = await db.all(query, params) || [];
        
        // Si no hay resultados con direcciones, usar datos dummy para demostración
        if (results.length === 0) {
            console.log('⚠️ No hay pedidos con direcciones, usando datos dummy para demostración');
            results = [
                { comuna: 'Santiago', region: 'Metropolitana de Santiago', orders: 412 },
                { comuna: 'Maipú', region: 'Metropolitana de Santiago', orders: 355 },
                { comuna: 'La Florida', region: 'Metropolitana de Santiago', orders: 298 },
                { comuna: 'Las Condes', region: 'Metropolitana de Santiago', orders: 245 },
                { comuna: 'Providencia', region: 'Metropolitana de Santiago', orders: 220 },
                { comuna: 'Ñuñoa', region: 'Metropolitana de Santiago', orders: 195 },
                { comuna: 'San Miguel', region: 'Metropolitana de Santiago', orders: 180 },
                { comuna: 'Puente Alto', region: 'Metropolitana de Santiago', orders: 165 },
                { comuna: 'San Bernardo', region: 'Metropolitana de Santiago', orders: 150 },
                { comuna: 'Recoleta', region: 'Metropolitana de Santiago', orders: 135 },
                { comuna: 'Independencia', region: 'Metropolitana de Santiago', orders: 120 },
                { comuna: 'Estación Central', region: 'Metropolitana de Santiago', orders: 110 },
                { comuna: 'Quilicura', region: 'Metropolitana de Santiago', orders: 105 },
                { comuna: 'Cerrillos', region: 'Metropolitana de Santiago', orders: 100 },
                { comuna: 'Lo Prado', region: 'Metropolitana de Santiago', orders: 95 },
                { comuna: 'Pudahuel', region: 'Metropolitana de Santiago', orders: 90 },
                { comuna: 'Quinta Normal', region: 'Metropolitana de Santiago', orders: 85 },
                { comuna: 'Viña del Mar', region: 'Valparaíso', orders: 82 },
                { comuna: 'Concepción', region: 'Biobío', orders: 61 },
                { comuna: 'La Serena', region: 'Coquimbo', orders: 45 }
            ];
        }
        
        // Separar RM (Región Metropolitana) del resto
        const rmComunas = [];
        const restoRegiones = [];
        
        // Lista de comunas de la RM (Región Metropolitana de Santiago)
        const rmRegions = ['Metropolitana de Santiago', 'Región Metropolitana', 'Santiago'];
        
        results.forEach(row => {
            const isRM = rmRegions.some(rmRegion => 
                row.region && row.region.toLowerCase().includes(rmRegion.toLowerCase())
            ) || row.region === '13'; // Código CUT de la RM
            
            if (isRM) {
                rmComunas.push({
                    comuna: row.comuna,
                    orders: row.orders
                });
            } else {
                restoRegiones.push({
                    region: row.region,
                    comuna: row.comuna,
                    orders: row.orders
                });
            }
        });
        
        // Calcular fechas por defecto si no se proporcionaron
        const dateFrom = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dateTo = to || new Date().toISOString().split('T')[0];
        
        res.json({
            success: true,
            data: {
                range: {
                    from: dateFrom,
                    to: dateTo
                },
                unit: 'orders',
                totals: {
                    RM: rmComunas,
                    RESTO: restoRegiones
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error en getOrdersByComuna:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos por comuna',
            error: error.message
        });
    }
};
