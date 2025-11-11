// backend/src/routes/fleetDrivers.js
const express = require('express');
const router = express.Router();
const fleetDriverController = require('../controllers/fleetDriverController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', fleetDriverController.getAll);
router.get('/:id', fleetDriverController.getById);
router.post('/', fleetDriverController.create);
router.put('/:id', fleetDriverController.update);
router.delete('/:id', fleetDriverController.delete);

module.exports = router;








