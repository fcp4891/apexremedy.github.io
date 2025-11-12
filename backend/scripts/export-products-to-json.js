#!/usr/bin/env node
/**
 * Script para exportar productos de la base de datos a JSON estático
 * Este script se ejecuta en GitHub Actions para generar la "API estática"
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, getDatabase } = require('../src/config/database');
const Product = require('../src/models/Product');
const UnifiedProductIngestion = require('../database/ingestion/UnifiedProductIngestion');

async function exportProducts(useUnified = false) {
    try {
        console.log('🚀 Iniciando exportación de productos a JSON...');
        
        // Si se usa el sistema unificado (recomendado)
        if (useUnified || process.env.USE_UNIFIED_EXPORT === 'true') {
            console.log('🔄 Usando sistema de ingesta unificado para exportación...\n');
            return await exportWithUnified();
        }
        
        // VERIFICAR PRIMERO si ya existe un JSON con productos
        const apiDir = path.join(__dirname, '../../frontend/api');
        const productsFile = path.join(apiDir, 'products.json');
        
        if (fs.existsSync(productsFile)) {
            try {
                const existingData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
                const productCount = existingData?.data?.total || 0;
                const isEmptyMsg = existingData?.message?.includes('JSON vacío') || false;
                
                console.log(`📄 JSON existente encontrado`);
                console.log(`📊 Productos en JSON existente: ${productCount}`);
                console.log(`⚠️ Es mensaje vacío: ${isEmptyMsg}`);
                
                // Si el JSON tiene productos Y no es un mensaje vacío, NO sobrescribir
                if (productCount > 0 && !isEmptyMsg) {
                    console.log(`✅ JSON existente tiene ${productCount} productos - NO sobrescribir`);
                    console.log(`✅ Preservando JSON existente con productos`);
                    return {
                        success: true,
                        productsCount: productCount,
                        featuredCount: existingData?.data?.featured?.length || 0,
                        categoriesCount: Object.keys(existingData?.data?.categories || {}).length || 0,
                        preserved: true
                    };
                }
            } catch (error) {
                console.warn('⚠️ Error al leer JSON existente, continuando con exportación...', error.message);
            }
        }
        
        // Verificar que la base de datos existe
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../database/apexremedy.db');
        
        if (!fs.existsSync(dbPath)) {
            console.error(`❌ Error: Base de datos no encontrada en: ${dbPath}`);
            console.log('💡 Asegúrate de que la base de datos existe o configura DB_PATH');
            // NO crear JSON vacío aquí - dejar que el workflow lo maneje
            throw new Error(`Base de datos no encontrada: ${dbPath}`);
        }
        
        console.log(`📂 Usando base de datos: ${dbPath}`);
        
        // Inicializar base de datos (ignorar errores de creación de tablas)
        try {
            await initDatabase();
        } catch (error) {
            console.warn('⚠️ Advertencia al inicializar DB (continuando...):', error.message);
            // Intentar conectar directamente sin crear tablas
            const { getDatabase } = require('../src/config/database');
            try {
                db = getDatabase();
            } catch (e) {
                console.error('❌ No se pudo conectar a la base de datos');
                throw e;
            }
        }
        
        const db = getDatabase();
        
        // Crear instancia del modelo Product
        const productModel = new Product();
        
        // Obtener solo productos ACTIVOS con sus imágenes
        console.log('📦 Obteniendo productos ACTIVOS de la base de datos...');
        // Usar findAllWithFilters para obtener solo productos activos
        const products = await productModel.findAllWithFilters({
            status: 'active',
            includeInactive: false
        });
        console.log(`✅ Encontrados ${products.length} productos activos`);
        
        // Obtener todas las marcas/breeders para mapear brand_id a breeder
        console.log('🏷️ Obteniendo marcas/breeders...');
        let brandsMap = {};
        try {
            const brands = await db.all('SELECT id, name FROM brands');
            brands.forEach(brand => {
                brandsMap[brand.id] = brand.name;
            });
        } catch (e) {
            console.warn('⚠️ No se pudieron cargar marcas (puede ser normal si la tabla no existe):', e.message);
        }
        
        // Obtener todas las variantes de precio para mapear product_id a price_variants
        console.log('💰 Obteniendo variantes de precio...');
        let priceVariantsMap = {};
        try {
            const priceVariants = await db.all(`
                SELECT product_id, variant_name, variant_type, quantity, unit, price, is_default
                FROM product_price_variants
                WHERE status = 'active'
                ORDER BY product_id, is_default DESC, quantity ASC
            `);
            priceVariants.forEach(variant => {
                if (!priceVariantsMap[variant.product_id]) {
                    priceVariantsMap[variant.product_id] = {};
                }
                const key = `${variant.quantity}${variant.unit}`;
                priceVariantsMap[variant.product_id][key] = variant.price;
            });
        } catch (e) {
            console.warn('⚠️ No se pudieron cargar variantes de precio (puede ser normal si la tabla no existe):', e.message);
        }
        
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
            
            // Intentar obtener price_variants desde la tabla product_price_variants primero
            if (priceVariantsMap[product.id] && Object.keys(priceVariantsMap[product.id]).length > 0) {
                priceVariants = priceVariantsMap[product.id];
            } else if (product.price_variants && typeof product.price_variants === 'string') {
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
            
            // Parsear campos JSON adicionales si existen
            let cannabinoidProfile = null;
            let terpeneProfile = null;
            let strainInfo = null;
            let therapeuticInfo = null;
            let usageInfo = null;
            let safetyInfo = null;
            let specifications = null;
            
            // Intentar parsear desde strings JSON
            const parseJsonField = (field) => {
                if (!field) return null;
                if (typeof field === 'string') {
                    try {
                        return JSON.parse(field);
                    } catch (e) {
                        return field; // Si no es JSON válido, retornar como string
                    }
                }
                return field;
            };
            
            cannabinoidProfile = parseJsonField(product.cannabinoid_profile);
            terpeneProfile = parseJsonField(product.terpene_profile);
            strainInfo = parseJsonField(product.strain_info);
            therapeuticInfo = parseJsonField(product.therapeutic_info);
            usageInfo = parseJsonField(product.usage_info);
            safetyInfo = parseJsonField(product.safety_info);
            specifications = parseJsonField(product.specifications);
            
            // Construir objeto normalizado para el frontend con TODOS los campos
            const normalized = {
                id: product.id,
                name: product.name,
                description: product.description || product.short_description || '',
                short_description: product.short_description || product.description || '',
                sku: product.sku,
                breeder: (product.brand_id && brandsMap[product.brand_id]) || null,
                brand_id: product.brand_id || null,
                category: product.category || '',
                category_slug: product.category_slug || '',
                category_id: product.category_id,
                product_type: product.product_type || null,
                price: product.base_price || product.price || 0,
                base_price: product.base_price || product.price || 0,
                stock: product.stock_quantity || product.stock || 0,
                stock_quantity: product.stock_quantity || product.stock || 0,
                stock_unit: product.stock_unit || null,
                image: product.image || product.primary_image || '',
                images: product.images || [],
                featured: product.featured === 1 || product.featured === true,
                // active debe derivarse de status (si status = 'active', entonces active = true)
                active: product.status === 'active' || product.active === 1 || product.active === true,
                is_medicinal: product.is_medicinal === 1 || product.is_medicinal === true,
                requires_prescription: product.requires_prescription === 1 || product.requires_prescription === true,
                created_at: product.created_at,
                updated_at: product.updated_at,
                // Campos estructurados
                attributes: attributes,
                price_variants: priceVariants,
                medicinal_info: medicinalInfo,
                // Campos específicos para modales
                cannabinoid_profile: cannabinoidProfile,
                terpene_profile: terpeneProfile,
                strain_info: strainInfo,
                therapeutic_info: therapeuticInfo,
                usage_info: usageInfo,
                safety_info: safetyInfo,
                specifications: specifications,
                // Campos adicionales
                medical_category: product.medical_category || null,
                unit_type: product.unit_type || null,
                base_unit: product.base_unit || null,
                unit_size: product.unit_size || null,
                status: product.status || 'active'
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
        
        // Crear directorio api si no existe (ya declarado arriba)
        if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
            console.log('📁 Directorio api creado:', apiDir);
        }
        
        // Guardar productos completos (productsFile ya declarado arriba)
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

/**
 * Exportación usando el sistema unificado
 */
