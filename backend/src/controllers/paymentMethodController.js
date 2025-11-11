// ============================================
// CONTROLADOR: PaymentMethods
// ============================================

const PaymentMethod = require('../models/PaymentMethod');

const crud = {
    getAll: async (req, res) => {
        try {
            const methods = await PaymentMethod.findAllActive(req.query.channel);
            res.json({ success: true, data: methods });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const method = await PaymentMethod.findById(req.params.id);
            if (!method) return res.status(404).json({ success: false, message: 'Método no encontrado' });
            res.json({ success: true, data: method });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const id = await PaymentMethod.create(req.body);
            const method = await PaymentMethod.findById(id);
            res.status(201).json({ success: true, data: method });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const method = await PaymentMethod.update(req.params.id, req.body);
            res.json({ success: true, data: method });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            await PaymentMethod.delete(req.params.id);
            res.json({ success: true, message: 'Método eliminado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = crud;









