// ============================================
// MODELO: GiftCardTransaction
// ============================================

const BaseModel = require('./index');

class GiftCardTransaction extends BaseModel {
    constructor() {
        super('gift_card_transactions');
    }
    
    async count(filters = {}) {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            
            if (filters.gift_card_id) {
                sql += ' AND gift_card_id = ?';
                params.push(filters.gift_card_id);
            }
            
            if (filters.transaction_type) {
                sql += ' AND transaction_type = ?';
                params.push(filters.transaction_type);
            }
            
            if (filters.date_from) {
                sql += ' AND DATE(created_at) >= ?';
                params.push(filters.date_from);
            }
            
            if (filters.date_to) {
                sql += ' AND DATE(created_at) <= ?';
                params.push(filters.date_to);
            }
            
            const result = await this.db.get(sql, params);
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }

    /**
     * Buscar transacciones con información relacionada
     */
    async findAllWithDetails(filters = {}) {
        // Verificar si la tabla existe y qué columnas tiene
        const tableInfo = await this.db.all(`PRAGMA table_info(${this.tableName})`);
        const colNames = tableInfo.map(c => c.name);
        const hasOperator = colNames.includes('operator');
        
        let sql = `SELECT t.*, 
                   gc.code as gift_card_code, gc.balance as current_balance`;
        
        if (hasOperator) {
            sql += `, u.name as operator_name`;
        } else {
            sql += `, NULL as operator_name`;
        }
        
        sql += ` FROM ${this.tableName} t
                   LEFT JOIN gift_cards gc ON t.gift_card_id = gc.id`;
        
        if (hasOperator) {
            sql += ` LEFT JOIN users u ON t.operator = u.id`;
        }
        
        sql += ` WHERE 1=1`;
        const params = [];

        if (filters.gift_card_id) {
            sql += ' AND t.gift_card_id = ?';
            params.push(filters.gift_card_id);
        }

        if (filters.transaction_type) {
            sql += ' AND t.transaction_type = ?';
            params.push(filters.transaction_type);
        } else if (filters.type) {
            sql += ' AND (t.transaction_type = ? OR t.type = ?)';
            params.push(filters.type, filters.type);
        }

        if (filters.order_id) {
            sql += ' AND t.order_id = ?';
            params.push(filters.order_id);
        }

        if (filters.date_from) {
            sql += ' AND DATE(t.created_at) >= ?';
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            sql += ' AND DATE(t.created_at) <= ?';
            params.push(filters.date_to);
        }

        sql += ' ORDER BY t.created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        
        if (filters.offset !== undefined && filters.offset !== null) {
            sql += ' OFFSET ?';
            params.push(parseInt(filters.offset));
        }

        return await this.db.all(sql, params);
    }

    /**
     * Reversar transacción (cuando aplique)
     */
    async reverse(id) {
        const transaction = await this.findById(id);
        if (!transaction) {
            throw new Error('Transacción no encontrada');
        }

        if (!['spend'].includes(transaction.type)) {
            throw new Error('Solo se pueden reversar transacciones de tipo spend');
        }

        const GiftCardModel = require('./GiftCard');
        const GiftCard = new GiftCardModel();
        const card = await GiftCard.findById(transaction.gift_card_id);
        
        if (!card) {
            throw new Error('Gift card no encontrada');
        }

        // Crear transacción de reversión
        const reversalAmount = transaction.amount;
        const newBalance = card.balance + reversalAmount;

        // Actualizar balance de la gift card
        await GiftCard.update(transaction.gift_card_id, {
            balance: newBalance
        });

        // Crear transacción de reversión
        return await this.create({
            gift_card_id: transaction.gift_card_id,
            type: 'reversal',
            amount: reversalAmount,
            balance_before: card.balance,
            balance_after: newBalance,
            related_payment_id: transaction.related_payment_id,
            order_id: transaction.order_id,
            source: 'ui',
            notes: `Reversión de transacción #${id}`
        });
    }
}

module.exports = GiftCardTransaction;

