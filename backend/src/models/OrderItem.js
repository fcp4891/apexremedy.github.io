// ============================================
// MODELO: OrderItem
// ============================================

const BaseModel = require('./index');

class OrderItem extends BaseModel {
    constructor() {
        super('order_items');
    }

    /**
     * Buscar items por orden
     */
    async findByOrderId(orderId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE order_id = ?`;
        return await this.db.all(sql, [orderId]);
    }

    /**
     * Buscar items por producto
     */
    async findByProductId(productId) {
        const sql = `SELECT * FROM ${this.tableName} WHERE product_id = ?`;
        return await this.db.all(sql, [productId]);
    }
}

module.exports = OrderItem;