// ============================================
// MODELO: Payment
// ============================================

const BaseModel = require('./index');

class Payment extends BaseModel {
    constructor() {
        super('payments');
    }

    /**
     * Buscar pagos con filtros avanzados
     */
    async findAllWithFilters(filters = {}) {
        try {
            // Primero verificar si la tabla existe
            const tableExists = await this.db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [this.tableName]
            );
            
            if (!tableExists) {
                console.warn(`⚠️ Tabla ${this.tableName} no existe. Retornando array vacío.`);
                return [];
            }

            // Verificar columnas disponibles
            const tableCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const colNames = tableCols.map(c => c.name);
            const hasAmountGross = colNames.includes('amount_gross');
            const hasCustomerId = colNames.includes('customer_id');
            const hasProviderId = colNames.includes('provider_id');
            
            let sql = `SELECT p.*, 
                   o.order_number,
                   o.user_id as order_user_id`;
            
            if (hasCustomerId || colNames.includes('order_id')) {
                sql += `, u.name as customer_name_full, 
                   u.email as customer_email_full,
                   u.name as customer_name,
                   u.email as customer_email`;
            } else {
                sql += `, NULL as customer_name_full, 
                   NULL as customer_email_full,
                   NULL as customer_name,
                   NULL as customer_email`;
            }
            
            if (hasProviderId) {
                sql += `, pp.name as provider_name`;
            } else {
                sql += `, NULL as provider_name`;
            }
            
            sql += ` FROM ${this.tableName} p`;
            
            if (colNames.includes('order_id')) {
                sql += ` LEFT JOIN orders o ON p.order_id = o.id`;
            } else {
                sql += ` LEFT JOIN orders o ON 1=0`; // Join que nunca matchea
            }
            
            if (hasCustomerId || colNames.includes('order_id')) {
                sql += ` LEFT JOIN users u ON COALESCE(${hasCustomerId ? 'p.customer_id' : 'NULL'}, ${colNames.includes('order_id') ? 'o.user_id' : 'NULL'}) = u.id`;
            } else {
                sql += ` LEFT JOIN users u ON 1=0`; // Join que nunca matchea
            }
            
            if (hasProviderId) {
                sql += ` LEFT JOIN payment_providers pp ON p.provider_id = pp.id`;
            } else {
                sql += ` LEFT JOIN payment_providers pp ON 1=0`; // Join que nunca matchea
            }
            
            sql += ` WHERE 1=1`;
            const params = [];

            if (filters.status) {
                sql += ' AND p.status = ?';
                params.push(filters.status);
            }

            if (filters.method) {
                sql += ' AND p.method = ?';
                params.push(filters.method);
            }

            if (filters.provider_id) {
                sql += ' AND p.provider_id = ?';
                params.push(filters.provider_id);
            }

            if (filters.order_id) {
                sql += ' AND p.order_id = ?';
                params.push(filters.order_id);
            }

            if (filters.customer_id) {
                sql += ' AND p.customer_id = ?';
                params.push(filters.customer_id);
            }

            if (filters.date_from) {
                sql += ' AND DATE(p.created_at) >= ?';
                params.push(filters.date_from);
            }

            if (filters.date_to) {
                sql += ' AND DATE(p.created_at) <= ?';
                params.push(filters.date_to);
            }

            if (filters.amount_min) {
                sql += ' AND p.amount_gross >= ?';
                params.push(filters.amount_min);
            }

            if (filters.amount_max) {
                sql += ' AND p.amount_gross <= ?';
                params.push(filters.amount_max);
            }

            sql += ' ORDER BY p.created_at DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }
            
            if (filters.offset !== undefined && filters.offset !== null) {
                sql += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }

            return await this.db.all(sql, params);
        } catch (error) {
            console.error(`Error en findAllWithFilters para ${this.tableName}:`, error);
            // Si hay error de tabla no existe, retornar array vacío
            if (error.message && error.message.includes('no such table')) {
                return [];
            }
            throw error;
        }
    }

    /**
     * Buscar pago por ID con información relacionada
     */
    async findByIdWithDetails(id) {
        try {
            // Verificar columnas disponibles
            const tableCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const colNames = tableCols.map(c => c.name);
            const hasCustomerId = colNames.includes('customer_id');
            const hasProviderId = colNames.includes('provider_id');
            
            let sql = `SELECT p.*, o.order_number, o.user_id as order_user_id`;
            
            if (hasCustomerId || colNames.includes('order_id')) {
                sql += `, u.name as customer_name_full, u.email as customer_email_full,
                        u.name as customer_name, u.email as customer_email`;
            } else {
                sql += `, NULL as customer_name_full, NULL as customer_email_full,
                        NULL as customer_name, NULL as customer_email`;
            }
            
            if (hasProviderId) {
                sql += `, pp.name as provider_name`;
            } else {
                sql += `, NULL as provider_name`;
            }
            
            sql += ` FROM ${this.tableName} p`;
            
            if (colNames.includes('order_id')) {
                sql += ` LEFT JOIN orders o ON p.order_id = o.id`;
            } else {
                sql += ` LEFT JOIN orders o ON 1=0`;
            }
            
            if (hasCustomerId || colNames.includes('order_id')) {
                sql += ` LEFT JOIN users u ON COALESCE(${hasCustomerId ? 'p.customer_id' : 'NULL'}, ${colNames.includes('order_id') ? 'o.user_id' : 'NULL'}) = u.id`;
            } else {
                sql += ` LEFT JOIN users u ON 1=0`;
            }
            
            if (hasProviderId) {
                sql += ` LEFT JOIN payment_providers pp ON p.provider_id = pp.id`;
            } else {
                sql += ` LEFT JOIN payment_providers pp ON 1=0`;
            }
            
            sql += ` WHERE p.id = ?`;
            return await this.db.get(sql, [id]);
        } catch (error) {
            console.error(`Error en findByIdWithDetails para ${this.tableName}:`, error);
            throw error;
        }
    }

    /**
     * Capturar un pago autorizado
     */
    async capture(id) {
        const payment = await this.findById(id);
        if (!payment) {
            throw new Error('Pago no encontrado');
        }

        if (payment.status !== 'authorized') {
            throw new Error(`No se puede capturar un pago con estado: ${payment.status}`);
        }

        return await this.update(id, {
            status: 'captured',
            captured_at: new Date().toISOString()
        });
    }

    /**
     * Anular un pago
     */
    async void(id) {
        const payment = await this.findById(id);
        if (!payment) {
            throw new Error('Pago no encontrado');
        }

        if (!['authorized', 'pending'].includes(payment.status)) {
            throw new Error(`No se puede anular un pago con estado: ${payment.status}`);
        }

        return await this.update(id, {
            status: 'voided'
        });
    }

    /**
     * Reintentar un pago fallido
     */
    async retry(id, newData = {}) {
        const payment = await this.findById(id);
        if (!payment) {
            throw new Error('Pago no encontrado');
        }

        if (payment.status !== 'failed') {
            throw new Error('Solo se pueden reintentar pagos fallidos');
        }

        return await this.update(id, {
            status: 'pending',
            failure_code: null,
            failure_message: null,
            ...newData
        });
    }

    /**
     * Obtener estadísticas de pagos
     */
    async getStats(filters = {}) {
        try {
            // Verificar si la tabla existe
            const tableExists = await this.db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [this.tableName]
            );
            
            if (!tableExists) {
                return {
                    total: 0,
                    authorized: 0,
                    captured: 0,
                    failed: 0,
                    voided: 0,
                    total_captured: 0,
                    total_net: 0,
                    total_fees: 0
                };
            }

            let sql = `SELECT 
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'authorized' THEN 1 ELSE 0 END) as authorized,
                   SUM(CASE WHEN status = 'captured' THEN 1 ELSE 0 END) as captured,
                   SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                   SUM(CASE WHEN status = 'voided' THEN 1 ELSE 0 END) as voided,
                   SUM(CASE WHEN status = 'captured' THEN amount_gross ELSE 0 END) as total_captured,
                   SUM(CASE WHEN status = 'captured' THEN amount_net ELSE 0 END) as total_net,
                   SUM(fee) as total_fees
                   FROM ${this.tableName}
                   WHERE 1=1`;
            const params = [];
            
            // Aplicar los mismos filtros que findAllWithFilters
            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }
            
            if (filters.method) {
                sql += ' AND method = ?';
                params.push(filters.method);
            }
            
            if (filters.date_from) {
                sql += ' AND DATE(created_at) >= ?';
                params.push(filters.date_from);
            }
            
            if (filters.date_to) {
                sql += ' AND DATE(created_at) <= ?';
                params.push(filters.date_to);
            }

            const result = await this.db.get(sql, params);
            return result || {
                total: 0,
                authorized: 0,
                captured: 0,
                failed: 0,
                voided: 0,
                total_captured: 0,
                total_net: 0,
                total_fees: 0
            };
        } catch (error) {
            console.error(`Error en getStats para ${this.tableName}:`, error);
            // Si hay error de tabla no existe, retornar estadísticas vacías
            if (error.message && error.message.includes('no such table')) {
                return {
                    total: 0,
                    authorized: 0,
                    captured: 0,
                    failed: 0,
                    voided: 0,
                    total_captured: 0,
                    total_net: 0,
                    total_fees: 0
                };
            }
            throw error;
        }
    }
}

// Exportar la clase para que pueda ser instanciada cuando sea necesario
module.exports = Payment;

