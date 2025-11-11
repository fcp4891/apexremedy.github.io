// ============================================
// CONTROLADOR: GiftCardCampaigns
// ============================================

const GiftCardCampaign = require('../models/GiftCardCampaign');

const crud = {
    getAll: async (req, res) => {
        try {
            const campaigns = req.query.active_only 
                ? await GiftCardCampaign.findAllActive()
                : await GiftCardCampaign.findAll();
            res.json({ success: true, data: campaigns });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    getById: async (req, res) => {
        try {
            const campaign = await GiftCardCampaign.findById(req.params.id);
            if (!campaign) return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
            res.json({ success: true, data: campaign });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    create: async (req, res) => {
        try {
            const id = await GiftCardCampaign.create(req.body);
            const campaign = await GiftCardCampaign.findById(id);
            res.status(201).json({ success: true, data: campaign });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const campaign = await GiftCardCampaign.update(req.params.id, req.body);
            res.json({ success: true, data: campaign });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            await GiftCardCampaign.delete(req.params.id);
            res.json({ success: true, message: 'Campaña eliminada' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = crud;









