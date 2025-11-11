/**
 * Script para verificar la actualización de productos en la base de datos
 * 
 * Uso: node scripts/verify-product-update.js <productId> <newPrice>
 * Ejemplo: node scripts/verify-product-update.js 87 18000
 */

const path = require('path');

// Configurar variables de entorno antes de importar
process.env.DB_TYPE = 'sqlite';
process.env.DB_PATH = process.env.DB_PATH || 'database/apexremedy.db';

const { initDatabase, getDatabase } = require('../src/config/database');
const Product = require('../src/models/Product');

async function verifyProductUpdate(productId, newPrice) {
    try {
        console.log('\n🔍 Verificando actualización de producto...\n');
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        const productModel = new Product();
        
        // 1. Leer producto ANTES
        console.log('📖 Paso 1: Leyendo producto ANTES de actualizar...');
        const productBefore = await productModel.findById(parseInt(productId));
        if (!productBefore) {
            console.error(`❌ Producto con ID ${productId} no encontrado`);
            process.exit(1);
        }
        
        console.log('   - ID:', productBefore.id);
        console.log('   - Nombre:', productBefore.name);
        console.log('   - base_price:', productBefore.base_price);
        console.log('   - stock_quantity:', productBefore.stock_quantity);
        
        // 2. Leer DIRECTAMENTE de BD ANTES
        console.log('\n📖 Paso 2: Leyendo DIRECTAMENTE de BD (ANTES)...');
        const directBefore = await db.get(
            'SELECT id, name, base_price, stock_quantity FROM products WHERE id = ?',
            [productId]
        );
        console.log('   - ID:', directBefore.id);
        console.log('   - Nombre:', directBefore.name);
        console.log('   - base_price:', directBefore.base_price, `(tipo: ${typeof directBefore.base_price})`);
        console.log('   - stock_quantity:', directBefore.stock_quantity, `(tipo: ${typeof directBefore.stock_quantity})`);
        
        // 3. Actualizar producto
        const priceToUpdate = parseFloat(newPrice) || parseFloat(productBefore.base_price) + 1000;
        console.log(`\n💾 Paso 3: Actualizando base_price a ${priceToUpdate}...`);
        
        const updateResult = await productModel.update(parseInt(productId), {
            base_price: priceToUpdate
        });
        
        console.log('   ✅ Update completado');
        console.log('   - base_price retornado por modelo:', updateResult.base_price);
        
        // 4. Leer DIRECTAMENTE de BD DESPUÉS
        console.log('\n📖 Paso 4: Leyendo DIRECTAMENTE de BD (DESPUÉS)...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
        
        const directAfter = await db.get(
            'SELECT id, name, base_price, stock_quantity FROM products WHERE id = ?',
            [productId]
        );
        console.log('   - ID:', directAfter.id);
        console.log('   - Nombre:', directAfter.name);
        console.log('   - base_price:', directAfter.base_price, `(tipo: ${typeof directAfter.base_price})`);
        console.log('   - stock_quantity:', directAfter.stock_quantity, `(tipo: ${typeof directAfter.stock_quantity})`);
        
        // 5. Leer mediante modelo DESPUÉS
        console.log('\n📖 Paso 5: Leyendo mediante modelo (DESPUÉS)...');
        const productAfter = await productModel.findById(parseInt(productId));
        console.log('   - ID:', productAfter.id);
        console.log('   - Nombre:', productAfter.name);
        console.log('   - base_price:', productAfter.base_price);
        console.log('   - stock_quantity:', productAfter.stock_quantity);
        
        // 6. Comparar
        console.log('\n📊 Paso 6: Comparando resultados...');
        const dbPrice = parseFloat(directAfter.base_price);
        const modelPrice = parseFloat(productAfter.base_price);
        const expectedPrice = parseFloat(priceToUpdate);
        
        const dbMatches = Math.abs(dbPrice - expectedPrice) < 0.01;
        const modelMatches = Math.abs(modelPrice - expectedPrice) < 0.01;
        const bothMatch = dbMatches && modelMatches;
        
        console.log(`   - Precio en BD: ${dbPrice} (esperado: ${expectedPrice}) → ${dbMatches ? '✅' : '❌'}`);
        console.log(`   - Precio en modelo: ${modelPrice} (esperado: ${expectedPrice}) → ${modelMatches ? '✅' : '❌'}`);
        console.log(`   - Ambos coinciden: ${bothMatch ? '✅' : '❌'}`);
        
        // 7. Verificar cambios
        console.log('\n📊 Paso 7: Verificando cambios...');
        const priceChanged = Math.abs(dbPrice - parseFloat(directBefore.base_price)) > 0.01;
        console.log(`   - base_price cambió: ${directBefore.base_price} → ${dbPrice} → ${priceChanged ? '✅' : '❌'}`);
        
        // 8. Resultado final
        console.log('\n' + '='.repeat(60));
        if (bothMatch && priceChanged) {
            console.log('✅ VERIFICACIÓN EXITOSA: Los cambios se persisten correctamente');
            console.log('='.repeat(60) + '\n');
        } else {
            console.log('❌ VERIFICACIÓN FALLIDA: Los cambios NO se persisten correctamente');
            if (!dbMatches) {
                console.log(`   - El precio en BD (${dbPrice}) no coincide con el esperado (${expectedPrice})`);
            }
            if (!modelMatches) {
                console.log(`   - El precio en modelo (${modelPrice}) no coincide con el esperado (${expectedPrice})`);
            }
            if (!priceChanged) {
                console.log(`   - El precio no cambió en la BD`);
            }
            console.log('='.repeat(60) + '\n');
        }
        
        // 9. Restaurar precio original
        if (priceChanged) {
            console.log('🔄 Restaurando precio original...');
            await productModel.update(parseInt(productId), {
                base_price: parseFloat(directBefore.base_price)
            });
            console.log('✅ Precio original restaurado\n');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Obtener argumentos de línea de comandos
const args = process.argv.slice(2);
const productId = args[0] || '87';
const newPrice = args[1] || null;

verifyProductUpdate(productId, newPrice)
    .then(() => {
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });





