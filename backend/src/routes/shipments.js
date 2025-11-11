// backend/src/routes/shipments.js
const express = require('express');
const router = express.Router();
const shipmentController = require('../controllers/shipmentController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', shipmentController.getAll);
router.get('/:id', shipmentController.getById);
router.post('/', shipmentController.create);
router.put('/:id/status', shipmentController.updateStatus);
router.get('/order/:orderId', shipmentController.getByOrder);
router.get('/tracking/:trackingNumber', shipmentController.getByTracking);

module.exports = router;








