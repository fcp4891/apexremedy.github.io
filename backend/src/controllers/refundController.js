// ============================================
// CONTROLADOR: Refunds
// ============================================

const Refund = require('../models/Refund');

/**
 * GET /api/refunds
 * Listar reembolsos
 */
exports.getRefunds = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            payment_id: req.query.payment_id,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        const refunds = await Refund.findAllWithDetails(filters);
        const total = await Refund.count(filters);

        res.json({
            success: true,
            data: refunds,
            pagination: {
                limit: parseInt(filters.limit),
                offset: parseInt(filters.offset),
                total: total
            }
        });
    } catch (error) {
        console.error('Error al obtener reembolsos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reembolsos',
            error: error.message
        });
    }
};

/**
 * GET /api/refunds/:id
 * Obtener reembolso por ID
 */
exports.getRefundById = async (req, res) => {
    try {
        const refund = await Refund.findById(req.params.id);
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Reembolso no encontrado'
            });
        }

        res.json({
            success: true,
            data: refund
        });
    } catch (error) {
        console.error('Error al obtener reembolso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reembolso',
            error: error.message
        });
    }
};

/**
 * POST /api/refunds
 * Crear reembolso
 */
exports.createRefund = async (req, res) => {
    try {
        const refund = await Refund.createWithValidation({
            ...req.body,
            requested_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: refund,
            message: 'Reembolso creado correctamente'
        });
    } catch (error) {
        console.error('Error al crear reembolso:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al crear reembolso'
        });
    }
};

/**
 * PATCH /api/refunds/:id
 * Actualizar reembolso
 */
exports.updateRefund = async (req, res) => {
    try {
        const refund = await Refund.findById(req.params.id);
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Reembolso no encontrado'
            });
        }

        // Solo permitir actualización hasta "processed"
        if (refund.status === 'processed' && req.body.status !== 'processed') {
            return res.status(400).json({
                success: false,
                message: 'No se puede modificar un reembolso procesado'
            });
        }

        const updated = await Refund.update(req.params.id, req.body);

        res.json({
            success: true,
            data: updated,
            message: 'Reembolso actualizado correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar reembolso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reembolso',
            error: error.message
        });
    }
};

/**
 * DELETE /api/refunds/:id
 * Eliminar reembolso (solo draft/pending)
 */
exports.deleteRefund = async (req, res) => {
    try {
        const refund = await Refund.findById(req.params.id);
        
        if (!refund) {
            return res.status(404).json({
                success: false,
                message: 'Reembolso no encontrado'
            });
        }

        if (!['draft', 'pending'].includes(refund.status)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden eliminar reembolsos en estado draft o pending'
            });
        }

        await Refund.delete(req.params.id);

        res.json({
            success: true,
            message: 'Reembolso eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar reembolso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar reembolso',
            error: error.message
        });
    }
};

/**
 * POST /api/refunds/:id/approve
 * Aprobar reembolso
 */
exports.approveRefund = async (req, res) => {
    try {
        const refund = await Refund.approve(req.params.id, req.user.id);

        res.json({
            success: true,
            data: refund,
            message: 'Reembolso aprobado correctamente'
        });
    } catch (error) {
        console.error('Error al aprobar reembolso:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al aprobar reembolso'
        });
    }
};

/**
 * POST /api/refunds/:id/process
 * Procesar reembolso
 */
exports.processRefund = async (req, res) => {
    try {
        const refund = await Refund.process(req.params.id);

        res.json({
            success: true,
            data: refund,
            message: 'Reembolso procesado correctamente'
        });
    } catch (error) {
        console.error('Error al procesar reembolso:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar reembolso'
        });
    }
};

/**
 * POST /api/refunds/:id/reverse
 * Reversar reembolso fallido
 */
exports.reverseRefund = async (req, res) => {
    try {
        const refund = await Refund.reverse(req.params.id);

        res.json({
            success: true,
            data: refund,
            message: 'Reembolso revertido correctamente'
        });
    } catch (error) {
        console.error('Error al reversar reembolso:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al reversar reembolso'
        });
    }
};

