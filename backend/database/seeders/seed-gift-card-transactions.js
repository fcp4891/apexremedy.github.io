// backend/database/seeders/seed-gift-card-transactions.js
// Seed para generar transacciones de gift cards

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

async function seedGiftCardTransactions() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n💳 Iniciando seed de transacciones de gift cards...\n');

    // Obtener datos necesarios - verificar columnas primero
    const tableCols = await dbHelper.all('PRAGMA table_info(gift_cards)');
    const colNames = tableCols.map(c => c.name);
    const hasInitialBalance = colNames.includes('initial_balance');
    const selectCols = hasInitialBalance ? 'id, balance, initial_balance' : 'id, balance';
    const giftCards = await dbHelper.all(`SELECT ${selectCols} FROM gift_cards WHERE status IN ("active") OR issued_at IS NOT NULL`);
    const payments = await dbHelper.all('SELECT id FROM payments WHERE status = "captured" LIMIT 30');
    const orders = await dbHelper.all('SELECT id FROM orders LIMIT 20');
    const users = await dbHelper.all('SELECT id FROM users LIMIT 10');

    if (giftCards.length === 0) {
      console.log('⚠️  No hay gift cards disponibles. Ejecuta seed-gift-cards.js primero.');
      return;
    }

    const count = 100;
    const types = ['spend', 'topup', 'adjustment', 'reversal'];
    const sources = ['api', 'ui', 'pos'];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();

    console.log(`💳 Generando ${count} transacciones...\n`);

    for (let i = 1; i <= count; i++) {
      const giftCard = randomChoice(giftCards);
      const type = randomChoice(types);
      const source = randomChoice(sources);
      const operator = Math.random() > 0.5 ? randomChoice(users) : null;

      // Balance actual de la gift card (simulado)
      let balanceBefore = giftCard.balance || giftCard.initial_value || 0;
      
      let amount = 0;
      let balanceAfter = balanceBefore;

      if (type === 'spend') {
        // Gasto: máximo el balance disponible
        amount = randomBetween(Math.round(balanceBefore * 0.1), Math.round(balanceBefore * 0.9));
        balanceAfter = balanceBefore - amount;
      } else if (type === 'topup') {
        // Recarga
        amount = randomBetween(5000, 50000);
        balanceAfter = balanceBefore + amount;
      } else if (type === 'adjustment') {
        // Ajuste manual
        amount = randomBetween(-5000, 10000);
        balanceAfter = balanceBefore + amount;
      } else if (type === 'reversal') {
        // Reversión: monto positivo
        amount = randomBetween(1000, 10000);
        balanceAfter = balanceBefore + amount;
      }

      const relatedPayment = type === 'spend' && payments.length > 0 && Math.random() > 0.5 ? randomChoice(payments) : null;
      const relatedOrder = type === 'spend' && orders.length > 0 && Math.random() > 0.7 ? randomChoice(orders) : null;

      const createdAt = randomDate(startDate, endDate);

      try {
        // Verificar columnas disponibles
        const tableCols = await dbHelper.all('PRAGMA table_info(gift_card_transactions)');
        const colNames = tableCols.map(c => c.name);
        
        let columns = ['gift_card_id', 'transaction_type', 'amount', 'balance_after', 'created_at'];
        let values = [
          giftCard.id,
          type,
          amount,
          balanceAfter,
          formatDate(createdAt)
        ];
        
        if (colNames.includes('order_id') && relatedOrder) {
          columns.push('order_id');
          values.push(relatedOrder.id);
        }
        
        if (colNames.includes('source')) {
          columns.push('source');
          values.push(source);
        }
        
        if (colNames.includes('operator') && operator) {
          columns.push('operator');
          values.push(operator.id);
        }
        
        if (colNames.includes('notes')) {
          columns.push('notes');
          values.push(type === 'adjustment' ? 'Ajuste manual de balance' : null);
        }
        
        const placeholders = values.map(() => '?').join(', ');
        await dbHelper.run(
          `INSERT INTO gift_card_transactions (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );

        inserted++;
        if (i % 20 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} transacciones insertadas...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando transacción ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de transacciones de gift cards completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Transacciones insertadas: ${inserted}`);
    console.log(`   - Transacciones omitidas: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de transacciones:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedGiftCardTransactions()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedGiftCardTransactions };

