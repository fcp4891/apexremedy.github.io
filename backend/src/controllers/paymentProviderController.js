// ============================================
// CONTROLADOR: PaymentProviders
// ============================================

const PaymentProvider = require('../models/PaymentProvider');

const crud = {
    getAll: async (req, res) => {
        try {
            const providers = req.query.active_only 
                ? await PaymentProvider.findAllActive()
                : await PaymentProvider.findAll();
            res.json({ success: true, data: providers });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const provider = await PaymentProvider.findById(req.params.id);
            if (!provider) return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
            res.json({ success: true, data: provider });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const id = await PaymentProvider.create(req.body);
            const provider = await PaymentProvider.findById(id);
            res.status(201).json({ success: true, data: provider });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const provider = await PaymentProvider.update(req.params.id, req.body);
            res.json({ success: true, data: provider });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            await PaymentProvider.delete(req.params.id);
            res.json({ success: true, message: 'Proveedor eliminado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = crud;









