// backend/database/ingestion/UnifiedProductIngestion.js
// Sistema unificado de ingesta de productos para GitHub (JSON), SQLite (local) y PostgreSQL (producción)

const path = require('path');
const fs = require('fs');

/**
 * Clase para ingesta unificada de productos
 * Soporta: GitHub (JSON), SQLite (local), PostgreSQL (producción)
 */
class UnifiedProductIngestion {
    constructor(mode = 'sqlite', config = {}) {
        this.mode = mode.toLowerCase();
        this.config = config;
        this.db = null;
        
        // Validar modo
        const validModes = ['json', 'github', 'sqlite', 'postgres', 'postgresql'];
        if (!validModes.includes(this.mode)) {
            throw new Error(`Modo inválido: ${mode}. Modos válidos: ${validModes.join(', ')}`);
        }
        
        // Normalizar modo
        if (this.mode === 'github') this.mode = 'json';
        if (this.mode === 'postgresql') this.mode = 'postgres';
    }
    
    /**
     * Inicializar conexión según el modo
     */
    async initialize() {
        if (this.mode === 'json' || this.mode === 'github') {
            // Para JSON, no necesitamos conexión a BD
            this.outputDir = this.config.outputDir || path.join(__dirname, '../../../frontend/api');
            if (!fs.existsSync(this.outputDir)) {
                fs.mkdirSync(this.outputDir, { recursive: true });
            }
        } else if (this.mode === 'sqlite') {
            const SQLiteAdapter = require('../../../src/services/database/SQLiteAdapter');
            const dbPath = this.config.dbPath || path.join(__dirname, '../../apexremedy.db');
            this.db = new SQLiteAdapter({ path: dbPath });
            await this.db.connect();
        } else if (this.mode === 'postgres') {
            const PostgreSQLAdapter = require('../../../src/services/database/PostgreSQLAdapter');
            this.db = new PostgreSQLAdapter({
                host: this.config.host || process.env.DB_HOST || 'localhost',
                port: this.config.port || process.env.DB_PORT || 5432,
                database: this.config.database || process.env.DB_NAME || 'apexremedy',
                user: this.config.user || process.env.DB_USER || 'postgres',
                password: this.config.password || process.env.DB_PASSWORD || '',
                ssl: this.config.ssl || (process.env.DB_SSL === 'true')
            });
            await this.db.connect();
        }
        
        console.log(`✅ Sistema de ingesta inicializado en modo: ${this.mode}`);
    }
    
    /**
     * Cerrar conexión
     */
    async close() {
        if (this.db && this.db.disconnect) {
            await this.db.disconnect();
        }
    }
    
    /**
     * Cargar mapeos de categorías y marcas
     */
    async loadMappings() {
        const categoryMap = {};
        const brandMap = {};
        
        if (this.mode === 'json') {
            // Para JSON, usamos los slugs directamente
            return { categoryMap: {}, brandMap: {} };
        }
        
        try {
            // Cargar categorías
            const categories = await this.db.all('SELECT id, slug FROM product_categories');
            categories.forEach(cat => {
                categoryMap[cat.slug] = cat.id;
            });
            
            // Cargar marcas
            const brands = await this.db.all('SELECT id, slug FROM brands');
            brands.forEach(brand => {
                brandMap[brand.slug] = brand.id;
            });
        } catch (error) {
            console.warn('⚠️ Advertencia al cargar mapeos:', error.message);
        }
        
        return { categoryMap, brandMap };
    }
    
