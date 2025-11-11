// ============================================
// MODELO: RefundReason
// ============================================

const BaseModel = require('./index');

class RefundReason extends BaseModel {
    constructor() {
        super('refund_reasons');
    }

    /**
     * Buscar todos los motivos activos ordenados
     */
    async findAllActive() {
        const sql = `SELECT * FROM ${this.tableName} 
                     WHERE is_active = 1 
                     ORDER BY sort_order ASC, name ASC`;
        return await this.db.all(sql);
    }
}

module.exports = new RefundReason();









