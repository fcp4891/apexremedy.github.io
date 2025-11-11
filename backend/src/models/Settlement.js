// ============================================
// MODELO: Settlement
// ============================================

const BaseModel = require('./index');

class Settlement extends BaseModel {
    constructor() {
        super('settlements');
    }

    /**
     * Buscar settlements con información relacionada
     */
    async findAllWithDetails(filters = {}) {
        let sql = `SELECT s.*, 
                   pp.name as provider_name
                   FROM ${this.tableName} s
                   LEFT JOIN payment_providers pp ON s.provider_id = pp.id
                   WHERE 1=1`;
        const params = [];

        if (filters.provider_id) {
            sql += ' AND s.provider_id = ?';
            params.push(filters.provider_id);
        }

        if (filters.status) {
            sql += ' AND s.status = ?';
            params.push(filters.status);
        }

        if (filters.period) {
            sql += ' AND s.period = ?';
            params.push(filters.period);
        }

        sql += ' ORDER BY s.created_at DESC';

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
            
            if (filters.provider_id) {
                sql += ' AND provider_id = ?';
                params.push(filters.provider_id);
            }
            
            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }
            
            if (filters.period) {
                sql += ' AND period = ?';
                params.push(filters.period);
            }
            
            const result = await this.db.get(sql, params);
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }

    /**
     * Buscar settlement con líneas
     */
    async findByIdWithLines(id) {
        const settlement = await this.findById(id);
        if (!settlement) return null;

        const linesSql = `SELECT * FROM settlement_lines WHERE settlement_id = ?`;
        settlement.lines = await this.db.all(linesSql, [id]);

        return settlement;
    }
}

module.exports = new Settlement();

