// ============================================
// CONTROLADOR: Settlements
// ============================================

const Settlement = require('../models/Settlement');
const SettlementLine = require('../models/SettlementLine');

exports.getSettlements = async (req, res) => {
    try {
        const filters = {
            provider_id: req.query.provider_id,
            status: req.query.status,
            period: req.query.period,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };
        const settlements = await Settlement.findAllWithDetails(filters);
        const total = await Settlement.count(filters);
        res.json({ 
            success: true, 
            data: settlements,
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

exports.getSettlementById = async (req, res) => {
    try {
        const settlement = await Settlement.findByIdWithLines(req.params.id);
        if (!settlement) return res.status(404).json({ success: false, message: 'Settlement no encontrado' });
        res.json({ success: true, data: settlement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSettlement = async (req, res) => {
    try {
        const id = await Settlement.create(req.body);
        const settlement = await Settlement.findById(id);
        res.status(201).json({ success: true, data: settlement });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateSettlement = async (req, res) => {
    try {
        const settlement = await Settlement.update(req.params.id, req.body);
        res.json({ success: true, data: settlement });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.matchLineWithPayment = async (req, res) => {
    try {
        const { payment_id } = req.body;
        await SettlementLine.matchWithPayment(req.params.lineId, payment_id);
        res.json({ success: true, message: 'Línea conciliada' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

