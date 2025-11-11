// backend/src/routes/packingMaterials.js
const express = require('express');
const router = express.Router();
const packingMaterialController = require('../controllers/packingMaterialController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', packingMaterialController.getAll);
router.get('/low-stock', packingMaterialController.getLowStock);
router.get('/:id', packingMaterialController.getById);
router.post('/', packingMaterialController.create);
router.put('/:id', packingMaterialController.update);
router.delete('/:id', packingMaterialController.delete);

module.exports = router;








