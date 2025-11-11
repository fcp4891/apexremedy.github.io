// backend/database/seeders/seed-gift-cards.js
// Seed para generar gift cards de prueba

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

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

function generateCode(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0] + ' ' + date.toISOString().split('T')[1].split('.')[0];
}

async function seedGiftCards() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n🎁 Iniciando seed de gift cards...\n');

    // Obtener datos necesarios
    const users = await dbHelper.all('SELECT id FROM users LIMIT 20');
    const campaigns = await dbHelper.all('SELECT id FROM gift_card_campaigns');

    const count = 50;
    const statuses = ['active', 'inactive', 'expired', 'redeemed']; // Usar status en lugar de state
    const values = [5000, 10000, 20000, 50000, 100000, 200000];
    let inserted = 0;
    let skipped = 0;

    const now = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    console.log(`🎁 Generando ${count} gift cards...\n`);

    for (let i = 1; i <= count; i++) {
      const status = randomChoice(statuses);
      const initialBalance = randomChoice(values);
      const balance = status === 'redeemed' ? 0 : randomBetween(0, initialBalance);
      const customer = Math.random() > 0.3 ? randomChoice(users) : null;
      const campaign = campaigns.length > 0 && Math.random() > 0.5 ? randomChoice(campaigns) : null;
      
      // Fecha de emisión
      const issuedAt = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
      
      // Fecha de expiración: 30-365 días desde emisión
      const expiresAt = new Date(issuedAt);
      expiresAt.setDate(expiresAt.getDate() + randomBetween(30, 365));

      const code = generateCode();

      try {
        // Verificar si el código ya existe
        const existing = await dbHelper.get('SELECT id FROM gift_cards WHERE code = ?', [code]);
        if (existing) {
          skipped++;
          continue;
        }

        // Verificar qué columnas existen
        const tableCols = await dbHelper.all('PRAGMA table_info(gift_cards)');
        const colNames = tableCols.map(c => c.name);

        // Usar las columnas que realmente existen según lo que vimos
        let columns = ['code', 'initial_balance', 'balance', 'status', 'created_at', 'updated_at'];
        let values = [
          code,
          initialBalance,
          balance,
          status,
          formatDate(issuedAt),
          formatDate(issuedAt)
        ];

        // Agregar columnas opcionales
        if (colNames.includes('currency')) {
          columns.push('currency');
          values.push('CLP');
        }

        if (colNames.includes('issued_to_customer_id') && customer) {
          columns.push('issued_to_customer_id');
          values.push(customer.id);
        }

        if (colNames.includes('issued_to_user_id') && customer) {
          columns.push('issued_to_user_id');
          values.push(customer.id);
        }

        if (colNames.includes('campaign_id') && campaign) {
          columns.push('campaign_id');
          values.push(campaign.id);
        }

        if (colNames.includes('issued_at')) {
          columns.push('issued_at');
          values.push(formatDate(issuedAt));
        }

        if (colNames.includes('expires_at')) {
          columns.push('expires_at');
          values.push(status === 'expired' ? formatDate(new Date(issuedAt.getTime() + 86400000)) : formatDate(expiresAt));
        }

        if (colNames.includes('notes')) {
          columns.push('notes');
          values.push(campaign ? `Gift card de campaña ${campaign.id}` : null);
        }

        const placeholders = values.map(() => '?').join(', ');
        await dbHelper.run(
          `INSERT INTO gift_cards (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );

        inserted++;
        if (i % 10 === 0) {
          process.stdout.write(`   Progreso: ${i}/${count} gift cards insertadas...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando gift card ${i}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de gift cards completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Gift cards insertadas: ${inserted}`);
    console.log(`   - Gift cards omitidas: ${skipped}`);

  } catch (error) {
    console.error('❌ Error en seed de gift cards:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedGiftCards()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedGiftCards };

