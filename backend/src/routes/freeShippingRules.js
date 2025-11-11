// backend/src/routes/freeShippingRules.js
const express = require('express');
const router = express.Router();
const freeShippingRuleController = require('../controllers/freeShippingRuleController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', freeShippingRuleController.getAll);
router.get('/:id', freeShippingRuleController.getById);
router.post('/', freeShippingRuleController.create);
router.put('/:id', freeShippingRuleController.update);
router.delete('/:id', freeShippingRuleController.delete);

module.exports = router;








