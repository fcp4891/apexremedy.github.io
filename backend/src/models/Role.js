// backend/src/models/Role.js
const Database = require('../database/db');

class Role {
    constructor() {
        this.db = Database.getInstance();
    }

    /**
     * Crear nuevo rol
     */
    async create(roleData) {
        const { code, name, description } = roleData;
        const now = new Date().toISOString();

        const query = `
            INSERT INTO roles (code, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await this.db.run(query, [
            code,
            name,
            description || null,
            now,
            now
        ]);

        return result.lastID;
    }

    /**
     * Buscar rol por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM roles WHERE id = ?';
        const role = await this.db.get(query, [id]);
        return role;
    }

    /**
     * Buscar rol por código
     */
    async findByCode(code) {
        const query = 'SELECT * FROM roles WHERE code = ?';
        const role = await this.db.get(query, [code]);
        return role;
    }

    /**
     * Buscar todos los roles
     */
    async findAll() {
        const query = 'SELECT * FROM roles ORDER BY id';
        const roles = await this.db.all(query);
        return roles;
    }

    /**
     * Actualizar rol
     */
    async update(id, roleData) {
        const { name, description } = roleData;
        const now = new Date().toISOString();

        const query = `
            UPDATE roles 
            SET name = ?, description = ?, updated_at = ?
            WHERE id = ?
        `;

        await this.db.run(query, [name, description || null, now, id]);
        return await this.findById(id);
    }

    /**
     * Eliminar rol
     */
    async delete(id) {
        const query = 'DELETE FROM roles WHERE id = ?';
        return await this.db.run(query, [id]);
    }

    /**
     * Obtener permisos del rol
     */
    async getPermissions(roleId) {
        const query = `
            SELECT p.* 
            FROM permissions p
            INNER JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = ?
        `;
        const permissions = await this.db.all(query, [roleId]);
        return permissions;
    }

    /**
     * Asignar permiso a rol
     */
    async assignPermission(roleId, permissionId) {
        const query = `
            INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
        `;
        return await this.db.run(query, [roleId, permissionId]);
    }

    /**
     * Remover permiso de rol
     */
    async removePermission(roleId, permissionId) {
        const query = `
            DELETE FROM role_permissions 
            WHERE role_id = ? AND permission_id = ?
        `;
        return await this.db.run(query, [roleId, permissionId]);
    }

    /**
     * Obtener usuarios con este rol
     */
    async getUsers(roleId) {
        const query = `
            SELECT u.*, ur.assigned_at, ur.assigned_by
            FROM users u
            INNER JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.role_id = ?
        `;
        const users = await this.db.all(query, [roleId]);
        return users;
    }
}

module.exports = Role;









