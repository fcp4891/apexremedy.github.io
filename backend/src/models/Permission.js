// backend/src/models/Permission.js
const Database = require('../database/db');

class Permission {
    constructor() {
        this.db = Database.getInstance();
    }

    /**
     * Crear nuevo permiso
     */
    async create(permissionData) {
        const { code, description, module } = permissionData;
        const now = new Date().toISOString();

        const query = `
            INSERT INTO permissions (code, description, module, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await this.db.run(query, [
            code,
            description || null,
            module || null,
            now,
            now
        ]);

        return result.lastID;
    }

    /**
     * Buscar permiso por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM permissions WHERE id = ?';
        const permission = await this.db.get(query, [id]);
        return permission;
    }

    /**
     * Buscar permiso por código
     */
    async findByCode(code) {
        const query = 'SELECT * FROM permissions WHERE code = ?';
        const permission = await this.db.get(query, [code]);
        return permission;
    }

    /**
     * Buscar todos los permisos
     */
    async findAll() {
        const query = 'SELECT * FROM permissions ORDER BY module, code';
        const permissions = await this.db.all(query);
        return permissions;
    }

    /**
     * Buscar permisos por módulo
     */
    async findByModule(module) {
        const query = 'SELECT * FROM permissions WHERE module = ? ORDER BY code';
        const permissions = await this.db.all(query, [module]);
        return permissions;
    }

    /**
     * Actualizar permiso
     */
    async update(id, permissionData) {
        const { description, module } = permissionData;
        const now = new Date().toISOString();

        const query = `
            UPDATE permissions 
            SET description = ?, module = ?, updated_at = ?
            WHERE id = ?
        `;

        await this.db.run(query, [description || null, module || null, now, id]);
        return await this.findById(id);
    }

    /**
     * Eliminar permiso
     */
    async delete(id) {
        const query = 'DELETE FROM permissions WHERE id = ?';
        return await this.db.run(query, [id]);
    }

    /**
     * Obtener roles que tienen este permiso
     */
    async getRoles(permissionId) {
        const query = `
            SELECT r.* 
            FROM roles r
            INNER JOIN role_permissions rp ON r.id = rp.role_id
            WHERE rp.permission_id = ?
        `;
        const roles = await this.db.all(query, [permissionId]);
        return roles;
    }

    /**
     * Obtener módulos únicos
     */
    async getModules() {
        const query = 'SELECT DISTINCT module FROM permissions WHERE module IS NOT NULL ORDER BY module';
        const result = await this.db.all(query);
        return result.map(r => r.module);
    }
}

module.exports = Permission;









