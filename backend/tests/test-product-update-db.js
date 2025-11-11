/**
 * Test para validar escritura en base de datos de productos
 * 
 * Este test verifica que los cambios en productos se persistan correctamente
 * en la base de datos SQLite.
 */

const path = require('path');

// Configurar variables de entorno antes de importar
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = process.env.DB_PATH || 'database/apexremedy.db';
process.env.NODE_ENV = 'test';

const { initDatabase, getDatabase } = require('../src/config/database');
const Product = require('../src/models/Product');

// Colores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testProductUpdate() {
    try {
        log('\n🧪 Iniciando test de actualización de productos en base de datos...\n', 'cyan');
        
        // 1. Inicializar base de datos
        log('📦 Paso 1: Inicializando base de datos...', 'blue');
        await initDatabase();
        const db = getDatabase();
        log('✅ Base de datos inicializada\n', 'green');
        
        // 2. Obtener un producto existente para testear
        log('📦 Paso 2: Buscando producto para testear...', 'blue');
        const productModel = new Product();
        
        // Buscar producto con ID 87 (el que está fallando según los logs)
        const testProductId = 87;
        let productBefore = await productModel.findById(testProductId);
        
        if (!productBefore) {
            log(`⚠️  Producto con ID ${testProductId} no encontrado, creando uno de prueba...`, 'yellow');
            // Crear producto de prueba
            productBefore = await productModel.create({
                name: 'Producto Test Update',
                sku: 'TEST-UPDATE-001',
                base_price: 10000,
                stock_quantity: 50,
                category_id: 1,
                product_type: 'flower',
                is_medicinal: 1,
                requires_prescription: 1,
                status: 'active'
            });
            log(`✅ Producto de prueba creado con ID: ${productBefore.id}\n`, 'green');
        } else {
            log(`✅ Producto encontrado: ${productBefore.name} (ID: ${productBefore.id})\n`, 'green');
        }
        
        const originalBasePrice = parseFloat(productBefore.base_price) || 0;
        const originalStock = parseFloat(productBefore.stock_quantity) || 0;
        const originalName = productBefore.name;
        
        log('📊 Valores ANTES de actualización:', 'blue');
        log(`   - ID: ${productBefore.id}`, 'cyan');
        log(`   - Nombre: ${originalName}`, 'cyan');
        log(`   - base_price: ${originalBasePrice}`, 'cyan');
        log(`   - stock_quantity: ${originalStock}\n`, 'cyan');
        
        // 3. Leer directamente de la base de datos (sin pasar por el modelo)
        log('📦 Paso 3: Leyendo directamente de la base de datos (sin cache)...', 'blue');
        const directReadBefore = await db.get(
            'SELECT id, name, base_price, stock_quantity FROM products WHERE id = ?',
            [productBefore.id]
        );
        
        if (!directReadBefore) {
            throw new Error('No se pudo leer el producto directamente de la base de datos');
        }
        
        log('📊 Valores leídos DIRECTAMENTE de BD (antes):', 'blue');
        log(`   - ID: ${directReadBefore.id}`, 'cyan');
        log(`   - Nombre: ${directReadBefore.name}`, 'cyan');
        log(`   - base_price: ${directReadBefore.base_price} (tipo: ${typeof directReadBefore.base_price})`, 'cyan');
        log(`   - stock_quantity: ${directReadBefore.stock_quantity} (tipo: ${typeof directReadBefore.stock_quantity})\n`, 'cyan');
        
        // 4. Actualizar el producto con valores diferentes
        log('📦 Paso 4: Actualizando producto...', 'blue');
        const newBasePrice = originalBasePrice + 5000; // Aumentar precio en 5000
        const newStock = originalStock + 10; // Aumentar stock en 10
        const newName = `${originalName} [TEST ${Date.now()}]`;
        
        log(`   - Nuevo base_price: ${newBasePrice}`, 'cyan');
        log(`   - Nuevo stock_quantity: ${newStock}`, 'cyan');
        log(`   - Nuevo nombre: ${newName}\n`, 'cyan');
        
        const updateData = {
            name: newName,
            base_price: newBasePrice,
            stock_quantity: newStock
        };
        
        const updatedProduct = await productModel.update(productBefore.id, updateData);
        
        if (!updatedProduct) {
            throw new Error('Error: update() retornó null o undefined');
        }
        
        log('✅ Producto actualizado mediante modelo\n', 'green');
        
        // 5. Verificar que el modelo retorne los valores actualizados
        log('📦 Paso 5: Verificando valores retornados por el modelo...', 'blue');
        log(`   - base_price retornado: ${updatedProduct.base_price} (esperado: ${newBasePrice})`, 'cyan');
        log(`   - stock_quantity retornado: ${updatedProduct.stock_quantity} (esperado: ${newStock})`, 'cyan');
        log(`   - name retornado: ${updatedProduct.name}`, 'cyan');
        
        const modelMatches = 
            parseFloat(updatedProduct.base_price) === newBasePrice &&
            parseFloat(updatedProduct.stock_quantity) === newStock &&
            updatedProduct.name === newName;
        
        if (modelMatches) {
            log('✅ Modelo retorna valores correctos\n', 'green');
        } else {
            log('❌ Modelo NO retorna valores correctos\n', 'red');
        }
        
        // 6. Leer DIRECTAMENTE de la base de datos después de la actualización
        log('📦 Paso 6: Leyendo DIRECTAMENTE de la base de datos (después de update)...', 'blue');
        
        // Esperar un poco para asegurar que la transacción se completó
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const directReadAfter = await db.get(
            'SELECT id, name, base_price, stock_quantity FROM products WHERE id = ?',
            [productBefore.id]
        );
        
        if (!directReadAfter) {
            throw new Error('No se pudo leer el producto directamente de la base de datos después del update');
        }
        
        log('📊 Valores leídos DIRECTAMENTE de BD (después):', 'blue');
        log(`   - ID: ${directReadAfter.id}`, 'cyan');
        log(`   - Nombre: ${directReadAfter.name}`, 'cyan');
        log(`   - base_price: ${directReadAfter.base_price} (tipo: ${typeof directReadAfter.base_price})`, 'cyan');
        log(`   - stock_quantity: ${directReadAfter.stock_quantity} (tipo: ${typeof directReadAfter.stock_quantity})\n`, 'cyan');
        
        // 7. Comparar valores
        log('📦 Paso 7: Comparando valores...', 'blue');
        
        const dbBasePrice = parseFloat(directReadAfter.base_price) || 0;
        const dbStock = parseFloat(directReadAfter.stock_quantity) || 0;
        const dbName = directReadAfter.name;
        
        const basePriceMatches = Math.abs(dbBasePrice - newBasePrice) < 0.01;
        const stockMatches = Math.abs(dbStock - newStock) < 0.01;
        const nameMatches = dbName === newName;
        
        log(`   - base_price en BD: ${dbBasePrice} vs Esperado: ${newBasePrice} → ${basePriceMatches ? '✅' : '❌'}`, 
            basePriceMatches ? 'green' : 'red');
        log(`   - stock_quantity en BD: ${dbStock} vs Esperado: ${newStock} → ${stockMatches ? '✅' : '❌'}`, 
            stockMatches ? 'green' : 'red');
        log(`   - name en BD: ${dbName} vs Esperado: ${newName} → ${nameMatches ? '✅' : '❌'}`, 
            nameMatches ? 'green' : 'red');
        
        // 8. Verificar cambios en la base de datos
        log('\n📦 Paso 8: Verificando cambios en la base de datos...', 'blue');
        
        const basePriceChanged = Math.abs(dbBasePrice - originalBasePrice) > 0.01;
        const stockChanged = Math.abs(dbStock - originalStock) > 0.01;
        const nameChanged = dbName !== originalName;
        
        log(`   - base_price cambió: ${originalBasePrice} → ${dbBasePrice} → ${basePriceChanged ? '✅' : '❌'}`, 
            basePriceChanged ? 'green' : 'red');
        log(`   - stock_quantity cambió: ${originalStock} → ${dbStock} → ${stockChanged ? '✅' : '❌'}`, 
            stockChanged ? 'green' : 'red');
        log(`   - name cambió: ${originalName} → ${dbName} → ${nameChanged ? '✅' : '❌'}`, 
            nameChanged ? 'green' : 'red');
        
        // 9. Resultado final
        log('\n' + '='.repeat(60), 'cyan');
        const allTestsPassed = basePriceMatches && stockMatches && nameMatches && 
                               basePriceChanged && stockChanged && nameChanged;
        
        if (allTestsPassed) {
            log('✅ TEST PASADO: Los cambios se persisten correctamente en la base de datos', 'green');
        } else {
            log('❌ TEST FALLIDO: Los cambios NO se persisten correctamente en la base de datos', 'red');
            log('\n🔍 Diagnóstico:', 'yellow');
            if (!basePriceMatches) {
                log(`   - base_price no coincide: BD tiene ${dbBasePrice}, esperado ${newBasePrice}`, 'red');
            }
            if (!stockMatches) {
                log(`   - stock_quantity no coincide: BD tiene ${dbStock}, esperado ${newStock}`, 'red');
            }
            if (!nameMatches) {
                log(`   - name no coincide: BD tiene "${dbName}", esperado "${newName}"`, 'red');
            }
        }
        log('='.repeat(60) + '\n', 'cyan');
        
        // 10. Restaurar valores originales (opcional)
        log('📦 Paso 9: Restaurando valores originales...', 'blue');
        await productModel.update(productBefore.id, {
            name: originalName,
            base_price: originalBasePrice,
            stock_quantity: originalStock
        });
        log('✅ Valores originales restaurados\n', 'green');
        
        // 11. Verificar restauración
        const restoredProduct = await db.get(
            'SELECT id, name, base_price, stock_quantity FROM products WHERE id = ?',
            [productBefore.id]
        );
        
        const restoredBasePrice = parseFloat(restoredProduct.base_price) || 0;
        const restoredStock = parseFloat(restoredProduct.stock_quantity) || 0;
        const restoredName = restoredProduct.name;
        
        const restoredCorrectly = 
            Math.abs(restoredBasePrice - originalBasePrice) < 0.01 &&
            Math.abs(restoredStock - originalStock) < 0.01 &&
            restoredName === originalName;
        
        if (restoredCorrectly) {
            log('✅ Valores restaurados correctamente', 'green');
        } else {
            log('⚠️  Advertencia: Los valores no se restauraron correctamente', 'yellow');
        }
        
        return allTestsPassed;
        
    } catch (error) {
        log(`\n❌ ERROR en el test: ${error.message}`, 'red');
        log(`   Stack: ${error.stack}\n`, 'red');
        throw error;
    }
}

// Ejecutar test
if (require.main === module) {
    testProductUpdate()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { testProductUpdate };

