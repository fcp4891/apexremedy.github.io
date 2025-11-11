// ============================================
// RUTAS: Refunds
// ============================================

const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, refundController.getRefunds);
router.get('/:id', authenticateToken, requireAdmin, refundController.getRefundById);
router.post('/', authenticateToken, requireAdmin, refundController.createRefund);
router.patch('/:id', authenticateToken, requireAdmin, refundController.updateRefund);
router.delete('/:id', authenticateToken, requireAdmin, refundController.deleteRefund);
router.post('/:id/approve', authenticateToken, requireAdmin, refundController.approveRefund);
router.post('/:id/process', authenticateToken, requireAdmin, refundController.processRefund);
router.post('/:id/reverse', authenticateToken, requireAdmin, refundController.reverseRefund);

module.exports = router;









