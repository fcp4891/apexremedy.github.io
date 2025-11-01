const dbHelper = require('../database/db');

class ProductImage {
    async create(imageData) {
        const sql = `
            INSERT INTO product_images (
                product_id, url, alt_text, display_order, is_primary, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const result = await dbHelper.run(sql, [
            imageData.product_id,
            imageData.url,
            imageData.alt_text || '',
            imageData.display_order || 0,
            imageData.is_primary || 0,
            new Date().toISOString()
        ]);
        
        return result.lastID;
    }
    
    async findByProductId(productId) {
        const sql = `
            SELECT * FROM product_images 
            WHERE product_id = ?
            ORDER BY is_primary DESC, display_order ASC
        `;
        
        return await dbHelper.all(sql, [productId]);
    }
    
    async deleteByProductId(productId) {
        const sql = 'DELETE FROM product_images WHERE product_id = ?';
        return await dbHelper.run(sql, [productId]);
    }
}

module.exports = ProductImage;