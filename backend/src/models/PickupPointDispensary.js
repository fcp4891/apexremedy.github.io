// backend/src/models/PickupPointDispensary.js
const BaseModel = require('./index');

class PickupPointDispensary extends BaseModel {
    constructor() {
        super('pickup_points_dispensary');
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY name`;
        return await this.db.all(sql);
    }
}

module.exports = PickupPointDispensary;








