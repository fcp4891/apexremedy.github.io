// ============================================
// MODELO: PaymentProvider
// ============================================

const BaseModel = require('./index');

class PaymentProvider extends BaseModel {
    constructor() {
        super('payment_providers');
    }

    /**
     * Buscar proveedor por key
     */
    async findByKey(providerKey) {
        const sql = `SELECT * FROM ${this.tableName} WHERE provider_key = ? LIMIT 1`;
        return await this.db.get(sql, [providerKey]);
    }

    /**
     * Buscar proveedores activos
     */
    async findAllActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY name ASC`;
        return await this.db.all(sql);
    }
}

module.exports = new PaymentProvider();









