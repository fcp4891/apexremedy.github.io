// ============================================
// RUTAS: Payments
// ============================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Rutas públicas (si es necesario)
// router.get('/', paymentController.getPayments);

// Rutas protegidas
router.get('/metrics/dashboard', authenticateToken, requireAdmin, paymentController.getPaymentMetrics);
router.get('/', authenticateToken, requireAdmin, paymentController.getPayments);
router.get('/:id', authenticateToken, requireAdmin, paymentController.getPaymentById);
router.patch('/:id', authenticateToken, requireAdmin, paymentController.updatePayment);
router.post('/:id/capture', authenticateToken, requireAdmin, paymentController.capturePayment);
router.post('/:id/void', authenticateToken, requireAdmin, paymentController.voidPayment);
router.post('/:id/retry', authenticateToken, requireAdmin, paymentController.retryPayment);

module.exports = router;

