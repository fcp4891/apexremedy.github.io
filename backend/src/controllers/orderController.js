// ============================================
// CONTROLADOR: Orders (Pedidos) - ACTUALIZADO CON PAGOS
// ============================================

const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const orderModel = new Order();
const orderItemModel = new OrderItem();
const productModel = new Product();

/**
 * POST /api/orders/test
 * Endpoint de prueba para diagnosticar problemas
 */
exports.testOrder = async (req, res) => {
    try {
        console.log('🧪 TEST: Datos recibidos:', req.body);
        console.log('🧪 TEST: Usuario:', req.user);
        
        res.json({
            success: true,
            message: 'Test endpoint funcionando',
            received_data: req.body,
            user: req.user
        });
    } catch (error) {
        console.error('❌ Error en test:', error);
        res.status(500).json({
            success: false,
            message: 'Error en test',
            error: error.message
        });
    }
};

/**
 * POST /api/orders
 * Crear nuevo pedido - ACTUALIZADO CON MÉTODO DE PAGO
 */
exports.createOrder = async (req, res) => {
    try {
        console.log('📦 Creando nueva orden...');
        console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const userId = req.user.id;
        const { 
            items, 
            customer_name, 
            customer_email, 
            customer_phone,
            shipping_address,
            notes,
            payment_method = 'transfer' // NUEVO: método de pago
        } = req.body;

        // Validaciones
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere al menos un producto'
            });
        }

        if (!customer_name || !customer_email || !shipping_address) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y dirección son obligatorios'
            });
        }

        // Validar método de pago
        const validPaymentMethods = ['transfer', 'cash', 'credit_card', 'debit_card'];
        if (!validPaymentMethods.includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Método de pago inválido'
            });
        }

        // Calcular totales y verificar stock
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            console.log(`🔍 Procesando item:`, item);
            const product = await productModel.findById(item.product_id);
            console.log(`📦 Producto encontrado:`, {
                id: product?.id,
                name: product?.name,
                stock_quantity: product?.stock_quantity,
                stock: product?.stock,
                base_price: product?.base_price,
                price: product?.price
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Producto ${item.product_id} no encontrado`
                });
            }

            // Usar stock_quantity o stock como fallback
            const stock = product.stock_quantity || product.stock || 0;
            if (stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente para ${product.name}. Disponible: ${stock}`
                });
            }

            // Usar base_price, price, o el precio enviado como fallback
            const price = product.base_price || product.price || item.price || 0;
            console.log(`💰 Precio calculado: ${price} para ${item.quantity} unidades`);
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            processedItems.push({
                product_id: product.id,
                quantity: item.quantity,
                unit_price: price, // Corrected to use calculated price
                subtotal: itemTotal
            });
        }

        const tax = Math.round(subtotal * 0.19); // IVA 19%
        const total = subtotal + tax;

        // Determinar estado inicial según método de pago
        const initialStatus = payment_method === 'transfer' ? 'pending_payment' : 'pending';

        // Generar número de orden único
        const orderNumber = `ORD-${Date.now()}-${userId}`;
        
        // Crear orden
        const orderData = {
            order_number: orderNumber,
            user_id: userId,
            total,
            subtotal,
            tax,
            status: initialStatus,
            payment_method,
            payment_status: 'pending', // NUEVO
            customer_name,
            customer_email,
            customer_phone: customer_phone || null,
            shipping_address: shipping_address || null, // NUEVO
            notes: notes || null, // NUEVO
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log(`📋 Creando orden con datos:`, orderData);
        const orderId = await orderModel.create(orderData);
        console.log(`✅ Orden creada con ID: ${orderId}`);

        // Crear items de la orden
        console.log(`📦 Creando ${processedItems.length} items de orden...`);
        for (const item of processedItems) {
            console.log(`➕ Creando item:`, { order_id: orderId, ...item });
            await orderItemModel.create({
                order_id: orderId,
                ...item,
                created_at: new Date().toISOString()
            });

            // Decrementar stock
            console.log(`📉 Decrementando stock: producto ${item.product_id}, cantidad ${item.quantity}`);
            await productModel.decrementStock(item.product_id, item.quantity);
        }
        console.log(`✅ Todos los items de orden creados`);

        console.log(`🔍 Obteniendo orden completa...`);

        // Obtener orden completa
        const order = await orderModel.findByIdWithItems(orderId);

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: { order }
        });

    } catch (error) {
        console.error('Error en createOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pedido',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/my-orders
 * Obtener pedidos del usuario autenticado
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        
        const orders = await orderModel.findByUserId(userId, limit);

        res.json({
            success: true,
            data: { orders, count: orders.length }
        });

    } catch (error) {
        console.error('Error en getMyOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/:id
 * Obtener un pedido específico
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderModel.findByIdWithItems(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar permisos (solo el propietario o admin)
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este pedido'
            });
        }

        res.json({
            success: true,
            data: { order }
        });

    } catch (error) {
        console.error('Error en getOrderById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedido',
            error: error.message
        });
    }
};

