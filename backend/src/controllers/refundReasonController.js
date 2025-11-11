// ============================================
// CONTROLADOR: RefundReasons
// ============================================

const RefundReason = require('../models/RefundReason');

/**
 * GET /api/refund-reasons
 * Listar motivos de reembolso
 */
exports.getRefundReasons = async (req, res) => {
    try {
        const reasons = req.query.active_only 
            ? await RefundReason.findAllActive()
            : await RefundReason.findAll();

        res.json({
            success: true,
            data: reasons
        });
    } catch (error) {
        console.error('Error al obtener motivos de reembolso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener motivos de reembolso',
            error: error.message
        });
    }
};

/**
 * CRUD completo para refund reasons
 */
exports.getRefundReasonById = async (req, res) => {
    try {
        const reason = await RefundReason.findById(req.params.id);
        if (!reason) {
            return res.status(404).json({ success: false, message: 'Motivo no encontrado' });
        }
        res.json({ success: true, data: reason });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createRefundReason = async (req, res) => {
    try {
        const id = await RefundReason.create(req.body);
        const reason = await RefundReason.findById(id);
        res.status(201).json({ success: true, data: reason });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateRefundReason = async (req, res) => {
    try {
        const reason = await RefundReason.update(req.params.id, req.body);
        res.json({ success: true, data: reason });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteRefundReason = async (req, res) => {
    try {
        await RefundReason.delete(req.params.id);
        res.json({ success: true, message: 'Motivo eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};









