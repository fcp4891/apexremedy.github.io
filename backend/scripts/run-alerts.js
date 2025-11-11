// backend/scripts/run-alerts.js
// Script de alertas automáticas para dashboards
// Uso: node run-alerts.js [--check-all] [--email]

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const args = process.argv.slice(2);
const options = {
    checkAll: args.includes('--check-all'),
    sendEmail: args.includes('--email')
};

// ============================================
// UTILIDADES
// ============================================

const createDbHelper = (db) => ({
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    })
});

// ============================================
// SERVICIO DE ALERTAS
// ============================================

class AlertService {
    constructor(dbHelper) {
        this.db = dbHelper;
        this.alerts = [];
    }

    async detectRevenueAnomalies() {
        console.log('🔍 Detectando anomalías en revenue...');
        
        try {
            // Revenue últimos 7 días vs promedio de 30 días anteriores
            const last7Days = await this.db.get(`
                SELECT 
                    COALESCE(SUM(total), 0) as revenue,
                    COUNT(*) as orders
                FROM orders
                WHERE DATE(created_at) >= date('now', '-7 days')
                AND status NOT IN ('cancelled')
            `);

            const prev30Days = await this.db.get(`
                SELECT 
                    COALESCE(SUM(total), 0) / 30 as avg_daily_revenue
                FROM orders
                WHERE DATE(created_at) >= date('now', '-37 days')
                AND DATE(created_at) < date('now', '-7 days')
                AND status NOT IN ('cancelled')
            `);

            const currentDaily = last7Days.revenue / 7;
            const avgDaily = prev30Days.avg_daily_revenue || 0;
            
            if (avgDaily > 0) {
                const change = ((currentDaily - avgDaily) / avgDaily) * 100;
                
                if (Math.abs(change) > 30) {
                    this.alerts.push({
                        type: change > 0 ? 'success' : 'warning',
                        title: 'Anomalía en Revenue',
                        message: `Revenue ${change > 0 ? 'aumentó' : 'disminuyó'} ${Math.abs(change).toFixed(1)}% vs promedio histórico`,
                        severity: Math.abs(change) > 50 ? 'high' : 'medium',
                        metric: 'revenue',
                        value: currentDaily,
                        threshold: avgDaily
                    });
                }
            }
        } catch (error) {
            console.error('Error detectando anomalías:', error);
        }
    }

    async checkLowStock() {
        console.log('📦 Verificando stock crítico...');
        
        try {
            const lowStock = await this.db.all(`
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
                HAVING available <= low_stock_threshold
                ORDER BY available ASC
            `);

            if (lowStock.length > 0) {
                const critical = lowStock.filter(p => p.available === 0);
                const low = lowStock.filter(p => p.available > 0 && p.available <= p.low_stock_threshold);

                if (critical.length > 0) {
                    this.alerts.push({
                        type: 'error',
                        title: 'Stock Crítico',
                        message: `${critical.length} productos sin stock`,
                        severity: 'high',
                        metric: 'stock',
                        count: critical.length,
                        products: critical.slice(0, 10)
                    });
                }

                if (low.length > 0) {
                    this.alerts.push({
                        type: 'warning',
                        title: 'Stock Bajo',
                        message: `${low.length} productos con stock bajo`,
                        severity: 'medium',
                        metric: 'stock',
                        count: low.length,
                        products: low.slice(0, 10)
                    });
                }
            }
        } catch (error) {
            console.error('Error verificando stock:', error);
        }
    }