/**
 * GET /api/orders
 * Obtener todos los pedidos (ADMIN)
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { status, payment_status, user_id, limit, offset } = req.query;

        const filters = {
            status,
            payment_status, // NUEVO
            user_id: user_id ? parseInt(user_id) : undefined,
            limit: limit ? parseInt(limit) : 100,
            offset: offset ? parseInt(offset) : 0
        };

        const orders = await orderModel.findAllWithFilters(filters);
        
        // Log del primer pedido para debugging
        if (orders.length > 0) {
            const firstOrder = orders[0];
            console.log('📋 [GET ALL ORDERS] Primer pedido devuelto:', {
                id: firstOrder.id,
                customer_name: firstOrder.customer_name,
                customer_email: firstOrder.customer_email,
                user_name: firstOrder.user_name,
                user_email: firstOrder.user_email,
                user_id: firstOrder.user_id,
                created_at: firstOrder.created_at,
                status: firstOrder.status,
                total: firstOrder.total
            });
        }

        res.json({
            success: true,
            data: { orders, count: orders.length }
        });

    } catch (error) {
        console.error('Error en getAllOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pedidos',
            error: error.message
        });
    }
};

/**
 * PATCH /api/orders/:id/status
 * Actualizar estado de un pedido (ADMIN)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'pending_payment', 'payment_verified', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido. Valores permitidos: ' + validStatuses.join(', ')
            });
        }

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Si se marca como entregado, actualizar fecha
        const updateData = { status };
        if (status === 'delivered') {
            updateData.delivered_at = new Date();
        }

        await orderModel.update(id, updateData);
        const updatedOrder = await orderModel.findByIdWithItems(id);

        res.json({
            success: true,
            message: 'Estado actualizado exitosamente',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Error en updateOrderStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado',
            error: error.message
        });
    }
};

// ============================================
// CONTROLADOR: Orders - PARTE 2 DE 2
// Continuación desde la Parte 1
// ============================================

/**
 * PATCH /api/orders/:id/cancel
 * Cancelar un pedido
 */
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderModel.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar este pedido'
            });
        }

        // Solo se puede cancelar si está pendiente o pendiente de pago
        if (!['pending', 'pending_payment'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se pueden cancelar pedidos pendientes'
            });
        }

        // Restaurar stock
        const items = await orderItemModel.findByOrderId(id);
        for (const item of items) {
            await productModel.incrementStock(item.product_id, item.quantity);
        }

        // Actualizar estado
        await orderModel.update(id, { 
            status: 'cancelled',
            cancelled_at: new Date()
        });
        
        const updatedOrder = await orderModel.findByIdWithItems(id);

        res.json({
            success: true,
            message: 'Pedido cancelado exitosamente',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Error en cancelOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar pedido',
            error: error.message
        });
    }
};

