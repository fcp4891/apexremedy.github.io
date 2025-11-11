#!/usr/bin/env node
// backend/database/ingestion/ingest-products.js
// Script maestro para ingesta de productos en diferentes modos
// Uso: node ingest-products.js [--mode=json|sqlite|postgres] [--force] [--category=slug]

const UnifiedProductIngestion = require('./UnifiedProductIngestion');
const {
  FLORES_MEDICINALES,
  ACEITES_MEDICINALES,
  CONCENTRADOS_MEDICINALES,
  CAPSULAS_MEDICINALES,
  TOPICOS_MEDICINALES,
  SEMILLAS,
  VAPORIZADORES,
  ACCESORIOS,
  ROPA,
  CBD_PUBLICO
} = require('../seeders/data/products-data');
const { CATEGORIES } = require('../seeders/data/seed-config');

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  mode: args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'sqlite',
  force: args.includes('--force'),
  category: args.find(arg => arg.startsWith('--category='))?.split('=')[1]
};

// Organizar productos por categoría
const productsDataByCategory = {
  [CATEGORIES.MEDICINAL_FLORES]: FLORES_MEDICINALES,
  [CATEGORIES.MEDICINAL_ACEITES]: ACEITES_MEDICINALES,
  [CATEGORIES.MEDICINAL_CONCENTRADOS]: CONCENTRADOS_MEDICINALES,
  [CATEGORIES.MEDICINAL_CAPSULAS]: CAPSULAS_MEDICINALES,
  [CATEGORIES.MEDICINAL_TOPICOS]: TOPICOS_MEDICINALES,
  [CATEGORIES.SEMILLAS]: SEMILLAS,
  [CATEGORIES.VAPORIZADORES]: VAPORIZADORES,
  [CATEGORIES.ACCESORIOS]: ACCESORIOS,
  [CATEGORIES.ROPA]: ROPA,
  [CATEGORIES.CBD]: CBD_PUBLICO
};

// Combinar todos los productos
const allProducts = Object.values(productsDataByCategory).flat();

async function runIngestion() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🌱 APEX REMEDY - SISTEMA DE INGESTA UNIFICADO 🌱      ║
║                                                            ║
║  Modos soportados:                                        ║
║    • JSON/GitHub  - Genera archivos JSON estáticos        ║
║    • SQLite       - Base de datos local                   ║
║    • PostgreSQL   - Base de datos de producción          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`📋 Configuración:`);
  console.log(`   Modo: ${options.mode}`);
  console.log(`   Forzar: ${options.force ? 'Sí' : 'No'}`);
  console.log(`   Categoría: ${options.category || 'Todas'}`);
  console.log(`   Total productos: ${allProducts.length}\n`);
  
  try {
    // Configuración según el modo
    let config = {};
    
    if (options.mode === 'postgres' || options.mode === 'postgresql') {
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'apexremedy',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true'
      };
    } else if (options.mode === 'sqlite') {
      const path = require('path');
      config = {
        dbPath: process.env.DB_PATH || path.join(__dirname, '../../apexremedy.db')
      };
    } else if (options.mode === 'json' || options.mode === 'github') {
      const path = require('path');
      config = {
        outputDir: process.env.JSON_OUTPUT_DIR || path.join(__dirname, '../../../frontend/api')
      };
    }
    
    // Crear instancia de ingesta
    const ingestion = new UnifiedProductIngestion(options.mode, config);
    
    // Inicializar
    await ingestion.initialize();
    
    // Filtrar productos por categoría si se especificó
    let productsToProcess = allProducts;
    if (options.category) {
      productsToProcess = productsDataByCategory[options.category] || [];
      if (productsToProcess.length === 0) {
        console.error(`❌ Categoría no encontrada: ${options.category}`);
        await ingestion.close();
        process.exit(1);
      }
    }
    
    // Procesar productos
    const onProgress = (current, total, productName) => {
      if (current % 10 === 0 || current === total) {
        console.log(`  📦 Procesados: ${current}/${total} - ${productName}`);
      }
    };
    
    const result = await ingestion.processProducts(productsToProcess, {
      force: options.force,
      category: options.category,
      onProgress: onProgress
    });
    
    // Cerrar conexión
    await ingestion.close();
    
    // Mostrar resumen
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN DE INGESTA');
    console.log('='.repeat(60));
    console.log(`✅ Productos procesados: ${result.inserted}`);
    console.log(`⚠️  Productos saltados: ${result.skipped}`);
    console.log(`📦 Total: ${result.total}`);
    console.log(`🔧 Modo: ${options.mode}`);
    console.log('='.repeat(60));
    
    if (options.mode === 'json' || options.mode === 'github') {
      console.log(`\n💾 Archivos JSON generados en: ${config.outputDir}`);
      console.log(`   - products.json`);
      console.log(`   - products-featured.json`);
      console.log(`   - products-by-category.json`);
    }
    
    console.log('\n🎉 ¡Ingesta completada exitosamente!\n');
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Error durante la ingesta:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  console.log('Opciones disponibles:');
  console.log('  --mode=json|sqlite|postgres    Modo de ingesta (default: sqlite)');
  console.log('  --force                        Eliminar productos existentes antes de insertar');
  console.log('  --category=slug                Procesar solo una categoría\n');
  
  runIngestion()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { runIngestion };









