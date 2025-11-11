// ============================================
// RUTAS: Analytics - Dashboard Completo
// ============================================

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// ============================================
// EXECUTIVE DASHBOARD
// ============================================
router.get('/executive', authenticateToken, requireAdmin, analyticsController.getExecutiveDashboard);
router.get('/executive/revenue-trend', authenticateToken, requireAdmin, analyticsController.getRevenueTrend);

// ============================================
// DASHBOARD COMERCIAL/VENTAS
// ============================================
router.get('/commercial', authenticateToken, requireAdmin, analyticsController.getCommercialDashboard);
router.get('/commercial/top-products', authenticateToken, requireAdmin, analyticsController.getTopProducts);
router.get('/commercial/temporal', authenticateToken, requireAdmin, analyticsController.getTemporalPerformance);

// ============================================
// DASHBOARD DE CLIENTES (CRM)
// ============================================
router.get('/customers', authenticateToken, requireAdmin, analyticsController.getCustomersDashboard);
router.get('/customers/rfm', authenticateToken, requireAdmin, analyticsController.getRFMSegmentation);
router.get('/customers/cohort', authenticateToken, requireAdmin, analyticsController.getCohortAnalysis);

// ============================================
// DASHBOARD DE MARKETING
// ============================================
router.get('/marketing', authenticateToken, requireAdmin, analyticsController.getMarketingDashboard);

// ============================================
// DASHBOARD DE PRODUCTO
// ============================================
router.get('/products', authenticateToken, requireAdmin, analyticsController.getProductsDashboard);

// ============================================
// DASHBOARD DE INVENTARIO
// ============================================
router.get('/inventory', authenticateToken, requireAdmin, analyticsController.getInventoryDashboard);

// ============================================
// DASHBOARD DE OPERACIONES
// ============================================
router.get('/operations', authenticateToken, requireAdmin, analyticsController.getOperationsDashboard);

// ============================================
// DASHBOARD DE UX/WEB
// ============================================
router.get('/ux', authenticateToken, requireAdmin, analyticsController.getUXDashboard);

// ============================================
// DASHBOARD FINANCIERO
// ============================================
router.get('/financial', authenticateToken, requireAdmin, analyticsController.getFinancialDashboard);

// ============================================
// DASHBOARD DE SERVICIO AL CLIENTE
// ============================================
router.get('/customer-service', authenticateToken, requireAdmin, analyticsController.getCustomerServiceDashboard);

// ============================================
// GEOGRAFÍA (mantener compatibilidad)
// ============================================
/**
 * GET /api/analytics/orders-by-comuna
 * Obtener pedidos agrupados por comuna y región
 * Query params:
 *   - from: fecha inicio (YYYY-MM-DD)
 *   - to: fecha fin (YYYY-MM-DD)
 *   - status: estado(s) del pedido (comma-separated o array)
 *   - shipping_provider: proveedor de envío (Starken, Chilexpress, etc.)
 *   - min_ticket: ticket mínimo
 *   - product_type: 'medicinal' | 'recreational'
 */
router.get('/orders-by-comuna', authenticateToken, requireAdmin, analyticsController.getOrdersByComuna);

module.exports = router;
