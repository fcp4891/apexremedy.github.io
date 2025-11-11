// backend/database/seeders/seed-webhooks.js
// Seed para generar entregas de webhooks de prueba

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

async function seedWebhooks() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n📡 Iniciando seed de webhooks...\n');

    // Obtener datos necesarios
    const payments = await dbHelper.all('SELECT id FROM payments LIMIT 50');
    const refunds = await dbHelper.all('SELECT id FROM refunds LIMIT 20');

    const count = 50;
    const events = ['payment.captured', 'payment.failed', 'payment.voided', 'refund.processed', 'refund.failed'];
    const statuses = ['pending', 'delivered', 'failed'];
    const endpoints = [
      'https://api.example.com/webhooks/payments',
      'https://webhook.example.com/payments',
      'https://api.example.com/webhooks/refunds'
    ];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date();

    console.log(`📡 Generando ${count} entregas de webhooks...\n`);

    for (let i = 1; i <= count; i++) {
      const event = randomChoice(events);
      const status = randomChoice(statuses);
      const endpoint = randomChoice(endpoints);
      
      let resourceId = null;
      let resourceType = null;

      if (event.startsWith('payment.')) {
        if (payments.length > 0) {
          resourceId = randomChoice(payments).id;
          resourceType = 'payment';
        }
      } else if (event.startsWith('refund.')) {
        if (refunds.length > 0) {
          resourceId = randomChoice(refunds).id;
          resourceType = 'refund';
        }
      }

      if (!resourceId) {
        skipped++;
        continue;
      }

      const createdAt = randomDate(startDate, endDate);
      const deliveredAt = status === 'delivered'
        ? formatDate(new Date(createdAt.getTime() + randomBetween(100, 5000)))
        : null;
      
      const failedAt = status === 'failed'
        ? formatDate(new Date(createdAt.getTime() + randomBetween(100, 5000)))
        : null;

      const payload = JSON.stringify({
        event,
        resource_type: resourceType,
        resource_id: resourceId,
        timestamp: createdAt.toISOString()
      });

      const responseCode = status === 'delivered' ? 200 : (status === 'failed' ? randomChoice([400, 500, 503]) : null);
      const responseBody = status === 'delivered' 
        ? JSON.stringify({ received: true })
        : (status === 'failed' ? JSON.stringify({ error: 'Failed to deliver' }) : null);

      const providerId = Math.random() > 0.5 ? (await dbHelper.get('SELECT id FROM payment_providers LIMIT 1'))?.id : null;

      try {
        await dbHelper.run(
          `INSERT INTO webhook_deliveries 
           (provider_id, event_type, payload, status, response_code, response_body, retry_count, delivered_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            providerId,
            event,
            payload,
            status,
            responseCode,
            responseBody,
            status === 'failed' ? randomBetween(1, 3) : 0,
            deliveredAt,
            formatDate(createdAt)
          ]
        );

        inserted++;
        if (i % 10 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} webhooks insertados...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando webhook ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de webhooks completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Webhooks insertados: ${inserted}`);
    console.log(`   - Webhooks omitidos: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de webhooks:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedWebhooks()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedWebhooks };

