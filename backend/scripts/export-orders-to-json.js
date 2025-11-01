#!/usr/bin/env node
/**
 * Script para exportar pedidos (orders) de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática" de pedidos
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');
const Order = require('../src/models/Order');
const OrderItem = require('../src/models/OrderItem');

async function exportOrders() {
    try {
        console.log('🚀 Iniciando exportación de pedidos a JSON...');
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.warn('⚠️ Base de datos no encontrada:', dbPath);
            console.warn('⚠️ Creando JSON vacío...');
            
            const apiDir = path.join(__dirname, '../../frontend/api');
            if (!fs.existsSync(apiDir)) {
                fs.mkdirSync(apiDir, { recursive: true });
            }
            
            const ordersFile = path.join(apiDir, 'orders.json');
            const emptyData = {
                success: true,
                message: 'JSON vacío - base de datos no disponible',
                data: {
                    orders: [],
                    total: 0,
                    timestamp: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(ordersFile, JSON.stringify(emptyData, null, 2));
            console.log('✅ JSON vacío creado:', ordersFile);
            return emptyData;
        }
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        
        // Crear instancias de los modelos
        const orderModel = new Order();
        const orderItemModel = new OrderItem();
        const User = require('../src/models/User');
        const userModel = new User();
        
        // Obtener todos los pedidos usando findAllWithFilters
        console.log('📦 Obteniendo pedidos de la base de datos...');
        const orders = await orderModel.findAllWithFilters({ limit: 10000 });
        
        console.log(`📦 ${orders.length} pedidos encontrados`);
        
        // Para cada pedido, obtener sus items y datos del cliente
        console.log('🔄 Obteniendo items de pedidos y datos de clientes...');
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
                try {
                    // Obtener items del pedido
                    let items = [];
                    try {
                        items = await orderItemModel.findByOrderId(order.id);
                    } catch (itemError) {
                        console.warn(`⚠️ Error al obtener items del pedido ${order.id}:`, itemError.message);
                    }
                    
                    // Obtener datos del cliente desde users si user_id existe
                    let customer_name = order.customer_name || null;
                    let customer_email = order.customer_email || null;
                    let customer_phone = order.customer_phone || null;
                    
                    if (order.user_id && (!customer_name || !customer_email)) {
                        try {
                            const user = await userModel.findById(order.user_id);
                            if (user) {
                                customer_name = customer_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
                                customer_email = customer_email || user.email;
                                customer_phone = customer_phone || user.phone || null;
                            }
                        } catch (userError) {
                            console.warn(`⚠️ Error al obtener datos del usuario ${order.user_id}:`, userError.message);
                        }
                    }
                    
                    // Normalizar pedido
                    const normalizedOrder = {
                        id: order.id,
                        order_number: order.order_number || `ORD-${order.id}`,
                        customer_id: order.user_id || order.customer_id || null,
                        user_id: order.user_id || order.customer_id || null,
                        status: order.status || 'pending',
                        payment_status: order.payment_status || 'pending',
                        payment_method: order.payment_method || null,
                        shipping_address_id: order.shipping_address_id || null,
                        billing_address_id: order.billing_address_id || null,
                        subtotal: parseFloat(order.subtotal) || 0,
                        shipping_cost: parseFloat(order.shipping_cost) || 0,
                        tax: parseFloat(order.tax) || 0,
                        discount: parseFloat(order.discount) || 0,
                        total: parseFloat(order.total) || 0,
                        notes: order.notes || null,
                        prescription_verified: order.prescription_verified === 1 || order.prescription_verified === true || order.prescription_verified === '1',
                        prescription_file: order.prescription_file || null,
                        tracking_number: order.tracking_number || null,
                        shipped_at: order.shipped_at || null,
                        delivered_at: order.delivered_at || null,
                        created_at: order.created_at,
                        updated_at: order.updated_at,
                        // Información del cliente
                        customer_name: customer_name,
                        customer_email: customer_email,
                        customer_phone: customer_phone,
                        shipping_address: order.shipping_address || null,
                        // Items del pedido
                        items: items.map(item => ({
                            id: item.id,
                            order_id: item.order_id,
                            product_id: item.product_id,
                            variant_id: item.variant_id || null,
                            quantity: parseFloat(item.quantity) || 0,
                            unit_price: parseFloat(item.unit_price) || 0,
                            subtotal: parseFloat(item.subtotal) || 0,
                            requires_prescription: item.requires_prescription === 1 || item.requires_prescription === true || item.requires_prescription === '1',
                            created_at: item.created_at
                        }))
                    };
                    
                    return normalizedOrder;
                } catch (error) {
                    console.warn(`⚠️ Error al procesar pedido ${order.id}:`, error.message);
                    // Retornar pedido mínimo si hay error
                    return {
                        id: order.id,
                        order_number: order.order_number || `ORD-${order.id}`,
                        customer_id: order.user_id || order.customer_id || null,
                        user_id: order.user_id || order.customer_id || null,
                        status: order.status || 'pending',
                        payment_status: order.payment_status || 'pending',
                        payment_method: order.payment_method || null,
                        subtotal: parseFloat(order.subtotal) || 0,
                        shipping_cost: parseFloat(order.shipping_cost) || 0,
                        tax: parseFloat(order.tax) || 0,
                        discount: parseFloat(order.discount) || 0,
                        total: parseFloat(order.total) || 0,
                        created_at: order.created_at,
                        updated_at: order.updated_at,
                        customer_name: order.customer_name || null,
                        customer_email: order.customer_email || null,
                        customer_phone: order.customer_phone || null,
                        items: []
                    };
                }
            })
        );
        
        // Preparar datos para exportar
        const exportData = {
            success: true,
            message: 'Pedidos exportados correctamente',
            data: {
                orders: ordersWithItems,
                total: ordersWithItems.length,
                timestamp: new Date().toISOString()
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
        }
        
        // Exportar a JSON
        const ordersFile = path.join(apiDir, 'orders.json');
        fs.writeFileSync(ordersFile, JSON.stringify(exportData, null, 2));
        
        console.log(`✅ ${ordersWithItems.length} pedidos exportados a: ${ordersFile}`);
        console.log(`📊 Resumen:`);
        console.log(`   - Total pedidos: ${ordersWithItems.length}`);
        console.log(`   - Pendientes: ${ordersWithItems.filter(o => o.status === 'pending' || o.status === 'pending_payment').length}`);
        console.log(`   - Completados: ${ordersWithItems.filter(o => o.status === 'completed' || o.status === 'delivered').length}`);
        console.log(`   - Cancelados: ${ordersWithItems.filter(o => o.status === 'cancelled').length}`);
        console.log(`   - Total items: ${ordersWithItems.reduce((sum, o) => sum + (o.items?.length || 0), 0)}`);
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Error durante la exportación de pedidos:', error);
        throw error;
    } finally {
        // Asegurarse de cerrar la conexión a la base de datos
        if (getDatabase()) {
            await getDatabase().disconnect();
            console.log('🔌 Base de datos desconectada.');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    exportOrders()
        .then(() => {
            console.log('✅ Exportación de pedidos completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = exportOrders;
