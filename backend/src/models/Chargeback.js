// ============================================
// MODELO: Chargeback
// ============================================

const BaseModel = require('./index');

class Chargeback extends BaseModel {
    constructor() {
        super('chargebacks');
    }

    /**
     * Buscar chargebacks con información relacionada
     */
    async findAllWithDetails(filters = {}) {
        let sql = `SELECT c.*, 
                   p.id as payment_id, p.order_id, p.amount_gross
                   FROM ${this.tableName} c
                   LEFT JOIN payments p ON c.payment_id = p.id
                   WHERE 1=1`;
        const params = [];

        if (filters.status) {
            sql += ' AND c.status = ?';
            params.push(filters.status);
        }

        if (filters.stage) {
            sql += ' AND c.stage = ?';
            params.push(filters.stage);
        }

        if (filters.payment_id) {
            sql += ' AND c.payment_id = ?';
            params.push(filters.payment_id);
        }

        sql += ' ORDER BY c.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        
        if (filters.offset !== undefined && filters.offset !== null) {
            sql += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }

        return await this.db.all(sql, params);
    }
    
    async count(filters = {}) {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            
            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }
            
            if (filters.stage) {
                sql += ' AND stage = ?';
                params.push(filters.stage);
            }
            
            if (filters.payment_id) {
                sql += ' AND payment_id = ?';
                params.push(filters.payment_id);
            }
            
            const result = await this.db.get(sql, params);
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }
}

module.exports = new Chargeback();

