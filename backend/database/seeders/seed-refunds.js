// backend/database/seeders/seed-refunds.js
// Seed para generar reembolsos de prueba

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
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

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0] + ' ' + date.toISOString().split('T')[1].split('.')[0];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedRefunds() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n💸 Iniciando seed de reembolsos...\n');

    // Obtener datos necesarios
    const payments = await dbHelper.all('SELECT id, order_id, amount_gross, amount FROM payments WHERE status IN ("captured", "authorized") LIMIT 50');
    const reasons = await dbHelper.all('SELECT id FROM refund_reasons');
    const users = await dbHelper.all('SELECT id FROM users LIMIT 10');
    const orders = await dbHelper.all('SELECT id FROM orders LIMIT 20');

    if (payments.length === 0) {
      console.log('⚠️  No hay pagos disponibles para crear reembolsos');
      return;
    }

    if (reasons.length === 0) {
      console.log('⚠️  No hay motivos de reembolso. Ejecuta seed-parametricas.js primero.');
      return;
    }

    const count = 30;
    const statuses = ['draft', 'pending', 'approved', 'processed', 'failed'];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();

    console.log(`💸 Generando ${count} reembolsos...\n`);

    for (let i = 1; i <= count; i++) {
      const payment = randomChoice(payments);
      const reason = randomChoice(reasons);
      const status = randomChoice(statuses);
      const requestedBy = randomChoice(users);
      const approvedBy = status === 'approved' || status === 'processed' ? randomChoice(users) : null;

      // Usar order_id del pago o uno aleatorio si no tiene
      const orderId = payment.order_id || (orders.length > 0 ? randomChoice(orders).id : null);
      
      if (!orderId) {
        skipped++;
        continue; // Saltar si no hay order_id disponible
      }

      // Monto: máximo el monto del pago, normalmente parcial
      const maxAmount = payment.amount_gross || payment.amount || 0;
      const amount = Math.round(maxAmount * randomBetween(50, 100) / 100);

      // Fechas según estado
      const createdAt = randomDate(startDate, endDate);
      const processedAt = ['processed', 'failed'].includes(status) && approvedBy
        ? formatDate(new Date(createdAt.getTime() + randomBetween(1, 86400) * 1000))
        : null;

      try {
        await dbHelper.run(
          `INSERT INTO refunds 
           (payment_id, order_id, amount, reason_id, status, requested_by, approved_by, processed_at, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payment.id,
            orderId,
            amount,
            reason.id,
            status,
            requestedBy.id,
            approvedBy?.id || null,
            processedAt,
            status === 'failed' ? 'Error al procesar reembolso' : null,
            formatDate(createdAt),
            formatDate(createdAt)
          ]
        );

        inserted++;
        if (i % 10 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} reembolsos insertados...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando reembolso ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de reembolsos completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Reembolsos insertados: ${inserted}`);
    console.log(`   - Reembolsos omitidos: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de reembolsos:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedRefunds()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedRefunds };

