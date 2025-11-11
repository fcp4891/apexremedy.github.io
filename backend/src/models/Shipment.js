// backend/src/models/Shipment.js
const BaseModel = require('./index');

class Shipment extends BaseModel {
    constructor() {
        super('shipments');
    }

    async findById(id) {
        const sql = `
            SELECT s.*, 
                   o.order_number,
                   o.status as order_status,
                   sp.name as provider_name,
                   sp.code as provider_code
            FROM ${this.tableName} s
            LEFT JOIN orders o ON s.order_id = o.id
            LEFT JOIN shipping_providers sp ON s.provider_id = sp.id
            WHERE s.id = ?
        `;
        const shipment = await this.db.get(sql, [id]);
        if (!shipment) return null;
        
        // Cargar items
        shipment.items = await this.getItems(id);
        shipment.events = await this.getEvents(id);
        
        return shipment;
    }

    async findAll() {
        const sql = `
            SELECT s.*, 
                   o.order_number,
                   o.status as order_status,
                   sp.name as provider_name,
                   sp.code as provider_code
            FROM ${this.tableName} s
            LEFT JOIN orders o ON s.order_id = o.id
            LEFT JOIN shipping_providers sp ON s.provider_id = sp.id
            ORDER BY s.created_at DESC
        `;
        const shipments = await this.db.all(sql);
        
        // Cargar items para todos los shipments
        for (const shipment of shipments) {
            shipment.items = await this.getItems(shipment.id);
        }
        
        return shipments;
    }

    async getItems(shipmentId) {
        const sql = `
            SELECT si.*, 
                   oi.product_name,
                   oi.variant_name,
                   p.name as product_name_full,
                   p.sku as product_sku
            FROM shipment_items si
            LEFT JOIN order_items oi ON si.order_item_id = oi.id
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.shipment_id = ?
        `;
        return await this.db.all(sql, [shipmentId]);
    }

    async getEvents(shipmentId) {
        const sql = `
            SELECT * FROM shipment_events 
            WHERE shipment_id = ? 
            ORDER BY event_at DESC
        `;
        return await this.db.all(sql, [shipmentId]);
    }

    async create(data) {
        const shipmentData = {
            order_id: data.order_id,
            provider_id: data.provider_id || null,
            tracking_number: data.tracking_number || null,
            carrier: data.carrier || null,
            service_code: data.service_code || null,
            weight: data.weight || null,
            status: data.status || 'pending',
            label_url: data.label_url || null,
            shipping_cost: data.shipping_cost || 0,
            insurance_amount: data.insurance_amount || 0,
            packaging_type: data.packaging_type || null,
            dispatch_center_id: data.dispatch_center_id || null,
            driver_id: data.driver_id || null,
            shipped_at: data.shipped_at || null,
            estimated_delivery: data.estimated_delivery || null,
            delivered_at: data.delivered_at || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const id = await super.create(shipmentData);
        
        // Crear items si existen
        if (data.items && Array.isArray(data.items)) {
            for (const item of data.items) {
                await this.db.run(
                    `INSERT INTO shipment_items 
                     (shipment_id, order_item_id, product_id, quantity, weight_kg, created_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [id, item.order_item_id, item.product_id, item.quantity, 
                     item.weight_kg || null, new Date().toISOString()]
                );
            }
        }
        
        // Crear evento inicial
        await this.db.run(
            `INSERT INTO shipment_events 
             (shipment_id, status, location, description, event_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, data.status || 'pending', null, 'Envío creado', 
             new Date().toISOString(), new Date().toISOString()]
        );
        
        return id;
    }

    async updateStatus(id, status, location = null, description = null) {
        await super.update(id, {
            status,
            updated_at: new Date().toISOString()
        });
        
        // Agregar evento
        await this.db.run(
            `INSERT INTO shipment_events 
             (shipment_id, status, location, description, event_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, status, location, description || `Estado actualizado a: ${status}`,
             new Date().toISOString(), new Date().toISOString()]
        );
        
        // Actualizar fechas según estado
        if (status === 'shipped' && !(await this.db.get('SELECT shipped_at FROM shipments WHERE id = ?', [id])).shipped_at) {
            await this.db.run('UPDATE shipments SET shipped_at = ? WHERE id = ?', [new Date().toISOString(), id]);
        }
        if (status === 'delivered' && !(await this.db.get('SELECT delivered_at FROM shipments WHERE id = ?', [id])).delivered_at) {
            await this.db.run('UPDATE shipments SET delivered_at = ? WHERE id = ?', [new Date().toISOString(), id]);
        }
        
        return await this.findById(id);
    }

    async getByOrder(orderId) {
        const sql = `
            SELECT * FROM ${this.tableName} 
            WHERE order_id = ? 
            ORDER BY created_at DESC
        `;
        return await this.db.all(sql, [orderId]);
    }

    async getByTracking(trackingNumber) {
        const sql = `SELECT * FROM ${this.tableName} WHERE tracking_number = ?`;
        return await this.db.get(sql, [trackingNumber]);
    }
}

module.exports = Shipment;








