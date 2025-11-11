// ============================================
// CONTROLADOR: GiftCardTransactions
// ============================================

const GiftCardTransactionModel = require('../models/GiftCardTransaction');
const GiftCardTransaction = new GiftCardTransactionModel();

exports.getTransactions = async (req, res) => {
    try {
        const filters = {
            gift_card_id: req.query.gift_card_id,
            transaction_type: req.query.transaction_type || req.query.type,
            order_id: req.query.order_id,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const transactions = await GiftCardTransaction.findAllWithDetails(filters);
        const total = await GiftCardTransaction.count(filters);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                limit: parseInt(filters.limit),
                offset: parseInt(filters.offset),
                total: total
            }
        });
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener transacciones',
            error: error.message
        });
    }
};

exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await GiftCardTransaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transacción no encontrada' });
        }
        res.json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reverseTransaction = async (req, res) => {
    try {
        const transaction = await GiftCardTransaction.reverse(req.params.id);
        res.json({ success: true, data: transaction, message: 'Transacción revertida' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

