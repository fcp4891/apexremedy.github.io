// backend/src/models/DispatchCenter.js
const BaseModel = require('./index');

class DispatchCenter extends BaseModel {
    constructor() {
        super('dispatch_centers');
    }

    async getDefault() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY id LIMIT 1`;
        return await this.db.get(sql);
    }
}

module.exports = DispatchCenter;








