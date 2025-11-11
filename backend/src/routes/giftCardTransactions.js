// ============================================
// RUTAS: GiftCardTransactions
// ============================================

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/giftCardTransactionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, transactionController.getTransactions);
router.get('/:id', authenticateToken, requireAdmin, transactionController.getTransactionById);
router.post('/:id/reverse', authenticateToken, requireAdmin, transactionController.reverseTransaction);

module.exports = router;









