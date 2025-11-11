// ============================================
// RUTAS: PaymentMethods
// ============================================

const express = require('express');
const router = express.Router();
const methodController = require('../controllers/paymentMethodController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, methodController.getAll);
router.get('/:id', authenticateToken, requireAdmin, methodController.getById);
router.post('/', authenticateToken, requireAdmin, methodController.create);
router.patch('/:id', authenticateToken, requireAdmin, methodController.update);
router.delete('/:id', authenticateToken, requireAdmin, methodController.delete);

module.exports = router;









