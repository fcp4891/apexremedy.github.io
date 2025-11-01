// backend/src/routes/productsNew.js
// Rutas actualizadas para el sistema de productos robusto

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
    authenticateToken, 
    requireAdmin, 
    optionalAuth,
    requireApprovedAccount 
} = require('../middleware/auth');

// ============================================
// RUTAS PÚBLICAS (sin autenticación requerida)
// ============================================

/**
 * GET /api/products
 * Obtener todos los productos con filtros
 * - Excluye automáticamente productos medicinales si usuario no autenticado/aprobado
 */
router.get('/', optionalAuth, productController.getAll);

/**
 * GET /api/products/search
 * Buscar productos por texto
 */
router.get('/search', optionalAuth, productController.search);

/**
 * GET /api/products/featured
 * Obtener productos destacados
 */
router.get('/featured', optionalAuth, productController.getFeatured);

/**
 * GET /api/products/categories
 * Obtener categorías
 * Query params: hierarchy=true, main=true
 */
router.get('/categories', optionalAuth, productController.getCategories);

/**
 * GET /api/products/brands
 * Obtener marcas activas
 */
router.get('/brands', productController.getBrands);

/**
 * GET /api/products/tags
 * Obtener tags
 * Query params: type=effect|flavor|condition, grouped=true
 */
router.get('/tags', productController.getTags);

/**
 * GET /api/products/type/:type
 * Obtener productos por tipo
 * Tipos: flower, oil, concentrate, seed, accessory, apparel, equipment, other
 */
router.get('/type/:type', optionalAuth, productController.getByType);

// ============================================
// RUTAS PROTEGIDAS - USUARIOS APROBADOS
// ⚠️ DEBEN IR ANTES DE /:id y /slug/:slug
// ============================================

/**
 * GET /api/products/medicinal/all
 * Obtener todos los productos medicinales
 * Requiere: Usuario autenticado con cuenta aprobada
 */
router.get('/medicinal/all', 
    authenticateToken, 
    requireApprovedAccount, 
    productController.getMedicinalProducts
);

// ============================================
// RUTAS ADMIN
// ⚠️ DEBEN IR ANTES DE /:id y /slug/:slug
// ============================================

/**
 * GET /api/products/admin/stats
 * Obtener estadísticas de productos (solo admin)
 */
router.get('/admin/stats', 
    authenticateToken, 
    requireAdmin, 
    productController.getStats
);

/**
 * GET /api/products/admin/low-stock
 * Obtener productos con stock bajo (solo admin)
 */
router.get('/admin/low-stock', 
    authenticateToken, 
    requireAdmin, 
    productController.getLowStock
);

/**
 * GET /api/products/admin/out-of-stock
 * Obtener productos sin stock (solo admin)
 */
router.get('/admin/out-of-stock', 
    authenticateToken, 
    requireAdmin, 
    productController.getOutOfStock
);

/**
 * PATCH /api/products/:id/stock
 * Actualizar stock de producto (solo admin)
 * Body: { quantity: number, operation: "set"|"increment"|"decrement" }
 */
router.patch('/:id/stock', 
    authenticateToken, 
    requireAdmin, 
    productController.updateStock
);

// ============================================
// RUTAS DINÁMICAS (DEBEN IR AL FINAL)
// ============================================

/**
 * GET /api/products/slug/:slug
 * Obtener producto por slug (para URLs amigables)
 */
router.get('/slug/:slug', optionalAuth, productController.getBySlug);

/**
 * GET /api/products/:id
 * Obtener producto por ID
 */
router.get('/:id', optionalAuth, productController.getById);

/**
 * POST /api/products
 * Crear producto (solo admin)
 * 
 * Body ejemplo:
 * {
 *   "name": "Producto Nuevo",
 *   "sku": "PROD-001",
 *   "category_id": 1,
 *   "product_type": "flower",
 *   "base_price": 15000,
 *   "stock_quantity": 100,
 *   "is_medicinal": true,
 *   "requires_prescription": true,
 *   "cannabinoid_profile": { "thc": 20, "cbd": 1 },
 *   "price_variants": [
 *     { "variant_name": "1g", "quantity": 1, "unit": "g", "price": 15000 }
 *   ],
 *   "tags": [1, 2, 3]
 * }
 */
router.post('/', 
    authenticateToken, 
    requireAdmin, 
    productController.create
);

/**
 * PUT /api/products/:id
 * Actualizar producto (solo admin)
 */
router.put('/:id', 
    authenticateToken, 
    requireAdmin, 
    productController.update
);

/**
 * DELETE /api/products/:id
 * Archivar producto (soft delete) (solo admin)
 */
router.delete('/:id', 
    authenticateToken, 
    requireAdmin, 
    productController.delete
);

// ============================================
// RUTAS DE IMÁGENES DE PRODUCTOS
// ============================================

const productImageController = require('../controllers/productImageController');

/**
 * POST /api/products/images
 * Crear/agregar imagen a un producto (solo admin)
 * Body: { product_id, url, alt_text, is_primary, display_order }
 */
router.post('/images', 
    authenticateToken, 
    requireAdmin, 
    productImageController.create
);

/**
 * GET /api/products/:productId/images
 * Obtener todas las imágenes de un producto
 */
router.get('/:productId/images', 
    productImageController.getByProductId
);

// ============================================
// NOTAS IMPORTANTES
// ============================================
/*
1. ORDEN DE RUTAS:
   - Las rutas específicas DEBEN ir ANTES de las dinámicas
   - /medicinal/all debe ir antes de /:id
   - /admin/* debe ir antes de /:id
   - /:id y /slug/:slug deben ir AL FINAL

2. MIDDLEWARE optionalAuth:
   - Permite acceso sin token
   - Si hay token, lo valida y agrega req.user
   - Permite control de acceso granular en el controlador

3. CONTROL DE ACCESO A PRODUCTOS MEDICINALES:
   - El controlador verifica automáticamente si el usuario
     puede acceder a productos con requires_prescription=1
   - Si no está autenticado: 401
   - Si no está aprobado: 403
   - Si es admin o está aprobado: 200

4. FILTROS AUTOMÁTICOS:
   - GET /api/products excluye automáticamente productos
     medicinales si el usuario no está autenticado/aprobado
   - GET /api/products/:id valida acceso individual

5. VARIANTES DE PRECIO:
   - Se incluyen automáticamente en la respuesta de cada producto
   - Se crean/actualizan junto con el producto

6. TAGS:
   - Se asignan mediante array de IDs en create/update
   - Se incluyen en la respuesta del producto

7. BÚSQUEDA:
   - /api/products/search?q=texto
   - Busca en name, description, sku
   - Respeta filtros de acceso medicinal

8. ESTADÍSTICAS (Admin):
   - /api/products/admin/stats: Generales
   - /api/products/admin/low-stock: Stock bajo
   - /api/products/admin/out-of-stock: Sin stock
*/

router.delete('/:id', 
    authenticateToken, 
    requireAdmin, 
    productController.delete
);

module.exports = router;
