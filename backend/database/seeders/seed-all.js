// backend/database/seeders/seed-all.js
// Script maestro para ejecutar los seeders por categoría
// Uso: node seed-all.js [--dataset=all|parametric|demo|test|analytics] [--force] [--skip-...] [--payment-count=N]

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const args = process.argv.slice(2);

const options = {
  force: args.includes('--force'),
  skipUsers: args.includes('--skip-users'),
  skipProducts: args.includes('--skip-products'),
  skipParametricas: args.includes('--skip-parametricas'),
  skipOrders: args.includes('--skip-orders'),
  skipPayments: args.includes('--skip-payments'),
  skipRefunds: args.includes('--skip-refunds'),
  skipGiftCards: args.includes('--skip-gift-cards'),
  skipGiftCardTransactions: args.includes('--skip-gift-card-transactions'),
  skipChargebacks: args.includes('--skip-chargebacks'),
  skipSettlements: args.includes('--skip-settlements'),
  skipWebhooks: args.includes('--skip-webhooks'),
  skipAnalytics: args.includes('--skip-analytics'),
  addDemo: args.includes('--add-demo'),
  paymentCount: args.find(arg => arg.startsWith('--payment-count='))?.split('=')[1] || '100',
  analyticsDays: args.find(arg => arg.startsWith('--analytics-days='))?.split('=')[1] || '90',
  analyticsSessions: args.find(arg => arg.startsWith('--analytics-sessions='))?.split('=')[1] || '500'
};

const datasetArg = args.find(arg => arg.startsWith('--dataset='))?.split('=')[1] || 'all';
options.datasetFilters = datasetArg
  .split(',')
  .map(value => value.trim().toLowerCase())
  .filter(Boolean);

if (options.datasetFilters.length === 0) {
  options.datasetFilters.push('all');
}

const RUN_ALL_DATASETS = options.datasetFilters.includes('all');
const LINE = '─'.repeat(80);
const BLOCK = '='.repeat(80);

