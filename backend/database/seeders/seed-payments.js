// backend/database/seeders/seed-payments.js
// Seed de pagos con múltiples transacciones y métodos de pago
// Uso: node seed-payments.js [--force] [--count=N]

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
});

const args = process.argv.slice(2);
const force = args.includes('--force');
const countArg = args.find(arg => arg.startsWith('--count='));
const PAYMENT_COUNT = countArg ? parseInt(countArg.split('=')[1]) || 100 : 100;

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString();
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedPayments() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log(`\n💳 Iniciando seed de pagos (${PAYMENT_COUNT} registros)...\n`);

    // Verificar que existan las tablas necesarias
    const requiredTables = ['orders', 'users', 'payment_providers', 'payment_methods'];
    for (const table of requiredTables) {
      const exists = await dbHelper.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (!exists) {
        throw new Error(`Tabla ${table} no existe. Ejecuta create_tables.js primero.`);
      }
    }

    // Obtener datos necesarios
    console.log('📊 Obteniendo datos de referencia...');
    const orders = await dbHelper.all('SELECT id, user_id, total FROM orders LIMIT 100');
    const users = await dbHelper.all('SELECT id FROM users LIMIT 50');
    const providers = await dbHelper.all('SELECT id, provider_key FROM payment_providers');
    const methods = await dbHelper.all('SELECT id, name FROM payment_methods');

    if (orders.length === 0) {
      console.warn('⚠️  No hay órdenes en la base de datos.');
      console.log('   Creando órdenes dummy para asociar pagos...');
      
      // Crear órdenes dummy para poder asociar pagos
      const now = new Date();
      const dummyOrders = [];
      for (let i = 0; i < 20; i++) {
        const user = randomChoice(users);
        const orderNumber = `ORD-DUMMY-${Date.now()}-${i}`;
        const total = randomBetween(10000, 200000);
        const subtotal = Math.round(total / 1.19);
        const tax = total - subtotal;
        
        try {
          const result = await dbHelper.run(
            `INSERT INTO orders 
             (order_number, user_id, status, payment_status, fulfillment_status, 
              subtotal, tax_amount, shipping_amount, discount_amount, total, currency, created_at, updated_at)
             VALUES (?, ?, 'pending', 'pending', 'unfulfilled', ?, ?, 0, 0, ?, 'CLP', ?, ?)`,
            [
              orderNumber, user.id, subtotal, tax, total,
              formatDate(now), formatDate(now)
            ]
          );
          dummyOrders.push({ id: result.lastID, user_id: user.id, total });
        } catch (error) {
          console.warn(`   ⚠️  Error creando orden dummy ${i}:`, error.message);
        }
      }
      
      // Agregar órdenes dummy a la lista
      orders.push(...dummyOrders);
      console.log(`   ✅ ${orders.length} órdenes disponibles para asociar pagos\n`);
    }
    if (users.length === 0) {
      throw new Error('No hay usuarios en la base de datos. Ejecuta seed-users.js primero.');
    }

    console.log(`   - Órdenes disponibles: ${orders.length}`);
    console.log(`   - Usuarios disponibles: ${users.length}`);
    console.log(`   - Proveedores: ${providers.length}`);
    console.log(`   - Métodos: ${methods.length}\n`);

    // Mapear métodos de pago
    const methodMap = {
      'transfer': methods.find(m => m.name.includes('Transferencia')),
      'credit': methods.find(m => m.name.includes('Crédito')),
      'debit': methods.find(m => m.name.includes('Débito')),
      'cash': methods.find(m => m.name.includes('Efectivo')),
      'gift_card': methods.find(m => m.name.includes('Gift Card'))
    };

    const transbankProvider = providers.find(p => p.provider_key === 'transbank');
    const transferProvider = providers.find(p => p.provider_key === 'transfer');

    // Estados de pago
    const statuses = ['authorized', 'captured', 'failed', 'voided'];
    const methods_types = ['transfer', 'credit', 'debit', 'cash', 'gift_card'];

    // Generar pagos
    console.log('💳 Generando pagos...');
    const now = new Date();
    const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 días atrás
    const endDate = new Date();

    let inserted = 0;
    let skipped = 0;
    const statusCounts = { authorized: 0, captured: 0, failed: 0, voided: 0 };
    const methodCounts = { transfer: 0, credit: 0, debit: 0, cash: 0, gift_card: 0 };

    for (let i = 0; i < PAYMENT_COUNT; i++) {
      try {
        // Seleccionar orden aleatoria (OBLIGATORIO - todos los pagos deben tener order_id)
        if (orders.length === 0) {
          console.warn('⚠️  No hay órdenes disponibles. Saltando creación de pagos sin órdenes.');
          skipped++;
          continue;
        }
        const order = randomChoice(orders);
        const user = users.find(u => u.id === order.user_id) || randomChoice(users);
        const methodType = randomChoice(methods_types);
        const status = randomChoice(statuses);
        const method = methodMap[methodType] || randomChoice(methods);

        // Usar el total de la orden como monto del pago (debe coincidir)
        const amountGross = Math.round(order.total || randomBetween(5000, 500000));
        
        // Calcular fee según método
        let fee = 0;
        let providerId = null;
        
        if (methodType === 'transfer') {
          fee = 0; // Sin fee
          providerId = transferProvider?.id || null;
        } else if (methodType === 'credit' || methodType === 'debit') {
          fee = Math.round(amountGross * 0.0295); // 2.95%
          providerId = transbankProvider?.id || null;
        } else if (methodType === 'cash') {
          fee = 0;
          providerId = null;
        } else if (methodType === 'gift_card') {
          fee = 0;
          providerId = null;
        }

        const amountNet = amountGross - fee;

        // Fechas según estado
        const createdAt = randomDate(startDate, endDate);
        const authorizedAt = status !== 'failed' ? formatDate(new Date(createdAt.getTime() + randomBetween(1, 300) * 1000)) : null;
        const capturedAt = status === 'captured' && authorizedAt 
          ? formatDate(new Date(new Date(authorizedAt).getTime() + randomBetween(1, 3600) * 1000))
          : null;

        // Failure info solo para pagos fallidos
        let failureCode = null;
        let failureMessage = null;
        if (status === 'failed') {
          const failureReasons = [
            { code: 'insufficient_funds', message: 'Fondos insuficientes' },
            { code: 'card_declined', message: 'Tarjeta rechazada' },
            { code: 'network_error', message: 'Error de red' },
            { code: 'timeout', message: 'Tiempo de espera agotado' },
            { code: 'invalid_card', message: 'Tarjeta inválida' }
          ];
          const failure = randomChoice(failureReasons);
          failureCode = failure.code;
          failureMessage = failure.message;
        }

        // Risk score aleatorio
        const riskScore = randomBetween(0, 100);

        // Verificar si ya existe un pago para esta orden
        if (!force) {
          const existing = await dbHelper.get(
            'SELECT id FROM payments WHERE order_id = ?',
            [order.id]
          );
          if (existing) {
            skipped++;
            continue;
          }
        }

        // Usar el método de pago correcto (código, no nombre)
        // El campo 'method' debe ser: 'transfer', 'credit', 'debit', 'cash', 'gift_card'
        const paymentMethodCode = methodType; // Ya es el código correcto
        
        // Insertar pago - usar el campo 'method' con el código correcto
        await dbHelper.run(
          `INSERT INTO payments 
           (order_id, customer_id, method, provider_id, status, amount_gross, fee, 
            amount_net, currency, authorized_at, captured_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id, // SIEMPRE debe tener order_id
            order.user_id || user.id, // Usar user_id de la orden si está disponible
            paymentMethodCode, // 'transfer', 'credit', 'debit', 'cash', 'gift_card'
            providerId,
            status,
            amountGross,
            fee,
            amountNet,
            'CLP',
            authorizedAt,
            capturedAt,
            formatDate(createdAt),
            formatDate(createdAt)
          ]
        );

        inserted++;
        statusCounts[status]++;
        methodCounts[methodType]++;

        if (inserted % 10 === 0) {
          process.stdout.write(`\r   Progreso: ${inserted}/${PAYMENT_COUNT} pagos insertados...`);
        }

      } catch (error) {
        console.error(`\n❌ Error insertando pago ${i + 1}:`, error.message);
      }
    }

    console.log(`\n\n✅ Seed de pagos completado\n`);
    console.log('📊 Resumen:');
    console.log(`   - Pagos insertados: ${inserted}`);
    console.log(`   - Pagos omitidos: ${skipped}`);
    console.log('\n📈 Por estado:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    console.log('\n💳 Por método:');
    Object.entries(methodCounts).forEach(([method, count]) => {
      console.log(`   - ${method}: ${count}`);
    });
    console.log();

  } catch (error) {
    console.error('❌ Error fatal en seed de pagos:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  // Verificar relaciones antes de ejecutar
  const { checkRelations } = require('./check-relations');
  
  checkRelations()
    .then(canProceed => {
      if (!canProceed) {
        console.error('\n❌ No se puede ejecutar seed de pagos. Corrige los problemas mencionados arriba.');
        process.exit(1);
      }
      
      console.log('🚀 Ejecutando seed de pagos...\n');
      return seedPayments();
    })
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedPayments };

