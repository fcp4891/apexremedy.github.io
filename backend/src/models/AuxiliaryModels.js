// backend/src/models/Brand.js
// Modelo para marcas/breeders

const BaseModel = require('./index');

class Brand extends BaseModel {
    constructor() {
        super('brands');
    }

    async create(data) {
        const brandData = {
            name: data.name,
            slug: data.slug || this._generateSlug(data.name),
            description: data.description || null,
            logo_url: data.logo_url || null,
            website: data.website || null,
            country: data.country || null,
            status: data.status || 'active',
            created_at: new Date().toISOString()
        };

        const fields = Object.keys(brandData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(brandData);

        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await this.db.run(sql, values);

        return await this.findById(result.lastID);
    }

    async findBySlug(slug) {
        const sql = `SELECT * FROM ${this.tableName} WHERE slug = ? AND status = 'active'`;
        return await this.db.get(sql, [slug]);
    }

    async findAllActive() {
        const sql = `
            SELECT b.*,
                   (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND status = 'active') as product_count
            FROM ${this.tableName} b
            WHERE b.status = 'active'
            ORDER BY b.name ASC
        `;
        return await this.db.all(sql);
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

// ============================================
// backend/src/models/Supplier.js
// Modelo para proveedores
// ============================================

class Supplier extends BaseModel {
    constructor() {
        super('suppliers');
    }

    async create(data) {
        const supplierData = {
            name: data.name,
            contact_name: data.contact_name || null,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            country: data.country || 'Chile',
            notes: data.notes || null,
            status: data.status || 'active',
            created_at: new Date().toISOString()
        };

        const fields = Object.keys(supplierData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(supplierData);

        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await this.db.run(sql, values);

        return await this.findById(result.lastID);
    }

    async findAllActive() {
        const sql = `
            SELECT s.*,
                   (SELECT COUNT(*) FROM products WHERE supplier_id = s.id AND status = 'active') as product_count
            FROM ${this.tableName} s
            WHERE s.status = 'active'
            ORDER BY s.name ASC
        `;
        return await this.db.all(sql);
    }

    async update(id, data) {
        const updateFields = [];
        const values = [];

        const allowedFields = [
            'name', 'contact_name', 'email', 'phone', 
            'address', 'city', 'country', 'notes', 'status'
        ];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error('No hay campos para actualizar');
        }

        values.push(id);
        const sql = `UPDATE ${this.tableName} SET ${updateFields.join(', ')} WHERE id = ?`;
        await this.db.run(sql, values);

        return await this.findById(id);
    }
}

// ============================================
// backend/src/models/ProductTag.js
// Modelo para tags de productos
// ============================================

class ProductTag extends BaseModel {
    constructor() {
        super('product_tags');
    }

    async create(data) {
        const tagData = {
            name: data.name,
            slug: data.slug || this._generateSlug(data.name),
            type: data.type || 'general',
            created_at: new Date().toISOString()
        };

        const fields = Object.keys(tagData);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(tagData);

        const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await this.db.run(sql, values);

        return await this.findById(result.lastID);
    }

    async findByType(type) {
        const sql = `SELECT * FROM ${this.tableName} WHERE type = ? ORDER BY name ASC`;
        return await this.db.all(sql, [type]);
    }

    async findBySlug(slug) {
        const sql = `SELECT * FROM ${this.tableName} WHERE slug = ?`;
        return await this.db.get(sql, [slug]);
    }

    async findAllGrouped() {
        const sql = `
            SELECT 
                type,
                GROUP_CONCAT(
                    json_object(
                        'id', id,
                        'name', name,
                        'slug', slug
                    )
                ) as tags
            FROM ${this.tableName}
            GROUP BY type
            ORDER BY type ASC
        `;
        
        const results = await this.db.all(sql);
        
        // Parsear JSON
        return results.map(row => ({
            type: row.type,
            tags: JSON.parse('[' + row.tags + ']')
        }));
    }

    /**
     * Obtener tags con conteo de productos
     */
    async findWithProductCount() {
        const sql = `
            SELECT 
                pt.*,
                COUNT(pta.product_id) as product_count
            FROM ${this.tableName} pt
            LEFT JOIN product_tag_assignments pta ON pt.id = pta.tag_id
            GROUP BY pt.id
            ORDER BY pt.type ASC, pt.name ASC
        `;
        return await this.db.all(sql);
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

module.exports = {
    Brand,
    Supplier,
    ProductTag
};
