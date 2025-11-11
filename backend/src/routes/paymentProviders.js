// ============================================
// RUTAS: PaymentProviders
// ============================================

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/paymentProviderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, providerController.getAll);
router.get('/:id', authenticateToken, requireAdmin, providerController.getById);
router.post('/', authenticateToken, requireAdmin, providerController.create);
router.patch('/:id', authenticateToken, requireAdmin, providerController.update);
router.delete('/:id', authenticateToken, requireAdmin, providerController.delete);

module.exports = router;