/**
 * DELETE /api/orders/:id
 * Eliminar un pedido (ADMIN)
 */
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        await orderModel.delete(id);

        res.json({
            success: true,
            message: 'Pedido eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error en deleteOrder:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pedido',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/stats/summary
 * Estadísticas de pedidos (ADMIN)
 */
exports.getOrderStats = async (req, res) => {
    try {
        const stats = await orderModel.getStats();

        res.json({
            success: true,
            data: { stats }
        });

    } catch (error) {
        console.error('Error en getOrderStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================
// NUEVAS FUNCIONES - SISTEMA DE PAGOS
// ============================================

/**
 * POST /api/orders/:id/payment-proof
 * Subir comprobante de pago
 */
exports.uploadPaymentProof = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ningún archivo'
            });
        }

        // Verificar que la orden pertenece al usuario
        const order = await orderModel.findById(id);
        
        if (!order) {
            // Eliminar archivo subido
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        if (order.user_id !== userId) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para subir comprobante a esta orden'
            });
        }

        // Verificar que la orden requiere comprobante
        if (order.payment_method !== 'transfer') {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Esta orden no requiere comprobante de pago'
            });
        }

        const filePath = `/uploads/payment-proofs/${req.file.filename}`;

        // Actualizar orden con ruta del comprobante
        await orderModel.update(id, { 
            payment_proof: filePath
        });

        res.json({
            success: true,
            message: 'Comprobante subido exitosamente',
            data: {
                filePath: filePath,
                fileName: req.file.originalname,
                fileSize: req.file.size
            }
        });

    } catch (error) {
        console.error('Error en uploadPaymentProof:', error);
        
        // Eliminar archivo si hay error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al subir comprobante',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/:id/payment-status
 * Verificar estado de pago
 */
exports.getPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await orderModel.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Verificar permisos
        if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver este estado'
            });
        }

        res.json({
            success: true,
            data: {
                order_id: order.id,
                payment_status: order.payment_status,
                payment_method: order.payment_method,
                payment_proof: order.payment_proof,
                payment_verified_at: order.payment_verified_at,
                status: order.status
            }
        });

    } catch (error) {
        console.error('Error en getPaymentStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado de pago',
            error: error.message
        });
    }
};

/**
 * POST /api/orders/:id/confirm-payment
 * Confirmar pago de una orden (ADMIN)
 */
exports.confirmPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;
        const adminId = req.user.id;

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Verificar que la orden está pendiente de pago
        if (order.payment_status === 'verified') {
            return res.status(400).json({
                success: false,
                message: 'El pago de esta orden ya fue verificado'
            });
        }

        // Actualizar estado de pago
        await orderModel.update(id, {
            payment_status: 'verified',
            payment_verified_at: new Date(),
            payment_verified_by: adminId,
            status: 'payment_verified',
            admin_notes: admin_notes || null
        });

        const updatedOrder = await orderModel.findByIdWithItems(id);

        res.json({
            success: true,
            message: 'Pago confirmado exitosamente',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Error en confirmPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al confirmar pago',
            error: error.message
        });
    }
};

/**
 * POST /api/orders/:id/reject-payment
 * Rechazar pago de una orden (ADMIN)
 */
exports.rejectPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const adminId = req.user.id;

        if (!rejection_reason || rejection_reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar una razón de rechazo'
            });
        }

        const order = await orderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Orden no encontrada'
            });
        }

        // Actualizar estado de pago
        await orderModel.update(id, {
            payment_status: 'rejected',
            payment_verified_by: adminId,
            payment_verified_at: new Date(),
            rejection_reason: rejection_reason
        });

        const updatedOrder = await orderModel.findByIdWithItems(id);

        res.json({
            success: true,
            message: 'Pago rechazado',
            data: { order: updatedOrder }
        });

    } catch (error) {
        console.error('Error en rejectPayment:', error);
        res.status(500).json({
            success: false,
            message: 'Error al rechazar pago',
            error: error.message
        });
    }
};

/**
 * GET /api/orders/admin/pending-payments
 * Obtener órdenes con pagos pendientes (ADMIN)
 */
exports.getPendingPayments = async (req, res) => {
    try {
        // Esta función usa el método del modelo
        const orders = await orderModel.findPendingPayments();

        res.json({
            success: true,
            data: { 
                orders, 
                count: orders.length,
                message: orders.length === 0 ? 'No hay pagos pendientes' : `${orders.length} pago(s) pendiente(s)`
            }
        });

    } catch (error) {
        console.error('Error en getPendingPayments:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos pendientes',
            error: error.message
        });
    }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Función auxiliar para validar archivos
 */
const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
        return {
            valid: false,
            message: 'Tipo de archivo no permitido. Solo JPG, PNG o PDF'
        };
    }

    if (file.size > maxSize) {
        return {
            valid: false,
            message: 'El archivo excede el tamaño máximo de 5MB'
        };
    }

    return { valid: true };
};

/**
 * Función auxiliar para limpiar archivos antiguos
 */
const cleanOldFile = (filePath) => {
    try {
        const fullPath = path.join(__dirname, '../..', filePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('Archivo antiguo eliminado:', filePath);
        }
    } catch (error) {
        console.error('Error al eliminar archivo antiguo:', error);
    }
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

// Ya están exportadas arriba con exports.nombreFuncion
// Este es el final del archivo

console.log('✅ Order Controller cargado con sistema de pagos');