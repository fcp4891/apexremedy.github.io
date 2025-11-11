// backend/src/models/PackingMaterial.js
const BaseModel = require('./index');

class PackingMaterial extends BaseModel {
    constructor() {
        super('packing_materials');
    }

    async getLowStock() {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE stock_quantity <= min_stock_level AND is_active = 1
            ORDER BY stock_quantity ASC
        `;
        return await this.db.all(sql);
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY material_name`;
        return await this.db.all(sql);
    }
}

module.exports = PackingMaterial;








