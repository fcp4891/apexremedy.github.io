// ============================================
// RUTAS: Alertas y Notificaciones
// ============================================

const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/alerts/check
 * Ejecutar todas las verificaciones de alertas
 */
router.get('/check', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const results = await alertService.runAllChecks();
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error en check alerts:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/low-stock
 * Verificar stock crítico
 */
router.get('/low-stock', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const alerts = await alertService.checkLowStock();
        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error checking low stock:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/revenue-anomalies
 * Detectar anomalías de revenue
 */
router.get('/revenue-anomalies', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const anomaly = await alertService.detectRevenueAnomalies();
        res.json({
            success: true,
            data: anomaly
        });
    } catch (error) {
        console.error('Error detecting revenue anomalies:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/alerts/fraud
 * Detectar fraude
 */
router.get('/fraud', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const fraud = await alertService.detectFraud();
        res.json({
            success: true,
            data: fraud
        });
    } catch (error) {
        console.error('Error detecting fraud:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

