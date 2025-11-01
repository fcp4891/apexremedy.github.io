// backend/src/models/Product.js
const BaseModel = require('./index');

class Product extends BaseModel {
    constructor() {
        super('products');
    }
    
    async findById(id) {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.id = ?
            `;
            const product = await this.db.get(sql, [id]);
            if (!product) return null;
            
            // Normalizar campos para compatibilidad con frontend
            product.price = product.base_price;
            product.stock = product.stock_quantity;
            
            if (product.attributes && typeof product.attributes === 'string') {
                try {
                    product.attributes = JSON.parse(product.attributes);
                } catch (e) {
                    console.error('Error parsing attributes:', e);
                    product.attributes = null;
                }
            }
            
            if (product.price_variants && typeof product.price_variants === 'string') {
                try {
                    product.price_variants = JSON.parse(product.price_variants);
                } catch (e) {
                    console.error('Error parsing price_variants:', e);
                    product.price_variants = null;
                }
            }
            
            if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                try {
                    product.medicinal_info = JSON.parse(product.medicinal_info);
                } catch (e) {
                    console.error('Error parsing medicinal_info:', e);
                    product.medicinal_info = null;
                }
            }
            
            // Cargar imágenes de product_images
            product.images = await this.getProductImages(id);
            
            return product;
        } catch (error) {
            console.error('Error in Product.findById:', error);
            throw error;
        }
    }

    async findAll() {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
            `;
            const products = await this.db.all(sql);
            
            // Cargar todas las imágenes de una vez
            const productIds = products.map(p => p.id);
            let imagesMap = {};
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const imagesSql = `
                    SELECT product_id, url, alt_text, display_order, is_primary
                    FROM product_images
                    WHERE product_id IN (${placeholders})
                    ORDER BY is_primary DESC, display_order ASC
                `;
                const allImages = await this.db.all(imagesSql, productIds);
                
                // Organizar imágenes por product_id
                allImages.forEach(img => {
                    if (!imagesMap[img.product_id]) {
                        imagesMap[img.product_id] = [];
                    }
                    imagesMap[img.product_id].push({
                        id: img.id || null,
                        url: img.url,
                        alt_text: img.alt_text || '',
                        display_order: img.display_order || 0,
                        is_primary: img.is_primary || 0
                    });
                });
            }
            
