// ============================================
// RUTAS: Settlements
// ============================================

const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, settlementController.getSettlements);
router.get('/:id', authenticateToken, requireAdmin, settlementController.getSettlementById);
router.post('/', authenticateToken, requireAdmin, settlementController.createSettlement);
router.patch('/:id', authenticateToken, requireAdmin, settlementController.updateSettlement);
router.post('/:id/lines/:lineId/match', authenticateToken, requireAdmin, settlementController.matchLineWithPayment);

module.exports = router;









