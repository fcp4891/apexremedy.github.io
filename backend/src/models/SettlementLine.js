// ============================================
// MODELO: SettlementLine
// ============================================

const BaseModel = require('./index');

class SettlementLine extends BaseModel {
    constructor() {
        super('settlement_lines');
    }

    /**
     * Marcar línea como conciliada con un pago
     */
    async matchWithPayment(id, paymentId) {
        return await this.update(id, {
            matched_payment_id: paymentId
        });
    }
}

module.exports = new SettlementLine();









