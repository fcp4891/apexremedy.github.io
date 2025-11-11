// backend/src/routes/shippingProviders.js
const express = require('express');
const router = express.Router();
const shippingProviderController = require('../controllers/shippingProviderController');
const { authenticateToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', shippingProviderController.getAll);
router.get('/:id', shippingProviderController.getById);
router.post('/', shippingProviderController.create);
router.put('/:id', shippingProviderController.update);
router.delete('/:id', shippingProviderController.delete);

module.exports = router;








