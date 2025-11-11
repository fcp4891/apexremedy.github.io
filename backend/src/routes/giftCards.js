// ============================================
// RUTAS: GiftCards
// ============================================

const express = require('express');
const router = express.Router();
const giftCardController = require('../controllers/giftCardController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, requireAdmin, giftCardController.getGiftCards);
router.get('/:id', authenticateToken, requireAdmin, giftCardController.getGiftCardById);
router.post('/', authenticateToken, requireAdmin, giftCardController.createGiftCard);
router.post('/batch', authenticateToken, requireAdmin, giftCardController.createBatchGiftCards);
router.patch('/:id', authenticateToken, requireAdmin, giftCardController.updateGiftCard);
router.delete('/:id', authenticateToken, requireAdmin, giftCardController.deleteGiftCard);
router.post('/:id/activate', authenticateToken, requireAdmin, giftCardController.activateGiftCard);
router.post('/:id/disable', authenticateToken, requireAdmin, giftCardController.disableGiftCard);
router.post('/:id/top-up', authenticateToken, requireAdmin, giftCardController.topUpGiftCard);
router.post('/:id/adjust', authenticateToken, requireAdmin, giftCardController.adjustGiftCard);

module.exports = router;









