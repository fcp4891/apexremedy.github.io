// backend/src/models/RestrictedZone.js
const BaseModel = require('./index');

class RestrictedZone extends BaseModel {
    constructor() {
        super('restricted_zones');
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY zone_name`;
        return await this.db.all(sql);
    }
}

module.exports = RestrictedZone;








