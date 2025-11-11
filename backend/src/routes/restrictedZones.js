// backend/src/routes/restrictedZones.js
const express = require('express');
const router = express.Router();
const restrictedZoneController = require('../controllers/restrictedZoneController');
const { authenticateToken } = require('../middleware/auth');

router.use((req, res, next) => {
    console.log('🔍 [restrictedZones] Ruta accedida:', req.method, req.path);
    console.log('🔍 [restrictedZones] Headers:', req.headers.authorization ? 'Token presente' : 'Sin token');
    next();
});

router.use(authenticateToken);

router.get('/', restrictedZoneController.getAll);
router.get('/:id', restrictedZoneController.getById);
router.post('/', restrictedZoneController.create);
router.put('/:id', restrictedZoneController.update);
router.delete('/:id', restrictedZoneController.delete);

module.exports = router;
