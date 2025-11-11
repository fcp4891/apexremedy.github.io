// ============================================
// MODELO: Refund
// ============================================

const BaseModel = require('./index');

class Refund extends BaseModel {
    constructor() {
        super('refunds');
    }
    
    async count(filters = {}) {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            
            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }
            
            if (filters.payment_id) {
                sql += ' AND payment_id = ?';
                params.push(filters.payment_id);
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
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }

    /**
     * Buscar reembolsos con información relacionada
     */
    async findAllWithDetails(filters = {}) {
        try {
            // Verificar si la tabla existe
            const tableExists = await this.db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [this.tableName]
            );
            
            if (!tableExists) {
                console.warn(`⚠️ Tabla ${this.tableName} no existe. Retornando array vacío.`);
                return [];
            }

            // Verificar qué columnas existen en la tabla refunds
            const refundCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const colNames = refundCols.map(c => c.name);
            const hasReasonId = colNames.includes('reason_id');
            const hasRequestedBy = colNames.includes('requested_by');
            const hasApprovedBy = colNames.includes('approved_by');

            let sql = `SELECT r.*, 
                   p.id as payment_id, p.order_id, p.amount_gross as payment_amount`;
            
            if (hasReasonId) {
                sql += `, rr.code as reason_code, rr.name as reason_name`;
            } else {
                sql += `, NULL as reason_code, NULL as reason_name`;
            }
            
            if (hasRequestedBy) {
                sql += `, u1.name as requested_by_name`;
            } else {
                sql += `, NULL as requested_by_name`;
            }
            
            if (hasApprovedBy) {
                sql += `, u2.name as approved_by_name`;
            } else {
                sql += `, NULL as approved_by_name`;
            }
            
            sql += ` FROM ${this.tableName} r
                   LEFT JOIN payments p ON r.payment_id = p.id`;
            
            if (hasReasonId) {
                sql += ` LEFT JOIN refund_reasons rr ON r.reason_id = rr.id`;
            }
            
            if (hasRequestedBy) {
                sql += ` LEFT JOIN users u1 ON r.requested_by = u1.id`;
            }
            
            if (hasApprovedBy) {
                sql += ` LEFT JOIN users u2 ON r.approved_by = u2.id`;
            }
            
            sql += ` WHERE 1=1`;
            const params = [];

            if (filters.status) {
                sql += ' AND r.status = ?';
                params.push(filters.status);
            }

            if (filters.payment_id) {
                sql += ' AND r.payment_id = ?';
                params.push(filters.payment_id);
            }

            if (filters.date_from) {
                sql += ' AND DATE(r.created_at) >= ?';
                params.push(filters.date_from);
            }

            if (filters.date_to) {
                sql += ' AND DATE(r.created_at) <= ?';
                params.push(filters.date_to);
            }

            sql += ' ORDER BY r.created_at DESC';

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
            console.error(`Error en findAllWithDetails para ${this.tableName}:`, error);
            // Si hay error de tabla o columna no existe, retornar array vacío
            if (error.message && (error.message.includes('no such table') || error.message.includes('no such column'))) {
                return [];
            }
            throw error;
        }
    }

    /**
     * Crear reembolso con validaciones
     */
    async createWithValidation(data) {
        // Validar que el pago existe y está capturado
        const Payment = require('./Payment');
        const payment = await Payment.findById(data.payment_id);
        
        if (!payment) {
            throw new Error('Pago no encontrado');
        }

        if (payment.status !== 'captured') {
            throw new Error('Solo se pueden reembolsar pagos capturados');
        }

        // Calcular monto ya reembolsado
        const existingRefunds = await this.db.all(
            `SELECT SUM(amount) as total FROM ${this.tableName} WHERE payment_id = ? AND status != 'failed'`,
            [data.payment_id]
        );
        const totalRefunded = existingRefunds[0]?.total || 0;

        // Validar que el monto no exceda lo capturado menos lo reembolsado
        const availableAmount = payment.amount_gross - totalRefunded;
        if (data.amount > availableAmount) {
            throw new Error(`Monto excede lo disponible. Máximo: ${availableAmount}`);
        }

        // Validar que reason_id existe
        const RefundReason = require('./RefundReason');
        const reason = await RefundReason.findById(data.reason_id);
        if (!reason) {
            throw new Error('Motivo de reembolso no encontrado');
        }

        return await this.create({
            ...data,
            status: 'draft'
        });
    }

    /**
     * Aprobar reembolso
     */
    async approve(id, approved_by) {
        const refund = await this.findById(id);
        if (!refund) {
            throw new Error('Reembolso no encontrado');
        }

        if (!['draft', 'pending'].includes(refund.status)) {
            throw new Error(`No se puede aprobar un reembolso con estado: ${refund.status}`);
        }

        return await this.update(id, {
            status: 'approved',
            approved_by
        });
    }

    /**
     * Procesar reembolso
     */
    async process(id) {
        const refund = await this.findById(id);
        if (!refund) {
            throw new Error('Reembolso no encontrado');
        }

        if (refund.status !== 'approved') {
            throw new Error('Solo se pueden procesar reembolsos aprobados');
        }

        return await this.update(id, {
            status: 'processed',
            processed_at: new Date().toISOString()
        });
    }

    /**
     * Reversar reembolso fallido
     */
    async reverse(id) {
        const refund = await this.findById(id);
        if (!refund) {
            throw new Error('Reembolso no encontrado');
        }

        if (refund.status !== 'failed') {
            throw new Error('Solo se pueden reversar reembolsos fallidos');
        }

        return await this.update(id, {
            status: 'reversed'
        });
    }
}

module.exports = new Refund();

