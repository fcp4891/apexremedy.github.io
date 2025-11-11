// ============================================
// RUTAS: WebhookDeliveries
// ============================================

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookDeliveryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, webhookController.getDeliveries);
router.get('/:id', authenticateToken, requireAdmin, webhookController.getDeliveryById);
router.post('/:id/retry', authenticateToken, requireAdmin, webhookController.retryDelivery);

module.exports = router;









