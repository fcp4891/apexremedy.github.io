// backend/src/models/ShippingRate.js
const BaseModel = require('./index');

class ShippingRate extends BaseModel {
    constructor() {
        super('shipping_rates');
    }

    async findByZoneAndWeight(zoneId, weight) {
        const sql = `
            SELECT sr.*, sm.name as method_name, sm.code as method_code
            FROM ${this.tableName} sr
            JOIN shipping_methods sm ON sr.shipping_method_id = sm.id
            WHERE sr.shipping_zone_id = ?
              AND (sr.min_weight IS NULL OR sr.min_weight <= ?)
              AND (sr.max_weight IS NULL OR sr.max_weight >= ?)
              AND sm.status = 'active'
            ORDER BY sr.rate ASC
            LIMIT 1
        `;
        return await this.db.get(sql, [zoneId, weight, weight]);
    }

    async getByMethod(methodId) {
        const sql = `
            SELECT sr.*, sz.name as zone_name
            FROM ${this.tableName} sr
            JOIN shipping_zones sz ON sr.shipping_zone_id = sz.id
            WHERE sr.shipping_method_id = ?
            ORDER BY sz.name
        `;
        return await this.db.all(sql, [methodId]);
    }
}

module.exports = ShippingRate;








