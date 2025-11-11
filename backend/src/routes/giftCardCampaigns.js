// ============================================
// RUTAS: GiftCardCampaigns
// ============================================

const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/giftCardCampaignController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, campaignController.getAll);
router.get('/:id', authenticateToken, requireAdmin, campaignController.getById);
router.post('/', authenticateToken, requireAdmin, campaignController.create);
router.patch('/:id', authenticateToken, requireAdmin, campaignController.update);
router.delete('/:id', authenticateToken, requireAdmin, campaignController.delete);

module.exports = router;









