// ============================================
// CONTROLADOR: GiftCards
// ============================================

const GiftCardModel = require('../models/GiftCard');
const GiftCard = new GiftCardModel();

/**
 * GET /api/gift-cards
 * Listar gift cards
 */
exports.getGiftCards = async (req, res) => {
    try {
        const filters = {
            state: req.query.state,
            status: req.query.status,
            customer_id: req.query.customer_id,
            campaign_id: req.query.campaign_id,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const cards = await GiftCard.findAllWithDetails(filters);
        const total = await GiftCard.count(filters);

        res.json({
            success: true,
            data: cards,
            pagination: {
                limit: parseInt(filters.limit),
                offset: parseInt(filters.offset),
                total: total
            }
        });
    } catch (error) {
        console.error('Error al obtener gift cards:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener gift cards',
            error: error.message
        });
    }
};

/**
 * GET /api/gift-cards/:id
 * Obtener gift card por ID
 */
exports.getGiftCardById = async (req, res) => {
    try {
        const card = await GiftCard.findById(req.params.id);
        
        if (!card) {
            return res.status(404).json({
                success: false,
                message: 'Gift card no encontrada'
            });
        }

        res.json({
            success: true,
            data: card
        });
    } catch (error) {
        console.error('Error al obtener gift card:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener gift card',
            error: error.message
        });
    }
};

/**
 * POST /api/gift-cards
 * Crear gift card individual
 */
exports.createGiftCard = async (req, res) => {
    try {
        const card = await GiftCard.createWithCode(req.body);

        res.status(201).json({
            success: true,
            data: card,
            message: 'Gift card creada correctamente'
        });
    } catch (error) {
        console.error('Error al crear gift card:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear gift card'
        });
    }
};

/**
 * POST /api/gift-cards/batch
 * Crear múltiples gift cards
 */
exports.createBatchGiftCards = async (req, res) => {
    try {
        const { count, ...data } = req.body;
        
        if (!count || count < 1 || count > 1000) {
            return res.status(400).json({
                success: false,
                message: 'El count debe estar entre 1 y 1000'
            });
        }

        const cards = await GiftCard.createBatch(count, data);

        res.status(201).json({
            success: true,
            data: cards,
            message: `${cards.length} gift cards creadas correctamente`
        });
    } catch (error) {
        console.error('Error al crear gift cards en lote:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear gift cards en lote'
        });
    }
};

/**
 * PATCH /api/gift-cards/:id
 * Actualizar gift card
 */
exports.updateGiftCard = async (req, res) => {
    try {
        const card = await GiftCard.update(req.params.id, req.body);

        res.json({
            success: true,
            data: card,
            message: 'Gift card actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar gift card:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar gift card',
            error: error.message
        });
    }
};

/**
 * DELETE /api/gift-cards/:id
 * Eliminar gift card (solo si sin movimientos)
 */
exports.deleteGiftCard = async (req, res) => {
    try {
        const GiftCardTransaction = require('../models/GiftCardTransaction');
        const transactions = await GiftCardTransaction.db.all(
            'SELECT COUNT(*) as count FROM gift_card_transactions WHERE gift_card_id = ?',
            [req.params.id]
        );

        if (transactions[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar una gift card con movimientos'
            });
        }

        await GiftCard.delete(req.params.id);

        res.json({
            success: true,
            message: 'Gift card eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar gift card:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar gift card',
            error: error.message
        });
    }
};

/**
 * POST /api/gift-cards/:id/activate
 * Activar gift card
 */
exports.activateGiftCard = async (req, res) => {
    try {
        const card = await GiftCard.activate(req.params.id);

        res.json({
            success: true,
            data: card,
            message: 'Gift card activada correctamente'
        });
    } catch (error) {
        console.error('Error al activar gift card:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al activar gift card'
        });
    }
};

/**
 * POST /api/gift-cards/:id/disable
 * Desactivar gift card
 */
exports.disableGiftCard = async (req, res) => {
    try {
        const card = await GiftCard.disable(req.params.id);

        res.json({
            success: true,
            data: card,
            message: 'Gift card desactivada correctamente'
        });
    } catch (error) {
        console.error('Error al desactivar gift card:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al desactivar gift card'
        });
    }
};

/**
 * POST /api/gift-cards/:id/top-up
 * Recargar gift card
 */
exports.topUpGiftCard = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto debe ser mayor a 0'
            });
        }

        const card = await GiftCard.topUp(req.params.id, amount);

        res.json({
            success: true,
            data: card,
            message: 'Gift card recargada correctamente'
        });
    } catch (error) {
        console.error('Error al recargar gift card:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al recargar gift card'
        });
    }
};

/**
 * POST /api/gift-cards/:id/adjust
 * Ajustar saldo de gift card
 */
exports.adjustGiftCard = async (req, res) => {
    try {
        const { amount, notes } = req.body;
        
        if (!amount || amount === 0) {
            return res.status(400).json({
                success: false,
                message: 'El monto no puede ser 0'
            });
        }

        const card = await GiftCard.adjustBalance(req.params.id, amount, notes);

        res.json({
            success: true,
            data: card,
            message: 'Saldo ajustado correctamente'
        });
    } catch (error) {
        console.error('Error al ajustar saldo:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al ajustar saldo'
        });
    }
};

