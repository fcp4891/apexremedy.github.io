#!/usr/bin/env node
/**
 * Script para exportar productos de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática"
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');
const Product = require('../src/models/Product');

async function exportProducts() {
    try {
        console.log('🚀 Iniciando exportación de productos a JSON...');
        
        // Verificar que la base de datos existe
        const fs = require('fs');
        const path = require('path');
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.error(`❌ Error: Base de datos no encontrada en: ${dbPath}`);
            console.log('💡 Asegúrate de que la base de datos existe o configura DB_PATH');
            throw new Error(`Base de datos no encontrada: ${dbPath}`);
        }
        
        console.log(`📂 Usando base de datos: ${dbPath}`);
        
        // Inicializar base de datos
        await initDatabase();
        const db = getDatabase();
        
        // Crear instancia del modelo Product
        const productModel = new Product();
        
        // Obtener todos los productos con sus imágenes
        console.log('📦 Obteniendo productos de la base de datos...');
        const products = await productModel.findAll();
        
        // Normalizar productos para el frontend
        const normalizedProducts = products.map(product => {
            // Parsear JSON strings si existen
            let attributes = null;
            let priceVariants = null;
            let medicinalInfo = null;
            
            if (product.attributes && typeof product.attributes === 'string') {
                try {
                    attributes = JSON.parse(product.attributes);
                } catch (e) {
                    console.warn(`⚠️ Error parsing attributes for product ${product.id}:`, e.message);
                }
            } else if (product.attributes) {
                attributes = product.attributes;
            }
            
            if (product.price_variants && typeof product.price_variants === 'string') {
                try {
                    priceVariants = JSON.parse(product.price_variants);
                } catch (e) {
                    console.warn(`⚠️ Error parsing price_variants for product ${product.id}:`, e.message);
                }
            } else if (product.price_variants) {
                priceVariants = product.price_variants;
            }
            
            if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                try {
                    medicinalInfo = JSON.parse(product.medicinal_info);
                } catch (e) {
                    console.warn(`⚠️ Error parsing medicinal_info for product ${product.id}:`, e.message);
                }
            } else if (product.medicinal_info) {
                medicinalInfo = product.medicinal_info;
            }
            
            // Construir objeto normalizado para el frontend
            const normalized = {
                id: product.id,
                name: product.name,
                description: product.description || '',
                sku: product.sku,
                category: product.category || '',
                category_slug: product.category_slug || '',
                category_id: product.category_id,
                price: product.base_price || product.price || 0,
                base_price: product.base_price || product.price || 0,
                stock: product.stock_quantity || product.stock || 0,
                stock_quantity: product.stock_quantity || product.stock || 0,
                image: product.image || product.primary_image || '',
                images: product.images || [],
                featured: product.featured === 1 || product.featured === true,
                active: product.active === 1 || product.active === true,
                created_at: product.created_at,
                updated_at: product.updated_at,
                attributes: attributes,
                price_variants: priceVariants,
                medicinal_info: medicinalInfo
            };
            
            return normalized;
        });
        
        // Crear estructura de respuesta similar a la API
        const apiResponse = {
            success: true,
            message: 'Productos exportados correctamente',
            data: {
                products: normalizedProducts,
                total: normalizedProducts.length,
                timestamp: new Date().toISOString()
            }
        };
        
        // Crear directorio api si no existe
        const apiDir = path.join(__dirname, '../../frontend/api');
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
            console.log('📁 Directorio api creado:', apiDir);
        }
        
        // Guardar productos completos
        const productsFile = path.join(apiDir, 'products.json');
        fs.writeFileSync(productsFile, JSON.stringify(apiResponse, null, 2), 'utf8');
        console.log(`✅ Productos exportados: ${productsFile} (${normalizedProducts.length} productos)`);
        
        // Exportar también productos destacados
        const featuredProducts = normalizedProducts.filter(p => p.featured);
        const featuredResponse = {
            success: true,
            message: 'Productos destacados exportados correctamente',
            data: {
                products: featuredProducts,
                total: featuredProducts.length,
                timestamp: new Date().toISOString()
            }
        };
        
        const featuredFile = path.join(apiDir, 'products-featured.json');
        fs.writeFileSync(featuredFile, JSON.stringify(featuredResponse, null, 2), 'utf8');
        console.log(`✅ Productos destacados exportados: ${featuredFile} (${featuredProducts.length} productos)`);
        
        // Exportar también por categorías (útil para filtros)
        const categoriesMap = {};
        normalizedProducts.forEach(product => {
            const categorySlug = product.category_slug || 'uncategorized';
            if (!categoriesMap[categorySlug]) {
                categoriesMap[categorySlug] = [];
            }
            categoriesMap[categorySlug].push(product);
        });
        
        const categoriesResponse = {
            success: true,
            message: 'Productos por categoría exportados correctamente',
            data: {
                categories: categoriesMap,
                timestamp: new Date().toISOString()
            }
        };
        
        const categoriesFile = path.join(apiDir, 'products-by-category.json');
        fs.writeFileSync(categoriesFile, JSON.stringify(categoriesResponse, null, 2), 'utf8');
        console.log(`✅ Productos por categoría exportados: ${categoriesFile}`);
        
        // Desconectar base de datos
        await db.disconnect();
        
        console.log('🎉 Exportación completada exitosamente!');
        return {
            success: true,
            productsCount: normalizedProducts.length,
            featuredCount: featuredProducts.length,
            categoriesCount: Object.keys(categoriesMap).length
        };
        
    } catch (error) {
        console.error('❌ Error al exportar productos:', error);
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    exportProducts()
        .then(result => {
            console.log('\n📊 Resumen de exportación:');
            console.log(`   - Productos totales: ${result.productsCount}`);
            console.log(`   - Productos destacados: ${result.featuredCount}`);
            console.log(`   - Categorías: ${result.categoriesCount}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { exportProducts };

