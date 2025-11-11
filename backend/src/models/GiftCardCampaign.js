// ============================================
// MODELO: GiftCardCampaign
// ============================================

const BaseModel = require('./index');

class GiftCardCampaign extends BaseModel {
    constructor() {
        super('gift_card_campaigns');
    }

    /**
     * Buscar campañas activas
     */
    async findAllActive() {
        const sql = `SELECT * FROM ${this.tableName} 
                     WHERE is_active = 1 
                     AND (start_at IS NULL OR start_at <= datetime('now'))
                     AND (end_at IS NULL OR end_at >= datetime('now'))
                     ORDER BY created_at DESC`;
        return await this.db.all(sql);
    }
}

module.exports = new GiftCardCampaign();









