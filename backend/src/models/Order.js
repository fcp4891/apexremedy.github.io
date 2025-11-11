// ============================================
// MODELO: Order - ACTUALIZADO CON SISTEMA DE PAGOS
// ============================================

const BaseModel = require('./index');

class Order extends BaseModel {
    constructor() {
        super('orders');
    }

    // ============================================
    // MÉTODOS ORIGINALES (MANTENIDOS)
    // ============================================

    /**
     * Buscar órdenes por usuario
     * ACTUALIZADO: Agregado parámetro limit
     */
    async findByUserId(userId, limit = 50) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [userId, limit]);
    }

    /**
     * Buscar orden con items
     */
    async findByIdWithItems(id) {
        const order = await this.findById(id);
        if (!order) return null;

        const itemsSql = `
            SELECT * FROM order_items 
            WHERE order_id = ?
        `;
        order.items = await this.db.all(itemsSql, [id]);

        return order;
    }

    /**
     * Buscar órdenes con filtros
     * ACTUALIZADO: Agregado filtro payment_status y JOIN con users para obtener datos del cliente
     */
    async findAllWithFilters(filters = {}) {
        // Verificar columnas disponibles en orders
        let hasCustomerFields = false;
        let hasPaymentMethod = false;
        try {
            const tableInfo = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const columnNames = tableInfo.map(col => col.name);
            hasCustomerFields = columnNames.includes('customer_name') && columnNames.includes('customer_email');
            hasPaymentMethod = columnNames.includes('payment_method');
        } catch (error) {
            console.warn('⚠️ No se pudo verificar columnas de orders:', error.message);
        }
        
        // Construir SQL con JOINs necesarios
        let sql;
        if (hasCustomerFields) {
            // La tabla tiene los campos directamente, usarlos con fallback a users
            sql = `SELECT o.*, 
                   COALESCE(
                       o.customer_name, 
                       u.name, 
                       CASE 
                           WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL 
                           THEN TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))
                           ELSE NULL
                       END
                   ) as customer_name,
                   COALESCE(o.customer_email, u.email) as customer_email,
                   u.name as user_name,
                   u.email as user_email`;
        } else {
            // La tabla no tiene los campos, obtenerlos del JOIN con users
            sql = `SELECT o.*, 
                   COALESCE(
                       u.name,
                       CASE 
                           WHEN u.first_name IS NOT NULL OR u.last_name IS NOT NULL 
                           THEN TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))
                           ELSE NULL
                       END,
                       'Cliente sin nombre'
                   ) as customer_name,
                   COALESCE(u.email, '') as customer_email,
                   u.name as user_name,
                   u.email as user_email`;
        }
        
        // Agregar payment_method desde payments
        // Si la tabla orders tiene payment_method, usarlo con fallback a payments
        // Si no, obtenerlo solo desde payments
        if (hasPaymentMethod) {
            sql += `, 
                   COALESCE(o.payment_method, p.method, 'cash') as payment_method,
                   p.method as payment_method_from_payments`;
        } else {
            sql += `, 
                   COALESCE(p.method, 'cash') as payment_method,
                   p.method as payment_method_from_payments,
                   p.status as payment_status_from_payments`;
        }
        
        sql += ` FROM ${this.tableName} o
                   LEFT JOIN users u ON o.user_id = u.id
                   LEFT JOIN (
                       SELECT p1.order_id, p1.method, p1.status
                       FROM payments p1
                       INNER JOIN (
                           SELECT order_id, MAX(created_at) as max_created_at
                           FROM payments
                           GROUP BY order_id
                       ) p2 ON p1.order_id = p2.order_id AND p1.created_at = p2.max_created_at
                   ) p ON o.id = p.order_id
                   WHERE 1=1`;
        
        const params = [];

        if (filters.status) {
            sql += ' AND o.status = ?';
            params.push(filters.status);
        }

        if (filters.payment_status) {
            sql += ' AND o.payment_status = ?';
            params.push(filters.payment_status);
        }

        if (filters.user_id) {
            sql += ' AND o.user_id = ?';
            params.push(filters.user_id);
        }

        sql += ' ORDER BY o.created_at DESC';

        if (filters.limit) {
            sql += ` LIMIT ${parseInt(filters.limit)}`;
        }

        if (filters.offset) {
            sql += ` OFFSET ${parseInt(filters.offset)}`;
        }

        return await this.db.all(sql, params);
    }

    /**
     * Obtener estadísticas
     * ACTUALIZADO: Agregadas estadísticas de pagos
     */
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'pending_payment' THEN 1 END) as pending_payment,
                COUNT(CASE WHEN status = 'payment_verified' THEN 1 END) as payment_verified,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
                COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as payments_pending,
                COUNT(CASE WHEN payment_status = 'verified' THEN 1 END) as payments_verified,
                COUNT(CASE WHEN payment_status = 'rejected' THEN 1 END) as payments_rejected,
                COUNT(CASE WHEN payment_method = 'transfer' THEN 1 END) as transfer_orders,
                COUNT(CASE WHEN payment_method = 'cash' THEN 1 END) as cash_orders,
                SUM(total) as total_revenue,
                AVG(total) as average_order_value,
                SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END) as delivered_revenue
            FROM ${this.tableName}
        `;

        return await this.db.get(sql);
    }

    // ============================================
    // NUEVOS MÉTODOS - SISTEMA DE PAGOS
    // ============================================

    /**
     * Buscar órdenes con pagos pendientes
     * Para panel de admin
     */
    async findPendingPayments() {
        const sql = `
            SELECT 
                o.*,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                julianday('now') - julianday(o.created_at) as days_pending
            FROM ${this.tableName} o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.payment_status = 'pending'
            AND o.payment_method = 'transfer'
            AND o.status != 'cancelled'
            ORDER BY o.created_at ASC
        `;

        return await this.db.all(sql);
    }

    /**
     * Buscar órdenes por método de pago
     */
    async findByPaymentMethod(paymentMethod, limit = 50) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE payment_method = ?
            ORDER BY created_at DESC
            LIMIT ?
        `;

        return await this.db.all(sql, [paymentMethod, limit]);
    }

    /**
     * Buscar órdenes por estado de pago
     */
    async findByPaymentStatus(paymentStatus, limit = 50) {
        const sql = `
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM ${this.tableName} o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.payment_status = ?
            ORDER BY o.created_at DESC
            LIMIT ?
        `;

        return await this.db.all(sql, [paymentStatus, limit]);
    }

    /**
     * Actualizar estado de pago
     */
    async updatePaymentStatus(id, status, verifiedBy = null) {
        const updates = {
            payment_status: status,
            payment_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (verifiedBy) {
            updates.payment_verified_by = verifiedBy;
        }

        return await this.update(id, updates);
    }

    /**
     * Confirmar pago
     */
    async confirmPayment(id, adminId, notes = null) {
        const updates = {
            payment_status: 'verified',
            payment_verified_at: new Date().toISOString(),
            payment_verified_by: adminId,
            status: 'payment_verified',
            updated_at: new Date().toISOString()
        };

        if (notes) {
            updates.admin_notes = notes;
        }

        return await this.update(id, updates);
    }

    /**
     * Rechazar pago
     */
    async rejectPayment(id, adminId, reason) {
        const updates = {
            payment_status: 'rejected',
            payment_verified_at: new Date().toISOString(),
            payment_verified_by: adminId,
            rejection_reason: reason,
            updated_at: new Date().toISOString()
        };

        return await this.update(id, updates);
    }

    /**
     * Actualizar comprobante de pago
     */
    async updatePaymentProof(id, filePath) {
        return await this.update(id, {
            payment_proof: filePath,
            updated_at: new Date().toISOString()
        });
    }

    /**
     * Obtener órdenes con comprobante subido pero no verificadas
     */
    async findPendingVerification() {
        const sql = `
            SELECT 
                o.*,
                u.name as user_name,
                u.email as user_email
            FROM ${this.tableName} o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.payment_proof IS NOT NULL
            AND o.payment_status = 'pending'
            AND o.status != 'cancelled'
            ORDER BY o.created_at ASC
        `;

        return await this.db.all(sql);
    }

    /**
     * Contar órdenes por estado de pago
     */
    async countByPaymentStatus() {
        const sql = `
            SELECT 
                payment_status,
                COUNT(*) as count,
                SUM(total) as total_amount
            FROM ${this.tableName}
            WHERE status != 'cancelled'
            GROUP BY payment_status
        `;

        return await this.db.all(sql);
    }

    /**
     * Obtener reporte de pagos por período
     */
    async getPaymentReport(startDate, endDate) {
        const sql = `
            SELECT 
                date(created_at) as date,
                payment_method,
                payment_status,
                COUNT(*) as count,
                SUM(total) as total
            FROM ${this.tableName}
            WHERE created_at BETWEEN ? AND ?
            GROUP BY date(created_at), payment_method, payment_status
            ORDER BY date DESC
        `;

        return await this.db.all(sql, [startDate, endDate]);
    }

    /**
     * Buscar órdenes con pagos rechazados
     */
    async findRejectedPayments(limit = 50) {
        const sql = `
            SELECT 
                o.*,
                u.name as user_name,
                u.email as user_email,
                admin.name as verified_by_name
            FROM ${this.tableName} o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN users admin ON o.payment_verified_by = admin.id
            WHERE o.payment_status = 'rejected'
            ORDER BY o.payment_verified_at DESC
            LIMIT ?
        `;

        return await this.db.all(sql, [limit]);
    }

    /**
     * Obtener órdenes recientes del usuario
     */
    async findRecentByUserId(userId, days = 30) {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE user_id = ?
            AND created_at >= datetime('now', '-${days} days')
            ORDER BY created_at DESC
        `;

        return await this.db.all(sql, [userId]);
    }

    /**
     * Verificar si usuario tiene órdenes pendientes de pago
     */
    async hasPendingPayments(userId) {
        const sql = `
            SELECT COUNT(*) as count
            FROM ${this.tableName}
            WHERE user_id = ?
            AND payment_status = 'pending'
            AND status != 'cancelled'
        `;

        const result = await this.db.get(sql, [userId]);
        return result.count > 0;
    }

    /**
     * Cancelar orden y actualizar fecha
     */
    async cancelOrder(id) {
        return await this.update(id, {
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    /**
     * Marcar orden como entregada
     */
    async markAsDelivered(id) {
        return await this.update(id, {
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    }

    /**
     * Buscar órdenes por rango de fechas
     */
    async findByDateRange(startDate, endDate, userId = null) {
        let sql = `
            SELECT * FROM ${this.tableName}
            WHERE created_at BETWEEN ? AND ?
        `;
        const params = [startDate, endDate];

        if (userId) {
            sql += ' AND user_id = ?';
            params.push(userId);
        }

        sql += ' ORDER BY created_at DESC';

        return await this.db.all(sql, params);
    }

    /**
     * Obtener total de ventas por período
     */
    async getTotalSales(startDate, endDate) {
        const sql = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(total) as total_revenue,
                AVG(total) as average_order
            FROM ${this.tableName}
            WHERE created_at BETWEEN ? AND ?
            AND status IN ('delivered', 'shipped', 'processing', 'payment_verified')
        `;

        return await this.db.get(sql, [startDate, endDate]);
    }
}

module.exports = Order;