/**
 * backend/scripts/db-check.js
 * Script de validación rápida del estado de la base de datos SQLite.
 * Verifica existencia de tablas críticas, datos paramétricos y relaciones clave.
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, '../database/apexremedy.db');

const REQUIRED_TABLES = [
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'product_categories',
  'payment_providers',
  'payment_methods',
];

const REQUIRED_ROLE_CODES = ['super_admin', 'admin', 'customer'];

const REQUIRED_PAYMENT_PROVIDERS = ['transbank', 'flow', 'mercadopago', 'transfer'];

function createDbHelper(db) {
  return {
    all: (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
    get: (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
  };
}

async function tableExists(dbHelper, table) {
  const row = await dbHelper.get(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [table],
  );
  return !!row;
}

async function ensureTables(dbHelper, report) {
  for (const table of REQUIRED_TABLES) {
    const exists = await tableExists(dbHelper, table);
    if (exists) {
      report.push({ status: 'ok', message: `Tabla '${table}' encontrada` });
    } else {
      report.push({ status: 'error', message: `Tabla '${table}' no existe` });
    }
  }
}

async function ensureRoleCodes(dbHelper, report) {
  const rows = await dbHelper.all(`SELECT code FROM roles`);
  const existingCodes = new Set(rows.map(r => r.code));
  for (const code of REQUIRED_ROLE_CODES) {
    if (existingCodes.has(code)) {
      report.push({ status: 'ok', message: `Rol '${code}' presente` });
    } else {
      report.push({
        status: 'error',
        message: `Rol '${code}' no se encuentra en tabla roles`,
      });
    }
  }
}

async function ensureAdminAssignment(dbHelper, report) {
  const row = await dbHelper.get(
    `
      SELECT u.email
      FROM users u
      INNER JOIN user_roles ur ON ur.user_id = u.id
      INNER JOIN roles r ON r.id = ur.role_id
      WHERE r.code IN ('admin', 'super_admin')
      LIMIT 1
    `,
  );
  if (row) {
    report.push({
      status: 'ok',
      message: `Usuario administrador detectado (${row.email})`,
    });
  } else {
    report.push({
      status: 'warn',
      message: 'No se encontró ningún usuario con rol admin o super_admin',
    });
  }
}

async function ensurePaymentProviders(dbHelper, report) {
  const rows = await dbHelper.all(
    `SELECT provider_key FROM payment_providers WHERE provider_key IN (${REQUIRED_PAYMENT_PROVIDERS.map(() => '?').join(',')})`,
    REQUIRED_PAYMENT_PROVIDERS,
  );
  const existingKeys = new Set(rows.map(r => r.provider_key));

  for (const providerKey of REQUIRED_PAYMENT_PROVIDERS) {
    if (existingKeys.has(providerKey)) {
      report.push({
        status: 'ok',
        message: `Proveedor de pago '${providerKey}' presente`,
      });
    } else {
      report.push({
        status: 'error',
        message: `Proveedor de pago '${providerKey}' ausente`,
      });
    }
  }
}

async function ensureParametricCounts(dbHelper, report) {
  const tablesWithMinimums = [
    { table: 'product_categories', min: 1, label: 'categorías' },
    { table: 'brands', min: 1, label: 'marcas' },
    { table: 'suppliers', min: 1, label: 'proveedores' },
  ];

  for (const { table, min, label } of tablesWithMinimums) {
    const row = await dbHelper.get(`SELECT COUNT(*) AS count FROM ${table}`);
    if (row && row.count >= min) {
      report.push({
        status: 'ok',
        message: `Tabla '${table}' contiene ${row.count} ${label}`,
      });
    } else {
      report.push({
        status: 'warn',
        message: `Tabla '${table}' tiene menos de ${min} ${label}`,
      });
    }
  }
}

async function runChecks() {
  console.log('\n🩺  Iniciando verificación de base de datos ApexRemedy...\n');
  const db = new sqlite3.Database(DB_PATH);
  const dbHelper = createDbHelper(db);
  const report = [];
  let hasErrors = false;

  try {
    await ensureTables(dbHelper, report);
    await ensureRoleCodes(dbHelper, report);
    await ensureAdminAssignment(dbHelper, report);
    await ensurePaymentProviders(dbHelper, report);
    await ensureParametricCounts(dbHelper, report);
  } catch (error) {
    hasErrors = true;
    report.push({
      status: 'error',
      message: `Error ejecutando validaciones: ${error.message}`,
    });
  } finally {
    db.close();
  }

  for (const item of report) {
    const prefix =
      item.status === 'ok'
        ? '✅'
        : item.status === 'warn'
          ? '⚠️ '
          : '❌';
    console.log(`${prefix} ${item.message}`);
    if (item.status === 'error') {
      hasErrors = true;
    }
  }

  console.log('\n📋 Resumen:');
  const total = report.length;
  const errors = report.filter(r => r.status === 'error').length;
  const warnings = report.filter(r => r.status === 'warn').length;
  const oks = report.filter(r => r.status === 'ok').length;

  console.log(`   ✓ OK: ${oks}`);
  console.log(`   ⚠️  Advertencias: ${warnings}`);
  console.log(`   ❌ Errores: ${errors}`);

  if (hasErrors) {
    console.log('\n❌ Verificación incompleta. Revisa los errores anteriores.\n');
    process.exit(1);
  }

  console.log('\n✅ Base de datos verificada correctamente.\n');
}

runChecks().catch(error => {
  console.error('❌ Error inesperado en el verificador:', error);
  process.exit(1);
});




