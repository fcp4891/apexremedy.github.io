// backend/src/routes/pickupPointsDispensary.js
const express = require('express');
const router = express.Router();
const pickupPointDispensaryController = require('../controllers/pickupPointDispensaryController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', pickupPointDispensaryController.getAll);
router.get('/:id', pickupPointDispensaryController.getById);
router.post('/', pickupPointDispensaryController.create);
router.put('/:id', pickupPointDispensaryController.update);
router.delete('/:id', pickupPointDispensaryController.delete);

module.exports = router;








