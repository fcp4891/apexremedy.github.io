// backend/database/seeders/seed-parametricas.js
// Seed de tablas paramétricas del sistema de pagos
// Uso: node seed-parametricas.js [--force]

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

// ============================================
// DATOS PARAMÉTRICOS
// ============================================

const PAYMENT_PROVIDERS = [
  {
    name: 'Transbank',
    provider_key: 'transbank',
    channel: 'web',
    fee_config: JSON.stringify({ type: 'percentage', value: 2.95, fixed: 0 }),
    installments_config: JSON.stringify({ enabled: true, max: 48, min: 3 }),
    is_active: 1,
    webhook_url: null,
    retries: 3,
    timeout_ms: 30000,
    credentials: JSON.stringify({ environment: 'integration', api_key: 'test_key' })
  },
  {
    name: 'Flow',
    provider_key: 'flow',
    channel: 'web',
    fee_config: JSON.stringify({ type: 'percentage', value: 2.5, fixed: 0 }),
    installments_config: JSON.stringify({ enabled: true, max: 12, min: 3 }),
    is_active: 1,
    webhook_url: null,
    retries: 3,
    timeout_ms: 30000,
    credentials: JSON.stringify({ environment: 'sandbox', api_key: 'test_key' })
  },
  {
    name: 'Mercado Pago',
    provider_key: 'mercadopago',
    channel: 'web',
    fee_config: JSON.stringify({ type: 'percentage', value: 3.49, fixed: 0 }),
    installments_config: JSON.stringify({ enabled: true, max: 24, min: 3 }),
    is_active: 1,
    webhook_url: null,
    retries: 3,
    timeout_ms: 30000,
    credentials: JSON.stringify({ environment: 'test', access_token: 'test_token' })
  },
  {
    name: 'Transferencia Bancaria',
    provider_key: 'transfer',
    channel: 'web',
    fee_config: JSON.stringify({ type: 'fixed', value: 0, fixed: 0 }),
    installments_config: JSON.stringify({ enabled: false, max: 1, min: 1 }),
    is_active: 1,
    webhook_url: null,
    retries: 0,
    timeout_ms: 0,
    credentials: JSON.stringify({ bank_accounts: [] })
  }
];

const PAYMENT_METHODS = [
  { name: 'Tarjeta de Crédito', provider_id: null, channel: 'web', is_active: 1 },
  { name: 'Tarjeta de Débito', provider_id: null, channel: 'web', is_active: 1 },
  { name: 'Transferencia Bancaria', provider_id: null, channel: 'web', is_active: 1 },
  { name: 'Efectivo', provider_id: null, channel: 'pos', is_active: 1 },
  { name: 'Gift Card', provider_id: null, channel: 'web', is_active: 1 }
];

const REFUND_REASONS = [
  { code: 'customer_request', name: 'Solicitud del Cliente', is_active: 1, sort_order: 1 },
  { code: 'product_defect', name: 'Producto Defectuoso', is_active: 1, sort_order: 2 },
  { code: 'wrong_product', name: 'Producto Incorrecto', is_active: 1, sort_order: 3 },
  { code: 'not_received', name: 'Producto No Recibido', is_active: 1, sort_order: 4 },
  { code: 'duplicate_payment', name: 'Pago Duplicado', is_active: 1, sort_order: 5 },
  { code: 'fraud', name: 'Fraude', is_active: 1, sort_order: 6 },
  { code: 'cancellation', name: 'Cancelación de Orden', is_active: 1, sort_order: 7 },
  { code: 'other', name: 'Otro', is_active: 1, sort_order: 99 }
];

