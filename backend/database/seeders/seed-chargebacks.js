// backend/database/seeders/seed-chargebacks.js
// Seed para generar chargebacks de prueba

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

function generateCaseId() {
  return `CB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

async function seedChargebacks() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n⚠️  Iniciando seed de chargebacks...\n');

    // Obtener datos necesarios
    const payments = await dbHelper.all('SELECT id, amount_gross, amount FROM payments WHERE status = "captured" LIMIT 50');

    if (payments.length === 0) {
      console.log('⚠️  No hay pagos capturados disponibles para crear chargebacks');
      return;
    }

    const count = 20;
    const stages = ['notification', 'chargeback', 'pre-arbitration', 'arbitration', 'won', 'lost'];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();

    console.log(`⚠️  Generando ${count} chargebacks...\n`);

    for (let i = 1; i <= count; i++) {
      const payment = randomChoice(payments);
      const stage = randomChoice(stages);
      const caseId = generateCaseId();

      const createdAt = randomDate(startDate, endDate);
      const deadlineAt = stage !== 'notification' 
        ? formatDate(new Date(createdAt.getTime() + randomBetween(7, 30) * 86400000))
        : null;

      try {
        await dbHelper.run(
          `INSERT INTO chargebacks 
           (payment_id, case_id, stage, deadline_at, evidence_links, status, outcome, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            payment.id,
            caseId,
            stage,
            deadlineAt,
            stage !== 'notification' ? JSON.stringify(['https://example.com/evidence.pdf']) : null,
            'open',
            ['won', 'lost'].includes(stage) ? stage : null,
            `Chargeback - Etapa ${stage}`,
            formatDate(createdAt),
            formatDate(createdAt)
          ]
        );

        inserted++;
        if (i % 5 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} chargebacks insertados...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando chargeback ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de chargebacks completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Chargebacks insertados: ${inserted}`);
    console.log(`   - Chargebacks omitidos: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de chargebacks:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedChargebacks()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedChargebacks };

