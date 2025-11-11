// backend/src/models/FleetDriver.js
const BaseModel = require('./index');

class FleetDriver extends BaseModel {
    constructor() {
        super('fleet_drivers');
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY driver_name`;
        return await this.db.all(sql);
    }
}

module.exports = FleetDriver;
