// ============================================
// CONTROLADOR: Chargebacks
// ============================================

const Chargeback = require('../models/Chargeback');

const crud = {
    getAll: async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                stage: req.query.stage,
                payment_id: req.query.payment_id,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };
            const chargebacks = await Chargeback.findAllWithDetails(filters);
            const total = await Chargeback.count(filters);
            res.json({ 
                success: true, 
                data: chargebacks,
                pagination: {
                    limit: parseInt(filters.limit),
                    offset: parseInt(filters.offset),
                    total: total
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const chargeback = await Chargeback.findById(req.params.id);
            if (!chargeback) return res.status(404).json({ success: false, message: 'Chargeback no encontrado' });
            res.json({ success: true, data: chargeback });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const id = await Chargeback.create(req.body);
            const chargeback = await Chargeback.findById(id);
            res.status(201).json({ success: true, data: chargeback });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const chargeback = await Chargeback.update(req.params.id, req.body);
            res.json({ success: true, data: chargeback });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            await Chargeback.delete(req.params.id);
            res.json({ success: true, message: 'Chargeback eliminado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = crud;

