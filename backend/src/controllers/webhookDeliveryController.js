// ============================================
// CONTROLADOR: WebhookDeliveries
// ============================================

const WebhookDelivery = require('../models/WebhookDelivery');

exports.getDeliveries = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            provider_id: req.query.provider_id,
            event_type: req.query.event_type,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };
        const deliveries = await WebhookDelivery.findAllWithFilters(filters);
        const total = await WebhookDelivery.count(filters);
        res.json({ 
            success: true, 
            data: deliveries,
            pagination: {
                limit: parseInt(filters.limit),
                offset: parseInt(filters.offset),
                total: total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDeliveryById = async (req, res) => {
    try {
        const delivery = await WebhookDelivery.findById(req.params.id);
        if (!delivery) return res.status(404).json({ success: false, message: 'Entrega no encontrada' });
        res.json({ success: true, data: delivery });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.retryDelivery = async (req, res) => {
    try {
        const delivery = await WebhookDelivery.retry(req.params.id);
        res.json({ success: true, data: delivery, message: 'Reintento iniciado' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

