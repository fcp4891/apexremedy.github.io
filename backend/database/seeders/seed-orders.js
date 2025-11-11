// backend/database/seeders/seed-orders.js
// Seed completo de órdenes con direcciones y envíos relacionados
// Uso: node seed-orders.js [--force] [--count=100]

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const args = process.argv.slice(2);
const options = {
    force: args.includes('--force'),
    count: parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1] || '150')
};

// ============================================
// UTILIDADES
// ============================================

const createDbHelper = (db) => ({
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    }),
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    })
});

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// ============================================
// DATOS DE CHILE
// ============================================

const COMUNAS_RM = [
    'Santiago', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa',
    'San Miguel', 'Puente Alto', 'San Bernardo', 'Recoleta', 'Independencia',
    'Estación Central', 'Quilicura', 'Cerrillos', 'Lo Prado', 'Pudahuel',
    'Quinta Normal', 'Vitacura', 'Lo Barnechea', 'Macul', 'Peñalolén',
    'La Reina', 'San Joaquín', 'La Cisterna', 'El Bosque', 'San Ramón',
    'La Granja', 'Pedro Aguirre Cerda', 'Lo Espejo', 'Conchalí', 'Huechuraba',
    'Renca', 'Cerro Navia', 'La Pintana'
];

const REGIONES = [
    { name: 'Metropolitana de Santiago', code: '13' },
    { name: 'Valparaíso', code: '05' },
    { name: 'Biobío', code: '08' },
    { name: 'Araucanía', code: '14' },
    { name: 'Los Lagos', code: '10' }
];

const STATUS_ORDERS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS = ['pending', 'authorized', 'captured', 'failed', 'refunded'];
const FULFILLMENT_STATUS = ['unfulfilled', 'fulfilled', 'partial', 'shipped'];