    async detectFraud() {
        console.log('🚨 Detectando posibles fraudes...');
        
        try {
            // Pedidos con valor muy alto
            const highValueOrders = await this.db.all(`
                SELECT 
                    o.id,
                    o.order_number,
                    o.user_id,
                    o.total,
                    u.email,
                    COUNT(DISTINCT o2.id) as user_orders_count
                FROM orders o
                JOIN users u ON u.id = o.user_id
                LEFT JOIN orders o2 ON o2.user_id = o.user_id
                WHERE DATE(o.created_at) >= date('now', '-7 days')
                AND o.total > 500000
                AND o.payment_status = 'pending'
                GROUP BY o.id
                HAVING user_orders_count = 1
            `);

            if (highValueOrders.length > 0) {
                this.alerts.push({
                    type: 'warning',
                    title: 'Posible Fraude',
                    message: `${highValueOrders.length} pedidos de alto valor de nuevos clientes`,
                    severity: 'medium',
                    metric: 'fraud',
                    count: highValueOrders.length,
                    orders: highValueOrders.slice(0, 5)
                });
            }

            // Múltiples pedidos fallidos del mismo usuario
            const failedPayments = await this.db.all(`
                SELECT 
                    u.id,
                    u.email,
                    COUNT(*) as failed_count
                FROM payments p
                JOIN users u ON u.id = p.customer_id
                WHERE DATE(p.created_at) >= date('now', '-7 days')
                AND p.status = 'failed'
                GROUP BY u.id
                HAVING failed_count >= 3
            `);

            if (failedPayments.length > 0) {
                this.alerts.push({
                    type: 'warning',
                    title: 'Pagos Fallidos Recurrentes',
                    message: `${failedPayments.length} usuarios con 3+ pagos fallidos`,
                    severity: 'medium',
                    metric: 'fraud',
                    count: failedPayments.length,
                    users: failedPayments
                });
            }
        } catch (error) {
            console.error('Error detectando fraude:', error);
        }
    }

    async generateReport() {
        console.log('📊 Generando reporte automático...');
        
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const report = {
                date: today.toISOString().split('T')[0],
                revenue: await this.db.get(`
                    SELECT COALESCE(SUM(total), 0) as total
                    FROM orders
                    WHERE DATE(created_at) = date('now', '-1 day')
                    AND status NOT IN ('cancelled')
                `),
                orders: await this.db.get(`
                    SELECT COUNT(*) as count
                    FROM orders
                    WHERE DATE(created_at) = date('now', '-1 day')
                `),
                newCustomers: await this.db.get(`
                    SELECT COUNT(*) as count
                    FROM users
                    WHERE DATE(created_at) = date('now', '-1 day')
                `),
                lowStock: await this.db.get(`
                    SELECT COUNT(*) as count
                    FROM products p
                    LEFT JOIN inventory_items inv ON inv.product_id = p.id
                    WHERE p.status = 'active'
                    GROUP BY p.id
                    HAVING COALESCE(SUM(inv.available_quantity), 0) <= p.low_stock_threshold
                `)
            };

            return report;
        } catch (error) {
            console.error('Error generando reporte:', error);
            return null;
        }
    }

    getAlerts() {
        return this.alerts;
    }

    printAlerts() {
        if (this.alerts.length === 0) {
            console.log('✅ No hay alertas activas');
            return;
        }

        console.log(`\n⚠️  ${this.alerts.length} alerta(s) detectada(s):\n`);
        this.alerts.forEach((alert, i) => {
            console.log(`${i + 1}. [${alert.type.toUpperCase()}] ${alert.title}`);
            console.log(`   ${alert.message}`);
            if (alert.count) console.log(`   Cantidad: ${alert.count}`);
            console.log('');
        });
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function runAlerts() {
    const dbPath = path.join(__dirname, '../database/apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🔔 Ejecutando sistema de alertas...\n');

    try {
        const alertService = new AlertService(dbHelper);

        // Ejecutar todas las verificaciones
        await alertService.detectRevenueAnomalies();
        await alertService.checkLowStock();
        await alertService.detectFraud();

        // Mostrar alertas
        alertService.printAlerts();

        // Generar reporte
        if (options.checkAll) {
            const report = await alertService.generateReport();
            if (report) {
                console.log('\n📊 Reporte Diario:');
                console.log(`   Revenue: ${report.revenue.total ? `$${report.revenue.total.toLocaleString()}` : '$0'}`);
                console.log(`   Órdenes: ${report.orders.count || 0}`);
                console.log(`   Nuevos Clientes: ${report.newCustomers.count || 0}`);
                console.log(`   Productos Stock Bajo: ${report.lowStock ? report.lowStock.count : 0}`);
            }
        }

        // Enviar email si está habilitado
        if (options.sendEmail && alertService.getAlerts().length > 0) {
            console.log('\n📧 Enviando alertas por email...');
            // Aquí se integraría con el sistema de notificaciones
            console.log('   ✅ Alertas enviadas (simulado)');
        }

        console.log('\n✅ Proceso de alertas completado\n');

    } catch (error) {
        console.error('❌ Error en sistema de alertas:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar
if (require.main === module) {
    runAlerts()
        .then(() => {
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { AlertService, runAlerts };
