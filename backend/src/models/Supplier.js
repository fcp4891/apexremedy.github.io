const BaseModel = require('./index');

class Supplier extends BaseModel {
    constructor() {
        super('suppliers');
    }

    async findAllWithStats() {
        const sql = `
            SELECT s.*,
                   (SELECT COUNT(*) FROM products WHERE supplier_id = s.id AND status = 'active') as product_count,
                   (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.id) as total_orders,
                   (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id) as total_purchases,
                   (SELECT AVG(JULIANDAY(actual_delivery_date) - JULIANDAY(order_date)) 
                    FROM purchase_orders 
                    WHERE supplier_id = s.id AND actual_delivery_date IS NOT NULL) as avg_delivery_days
            FROM ${this.tableName} s
            ORDER BY s.name ASC
        `;
        return await this.db.all(sql);
    }

    async findByIdWithStats(id) {
        const sql = `
            SELECT s.*,
                   (SELECT COUNT(*) FROM products WHERE supplier_id = s.id) as product_count,
                   (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.id) as total_orders,
                   (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id) as total_purchases
            FROM ${this.tableName} s
            WHERE s.id = ?
        `;
        return await this.db.get(sql, [id]);
    }

    async findAllActive() {
        const sql = `
            SELECT * FROM ${this.tableName}
            WHERE status = 'active'
            ORDER BY name ASC
        `;
        return await this.db.all(sql);
    }

    async getTopSuppliers(limit = 5) {
        const sql = `
            SELECT s.*,
                   (SELECT COUNT(*) FROM purchase_orders WHERE supplier_id = s.id) as order_count,
                   (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id) as total_purchases
            FROM ${this.tableName} s
            ORDER BY order_count DESC
            LIMIT ?
        `;
        return await this.db.all(sql, [limit]);
    }

    async getByCountry() {
        const sql = `
            SELECT country, COUNT(*) as supplier_count
            FROM ${this.tableName}
            WHERE status = 'active'
            GROUP BY country
            ORDER BY supplier_count DESC
        `;
        return await this.db.all(sql);
    }

    async getProductsBySupplier() {
        // Primero obtener proveedores con cantidad de productos
        const suppliersSql = `
            SELECT s.id, s.name, s.code, COUNT(p.id) as product_count
            FROM ${this.tableName} s
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'active'
            WHERE s.status = 'active'
            GROUP BY s.id, s.name, s.code
            ORDER BY product_count DESC
        `;
        const suppliers = await this.db.all(suppliersSql);
        
        // Para cada proveedor, obtener la lista de productos
        const result = await Promise.all(suppliers.map(async (supplier) => {
            const productsSql = `
                SELECT p.id, p.name, p.base_price, p.stock_quantity, 
                       c.name as category_name, c.slug as category_slug
                FROM products p
                LEFT JOIN product_categories c ON p.category_id = c.id
                WHERE p.supplier_id = ? AND p.status = 'active'
                ORDER BY p.name ASC
            `;
            const products = await this.db.all(productsSql, [supplier.id]);
            
            return {
                id: supplier.id,
                name: supplier.name,
                code: supplier.code,
                product_count: supplier.product_count,
                products: products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.base_price,
                    stock: p.stock_quantity,
                    category: p.category_name,
                    category_slug: p.category_slug
                }))
            };
        }));
        
        return result;
    }

    async getProductsByCategory() {
        // Obtener categorías agrupadas por proveedor
        const sql = `
            SELECT 
                s.id as supplier_id,
                s.name as supplier_name,
                s.code as supplier_code,
                c.id as category_id,
                c.name as category_name,
                c.slug as category_slug,
                COUNT(p.id) as product_count
            FROM ${this.tableName} s
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'active'
            LEFT JOIN product_categories c ON p.category_id = c.id
            WHERE s.status = 'active' AND c.id IS NOT NULL
            GROUP BY s.id, s.name, s.code, c.id, c.name, c.slug
            ORDER BY s.name, product_count DESC
        `;
        const rows = await this.db.all(sql);
        
        // Agrupar por proveedor
        const bySupplier = {};
        rows.forEach(row => {
            const key = row.supplier_id;
            if (!bySupplier[key]) {
                bySupplier[key] = {
                    supplier_id: row.supplier_id,
                    supplier_name: row.supplier_name,
                    supplier_code: row.supplier_code,
                    categories: []
                };
            }
            bySupplier[key].categories.push({
                id: row.category_id,
                name: row.category_name,
                slug: row.category_slug,
                product_count: row.product_count
            });
        });
        
        return Object.values(bySupplier);
    }

    async getPriceRanges() {
        // Obtener rangos de precios por proveedor
        const sql = `
            SELECT 
                s.id as supplier_id,
                s.name as supplier_name,
                s.code as supplier_code,
                MIN(p.base_price) as min_price,
                MAX(p.base_price) as max_price,
                AVG(p.base_price) as avg_price,
                COUNT(p.id) as product_count
            FROM ${this.tableName} s
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'active'
            WHERE s.status = 'active'
            GROUP BY s.id, s.name, s.code
            HAVING COUNT(p.id) > 0
            ORDER BY s.name
        `;
        return await this.db.all(sql);
    }

    async getLowStockProducts(threshold = 10) {
        const sql = `
            SELECT p.name, p.stock_quantity, s.name as supplier_name, s.code as supplier_code
            FROM products p
            LEFT JOIN ${this.tableName} s ON p.supplier_id = s.id
            WHERE p.stock_quantity <= ? AND p.status = 'active'
            ORDER BY p.stock_quantity ASC
            LIMIT 10
        `;
        return await this.db.all(sql, [threshold]);
    }

    async getSupplierDependencyAnalysis() {
        const sql = `
            SELECT 
                s.name,
                s.code,
                COUNT(p.id) as product_count,
                ROUND((COUNT(p.id) * 100.0 / (SELECT COUNT(*) FROM products WHERE status = 'active')), 2) as percentage
            FROM ${this.tableName} s
            LEFT JOIN products p ON s.id = p.supplier_id AND p.status = 'active'
            WHERE s.status = 'active'
            GROUP BY s.id, s.name, s.code
            ORDER BY product_count DESC
        `;
        return await this.db.all(sql);
    }
}

module.exports = Supplier;