const pipeline = [
  {
    id: 'users',
    label: 'Usuarios',
    emoji: '👤',
    dataset: 'maintenance',
    skipOption: 'skipUsers',
    command: (opts) => (opts.addDemo ? 'node seed-users.js --add-demo' : 'node seed-users.js --list-only'),
    successMessage: 'Seed de usuarios completado'
  },
  {
    id: 'products',
    label: 'Productos',
    emoji: '📦',
    dataset: 'demo',
    skipOption: 'skipProducts',
    command: (opts) => (opts.force ? 'node seed-products.js --force' : 'node seed-products.js'),
    successMessage: 'Seed de productos completado'
  },
  {
    id: 'parametricas',
    label: 'Paramétricas del Sistema de Pagos',
    emoji: '🔧',
    dataset: 'parametric',
    skipOption: 'skipParametricas',
    command: (opts) => (opts.force ? 'node seed-parametricas.js --force' : 'node seed-parametricas.js'),
    successMessage: 'Seed de paramétricas completado'
  },
  {
    id: 'orders',
    label: 'Órdenes con Direcciones y Envíos',
    emoji: '📦',
    dataset: 'demo',
    skipOption: 'skipOrders',
    command: (opts) => (opts.force
      ? 'node seed-orders.js --force --count=150'
      : 'node seed-orders.js --count=150'),
    successMessage: 'Seed de órdenes completado',
    onError: (_, message) => {
      if (message.includes('No hay usuarios') || message.includes('No hay productos')) {
        return {
          action: 'continue',
          note: 'No hay datos suficientes para órdenes. Ejecuta seed-users.js y seed-products.js primero.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'payments',
    label: 'Pagos y Transacciones',
    emoji: '💳',
    dataset: 'demo',
    skipOption: 'skipPayments',
    command: (opts) => (opts.force
      ? `node seed-payments.js --force --count=${opts.paymentCount}`
      : `node seed-payments.js --count=${opts.paymentCount}`),
    successMessage: 'Seed de pagos completado',
    onError: (_, message) => {
      if (message.includes('No hay órdenes')) {
        return {
          action: 'continue',
          note: 'No hay órdenes. Los pagos se crearán sin order_id.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'refunds',
    label: 'Reembolsos',
    emoji: '💸',
    dataset: 'demo',
    skipOption: 'skipRefunds',
    command: () => 'node seed-refunds.js',
    successMessage: 'Seed de reembolsos completado',
    onError: (_, message) => {
      if (message.includes('No hay pagos')) {
        return {
          action: 'continue',
          note: 'No hay pagos disponibles para generar reembolsos.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'giftCards',
    label: 'Gift Cards',
    emoji: '🎁',
    dataset: 'demo',
    skipOption: 'skipGiftCards',
    command: () => 'node seed-gift-cards.js',
    successMessage: 'Seed de gift cards completado'
  },
  {
    id: 'giftCardTransactions',
    label: 'Transacciones de Gift Cards',
    emoji: '💳',
    dataset: 'demo',
    skipOption: 'skipGiftCardTransactions',
    command: () => 'node seed-gift-card-transactions.js',
    successMessage: 'Seed de transacciones de gift cards completado',
    onError: (_, message) => {
      if (message.includes('No hay gift cards')) {
        return {
          action: 'continue',
          note: 'No hay gift cards disponibles para generar transacciones.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'chargebacks',
    label: 'Chargebacks',
    emoji: '⚠️',
    dataset: 'test',
    skipOption: 'skipChargebacks',
    command: () => 'node seed-chargebacks.js',
    successMessage: 'Seed de chargebacks completado',
    onError: (_, message) => {
      if (message.includes('No hay pagos')) {
        return {
          action: 'continue',
          note: 'No hay pagos capturados para simular chargebacks.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'settlements',
    label: 'Conciliaciones',
    emoji: '💼',
    dataset: 'test',
    skipOption: 'skipSettlements',
    command: () => 'node seed-settlements.js',
    successMessage: 'Seed de conciliaciones completado',
    onError: (_, message) => {
      if (message.includes('No hay pagos') || message.includes('No hay proveedores')) {
        return {
          action: 'continue',
          note: 'Datos insuficientes para conciliaciones. Genera pagos y proveedores primero.'
        };
      }
      return { action: 'fail' };
    }
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    emoji: '📡',
    dataset: 'test',
    skipOption: 'skipWebhooks',
    command: () => 'node seed-webhooks.js',
    successMessage: 'Seed de webhooks completado'
  },
  {
    id: 'analytics',
    label: 'Analytics & Tracking',
    emoji: '📊',
    dataset: 'analytics',
    skipOption: 'skipAnalytics',
    command: (opts) => `node seed-analytics.js --days=${opts.analyticsDays} --sessions=${opts.analyticsSessions}`,
    successMessage: 'Seed de analytics completado',
    onError: (_, message) => {
      if (message.includes('No hay usuarios') || message.includes('No hay productos')) {
        return {
          action: 'continue',
          note: 'Sin usuarios/productos suficientes para analytics. Ejecuta seeds base primero.'
        };
      }
      return { action: 'fail' };
    }
  }
];

function extractErrorMessage(error) {
  if (!error) return 'Error desconocido';
  if (typeof error.stderr === 'string' && error.stderr.trim()) return error.stderr.trim();
  if (typeof error.stdout === 'string' && error.stdout.trim()) return error.stdout.trim();
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  return String(error);
}

function shouldSkipByDataset(step) {
  if (RUN_ALL_DATASETS) return false;
  if (step.dataset === 'maintenance') return false;
  return !options.datasetFilters.includes(step.dataset);
}

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║      🚀 APEX REMEDY - SEED COMPLETO DEL SISTEMA 🚀         ║
║                                                            ║
║  Ejecuta los seeders por categorías de datos               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('📋 Configuración:');
console.log(`   Dataset(s) objetivo: ${RUN_ALL_DATASETS ? 'todos' : options.datasetFilters.join(', ')}`);
console.log(`   Forzar inserción: ${options.force ? 'Sí' : 'No'}`);
console.log(`   Saltar usuarios: ${options.skipUsers ? 'Sí' : 'No'}`);
console.log(`   Saltar productos: ${options.skipProducts ? 'Sí' : 'No'}`);
console.log(`   Saltar paramétricas: ${options.skipParametricas ? 'Sí' : 'No'}`);
console.log(`   Saltar órdenes: ${options.skipOrders ? 'Sí' : 'No'}`);
console.log(`   Saltar pagos: ${options.skipPayments ? 'Sí' : 'No'}`);
console.log(`   Saltar reembolsos: ${options.skipRefunds ? 'Sí' : 'No'}`);
console.log(`   Saltar gift cards: ${options.skipGiftCards ? 'Sí' : 'No'}`);
console.log(`   Saltar transacciones GC: ${options.skipGiftCardTransactions ? 'Sí' : 'No'}`);
console.log(`   Saltar chargebacks: ${options.skipChargebacks ? 'Sí' : 'No'}`);
console.log(`   Saltar conciliaciones: ${options.skipSettlements ? 'Sí' : 'No'}`);
console.log(`   Saltar webhooks: ${options.skipWebhooks ? 'Sí' : 'No'}`);
console.log(`   Saltar analytics: ${options.skipAnalytics ? 'Sí' : 'No'}`);
console.log(`   Cantidad de pagos: ${options.paymentCount}`);
console.log(`   Agregar usuarios demo: ${options.addDemo ? 'Sí' : 'No'}`);
console.log();

const results = [];

async function runStep(step, index) {
  if (options[step.skipOption]) {
    console.log(`⏭️  Saltando ${step.label} (omitido por flag)\n`);
    results.push({ id: step.id, status: 'skipped', reason: 'flag', dataset: step.dataset });
    return;
  }

  if (shouldSkipByDataset(step)) {
    console.log(`⏭️  Saltando ${step.label} (fuera del dataset objetivo: ${step.dataset})\n`);
    results.push({ id: step.id, status: 'skipped', reason: 'dataset', dataset: step.dataset });
    return;
  }

  console.log(`${step.emoji} PASO ${index + 1}: ${step.label}`);
  console.log(LINE);

  const command = step.command(options);

  try {
    const { stdout, stderr } = await execPromise(command, { cwd: __dirname });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${step.successMessage}\n`);
    results.push({ id: step.id, status: 'completed', dataset: step.dataset });
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error(`❌ Error en ${step.label}: ${message}`);

    if (typeof step.onError === 'function') {
      const decision = step.onError(error, message) || { action: 'fail' };

      if (decision.action === 'continue') {
        if (decision.note) {
          console.warn(`⚠️  ${decision.note}\n`);
        } else {
          console.warn('⚠️  Advertencia: se continúa con el proceso\n');
        }
        results.push({ id: step.id, status: 'warning', note: decision.note, dataset: step.dataset });
        return;
      }

      if (decision.action === 'fail' && decision.note) {
        console.error(`❌ ${decision.note}`);
      }
    }

    throw error;
  }
}

async function runSeed() {
  const startTime = Date.now();

  try {
    console.log('🏁 Iniciando proceso de seed...\n');
    console.log(BLOCK + '\n');

    for (let i = 0; i < pipeline.length; i += 1) {
      const step = pipeline[i];
      await runStep(step, i);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const completed = results.filter(r => r.status === 'completed').length;
    const warnings = results.filter(r => r.status === 'warning');
    const skipped = results.filter(r => r.status === 'skipped');

    console.log(BLOCK);
    console.log('🎉 SEED COMPLETO FINALIZADO');
    console.log(BLOCK);
    console.log(`⏱️  Tiempo total: ${duration} segundos`);
    console.log(`✅ Pasos ejecutados: ${completed}`);
    console.log(`⚠️  Con advertencias: ${warnings.length}`);
    console.log(`⏭️  Saltados: ${skipped.length}`);
    console.log();

    if (warnings.length > 0) {
      console.log('⚠️  Pasos con advertencias:');
      warnings.forEach(item => {
        console.log(`   • ${item.id} (${item.dataset})${item.note ? ` → ${item.note}` : ''}`);
      });
      console.log();
    }

    if (skipped.length > 0) {
      console.log('⏭️  Pasos omitidos:');
      skipped.forEach(item => {
        const reason = item.reason === 'flag'
          ? 'omitido manualmente'
          : `no pertenece al dataset (${item.dataset})`;
        console.log(`   • ${item.id} → ${reason}`);
      });
      console.log();
    }

    console.log('✅ Base de datos lista para usar!');
    console.log();
    console.log('📋 Próximos pasos:');
    console.log('   1. Verifica los datos con: npm run db:check');
    console.log('   2. Inicia el servidor: npm run dev');
    console.log('   3. Accede al panel admin para configurar');
    console.log();
  } catch (error) {
    console.error('\n❌ Error fatal durante el seed:', error);
    process.exit(1);
  }
}

runSeed()
  .then(() => {
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });




