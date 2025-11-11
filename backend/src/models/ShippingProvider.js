// backend/src/models/ShippingProvider.js
const BaseModel = require('./index');

class ShippingProvider extends BaseModel {
    constructor() {
        super('shipping_providers');
    }

    async findById(id) {
        const provider = await super.findById(id);
        if (!provider) return null;
        
        // Cargar relaciones
        provider.service_types = await this.getServiceTypes(id);
        provider.zones = await this.getZones(id);
        provider.credentials = await this.getCredentials(id);
        provider.pickup_points = await this.getPickupPoints(id);
        
        return provider;
    }

    async getServiceTypes(providerId) {
        const sql = `SELECT * FROM provider_service_types WHERE provider_id = ? AND is_active = 1 ORDER BY service_name`;
        return await this.db.all(sql, [providerId]);
    }

    async getZones(providerId) {
        const sql = `SELECT * FROM provider_zones WHERE provider_id = ? AND is_active = 1 ORDER BY zone_name`;
        return await this.db.all(sql, [providerId]);
    }

    async getCredentials(providerId) {
        const sql = `SELECT credential_type, credential_key FROM provider_credentials WHERE provider_id = ?`;
        const credentials = await this.db.all(sql, [providerId]);
        // No exponer valores por seguridad
        return credentials.map(c => ({ type: c.credential_type, key: c.credential_key }));
    }

    async getPickupPoints(providerId) {
        const sql = `SELECT * FROM provider_pickup_points WHERE provider_id = ? AND is_active = 1 ORDER BY point_name`;
        return await this.db.all(sql, [providerId]);
    }

    async create(data) {
        const providerData = {
            name: data.name,
            code: data.code || data.name.toLowerCase().replace(/\s+/g, '-'),
            provider_type: data.provider_type || 'external',
            description: data.description || null,
            website: data.website || null,
            phone: data.phone || null,
            email: data.email || null,
            is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
            supports_tracking: data.supports_tracking !== undefined ? (data.supports_tracking ? 1 : 0) : 1,
            supports_labels: data.supports_labels !== undefined ? (data.supports_labels ? 1 : 0) : 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const id = await super.create(providerData);
        
        // Crear service types si existen
        if (data.service_types && Array.isArray(data.service_types)) {
            for (const st of data.service_types) {
                await this.db.run(
                    `INSERT INTO provider_service_types 
                     (provider_id, service_code, service_name, description, estimated_days_min, estimated_days_max, is_active, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, st.service_code, st.service_name, st.description || null, 
                     st.estimated_days_min || null, st.estimated_days_max || null,
                     st.is_active !== undefined ? (st.is_active ? 1 : 0) : 1,
                     new Date().toISOString(), new Date().toISOString()]
                );
            }
        }
        
        return id;
    }

    async update(id, data) {
        const provider = await this.findById(id);
        if (!provider) {
            throw new Error('Proveedor no encontrado');
        }

        const updateData = {
            name: data.name || provider.name,
            code: data.code || provider.code,
            provider_type: data.provider_type || provider.provider_type,
            description: data.description !== undefined ? data.description : provider.description,
            website: data.website !== undefined ? data.website : provider.website,
            phone: data.phone !== undefined ? data.phone : provider.phone,
            email: data.email !== undefined ? data.email : provider.email,
            is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : provider.is_active,
            supports_tracking: data.supports_tracking !== undefined ? (data.supports_tracking ? 1 : 0) : provider.supports_tracking,
            supports_labels: data.supports_labels !== undefined ? (data.supports_labels ? 1 : 0) : provider.supports_labels,
            updated_at: new Date().toISOString()
        };

        await super.update(id, updateData);
        
        // Actualizar service types si se proporcionan
        if (data.service_types && Array.isArray(data.service_types)) {
            // Eliminar existentes y crear nuevos (simplificado)
            await this.db.run('DELETE FROM provider_service_types WHERE provider_id = ?', [id]);
            for (const st of data.service_types) {
                await this.db.run(
                    `INSERT INTO provider_service_types 
                     (provider_id, service_code, service_name, description, estimated_days_min, estimated_days_max, is_active, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [id, st.service_code, st.service_name, st.description || null,
                     st.estimated_days_min || null, st.estimated_days_max || null,
                     st.is_active !== undefined ? (st.is_active ? 1 : 0) : 1,
                     new Date().toISOString(), new Date().toISOString()]
                );
            }
        }
        
        return await this.findById(id);
    }

    async getActive() {
        const sql = `SELECT * FROM ${this.tableName} WHERE is_active = 1 ORDER BY name`;
        return await this.db.all(sql);
    }
}

module.exports = ShippingProvider;