    /**
     * Insertar un producto en la base de datos
     */
    async insertProduct(product, categoryMap, brandMap) {
        if (this.mode === 'json') {
            // Para JSON, solo retornamos el producto normalizado
            return this.normalizeProductForJSON(product);
        }
        
        // Mapear categoría y marca
        const categoryId = categoryMap[product.category];
        const brandId = product.brand ? brandMap[product.brand] : null;
        
        if (!categoryId) {
            throw new Error(`Categoría no encontrada: ${product.category} para producto ${product.name}`);
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
        
        // Determinar la sintaxis SQL según la BD
        const now = new Date().toISOString();
        let insertSQL;
        
        if (this.mode === 'postgres') {
            insertSQL = `
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    medical_category, base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    cannabinoid_profile, terpene_profile, strain_info,
                    therapeutic_info, usage_info, safety_info, 
                    specifications, attributes,
                    featured, status, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
            `;
        } else {
            insertSQL = `
                INSERT OR IGNORE INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    medical_category, base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    cannabinoid_profile, terpene_profile, strain_info,
                    therapeutic_info, usage_info, safety_info, 
                    specifications, attributes,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
        }
        
        const params = [
            product.name, product.slug, product.sku || null, 
            product.description || null, product.short_description || null,
            categoryId, product.product_type || 'standard', 
            product.is_medicinal ? 1 : 0, 
            product.requires_prescription ? 1 : 0,
            product.medical_category || null,
            product.base_price || 0,
            product.stock_quantity || 0,
            product.stock_unit || 'unidades',
            product.unit_type || null,
            product.base_unit || null,
            product.unit_size || null,
            brandId,
            cannabinoidProfile, terpeneProfile, strainInfo,
            therapeuticInfo, usageInfo, safetyInfo,
            specifications, attributes,
            product.featured ? 1 : 0,
            product.status || 'active',
            now, now
        ];
        
        let result;
        let productId;
        
        if (this.mode === 'postgres') {
            result = await this.db.query(insertSQL, params);
            // En PostgreSQL, si hay conflicto, result será vacío
            if (result.length > 0 && result[0].id) {
                productId = result[0].id;
            } else {
                // Producto ya existe, obtener su ID
                const existing = await this.db.get('SELECT id FROM products WHERE slug = $1', [product.slug]);
                productId = existing?.id;
            }
        } else {
            result = await this.db.run(insertSQL, params);
            if (result.lastID) {
                productId = result.lastID;
            } else {
                // Producto ya existe, obtener su ID
                const existing = await this.db.get('SELECT id FROM products WHERE slug = ?', [product.slug]);
                productId = existing?.id;
            }
        }
        
        return productId;
    }
    
    /**
     * Insertar variantes de precio
     */
    async insertPriceVariants(productId, priceVariants) {
        if (!productId || !priceVariants || priceVariants.length === 0) {
            return;
        }
        
        const now = new Date().toISOString();
        
        for (const variant of priceVariants) {
            let insertSQL;
            
            if (this.mode === 'postgres') {
                insertSQL = `
                    INSERT INTO product_price_variants (
                        product_id, variant_name, variant_type, quantity, unit, 
                        price, compare_at_price, is_default, status, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT DO NOTHING
                `;
            } else {
                insertSQL = `
                    INSERT OR IGNORE INTO product_price_variants (
                        product_id, variant_name, variant_type, quantity, unit, 
                        price, compare_at_price, is_default, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
            }
            
            const params = [
                productId,
                variant.name || variant.variant_name || '',
                variant.type || variant.variant_type || 'quantity',
                variant.quantity || 0,
                variant.unit || 'unidades',
                variant.price || 0,
                variant.compare_at_price || null,
                variant.is_default ? 1 : 0,
                'active',
                now,
                now
            ];
            
            if (this.mode === 'postgres') {
                await this.db.query(insertSQL, params);
            } else {
                await this.db.run(insertSQL, params);
            }
        }
    }
    
    /**
     * Insertar imágenes del producto
     */
    async insertProductImages(productId, imageUrl) {
        if (!productId || !imageUrl) {
            return;
        }
        
        const now = new Date().toISOString();
        let insertSQL;
        
        if (this.mode === 'postgres') {
            insertSQL = `
                    INSERT INTO product_images (
                        product_id, url, alt_text, display_order, is_primary, created_at, updated_at
                    ) VALUES ($1, $2, $3, 0, 1, $4, $5)
                ON CONFLICT (product_id, url) DO NOTHING
            `;
        } else {
            insertSQL = `
                INSERT OR IGNORE INTO product_images (
                    product_id, url, alt_text, display_order, is_primary, created_at, updated_at
                ) VALUES (?, ?, ?, 0, 1, ?, ?)
            `;
        }
        
        const params = [
            productId,
            imageUrl,
            '', // alt_text se puede actualizar después
            now,
            now
        ];
        
        if (this.mode === 'postgres') {
            await this.db.query(insertSQL, params);
        } else {
            await this.db.run(insertSQL, params);
        }
    }
    
    /**
     * Normalizar producto para JSON (exportación GitHub)
     */
    normalizeProductForJSON(product) {
        return {
            id: product.id || null,
            name: product.name,
            slug: product.slug,
            sku: product.sku || null,
            description: product.description || product.short_description || '',
            short_description: product.short_description || product.description || '',
            category: product.category || '',
            category_slug: product.category || '',
            category_id: product.category_id || null,
            brand: product.brand || null,
            brand_id: product.brand_id || null,
            product_type: product.product_type || 'standard',
            price: product.base_price || product.price || 0,
            base_price: product.base_price || product.price || 0,
            stock: product.stock_quantity || product.stock || 0,
            stock_quantity: product.stock_quantity || product.stock || 0,
            stock_unit: product.stock_unit || 'unidades',
            unit_type: product.unit_type || null,
            base_unit: product.base_unit || null,
            unit_size: product.unit_size || null,
            image: product.image_url || product.image || '',
            images: product.images || [],
            featured: product.featured ? true : false,
            active: product.status !== 'inactive',
            is_medicinal: product.is_medicinal ? true : false,
            requires_prescription: product.requires_prescription ? true : false,
            medical_category: product.medical_category || null,
            // Campos estructurados
            cannabinoid_profile: product.cannabinoid_profile || null,
            terpene_profile: product.terpene_profile || null,
            strain_info: product.strain_info || null,
            therapeutic_info: product.therapeutic_info || null,
            usage_info: product.usage_info || null,
            safety_info: product.safety_info || null,
            specifications: product.specifications || null,
            attributes: product.attributes || null,
            price_variants: product.price_variants || null,
            status: product.status || 'active',
            created_at: product.created_at || new Date().toISOString(),
            updated_at: product.updated_at || new Date().toISOString()
        };
    }
    
    /**
     * Procesar productos desde un array de datos
     */
    async processProducts(products, options = {}) {
        const {
            force = false,
            category = null,
            onProgress = null
        } = options;
        
        console.log(`\n📦 Procesando ${products.length} productos en modo ${this.mode}...`);
        
        // Limpiar productos existentes si es necesario
        if (force && this.mode !== 'json') {
            console.log('🗑️  Eliminando productos existentes...');
            await this.db.run('DELETE FROM product_images');
            await this.db.run('DELETE FROM product_price_variants');
            await this.db.run('DELETE FROM product_variants');
            await this.db.run('DELETE FROM products');
            console.log('  ✓ Productos eliminados\n');
        }
        
        // Cargar mapeos
        const { categoryMap, brandMap } = await this.loadMappings();
        
        let totalInserted = 0;
        let totalSkipped = 0;
        const jsonProducts = [];
        
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            // Filtrar por categoría si se especificó
            if (category && product.category !== category) {
                continue;
            }
            
            try {
                if (this.mode === 'json') {
                    // Modo JSON: solo normalizar
                    const normalized = this.normalizeProductForJSON(product);
                    normalized.id = i + 1; // ID temporal para JSON
                    jsonProducts.push(normalized);
                    totalInserted++;
                } else {
                    // Modo BD: insertar en base de datos
                    const productId = await this.insertProduct(product, categoryMap, brandMap);
                    
                    if (productId) {
                        // Insertar variantes de precio
                        if (product.price_variants && product.price_variants.length > 0) {
                            await this.insertPriceVariants(productId, product.price_variants);
                        }
                        
                        // Insertar imagen principal
                        if (product.image_url) {
                            await this.insertProductImages(productId, product.image_url);
                        }
                        
                        totalInserted++;
                        
                        if (onProgress) {
                            onProgress(i + 1, products.length, product.name);
                        }
                    } else {
                        totalSkipped++;
                    }
                }
            } catch (error) {
                console.error(`  ✗ Error procesando ${product.name}:`, error.message);
                totalSkipped++;
            }
        }
        
        // Si es modo JSON, guardar archivos
        if (this.mode === 'json') {
            await this.saveJSONFiles(jsonProducts);
        }
        
        return {
            total: products.length,
            inserted: totalInserted,
            skipped: totalSkipped
        };
    }
    
    /**
     * Guardar archivos JSON para GitHub
     */
    async saveJSONFiles(products) {
        console.log('\n💾 Guardando archivos JSON...');
        
        // Productos completos
        const apiResponse = {
            success: true,
            message: 'Productos exportados correctamente',
            data: {
                products: products,
                total: products.length,
                timestamp: new Date().toISOString()
            }
        };
        
        const productsFile = path.join(this.outputDir, 'products.json');
        fs.writeFileSync(productsFile, JSON.stringify(apiResponse, null, 2), 'utf8');
        console.log(`  ✓ ${productsFile} (${products.length} productos)`);
        
        // Productos destacados
        const featuredProducts = products.filter(p => p.featured);
        const featuredResponse = {
            success: true,
            message: 'Productos destacados exportados correctamente',
            data: {
                products: featuredProducts,
                total: featuredProducts.length,
                timestamp: new Date().toISOString()
            }
        };
        
        const featuredFile = path.join(this.outputDir, 'products-featured.json');
        fs.writeFileSync(featuredFile, JSON.stringify(featuredResponse, null, 2), 'utf8');
        console.log(`  ✓ ${featuredFile} (${featuredProducts.length} productos)`);
        
        // Productos por categoría
        const categoriesMap = {};
        products.forEach(product => {
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
        
        const categoriesFile = path.join(this.outputDir, 'products-by-category.json');
        fs.writeFileSync(categoriesFile, JSON.stringify(categoriesResponse, null, 2), 'utf8');
        console.log(`  ✓ ${categoriesFile}`);
        
        console.log('  ✅ Archivos JSON guardados exitosamente\n');
    }
}

module.exports = UnifiedProductIngestion;

