// backend/src/models/ProductCategory.js
// Modelo para categorías de productos

const BaseModel = require('./index');

class ProductCategory extends BaseModel {
    constructor() {
        super('product_categories');
    }

    /**
     * Crear categoría
     */
    async create(data) {
        const categoryData = {
            name: data.name,
            slug: data.slug || this._generateSlug(data.name),
            parent_id: data.parent_id || null,
            description: data.description || null,
            icon: data.icon || null,
            display_order: data.display_order || 0,
            is_medicinal: data.is_medicinal ? 1 : 0,
            requires_auth: data.requires_auth ? 1 : 0,
            meta_title: data.meta_title || data.name,
            meta_description: data.meta_description || null,
            status: data.status || 'active',
            created_at: new Date().toISOString()
        };

        const fields = Object.keys(categoryData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(categoryData);

        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await this.db.run(sql, values);

        return await this.findById(result.lastID);
    }

    /**
     * Obtener categorías con jerarquía
     */
    async findAllWithHierarchy() {
        const sql = `
            SELECT 
                c.*,
                parent.name as parent_name,
                (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status = 'active') as product_count
            FROM ${this.tableName} c
            LEFT JOIN ${this.tableName} parent ON c.parent_id = parent.id
            WHERE c.status = 'active'
            ORDER BY c.parent_id ASC, c.display_order ASC, c.name ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Obtener solo categorías principales (sin parent_id)
     */
    async findMainCategories() {
        const sql = `
            SELECT *,
                   (SELECT COUNT(*) FROM products WHERE category_id = ${this.tableName}.id AND status = 'active') as product_count
            FROM ${this.tableName}
            WHERE parent_id IS NULL AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Obtener subcategorías de una categoría
     */
    async findSubcategories(parentId) {
        const sql = `
            SELECT *,
                   (SELECT COUNT(*) FROM products WHERE category_id = ${this.tableName}.id AND status = 'active') as product_count
            FROM ${this.tableName}
            WHERE parent_id = ? AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        
        return await this.db.all(sql, [parentId]);
    }

    /**
     * Obtener categorías públicas (no medicinales)
     */
    async findPublicCategories() {
        const sql = `
            SELECT *,
                   (SELECT COUNT(*) FROM products WHERE category_id = ${this.tableName}.id AND status = 'active' AND is_medicinal = 0) as product_count
            FROM ${this.tableName}
            WHERE is_medicinal = 0 AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Obtener categorías medicinales
     */
    async findMedicinalCategories() {
        const sql = `
            SELECT *,
                   (SELECT COUNT(*) FROM products WHERE category_id = ${this.tableName}.id AND status = 'active' AND is_medicinal = 1) as product_count
            FROM ${this.tableName}
            WHERE is_medicinal = 1 AND status = 'active'
            ORDER BY display_order ASC, name ASC
        `;
        
        return await this.db.all(sql);
    }

    /**
     * Buscar categoría por slug
     */
    async findBySlug(slug) {
        const sql = `SELECT * FROM ${this.tableName} WHERE slug = ?`;
        return await this.db.get(sql, [slug]);
    }

    _generateSlug(name) {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}

module.exports = ProductCategory;
