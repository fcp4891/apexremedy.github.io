const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/suppliers
 * Obtener todos los proveedores con estadísticas
 */
router.get('/', supplierController.getAll);

/**
 * GET /api/suppliers/stats
 * Obtener estadísticas de proveedores
 */
router.get('/stats', supplierController.getStats);

/**
 * GET /api/suppliers/stats/test
 * Endpoint de prueba temporal para diagnosticar el problema
 */
router.get('/stats/test', async (req, res) => {
    try {
        const Supplier = require('../models/Supplier');
        const supplierModel = new Supplier();
        
        const [productsBySupplier, productsByCategory, priceRanges] = await Promise.all([
            supplierModel.getProductsBySupplier(),
            supplierModel.getProductsByCategory(),
            supplierModel.getPriceRanges()
        ]);
        
        res.json({
            success: true,
            data: {
                productsBySupplier: {
                    count: productsBySupplier.length,
                    first: productsBySupplier[0] || null,
                    firstKeys: productsBySupplier[0] ? Object.keys(productsBySupplier[0]) : [],
                    hasProducts: productsBySupplier[0] ? 'products' in productsBySupplier[0] : false
                },
                productsByCategory: {
                    count: productsByCategory.length,
                    first: productsByCategory[0] || null,
                    firstKeys: productsByCategory[0] ? Object.keys(productsByCategory[0]) : [],
                    hasSupplierName: productsByCategory[0] ? 'supplier_name' in productsByCategory[0] : false
                },
                priceRanges: {
                    isArray: Array.isArray(priceRanges),
                    type: typeof priceRanges,
                    count: Array.isArray(priceRanges) ? priceRanges.length : 1,
                    first: Array.isArray(priceRanges) ? priceRanges[0] : priceRanges
                }
            }
        });
    } catch (error) {
        console.error('Error en test endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Error en test endpoint',
            error: error.message
        });
    }
});

/**
 * GET /api/suppliers/:id
 * Obtener proveedor por ID con estadísticas
 */
router.get('/:id', supplierController.getById);

/**
 * POST /api/suppliers
 * Crear nuevo proveedor
 */
router.post('/', supplierController.create);

/**
 * PUT /api/suppliers/:id
 * Actualizar proveedor
 */
router.put('/:id', supplierController.update);

/**
 * DELETE /api/suppliers/:id
 * Eliminar proveedor
 */
router.delete('/:id', supplierController.remove);

module.exports = router;

