// ============================================
// SERVICIO: Alertas y Notificaciones Automáticas
// ============================================

const Database = require('../database/db');
const db = Database.getInstance();

class AlertService {
    /**
     * Verificar stock crítico y generar alertas
     */
    async checkLowStock() {
        try {
            const lowStockProducts = await db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.sku,
                    COALESCE(SUM(inv.available_quantity), 0) as available,
                    p.low_stock_threshold
                FROM products p
                LEFT JOIN inventory_items inv ON inv.product_id = p.id
                WHERE p.status = 'active'
                GROUP BY p.id
                HAVING available <= p.low_stock_threshold AND available > 0
            `);

            const outOfStock = await db.all(`
                SELECT 
                    p.id,
                    p.name,
                    p.sku,
                    COALESCE(SUM(inv.available_quantity), 0) as available
                FROM products p
                LEFT JOIN inventory_items inv ON inv.product_id = p.id
                WHERE p.status = 'active'
                GROUP BY p.id
                HAVING available = 0
            `);

            // Crear notificaciones para admins
            const adminUsers = await db.all(`
                SELECT id FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                WHERE r.code IN ('admin', 'super_admin', 'manager')
                AND u.status = 'active'
            `);

            const alerts = [];
            
            if (lowStockProducts.length > 0) {
                for (const admin of adminUsers) {
                    await db.run(`
                        INSERT INTO notifications 
                        (user_id, channel, topic, subject, message, status, priority, created_at)
                        VALUES (?, 'dashboard', 'low_stock', ?, ?, 'queued', 'high', ?)
                    `, [
                        admin.id,
                        `Stock Bajo: ${lowStockProducts.length} productos`,
                        `${lowStockProducts.length} productos tienen stock bajo. Revisar: ${lowStockProducts.slice(0, 5).map(p => p.name).join(', ')}`,
                        new Date().toISOString()
                    ]);
                }
                alerts.push({
                    type: 'low_stock',
                    count: lowStockProducts.length,
                    products: lowStockProducts
                });
            }

            if (outOfStock.length > 0) {
                for (const admin of adminUsers) {
                    await db.run(`
                        INSERT INTO notifications 
                        (user_id, channel, topic, subject, message, status, priority, created_at)
                        VALUES (?, 'dashboard', 'out_of_stock', ?, ?, 'queued', 'urgent', ?)
                    `, [
                        admin.id,
                        `Sin Stock: ${outOfStock.length} productos`,
                        `${outOfStock.length} productos están sin stock. Revisar: ${outOfStock.slice(0, 5).map(p => p.name).join(', ')}`,
                        new Date().toISOString()
                    ]);
                }
                alerts.push({
                    type: 'out_of_stock',
                    count: outOfStock.length,
                    products: outOfStock
                });
            }

            return alerts;
        } catch (error) {
            console.error('Error checking low stock:', error);
            throw error;
        }
    }

    /**
     * Detectar anomalías en revenue (caídas o picos inusuales)
     */
    async detectRevenueAnomalies() {
        try {
            // Comparar revenue de últimos 7 días vs 7 días anteriores
            const now = new Date();
            const last7Days = new Date(now);
            last7Days.setDate(last7Days.getDate() - 7);
            const prev7Days = new Date(last7Days);
            prev7Days.setDate(prev7Days.getDate() - 7);

            const last7Revenue = await db.get(`
                SELECT COALESCE(SUM(total), 0) as revenue
                FROM orders
                WHERE DATE(created_at) >= ? AND DATE(created_at) < ?
                AND status NOT IN ('cancelled')
            `, [last7Days.toISOString().split('T')[0], now.toISOString().split('T')[0]]);

            const prev7Revenue = await db.get(`
                SELECT COALESCE(SUM(total), 0) as revenue
                FROM orders
                WHERE DATE(created_at) >= ? AND DATE(created_at) < ?
                AND status NOT IN ('cancelled')
            `, [prev7Days.toISOString().split('T')[0], last7Days.toISOString().split('T')[0]]);

            const change = prev7Revenue.revenue > 0 
                ? ((last7Revenue.revenue - prev7Revenue.revenue) / prev7Revenue.revenue * 100)
                : 0;

            // Alerta si hay caída > 30% o pico > 50%
            if (change < -30 || change > 50) {
                const adminUsers = await db.all(`
                    SELECT id FROM users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    WHERE r.code IN ('admin', 'super_admin')
                    AND u.status = 'active'
                `);

                const alertType = change < -30 ? 'revenue_drop' : 'revenue_spike';
                const message = change < -30
                    ? `⚠️ Caída de revenue: ${change.toFixed(1)}% vs período anterior`
                    : `📈 Pico de revenue: +${change.toFixed(1)}% vs período anterior`;

                for (const admin of adminUsers) {
                    await db.run(`
                        INSERT INTO notifications 
                        (user_id, channel, topic, subject, message, status, priority, created_at)
                        VALUES (?, 'dashboard', ?, ?, ?, 'queued', 'high', ?)
                    `, [
                        admin.id,
                        alertType,
                        'Anomalía de Revenue Detectada',
                        message,
                        new Date().toISOString()
                    ]);
                }

                return {
                    type: alertType,
                    change: change,
                    last7Revenue: last7Revenue.revenue,
                    prev7Revenue: prev7Revenue.revenue
                };
            }

            return null;
        } catch (error) {
            console.error('Error detecting revenue anomalies:', error);
            throw error;
        }
    }

    /**
     * Detectar fraude básico (pedidos sospechosos)
     */
    async detectFraud() {
        try {
            // Detectar pedidos con valores muy altos o patrones sospechosos
            const suspiciousOrders = await db.all(`
                SELECT 
                    o.id,
                    o.order_number,
                    o.user_id,
                    o.total,
                    u.email,
                    COUNT(DISTINCT o2.id) as user_order_count
                FROM orders o
                JOIN users u ON u.id = o.user_id
                LEFT JOIN orders o2 ON o2.user_id = o.user_id AND DATE(o2.created_at) = DATE(o.created_at)
                WHERE DATE(o.created_at) >= DATE('now', '-7 days')
                AND o.status NOT IN ('cancelled')
                GROUP BY o.id
                HAVING o.total > 500000 OR user_order_count > 5
            `);

            if (suspiciousOrders.length > 0) {
                const adminUsers = await db.all(`
                    SELECT id FROM users u
                    JOIN user_roles ur ON ur.user_id = u.id
                    JOIN roles r ON r.id = ur.role_id
                    WHERE r.code IN ('admin', 'super_admin')
                    AND u.status = 'active'
                `);

                for (const admin of adminUsers) {
                    await db.run(`
                        INSERT INTO notifications 
                        (user_id, channel, topic, subject, message, status, priority, created_at)
                        VALUES (?, 'dashboard', 'fraud_alert', ?, ?, 'queued', 'urgent', ?)
                    `, [
                        admin.id,
                        'Alerta de Fraude',
                        `${suspiciousOrders.length} pedidos sospechosos detectados. Revisar: ${suspiciousOrders.slice(0, 3).map(o => o.order_number).join(', ')}`,
                        new Date().toISOString()
                    ]);
                }

                return suspiciousOrders;
            }

            return [];
        } catch (error) {
            console.error('Error detecting fraud:', error);
            throw error;
        }
    }

    /**
     * Ejecutar todas las verificaciones de alertas
     */
    async runAllChecks() {
        const results = {
            lowStock: await this.checkLowStock(),
            revenueAnomalies: await this.detectRevenueAnomalies(),
            fraud: await this.detectFraud()
        };
        return results;
    }
}

module.exports = new AlertService();

