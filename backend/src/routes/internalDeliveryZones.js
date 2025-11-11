// backend/src/routes/internalDeliveryZones.js
const express = require('express');
const router = express.Router();
const internalDeliveryZoneController = require('../controllers/internalDeliveryZoneController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', internalDeliveryZoneController.getAll);
router.get('/:id', internalDeliveryZoneController.getById);
router.post('/', internalDeliveryZoneController.create);
router.put('/:id', internalDeliveryZoneController.update);
router.delete('/:id', internalDeliveryZoneController.delete);

module.exports = router;








