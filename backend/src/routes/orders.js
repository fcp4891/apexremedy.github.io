// ============================================
// RUTAS: Orders (Pedidos) - ACTUALIZADO CON PAGOS
// ============================================

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');

// ============================================
// CONFIGURACIÓN DE MULTER PARA COMPROBANTES
// ============================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/payment-proofs');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `proof-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos JPG, PNG o PDF'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
});

// ============================================
// RUTAS PROTEGIDAS - CLIENTE
// ============================================

/**
 * POST /api/orders/test
 * Endpoint de prueba para diagnosticar problemas
 */
router.post('/test', authenticateToken, orderController.testOrder);

/**
 * POST /api/orders
 * Crear nuevo pedido (requiere autenticación)
 */
router.post('/', authenticateToken, orderController.createOrder);

/**
 * GET /api/orders/my-orders
 * Obtener pedidos del usuario autenticado
 */
router.get('/my-orders', authenticateToken, orderController.getMyOrders);

/**
 * GET /api/orders/:id
 * Obtener un pedido específico
 * (solo el propietario o admin puede ver)
 */
router.get('/:id', authenticateToken, orderController.getOrderById);

/**
 * PATCH /api/orders/:id/cancel
 * Cancelar un pedido (solo si está pendiente)
 */
router.patch('/:id/cancel', authenticateToken, orderController.cancelOrder);

// ============================================
// NUEVAS RUTAS - SISTEMA DE PAGOS
// ============================================

/**
 * POST /api/orders/:id/payment-proof
 * Subir comprobante de pago
 */
router.post('/:id/payment-proof', 
    authenticateToken, 
    upload.single('proof'), 
    orderController.uploadPaymentProof
);

/**
 * GET /api/orders/:id/payment-status
 * Verificar estado de pago
 */
router.get('/:id/payment-status', authenticateToken, orderController.getPaymentStatus);

// ============================================
// RUTAS ADMIN
// ============================================

/**
 * GET /api/orders
 * Obtener todos los pedidos (solo admin)
 * NOTA: Esta ruta debe estar DESPUÉS de las rutas específicas
 */
router.get('/', authenticateToken, requireAdmin, orderController.getAllOrders);

/**
 * PATCH /api/orders/:id/status
 * Actualizar estado de un pedido (solo admin)
 */
router.patch('/:id/status', authenticateToken, requireAdmin, orderController.updateOrderStatus);

/**
 * DELETE /api/orders/:id
 * Eliminar un pedido (solo admin)
 */
router.delete('/:id', authenticateToken, requireAdmin, orderController.deleteOrder);

/**
 * GET /api/orders/stats/summary
 * Obtener estadísticas de pedidos (solo admin)
 */
router.get('/stats/summary', authenticateToken, requireAdmin, orderController.getOrderStats);

// ============================================
// NUEVAS RUTAS ADMIN - GESTIÓN DE PAGOS
// ============================================

/**
 * POST /api/orders/:id/confirm-payment
 * Confirmar pago de una orden (admin)
 */
router.post('/:id/confirm-payment', authenticateToken, requireAdmin, orderController.confirmPayment);

/**
 * POST /api/orders/:id/reject-payment
 * Rechazar pago de una orden (admin)
 */
router.post('/:id/reject-payment', authenticateToken, requireAdmin, orderController.rejectPayment);

/**
 * GET /api/orders/admin/pending-payments
 * Obtener órdenes con pagos pendientes (admin)
 */
router.get('/admin/pending-payments', authenticateToken, requireAdmin, orderController.getPendingPayments);

module.exports = router;
