/**
 * Interfaz abstracta para adaptadores de base de datos
 * Permite cambiar fácilmente entre diferentes tipos de BD
 */
class DatabaseInterface {
    constructor() {
        if (this.constructor === DatabaseInterface) {
            throw new Error('DatabaseInterface es una clase abstracta y no puede ser instanciada directamente');
        }
    }
    
    /**
     * Conectar a la base de datos
     */
    async connect() {
        throw new Error('Método connect() debe ser implementado por la clase hija');
    }
    
    /**
     * Desconectar de la base de datos
     */
    async disconnect() {
        throw new Error('Método disconnect() debe ser implementado por la clase hija');
    }
    
    /**
     * Ejecutar query SQL
     * @param {string} sql - Query SQL
     * @param {Array} params - Parámetros para el query
     */
    async query(sql, params = []) {
        throw new Error('Método query() debe ser implementado por la clase hija');
    }
    
    /**
     * Ejecutar query y obtener una fila
     * @param {string} sql - Query SQL
     * @param {Array} params - Parámetros para el query
     */
    async get(sql, params = []) {
        throw new Error('Método get() debe ser implementado por la clase hija');
    }
    
    /**
     * Ejecutar query y obtener todas las filas
     * @param {string} sql - Query SQL
     * @param {Array} params - Parámetros para el query
     */
    async all(sql, params = []) {
        throw new Error('Método all() debe ser implementado por la clase hija');
    }
    
    /**
     * Ejecutar query y obtener el último ID insertado
     * @param {string} sql - Query SQL
     * @param {Array} params - Parámetros para el query
     */
    async run(sql, params = []) {
        throw new Error('Método run() debe ser implementado por la clase hija');
    }
    
    /**
     * Iniciar transacción
     */
    async beginTransaction() {
        throw new Error('Método beginTransaction() debe ser implementado por la clase hija');
    }
    
    /**
     * Confirmar transacción
     */
    async commit() {
        throw new Error('Método commit() debe ser implementado por la clase hija');
    }
    
    /**
     * Revertir transacción
     */
    async rollback() {
        throw new Error('Método rollback() debe ser implementado por la clase hija');
    }
    
    /**
     * Verificar si la conexión está activa
     */
    async isConnected() {
        throw new Error('Método isConnected() debe ser implementado por la clase hija');
    }
}

module.exports = DatabaseInterface;

