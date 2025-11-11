// ============================================
// RUTAS: RefundReasons
// ============================================

const express = require('express');
const router = express.Router();
const refundReasonController = require('../controllers/refundReasonController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, refundReasonController.getRefundReasons);
router.get('/:id', authenticateToken, requireAdmin, refundReasonController.getRefundReasonById);
router.post('/', authenticateToken, requireAdmin, refundReasonController.createRefundReason);
router.patch('/:id', authenticateToken, requireAdmin, refundReasonController.updateRefundReason);
router.delete('/:id', authenticateToken, requireAdmin, refundReasonController.deleteRefundReason);

module.exports = router;









