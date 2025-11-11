// ============================================
// RUTAS: Logistics Metrics
// ============================================

const express = require('express');
const router = express.Router();
const logisticsController = require('../controllers/logisticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/logistics/metrics/dashboard
 * Obtener métricas completas del dashboard de logística
 */
router.get('/metrics/dashboard', authenticateToken, requireAdmin, logisticsController.getLogisticsMetrics);

module.exports = router;









