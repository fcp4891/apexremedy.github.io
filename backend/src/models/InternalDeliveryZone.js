// backend/src/models/InternalDeliveryZone.js
const BaseModel = require('./index');

class InternalDeliveryZone extends BaseModel {
    constructor() {
        super('internal_delivery_zones');
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY zone_name`;
        return await this.db.all(sql);
    }

    async findByLocation(commune, region) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE is_active = 1 
              AND (coverage_data LIKE ? OR coverage_data LIKE ?)
            ORDER BY delivery_fee ASC
            LIMIT 1
        `;
        return await this.db.get(sql, [`%${commune}%`, `%${region}%`]);
    }
}

module.exports = InternalDeliveryZone;