const GIFT_CARD_CAMPAIGNS = [
  {
    name: 'Bienvenida 2025',
    description: 'Campaña de gift cards para nuevos clientes',
    start_at: '2025-01-01T00:00:00.000Z',
    end_at: '2025-12-31T23:59:59.000Z',
    is_active: 1,
    terms_url: null
  },
  {
    name: 'Día de la Madre',
    description: 'Campaña especial para el Día de la Madre',
    start_at: '2025-05-01T00:00:00.000Z',
    end_at: '2025-05-31T23:59:59.000Z',
    is_active: 1,
    terms_url: null
  },
  {
    name: 'Black Friday',
    description: 'Campaña Black Friday',
    start_at: '2025-11-20T00:00:00.000Z',
    end_at: '2025-11-30T23:59:59.000Z',
    is_active: 1,
    terms_url: null
  }
];

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedParametricas() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);
  const now = new Date().toISOString();

  try {
    console.log('\n🔧 Iniciando seed de tablas paramétricas...\n');

    // ============================================
    // 1. PAYMENT PROVIDERS
    // ============================================
    console.log('💳 Insertando proveedores de pago...');
    let providersInserted = 0;
    
    for (const provider of PAYMENT_PROVIDERS) {
      try {
        const existing = await dbHelper.get(
          'SELECT id FROM payment_providers WHERE provider_key = ?',
          [provider.provider_key]
        );

        if (existing && !force) {
          console.log(`  ⏭️  Proveedor ${provider.name} ya existe, omitiendo...`);
          continue;
        }

        if (existing && force) {
          await dbHelper.run(
            `UPDATE payment_providers 
             SET name = ?, channel = ?, fee_config = ?, installments_config = ?, 
                 is_active = ?, webhook_url = ?, retries = ?, timeout_ms = ?, credentials = ?, updated_at = ?
             WHERE provider_key = ?`,
            [
              provider.name, provider.channel, provider.fee_config, provider.installments_config,
              provider.is_active, provider.webhook_url, provider.retries, provider.timeout_ms,
              provider.credentials, now, provider.provider_key
            ]
          );
          console.log(`  ✅ Proveedor ${provider.name} actualizado`);
        } else {
          await dbHelper.run(
            `INSERT INTO payment_providers 
             (name, provider_key, channel, fee_config, installments_config, is_active, 
              webhook_url, retries, timeout_ms, credentials, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              provider.name, provider.provider_key, provider.channel, provider.fee_config,
              provider.installments_config, provider.is_active, provider.webhook_url,
              provider.retries, provider.timeout_ms, provider.credentials, now, now
            ]
          );
          console.log(`  ✅ Proveedor ${provider.name} insertado`);
        }
        providersInserted++;
      } catch (error) {
        console.error(`  ❌ Error insertando ${provider.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${providersInserted} proveedores procesados\n`);

    // ============================================
    // 2. PAYMENT METHODS
    // ============================================
    console.log('💳 Insertando métodos de pago...');
    let methodsInserted = 0;
    
    // Obtener IDs de proveedores para vincular
    const transbankProvider = await dbHelper.get(
      'SELECT id FROM payment_providers WHERE provider_key = ?',
      ['transbank']
    );
    const transferProvider = await dbHelper.get(
      'SELECT id FROM payment_providers WHERE provider_key = ?',
      ['transfer']
    );

    for (const method of PAYMENT_METHODS) {
      try {
        const existing = await dbHelper.get(
          'SELECT id FROM payment_methods WHERE name = ?',
          [method.name]
        );

        if (existing && !force) {
          console.log(`  ⏭️  Método ${method.name} ya existe, omitiendo...`);
          continue;
        }

        // Asignar provider_id según el método
        let provider_id = null;
        if (method.name.includes('Tarjeta') && transbankProvider) {
          provider_id = transbankProvider.id;
        } else if (method.name.includes('Transferencia') && transferProvider) {
          provider_id = transferProvider.id;
        }

        if (existing && force) {
          await dbHelper.run(
            `UPDATE payment_methods 
             SET provider_id = ?, channel = ?, is_active = ?, updated_at = ?
             WHERE name = ?`,
            [provider_id, method.channel, method.is_active, now, method.name]
          );
          console.log(`  ✅ Método ${method.name} actualizado`);
        } else {
          await dbHelper.run(
            `INSERT INTO payment_methods 
             (name, provider_id, channel, is_active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [method.name, provider_id, method.channel, method.is_active, now, now]
          );
          console.log(`  ✅ Método ${method.name} insertado`);
        }
        methodsInserted++;
      } catch (error) {
        console.error(`  ❌ Error insertando ${method.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${methodsInserted} métodos procesados\n`);

    // ============================================
    // 3. REFUND REASONS
    // ============================================
    console.log('↩️  Insertando motivos de reembolso...');
    let reasonsInserted = 0;
    
    for (const reason of REFUND_REASONS) {
      try {
        const existing = await dbHelper.get(
          'SELECT id FROM refund_reasons WHERE code = ?',
          [reason.code]
        );

        if (existing && !force) {
          console.log(`  ⏭️  Motivo ${reason.code} ya existe, omitiendo...`);
          continue;
        }

        if (existing && force) {
          await dbHelper.run(
            `UPDATE refund_reasons 
             SET name = ?, is_active = ?, sort_order = ?, updated_at = ?
             WHERE code = ?`,
            [reason.name, reason.is_active, reason.sort_order, now, reason.code]
          );
          console.log(`  ✅ Motivo ${reason.code} actualizado`);
        } else {
          await dbHelper.run(
            `INSERT INTO refund_reasons 
             (code, name, is_active, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [reason.code, reason.name, reason.is_active, reason.sort_order, now, now]
          );
          console.log(`  ✅ Motivo ${reason.code} insertado`);
        }
        reasonsInserted++;
      } catch (error) {
        console.error(`  ❌ Error insertando ${reason.code}:`, error.message);
      }
    }
    console.log(`  ✅ ${reasonsInserted} motivos procesados\n`);

    // ============================================
    // 4. GIFT CARD CAMPAIGNS
    // ============================================
    console.log('🎁 Insertando campañas de gift cards...');
    let campaignsInserted = 0;
    
    for (const campaign of GIFT_CARD_CAMPAIGNS) {
      try {
        const existing = await dbHelper.get(
          'SELECT id FROM gift_card_campaigns WHERE name = ?',
          [campaign.name]
        );

        if (existing && !force) {
          console.log(`  ⏭️  Campaña ${campaign.name} ya existe, omitiendo...`);
          continue;
        }

        if (existing && force) {
          await dbHelper.run(
            `UPDATE gift_card_campaigns 
             SET description = ?, start_at = ?, end_at = ?, is_active = ?, terms_url = ?, updated_at = ?
             WHERE name = ?`,
            [
              campaign.description, campaign.start_at, campaign.end_at,
              campaign.is_active, campaign.terms_url, now, campaign.name
            ]
          );
          console.log(`  ✅ Campaña ${campaign.name} actualizada`);
        } else {
          await dbHelper.run(
            `INSERT INTO gift_card_campaigns 
             (name, description, start_at, end_at, is_active, terms_url, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              campaign.name, campaign.description, campaign.start_at, campaign.end_at,
              campaign.is_active, campaign.terms_url, now, now
            ]
          );
          console.log(`  ✅ Campaña ${campaign.name} insertada`);
        }
        campaignsInserted++;
      } catch (error) {
        console.error(`  ❌ Error insertando ${campaign.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${campaignsInserted} campañas procesadas\n`);

    console.log('✅ Seed de tablas paramétricas completado\n');
    console.log('📊 Resumen:');
    console.log(`   - Proveedores de pago: ${providersInserted}`);
    console.log(`   - Métodos de pago: ${methodsInserted}`);
    console.log(`   - Motivos de reembolso: ${reasonsInserted}`);
    console.log(`   - Campañas de gift cards: ${campaignsInserted}\n`);

  } catch (error) {
    console.error('❌ Error fatal en seed de paramétricas:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedParametricas()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedParametricas };









