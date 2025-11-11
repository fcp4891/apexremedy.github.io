// backend/src/routes/dispatchCenters.js
const express = require('express');
const router = express.Router();
const dispatchCenterController = require('../controllers/dispatchCenterController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', dispatchCenterController.getAll);
router.get('/:id', dispatchCenterController.getById);
router.post('/', dispatchCenterController.create);
router.put('/:id', dispatchCenterController.update);
router.delete('/:id', dispatchCenterController.delete);

module.exports = router;