async function exportWithUnified() {
    try {
        const UnifiedProductIngestion = require('../database/ingestion/UnifiedProductIngestion');
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
        } = require('../database/seeders/data/products-data');
        const { CATEGORIES } = require('../database/seeders/data/seed-config');
        
        // Combinar todos los productos
        const allProducts = [
            ...FLORES_MEDICINALES,
            ...ACEITES_MEDICINALES,
            ...CONCENTRADOS_MEDICINALES,
            ...CAPSULAS_MEDICINALES,
            ...TOPICOS_MEDICINALES,
            ...SEMILLAS,
            ...VAPORIZADORES,
            ...ACCESORIOS,
            ...ROPA,
            ...CBD_PUBLICO
        ];
        
        // Configurar salida JSON
        const outputDir = process.env.JSON_OUTPUT_DIR || path.join(__dirname, '../../frontend/api');
        const ingestion = new UnifiedProductIngestion('json', { outputDir });
        
        await ingestion.initialize();
        
        const result = await ingestion.processProducts(allProducts, {
            force: false,
            category: null
        });
        
        await ingestion.close();
        
        return {
            success: true,
            productsCount: result.inserted,
            featuredCount: 0, // Se calcula en saveJSONFiles
            categoriesCount: 0, // Se calcula en saveJSONFiles
            preserved: false
        };
        
    } catch (error) {
        console.error('❌ Error en exportación unificada:', error);
        throw error;
    }
}

module.exports = { exportProducts, exportWithUnified };

