// backend/database/seeders/seed-settlements.js
// Seed para generar conciliaciones (settlements) de prueba

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

async function seedSettlements() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n💼 Iniciando seed de conciliaciones...\n');

    // Obtener datos necesarios
    const providers = await dbHelper.all('SELECT id FROM payment_providers WHERE is_active = 1');
    const payments = await dbHelper.all('SELECT id, amount_net, amount_gross, fee FROM payments WHERE status = "captured" LIMIT 100');

    if (providers.length === 0) {
      console.log('⚠️  No hay proveedores de pago disponibles');
      return;
    }

    if (payments.length === 0) {
      console.log('⚠️  No hay pagos capturados disponibles');
      return;
    }

    const count = 15;
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();

    console.log(`💼 Generando ${count} conciliaciones...\n`);

    for (let i = 1; i <= count; i++) {
      const provider = randomChoice(providers);
      const status = randomChoice(statuses);
      
      // Agrupar pagos por provider para la conciliación
      // Simular pagos del proveedor (50% de probabilidad)
      const providerPayments = [];
      for (const payment of payments) {
        if (Math.random() > 0.5 && providerPayments.length < 20) {
          providerPayments.push(payment);
        }
      }
      
      if (providerPayments.length < 3) {
        // Asegurar al menos 3 pagos
        providerPayments.push(...payments.slice(0, Math.min(3, payments.length)));
      }

      if (providerPayments.length === 0) continue;

      const totalGross = providerPayments.reduce((sum, p) => sum + (p.amount_gross || p.amount || 0), 0);
      const totalFees = providerPayments.reduce((sum, p) => sum + (p.fee || 0), 0);
      const totalNet = totalGross - totalFees;

      const settlementDate = randomDate(startDate, endDate);
      const settlementNumber = `STL-${settlementDate.getFullYear()}${String(settlementDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(4, '0')}`;

      const processedAt = status === 'completed' || status === 'failed'
        ? formatDate(new Date(settlementDate.getTime() + randomBetween(1, 3) * 86400000))
        : null;

      try {
        // Verificar columnas disponibles
      const tableCols = await dbHelper.all('PRAGMA table_info(settlements)');
      const colNames = tableCols.map(c => c.name);
      
      const period = `${settlementDate.getFullYear()}-${String(settlementDate.getMonth() + 1).padStart(2, '0')}`;
      
      let columns = ['provider_id', 'period', 'status', 'created_at', 'updated_at'];
      let values = [
        provider.id,
        period,
        status,
        formatDate(settlementDate),
        formatDate(settlementDate)
      ];
      
      if (colNames.includes('settlement_number')) {
        columns.splice(2, 0, 'settlement_number');
        values.splice(2, 0, settlementNumber);
      }
      
      if (colNames.includes('file_name')) {
        columns.push('file_name');
        values.push(status === 'completed' ? `${settlementNumber}.csv` : null);
      }
      
      if (colNames.includes('uploaded_at')) {
        columns.push('uploaded_at');
        values.push(status === 'completed' ? processedAt : null);
      }

      const placeholders = values.map(() => '?').join(', ');
      const result = await dbHelper.run(
          `INSERT INTO settlements (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );

        const settlementId = result.lastID;

        // Crear líneas de conciliación para cada pago
        for (const payment of providerPayments) {
          try {
            const providerTxId = `TX-${payment.id}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const paymentAmount = payment.amount_net || payment.amount || 0;
            const fee = payment.fee || 0;
            
            await dbHelper.run(
              `INSERT INTO settlement_lines 
               (settlement_id, date, provider_tx_id, matched_payment_id, amount, fee, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                settlementId,
                formatDate(settlementDate).split(' ')[0],
                providerTxId,
                payment.id,
                paymentAmount,
                fee,
                formatDate(settlementDate)
              ]
            );
          } catch (error) {
            // Ignorar errores de líneas individuales
          }
        }

        inserted++;
        if (i % 5 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} conciliaciones insertadas...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando conciliación ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de conciliaciones completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Conciliaciones insertadas: ${inserted}`);
    console.log(`   - Conciliaciones omitidas: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de conciliaciones:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedSettlements()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedSettlements };

