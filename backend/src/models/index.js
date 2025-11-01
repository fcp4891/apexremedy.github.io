// ============================================
// MODELO BASE: BaseModel
// ============================================

const Database = require('../../src/database/db');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = Database.getInstance();
    }

    /**
     * Crear un nuevo registro
     */
    async create(data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const result = await this.db.run(sql, values);
        return result.lastID;
    }

    /**
     * Buscar todos los registros
     */
    async findAll() {
        const sql = `SELECT * FROM ${this.tableName}`;
        return await this.db.all(sql);
    }

    /**
     * Buscar registro por ID
     */
    async findById(id) {
        const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
        return await this.db.get(sql, [id]);
    }

    /**
     * Actualizar registro
     */
    async update(id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
        await this.db.run(sql, [...values, id]);
        
        return await this.findById(id);
    }

    /**
     * Eliminar registro
     */
    async delete(id) {
        const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
        return await this.db.run(sql, [id]);
    }

    /**
     * Contar registros
     */
    async count() {
        const sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
        const result = await this.db.get(sql);
        return result.count;
    }
}

module.exports = BaseModel;
