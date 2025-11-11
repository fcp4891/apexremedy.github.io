// backend/database/seeders/seed-products.js
// Script principal de seed de productos - Mejorado y reutilizable
// Uso: node seed-products.js [--force] [--category=nombre] [--use-unified]
// NOTA: Por defecto usa el sistema legacy. Usa --use-unified para el nuevo sistema

const path = require('path');
const args = process.argv.slice(2);
const useUnified = args.includes('--use-unified');

// Importar configuración y datos
const { CATEGORIES, BRANDS } = require('./data/seed-config');
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
} = require('./data/products-data');

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
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
});

// Si se usa el sistema unificado, redirigir al nuevo script
if (useUnified) {
  const { runIngestion } = require('../ingestion/ingest-products');
  const unifiedArgs = args.filter(arg => !arg.includes('--use-unified'));
  const unifiedOptions = {
    mode: unifiedArgs.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'sqlite',
    force: unifiedArgs.includes('--force'),
    category: unifiedArgs.find(arg => arg.startsWith('--category='))?.split('=')[1]
  };
  
  console.log('🔄 Usando sistema de ingesta unificado...\n');
  runIngestion()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
  
  // No continuar con el código legacy
  process.exit(0);
}

// Código legacy para compatibilidad
const sqlite3 = require('sqlite3').verbose();

// Procesar argumentos de línea de comandos
const options = {
  force: args.includes('--force'),
  category: args.find(arg => arg.startsWith('--category='))?.split('=')[1]
};

// ============================================
// FUNCIÓN PRINCIPAL DE SEED
// ============================================

