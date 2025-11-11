// ============================================
// RUTAS: Chargebacks
// ============================================

const express = require('express');
const router = express.Router();
const chargebackController = require('../controllers/chargebackController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, chargebackController.getAll);
router.get('/:id', authenticateToken, requireAdmin, chargebackController.getById);
router.post('/', authenticateToken, requireAdmin, chargebackController.create);
router.patch('/:id', authenticateToken, requireAdmin, chargebackController.update);
router.delete('/:id', authenticateToken, requireAdmin, chargebackController.delete);

module.exports = router;