const CARRIERS = ['Chilexpress', 'Starken', 'Correos Chile', 'Blue Express'];

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedOrders() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('📦 Iniciando seed de Órdenes...\n');

    try {
        // Obtener datos existentes
        const users = await dbHelper.all('SELECT id, email, name FROM users WHERE status = "active" LIMIT 100');
        const products = await dbHelper.all('SELECT id, name, base_price, stock_quantity FROM products WHERE status = "active" LIMIT 100');
        const shippingMethods = await dbHelper.all('SELECT id, code, name FROM shipping_methods WHERE status = "active"');
        const warehouses = await dbHelper.all('SELECT id FROM warehouses WHERE status = "active" LIMIT 1');

        if (users.length === 0) {
            console.log('⚠️  No hay usuarios. Ejecuta seed-users.js primero.');
            db.close();
            return;
        }

        if (products.length === 0) {
            console.log('⚠️  No hay productos. Ejecuta seed-products.js primero.');
            db.close();
            return;
        }

        console.log(`✅ Usuarios encontrados: ${users.length}`);
        console.log(`✅ Productos encontrados: ${products.length}`);

        // Calcular fechas
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90); // Últimos 90 días

        // Verificar si ya hay órdenes
        const existingOrders = await dbHelper.get('SELECT COUNT(*) as count FROM orders');
        if (existingOrders.count > 0 && !options.force) {
            console.log(`⚠️  Ya existen ${existingOrders.count} órdenes. Usa --force para agregar más.`);
            db.close();
            return;
        }

        // ============================================
        // CREAR ÓRDENES
        // ============================================
        console.log(`\n📦 Creando ${options.count} órdenes...`);

        let ordersCreated = 0;
        let addressesCreated = 0;
        let shipmentsCreated = 0;

        for (let i = 0; i < options.count; i++) {
            const user = randomChoice(users);
            const orderDate = randomDate(startDate, endDate);
            
            // Crear dirección de envío
            const commune = randomChoice(COMUNAS_RM);
            const region = randomChoice(REGIONES);
            const isRM = region.name.includes('Metropolitana');
            
            const addressResult = await dbHelper.run(`
                INSERT INTO addresses 
                (user_id, label, full_name, rut, line1, line2, commune, city, region, country, 
                 postal_code, phone, is_default_shipping, is_default_billing, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user.id,
                'Casa',
                user.name,
                `${randomInt(10000000, 99999999)}-${randomInt(0, 9)}`,
                `Calle ${randomInt(1, 9999)}`,
                Math.random() < 0.3 ? `Depto ${randomInt(1, 100)}` : null,
                commune,
                isRM ? 'Santiago' : region.name,
                region.name,
                'Chile',
                `${randomInt(7500000, 9999999)}`,
                `+569${randomInt(10000000, 99999999)}`,
                1,
                1,
                orderDate.toISOString(),
                orderDate.toISOString()
            ]);
            const addressId = addressResult.lastID;
            addressesCreated++;

            // Crear items de la orden
            const itemsCount = randomInt(1, 5);
            const orderItems = [];
            let subtotal = 0;

            for (let j = 0; j < itemsCount; j++) {
                const product = randomChoice(products);
                const quantity = randomInt(1, 3);
                const unitPrice = product.base_price;
                const itemTotal = unitPrice * quantity;
                subtotal += itemTotal;

                orderItems.push({
                    product_id: product.id,
                    quantity: quantity,
                    unit_price: unitPrice,
                    total: itemTotal
                });
            }

            // Calcular totales
            const taxAmount = subtotal * 0.19; // IVA 19%
            const shippingAmount = randomInt(3000, 8000);
            const discountAmount = Math.random() < 0.2 ? subtotal * randomInt(5, 15) / 100 : 0;
            const total = subtotal + taxAmount + shippingAmount - discountAmount;

            // Estado de la orden
            const status = randomChoice(STATUS_ORDERS);
            const paymentStatus = status === 'cancelled' ? 'failed' : 
                                status === 'delivered' ? 'captured' : 
                                randomChoice(['pending', 'authorized', 'captured']);
            const fulfillmentStatus = status === 'delivered' ? 'fulfilled' :
                                     status === 'shipped' ? 'shipped' :
                                     status === 'processing' ? 'partial' : 'unfulfilled';
            
            // Método de pago aleatorio
            const paymentMethods = ['transfer', 'cash', 'credit_card', 'debit_card'];
            const paymentMethod = randomChoice(paymentMethods);

            // Crear orden
            const orderNumber = `ORD-${Date.now()}-${user.id}-${i}`;
            const orderResult = await dbHelper.run(`
                INSERT INTO orders 
                (order_number, user_id, status, payment_status, fulfillment_status, subtotal, 
                 tax_amount, shipping_amount, discount_amount, total, currency, notes, 
                 shipping_address_id, billing_address_id, shipping_method, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                orderNumber,
                user.id,
                status,
                paymentStatus,
                fulfillmentStatus,
                subtotal,
                taxAmount,
                shippingAmount,
                discountAmount,
                total,
                'CLP',
                Math.random() < 0.1 ? 'Orden especial - entrega rápida' : null,
                addressId,
                addressId,
                randomChoice(shippingMethods)?.code || 'STANDARD',
                orderDate.toISOString(),
                orderDate.toISOString()
            ]);
            const orderId = orderResult.lastID;

            // Crear items de la orden
            for (const item of orderItems) {
                const product = products.find(p => p.id === item.product_id);
                await dbHelper.run(`
                    INSERT INTO order_items 
                    (order_id, product_id, product_name, quantity, unit_price, subtotal, 
                     tax_amount, discount_amount, total, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    orderId,
                    item.product_id,
                    product.name,
                    item.quantity,
                    item.unit_price,
                    item.total,
                    item.total * 0.19,
                    0,
                    item.total * 1.19,
                    orderDate.toISOString()
                ]);
            }

            // Crear historial de estado
            await dbHelper.run(`
                INSERT INTO order_status_history 
                (order_id, status, notes, created_at)
                VALUES (?, ?, ?, ?)
            `, [
                orderId,
                status,
                'Estado inicial',
                orderDate.toISOString()
            ]);

            // Crear pago relacionado
            if (paymentStatus !== 'failed') {
                const paymentMethods = await dbHelper.all('SELECT id FROM payment_methods WHERE is_active = 1 LIMIT 1');
                if (paymentMethods.length > 0) {
                    const paymentProvider = await dbHelper.get('SELECT id FROM payment_providers WHERE is_active = 1 LIMIT 1');
                    const amountGross = Math.round(total);
                    // Fee solo para transferencias y tarjetas, efectivo sin fee
                    const fee = (paymentMethod === 'transfer' || paymentMethod === 'credit_card' || paymentMethod === 'debit_card') 
                                ? Math.round(amountGross * 0.03) // 3% fee
                                : 0;
                    const amountNet = amountGross - fee;
                    
                    // Mapear método de pago para la tabla payments
                    let paymentMethodForPayments = paymentMethod;
                    if (paymentMethod === 'credit_card') paymentMethodForPayments = 'credit';
                    if (paymentMethod === 'debit_card') paymentMethodForPayments = 'debit';

                    await dbHelper.run(`
                        INSERT INTO payments 
                        (order_id, customer_id, method, provider_id, status, amount_gross, fee, 
                         amount_net, currency, authorized_at, captured_at, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        orderId,
                        user.id,
                        paymentMethodForPayments,
                        paymentMethod === 'cash' ? null : (paymentProvider ? paymentProvider.id : null),
                        paymentStatus,
                        amountGross,
                        fee,
                        amountNet,
                        'CLP',
                        paymentStatus !== 'pending' ? orderDate.toISOString() : null,
                        paymentStatus === 'captured' ? orderDate.toISOString() : null,
                        orderDate.toISOString(),
                        orderDate.toISOString()
                    ]);
                }
            }

            // Crear envío si está enviado o entregado
            if (status === 'shipped' || status === 'delivered') {
                const carrier = randomChoice(CARRIERS);
                const trackingNumber = `${carrier.substring(0, 3).toUpperCase()}-${randomInt(100000000, 999999999)}`;
                const shippedDate = new Date(orderDate);
                shippedDate.setDate(shippedDate.getDate() + randomInt(1, 3));
                
                const deliveryDate = status === 'delivered' ? new Date(shippedDate) : null;
                if (deliveryDate) {
                    deliveryDate.setDate(deliveryDate.getDate() + randomInt(1, 5));
                }

                const shipmentResult = await dbHelper.run(`
                    INSERT INTO shipments 
                    (order_id, tracking_number, carrier, service_code, weight, status, 
                     shipped_at, estimated_delivery, delivered_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    orderId,
                    trackingNumber,
                    carrier,
                    'STANDARD',
                    randomInt(500, 5000), // gramos
                    status === 'delivered' ? 'delivered' : 'in_transit',
                    shippedDate.toISOString(),
                    deliveryDate ? deliveryDate.toISOString() : null,
                    deliveryDate ? deliveryDate.toISOString() : null,
                    orderDate.toISOString(),
                    orderDate.toISOString()
                ]);
                shipmentsCreated++;

                // Crear eventos de envío
                await dbHelper.run(`
                    INSERT INTO shipment_events 
                    (shipment_id, status, location, description, event_at, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    shipmentResult.lastID,
                    'shipped',
                    'Santiago',
                    'Enviado desde bodega',
                    shippedDate.toISOString(),
                    shippedDate.toISOString()
                ]);

                if (deliveryDate) {
                    await dbHelper.run(`
                        INSERT INTO shipment_events 
                        (shipment_id, status, location, description, event_at, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        shipmentResult.lastID,
                        'delivered',
                        commune,
                        'Entregado al destinatario',
                        deliveryDate.toISOString(),
                        deliveryDate.toISOString()
                    ]);
                }
            }

            ordersCreated++;
            if (ordersCreated % 25 === 0) {
                console.log(`   ✅ ${ordersCreated} órdenes creadas...`);
            }
        }

        console.log(`\n✅ Seed de Órdenes completado exitosamente!\n`);
        console.log('📊 Resumen:');
        console.log(`   - Órdenes creadas: ${ordersCreated}`);
        console.log(`   - Direcciones creadas: ${addressesCreated}`);
        console.log(`   - Envíos creados: ${shipmentsCreated}`);
        console.log(`   - Items de orden: ~${ordersCreated * 3} (aprox)`);
        console.log(`   - Pagos creados: ~${Math.floor(ordersCreated * 0.9)} (aprox)\n`);

    } catch (error) {
        console.error('❌ Error en seed de órdenes:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar
if (require.main === module) {
    seedOrders()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { seedOrders };








