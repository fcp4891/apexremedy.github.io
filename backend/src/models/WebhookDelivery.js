// ============================================
// MODELO: WebhookDelivery
// ============================================

const BaseModel = require('./index');

class WebhookDelivery extends BaseModel {
    constructor() {
        super('webhook_deliveries');
    }

    /**
     * Buscar entregas con filtros
     */
    async findAllWithFilters(filters = {}) {
        let sql = `SELECT w.*, 
                   pp.name as provider_name
                   FROM ${this.tableName} w
                   LEFT JOIN payment_providers pp ON w.provider_id = pp.id
                   WHERE 1=1`;
        const params = [];

        if (filters.status) {
            sql += ' AND w.status = ?';
            params.push(filters.status);
        }

        if (filters.provider_id) {
            sql += ' AND w.provider_id = ?';
            params.push(filters.provider_id);
        }

        if (filters.event_type) {
            sql += ' AND w.event_type = ?';
            params.push(filters.event_type);
        }

        sql += ' ORDER BY w.created_at DESC';

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
            
            if (filters.provider_id) {
                sql += ' AND provider_id = ?';
                params.push(filters.provider_id);
            }
            
            if (filters.event_type) {
                sql += ' AND event_type = ?';
                params.push(filters.event_type);
            }
            
            const result = await this.db.get(sql, params);
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }

    /**
     * Reintentar entrega
     */
    async retry(id) {
        const delivery = await this.findById(id);
        if (!delivery) {
            throw new Error('Entrega no encontrada');
        }

        return await this.update(id, {
            status: 'pending',
            retry_count: (delivery.retry_count || 0) + 1
        });
    }
}

module.exports = new WebhookDelivery();

