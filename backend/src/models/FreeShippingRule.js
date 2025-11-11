// backend/src/models/FreeShippingRule.js
const BaseModel = require('./index');

class FreeShippingRule extends BaseModel {
    constructor() {
        super('free_shipping_rules');
    }

    async getActive() {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE is_active = 1 
              AND (start_date IS NULL OR start_date <= date('now'))
              AND (end_date IS NULL OR end_date >= date('now'))
            ORDER BY min_order_amount ASC
        `;
        return await this.db.all(sql);
    }
}

module.exports = FreeShippingRule;