async function seedProducts() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  console.log('🌱 Iniciando seed de productos...\n');
  
  if (options.force) {
    console.log('⚠️  Modo FORCE activado: Se eliminarán productos existentes\n');
  }
  
  if (options.category) {
    console.log(`📂 Filtrando por categoría: ${options.category}\n`);
  }

  try {
    // ============================================
    // 1. CARGAR CATEGORÍAS Y MARCAS
    // ============================================
    console.log('📋 Cargando categorías y marcas...');
    
    const categoryMap = {};
    const catRows = await dbHelper.all('SELECT id, slug FROM product_categories');
    catRows.forEach(cat => { categoryMap[cat.slug] = cat.id; });
    console.log(`  ✓ ${catRows.length} categorías cargadas`);

    const brandMap = {};
    const brandRows = await dbHelper.all('SELECT id, slug FROM brands');
    brandRows.forEach(brand => { brandMap[brand.slug] = brand.id; });
    console.log(`  ✓ ${brandRows.length} marcas cargadas`);

    const supplierMap = {};
    const supplierRows = await dbHelper.all('SELECT id, code FROM suppliers');
    supplierRows.forEach(supplier => { supplierMap[supplier.code] = supplier.id; });
    console.log(`  ✓ ${supplierRows.length} proveedores cargados\n`);

    // ============================================
    // 2. ORGANIZAR PRODUCTOS POR CATEGORÍA
    // ============================================
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

    // ============================================
    // 3. MODO FORCE: LIMPIAR PRODUCTOS EXISTENTES
    // ============================================
    if (options.force) {
      console.log('🗑️  Eliminando productos existentes...');
      await dbHelper.run('DELETE FROM product_images');
      await dbHelper.run('DELETE FROM product_price_variants');
      await dbHelper.run('DELETE FROM product_variants');
      await dbHelper.run('DELETE FROM products');
      console.log('  ✓ Productos eliminados\n');
    }

    // ============================================
    // 4. INSERTAR PRODUCTOS
    // ============================================
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const [categorySlug, products] of Object.entries(productsDataByCategory)) {
      // Filtrar por categoría si se especificó
      if (options.category && categorySlug !== options.category) {
        continue;
      }

      const categoryName = categorySlug.replace(/-/g, ' ').toUpperCase();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 ${categoryName}`);
      console.log('='.repeat(60));

      for (const product of products) {
        try {
          // Mapear categoría, marca y proveedor
          const categoryId = categoryMap[product.category];
          const brandId = product.brand ? brandMap[product.brand] : null;
          const supplierId = product.supplier ? supplierMap[product.supplier] : supplierMap['AR-PROD']; // Por defecto Apex Remedy

          if (!categoryId) {
            console.log(`  ⚠️  Categoría no encontrada: ${product.category} - Saltando ${product.name}`);
            totalSkipped++;
            continue;
          }

          // Preparar campos JSON
          const cannabinoidProfile = product.cannabinoid_profile ? JSON.stringify(product.cannabinoid_profile) : null;
          const terpeneProfile = product.terpene_profile ? JSON.stringify(product.terpene_profile) : null;
          const strainInfo = product.strain_info ? JSON.stringify(product.strain_info) : null;
          const therapeuticInfo = product.therapeutic_info ? JSON.stringify(product.therapeutic_info) : null;
          const usageInfo = product.usage_info ? JSON.stringify(product.usage_info) : null;
          const safetyInfo = product.safety_info ? JSON.stringify(product.safety_info) : null;
          const specifications = product.specifications ? JSON.stringify(product.specifications) : null;
          const attributes = product.attributes ? JSON.stringify(product.attributes) : null;

          // Insertar producto
          const result = await dbHelper.run(`
            INSERT OR IGNORE INTO products (
              name, slug, sku, description, short_description,
              category_id, product_type, is_medicinal, requires_prescription,
              medical_category, base_price, stock_quantity, stock_unit,
              unit_type, base_unit, unit_size, brand_id, supplier_id,
              cannabinoid_profile, terpene_profile, strain_info,
              therapeutic_info, usage_info, safety_info, 
              specifications, attributes,
              featured, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.name, product.slug, product.sku, product.description, product.short_description,
            categoryId, product.product_type, product.is_medicinal, product.requires_prescription,
            product.medical_category, product.base_price, product.stock_quantity, product.stock_unit,
            product.unit_type, product.base_unit, product.unit_size, brandId, supplierId,
            cannabinoidProfile, terpeneProfile, strainInfo,
            therapeuticInfo, usageInfo, safetyInfo,
            specifications, attributes,
            product.featured, product.status,
            new Date().toISOString(), new Date().toISOString()
          ]);

          if (result.changes > 0) {
            console.log(`  ✓ ${product.name}`);
            totalInserted++;

            // Obtener ID del producto insertado
            const productRows = await dbHelper.all('SELECT id FROM products WHERE slug = ?', [product.slug]);
            if (productRows.length > 0) {
              const productId = productRows[0].id;

              // Agregar variantes de precio si existen
              if (product.price_variants && product.price_variants.length > 0) {
                for (const variant of product.price_variants) {
                  await dbHelper.run(`
                    INSERT OR IGNORE INTO product_price_variants (
                      product_id, variant_name, variant_type, quantity, unit, 
                      price, compare_at_price, is_default, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `, [
                    productId, variant.name, variant.type, variant.quantity, variant.unit,
                    variant.price, variant.compare_at_price, variant.is_default, 'active',
                    new Date().toISOString(), new Date().toISOString()
                  ]);
                }
              }

              // Agregar imagen principal si existe
              if (product.image_url) {
                await dbHelper.run(`
                  INSERT OR IGNORE INTO product_images (
                    product_id, url, alt_text, display_order, is_primary, created_at, updated_at
                  ) VALUES (?, ?, ?, 0, 1, ?, ?)
                `, [
                  productId, product.image_url, product.name,
                  new Date().toISOString(), new Date().toISOString()
                ]);
              }
            }
          } else {
            totalSkipped++;
          }
        } catch (error) {
          console.error(`  ✗ Error insertando ${product.name}:`, error.message);
          totalSkipped++;
        }
      }
    }

    // ============================================
    // 5. RESUMEN
    // ============================================
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMEN DEL SEED');
    console.log('='.repeat(60));
    console.log(`✅ Productos insertados: ${totalInserted}`);
    console.log(`⚠️  Productos saltados: ${totalSkipped}`);
    console.log(`📦 Total procesado: ${totalInserted + totalSkipped}`);
    console.log('='.repeat(60));

    // Verificar productos en base de datos
    const totalProducts = await dbHelper.all('SELECT COUNT(*) as count FROM products');
    console.log(`\n📈 Total de productos en base de datos: ${totalProducts[0].count}`);

    // Productos por categoría
    console.log('\n📊 Productos por categoría:');
    const categorySummary = await dbHelper.all(`
      SELECT 
        pc.name as category,
        COUNT(p.id) as count
      FROM product_categories pc
      LEFT JOIN products p ON pc.id = p.category_id
      GROUP BY pc.id
      ORDER BY pc.display_order
    `);
    
    categorySummary.forEach(cat => {
      const icon = cat.count > 0 ? '✓' : '○';
      console.log(`  ${icon} ${cat.category}: ${cat.count} productos`);
    });

    console.log('\n🎉 ¡Seed de productos completado exitosamente!\n');

  } catch (error) {
    console.error('\n❌ Error durante el seed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// ============================================
// EJECUTAR SEED
// ============================================

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          🌱 APEX REMEDY - SEED DE PRODUCTOS 🌱             ║
║                                                            ║
║  Sistema reutilizable y fácil de actualizar               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

console.log('Opciones disponibles:');
console.log('  --force              Eliminar productos existentes antes de insertar');
console.log('  --category=slug      Insertar solo productos de una categoría\n');

seedProducts()
  .then(() => {
    console.log('✅ Proceso completado con éxito');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });