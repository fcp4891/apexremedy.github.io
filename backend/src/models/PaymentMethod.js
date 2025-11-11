// ============================================
// MODELO: PaymentMethod
// ============================================

const BaseModel = require('./index');

class PaymentMethod extends BaseModel {
    constructor() {
        super('payment_methods');
    }

    /**
     * Buscar métodos activos
     */
    async findAllActive(channel = null) {
        let sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1`;
        const params = [];

        if (channel) {
            sql += ' AND channel = ?';
            params.push(channel);
        }

        sql += ' ORDER BY name ASC';
        return await this.db.all(sql, params);
    }
}

module.exports = new PaymentMethod();