            return products.map(product => {
                // Normalizar campos
                product.price = product.base_price;
                product.stock = product.stock_quantity;
                
                // Agregar imágenes desde product_images
                if (imagesMap[product.id]) {
                    product.images = imagesMap[product.id];
                } else {
                    product.images = [];
                }
                
                if (product.attributes && typeof product.attributes === 'string') {
                    try {
                        product.attributes = JSON.parse(product.attributes);
                    } catch (e) {
                        console.error('Error parsing attributes:', e);
                        product.attributes = null;
                    }
                }
                
                if (product.price_variants && typeof product.price_variants === 'string') {
                    try {
                        product.price_variants = JSON.parse(product.price_variants);
                    } catch (e) {
                        console.error('Error parsing price_variants:', e);
                        product.price_variants = null;
                    }
                }
                
                if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                    try {
                        product.medicinal_info = JSON.parse(product.medicinal_info);
                    } catch (e) {
                        console.error('Error parsing medicinal_info:', e);
                        product.medicinal_info = null;
                    }
                }
                
                return product;
            });
        } catch (error) {
            console.error('Error in Product.findAll:', error);
            throw error;
        }
    }

    async update(id, data) {
        try {
            const product = await this.findById(id);
            if (!product) {
                throw new Error('Producto no encontrado');
            }

            // Mapear category_slug a category_id si viene del frontend
            let categoryId = data.category_id;
            if (!categoryId && data.category_slug) {
                const category = await this.db.get(
                    'SELECT id FROM product_categories WHERE slug = ?',
                    [data.category_slug]
                );
                categoryId = category ? category.id : null;
            }

            const updateData = {
                name: data.name,
                slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
                sku: data.sku || null,
                description: data.description || null,
                short_description: data.short_description || null,
                category_id: categoryId || data.category || product.category_id,
                brand_id: data.brand_id || product.brand_id,
                product_type: data.product_type || product.product_type,
                is_medicinal: data.is_medicinal !== undefined ? (data.is_medicinal ? 1 : 0) : product.is_medicinal,
                requires_prescription: data.requires_prescription !== undefined ? (data.requires_prescription ? 1 : 0) : product.requires_prescription,
                medical_category: data.medical_category || product.medical_category,
                base_price: parseFloat(data.base_price || data.price || product.base_price),
                stock_quantity: parseFloat(data.stock_quantity || data.stock || product.stock_quantity),
                stock_unit: data.stock_unit || product.stock_unit,
                unit_type: data.unit_type || product.unit_type,
                base_unit: data.base_unit || product.base_unit,
                unit_size: data.unit_size || product.unit_size,
                cannabinoid_profile: data.cannabinoid_profile ? JSON.stringify(data.cannabinoid_profile) : product.cannabinoid_profile,
                terpene_profile: data.terpene_profile ? JSON.stringify(data.terpene_profile) : product.terpene_profile,
                strain_info: data.strain_info ? JSON.stringify(data.strain_info) : product.strain_info,
                therapeutic_info: data.therapeutic_info ? JSON.stringify(data.therapeutic_info) : product.therapeutic_info,
                usage_info: data.usage_info ? JSON.stringify(data.usage_info) : product.usage_info,
                safety_info: data.safety_info ? JSON.stringify(data.safety_info) : product.safety_info,
                specifications: data.specifications ? JSON.stringify(data.specifications) : product.specifications,
                attributes: data.attributes ? JSON.stringify(data.attributes) : product.attributes,
                featured: data.featured !== undefined ? (data.featured ? 1 : 0) : product.featured,
                status: data.status || product.status,
                updated_at: new Date().toISOString()
            };

            const fields = Object.keys(updateData);
            const placeholders = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updateData[field]);
            
            const sql = `UPDATE ${this.tableName} SET ${placeholders} WHERE id = ?`;
            await this.db.run(sql, [...values, id]);
            
            // Manejar imágenes en product_images
            const imagesToSave = [];
            if (data.image) {
                imagesToSave.push({ url: data.image, display_order: 0, is_primary: 1 });
                console.log('📸 Imagen principal recibida para producto', id);
            }
            if (data.productSecondImage) {
                imagesToSave.push({ url: data.productSecondImage, display_order: 1, is_primary: 0 });
                console.log('📸 Segunda imagen recibida para producto', id);
            }
            
            if (imagesToSave.length > 0) {
                console.log('💾 Guardando', imagesToSave.length, 'imagen(es) en product_images para producto', id);
                await this.updateProductImages(id, imagesToSave);
                console.log('✅ Imágenes guardadas exitosamente en product_images');
            } else {
                console.log('⚠️ No se recibieron imágenes para guardar en product_images');
            }
            
            return await this.findById(id);
        } catch (error) {
            console.error('Error en Product.update:', error);
            throw error;
        }
    }
    
    /**
     * Obtener imágenes de un producto de product_images
     */
    async getProductImages(productId) {
        try {
            const sql = `
                SELECT id, url, alt_text, display_order, is_primary
                FROM product_images
                WHERE product_id = ?
                ORDER BY display_order ASC
            `;
            return await this.db.all(sql, [productId]);
        } catch (error) {
            console.error('Error obteniendo imágenes del producto:', error);
            return [];
        }
    }
    
    /**
     * Actualizar imágenes de un producto en product_images
     */
    async updateProductImages(productId, images) {
        try {
            // Eliminar imágenes antiguas
            await this.db.run('DELETE FROM product_images WHERE product_id = ?', [productId]);
            
            // Insertar nuevas imágenes
            for (const img of images) {
                if (img.url) {
                    await this.db.run(
                        `INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary, created_at)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [productId, img.url, img.alt_text || '', img.display_order || 0, 
                         img.is_primary || 0, new Date().toISOString()]
                    );
                }
            }
        } catch (error) {
            console.error('Error actualizando imágenes del producto:', error);
            throw error;
        }
    }

    async create(data) {
        try {
            // Mapear category_slug a category_id si viene del frontend
            let categoryId = data.category_id;
            if (!categoryId && data.category_slug) {
                const category = await this.db.get(
                    'SELECT id FROM product_categories WHERE slug = ?',
                    [data.category_slug]
                );
                categoryId = category ? category.id : null;
            }
            
            const productData = {
                name: data.name,
                slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
                sku: data.sku || null,
                description: data.description || null,
                short_description: data.short_description || null,
                category_id: categoryId || data.category,
                brand_id: data.brand_id || null,
                product_type: data.product_type || 'standard',
                is_medicinal: data.is_medicinal || (data.requires_prescription ? 1 : 0),
                requires_prescription: data.requires_prescription ? 1 : 0,
                medical_category: data.medical_category || null,
                base_price: parseFloat(data.base_price || data.price || 0),
                stock_quantity: parseFloat(data.stock_quantity || data.stock || 0),
                stock_unit: data.stock_unit || 'unidades',
                unit_type: data.unit_type || null,
                base_unit: data.base_unit || null,
                unit_size: data.unit_size || null,
                cannabinoid_profile: data.cannabinoid_profile ? JSON.stringify(data.cannabinoid_profile) : null,
                terpene_profile: data.terpene_profile ? JSON.stringify(data.terpene_profile) : null,
                strain_info: data.strain_info ? JSON.stringify(data.strain_info) : null,
                therapeutic_info: data.therapeutic_info ? JSON.stringify(data.therapeutic_info) : null,
                usage_info: data.usage_info ? JSON.stringify(data.usage_info) : null,
                safety_info: data.safety_info ? JSON.stringify(data.safety_info) : null,
                specifications: data.specifications ? JSON.stringify(data.specifications) : null,
                attributes: data.attributes ? JSON.stringify(data.attributes) : null,
                featured: data.featured ? 1 : 0,
                status: data.status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const fields = Object.keys(productData).join(', ');
            const placeholders = Object.keys(productData).map(() => '?').join(', ');
            const values = Object.values(productData);

            const sql = `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`;
            const result = await this.db.run(sql, values);
            
            const productId = result.lastID;
            
            // Guardar imágenes en product_images si existen
            const imagesToSave = [];
            if (data.image) {
                imagesToSave.push({ url: data.image, display_order: 0, is_primary: 1 });
            }
            if (data.productSecondImage) {
                imagesToSave.push({ url: data.productSecondImage, display_order: 1, is_primary: 0 });
            }
            
            if (imagesToSave.length > 0) {
                await this.updateProductImages(productId, imagesToSave);
            }
            
            return productId;
        } catch (error) {
            console.error('Error en Product.create:', error);
            throw error;
        }
    }
    
    async findAllWithFilters(filters = {}) {
        let sql = `SELECT p.*, c.name as category, c.slug as category_slug FROM ${this.tableName} p LEFT JOIN product_categories c ON p.category_id = c.id`;
        const params = [];
        const conditions = [];

        if (filters.category) {
            conditions.push('p.category_id = ?');
            params.push(filters.category);
        }

        if (filters.minPrice !== undefined) {
            conditions.push('p.base_price >= ?');
            params.push(filters.minPrice);
        }

        if (filters.maxPrice !== undefined) {
            conditions.push('p.base_price <= ?');
            params.push(filters.maxPrice);
        }

        if (filters.featured !== undefined) {
            conditions.push('p.featured = ?');
            params.push(filters.featured ? 1 : 0);
        }

        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                conditions.push('p.stock_quantity > 0');
            } else {
                conditions.push('p.stock_quantity = 0');
            }
        }

        if (filters.search) {
            conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (filters.excludeMedicinal) {
            conditions.push('p.requires_prescription = 0');
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ` ORDER BY p.${filters.orderBy || 'name'} ${filters.order || 'ASC'}`;

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
            
            if (filters.offset) {
                sql += ' OFFSET ?';
                params.push(filters.offset);
            }
        }
        
        const products = await this.db.all(sql, params);
        
        // Cargar todas las imágenes de una vez para todos los productos
        const productIds = products.map(p => p.id);
        let imagesMap = {};
        if (productIds.length > 0) {
            const placeholders = productIds.map(() => '?').join(',');
            const imagesSql = `
                SELECT product_id, url, alt_text, display_order, is_primary
                FROM product_images
                WHERE product_id IN (${placeholders})
                ORDER BY is_primary DESC, display_order ASC
            `;
            const allImages = await this.db.all(imagesSql, productIds);
            
            // Organizar imágenes por product_id
            imagesMap = {};
            allImages.forEach(img => {
                if (!imagesMap[img.product_id]) {
                    imagesMap[img.product_id] = [];
                }
                imagesMap[img.product_id].push({
                    id: img.id || null,
                    url: img.url,
                    alt_text: img.alt_text || '',
                    display_order: img.display_order || 0,
                    is_primary: img.is_primary || 0
                });
            });
        }
        
        // Parsear campos JSON y normalizar campos
        return products.map(product => {
            // Normalizar campos para compatibilidad con frontend
            product.price = product.base_price;
            product.stock = product.stock_quantity;
            
            // Agregar imágenes desde product_images
            if (imagesMap[product.id]) {
                product.images = imagesMap[product.id];
            } else {
                product.images = [];
            }
            
            if (product.attributes && typeof product.attributes === 'string') {
                try {
                    product.attributes = JSON.parse(product.attributes);
                } catch (e) {
                    product.attributes = null;
                }
            }
            
            if (product.price_variants && typeof product.price_variants === 'string') {
                try {
                    product.price_variants = JSON.parse(product.price_variants);
                } catch (e) {
                    product.price_variants = null;
                }
            }
            
            if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                try {
                    product.medicinal_info = JSON.parse(product.medicinal_info);
                } catch (e) {
                    product.medicinal_info = null;
                }
            }
            
            return product;
        });
    }
    
    async getMedicinalProducts(limit = 50) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE requires_prescription = 1 AND stock_quantity > 0
            ORDER BY featured DESC, name ASC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async getPublicProducts(limit = 100) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE requires_prescription = 0
            ORDER BY featured DESC, created_at DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async search(query) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE name LIKE ? OR description LIKE ?
            ORDER BY name ASC
        `;
        const searchTerm = `%${query}%`;
        return await this.db.all(sql, [searchTerm, searchTerm]);
    }
    
    async getFeatured(limit = 6) {
        try {
            const sql = `
                SELECT p.*, c.name as category, c.slug as category_slug
                FROM ${this.tableName} p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.featured = 1 AND p.stock_quantity > 0
                ORDER BY p.created_at DESC 
                LIMIT ?
            `;
            const products = await this.db.all(sql, [limit]);
            
            // Cargar todas las imágenes de una vez (igual que findAll)
            const productIds = products.map(p => p.id);
            let imagesMap = {};
            
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const imagesSql = `
                    SELECT product_id, url, alt_text, display_order, is_primary
                    FROM product_images
                    WHERE product_id IN (${placeholders})
                    ORDER BY is_primary DESC, display_order ASC
                `;
                const allImages = await this.db.all(imagesSql, productIds);
                
                // Organizar imágenes por product_id
                allImages.forEach(img => {
                    if (!imagesMap[img.product_id]) {
                        imagesMap[img.product_id] = [];
                    }
                    imagesMap[img.product_id].push({
                        id: img.id || null,
                        url: img.url,
                        alt_text: img.alt_text || '',
                        display_order: img.display_order || 0,
                        is_primary: img.is_primary || 0
                    });
                });
            }
            
            // Normalizar campos y agregar imágenes
            return products.map(product => {
                // Normalizar campos para compatibilidad con frontend
                product.price = product.base_price;
                product.stock = product.stock_quantity;
                
                // Agregar imágenes desde product_images
                product.images = imagesMap[product.id] || [];
                
                // Parsear JSON fields
                if (product.attributes && typeof product.attributes === 'string') {
                    try {
                        product.attributes = JSON.parse(product.attributes);
                    } catch (e) {
                        product.attributes = null;
                    }
                }
                
                if (product.price_variants && typeof product.price_variants === 'string') {
                    try {
                        product.price_variants = JSON.parse(product.price_variants);
                    } catch (e) {
                        product.price_variants = null;
                    }
                }
                
                if (product.medicinal_info && typeof product.medicinal_info === 'string') {
                    try {
                        product.medicinal_info = JSON.parse(product.medicinal_info);
                    } catch (e) {
                        product.medicinal_info = null;
                    }
                }
                
                return product;
            });
        } catch (error) {
            console.error('Error in Product.getFeatured:', error);
            throw error;
        }
    }
    
    async getCategories() {
        const sql = `
            SELECT DISTINCT category_id, c.name as category_name, c.slug as category_slug
            FROM ${this.tableName} p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.category_id IS NOT NULL
            ORDER BY c.name ASC
        `;
        const results = await this.db.all(sql);
        return results.map(row => row.category_name || 'Sin categoría');
    }
    
    async getAllAvailableCategories() {
        const sql = `
            SELECT name 
            FROM product_categories 
            WHERE status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        const results = await this.db.all(sql);
        // Devolver solo los nombres como strings para compatibilidad
        return results.map(row => row.name);
    }
    
    async getPublicCategories() {
        const sql = `
            SELECT DISTINCT category_id, c.name as category_name, c.slug as category_slug
            FROM ${this.tableName} p
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE p.category_id IS NOT NULL 
              AND p.requires_prescription = 0
            ORDER BY c.name ASC
        `;
        const results = await this.db.all(sql);
        return results.map(row => row.category_name || 'Sin categoría');
    }
    
    async getBestSellers(limit = 10) {
        const sql = `
            SELECT p.*, COALESCE(SUM(oi.quantity), 0) as total_sold
            FROM ${this.tableName} p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id
            ORDER BY total_sold DESC, p.created_at DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
    
    async updateStock(id, newStock) {
        const sql = `UPDATE ${this.tableName} SET stock_quantity = ?, updated_at = ? WHERE id = ?`;
        await this.db.run(sql, [newStock, new Date().toISOString(), id]);
        return await this.findById(id);
    }
    
    async decrementStock(id, quantity) {
        const product = await this.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const newStock = (product.stock_quantity || 0) - quantity;
        if (newStock < 0) {
            throw new Error('Stock insuficiente');
        }
        
        return await this.updateStock(id, newStock);
    }
    
    async incrementStock(id, quantity) {
        const product = await this.findById(id);
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        const newStock = (product.stock_quantity || 0) + quantity;
        return await this.updateStock(id, newStock);
    }
    
    async getLowStock(threshold = 10) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE stock_quantity <= ? AND stock_quantity > 0
            ORDER BY stock_quantity ASC
        `;
        return await this.db.all(sql, [threshold]);
    }
    
    async getOutOfStock() {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE stock_quantity = 0
            ORDER BY name ASC
        `;
        return await this.db.all(sql);
    }
    
    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN stock_quantity > 0 THEN 1 END) as in_stock,
                COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock,
                COUNT(CASE WHEN stock_quantity <= 10 AND stock_quantity > 0 THEN 1 END) as low_stock,
                COUNT(CASE WHEN featured = 1 THEN 1 END) as featured,
                COUNT(CASE WHEN requires_prescription = 1 THEN 1 END) as medicinal,
                SUM(stock_quantity * base_price) as total_value,
                AVG(base_price) as average_price,
                MIN(base_price) as min_price,
                MAX(base_price) as max_price
            FROM ${this.tableName}
        `;
        
        return await this.db.get(sql);
    }
    
    async getByCategory(category) {
        return await this.findAllWithFilters({ category_id: category });
    }
    
    async nameExists(name, excludeId = null) {
        let sql = `SELECT id FROM ${this.tableName} WHERE name = ?`;
        const params = [name];
        
        if (excludeId) {
            sql += ' AND id != ?';
            params.push(excludeId);
        }
        
        const result = await this.db.get(sql, params);
        return !!result;
    }
    
    async getRecent(limit = 10) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }
}

module.exports = Product;