// ============================================
// MODELO: GiftCard
// ============================================

const BaseModel = require('./index');
const crypto = require('crypto');

class GiftCard extends BaseModel {
    constructor() {
        super('gift_cards');
    }
    
    async count(filters = {}) {
        try {
            const tableCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const colNames = tableCols.map(c => c.name);
            const hasIssuedToCustomerId = colNames.includes('issued_to_customer_id');
            const hasCampaignId = colNames.includes('campaign_id');
            const hasState = colNames.includes('state');
            const hasStatus = colNames.includes('status');
            
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            
            if (filters.state && hasState) {
                sql += ' AND state = ?';
                params.push(filters.state);
            } else if (filters.status && hasStatus) {
                sql += ' AND status = ?';
                params.push(filters.status);
            } else if (filters.state && hasStatus) {
                sql += ' AND status = ?';
                params.push(filters.state);
            }
            
            if (filters.customer_id && hasIssuedToCustomerId) {
                sql += ' AND issued_to_customer_id = ?';
                params.push(filters.customer_id);
            }
            
            if (filters.campaign_id && hasCampaignId) {
                sql += ' AND campaign_id = ?';
                params.push(filters.campaign_id);
            }
            
            const result = await this.db.get(sql, params);
            return result?.total || 0;
        } catch (error) {
            console.error(`Error en count para ${this.tableName}:`, error);
            return 0;
        }
    }

    /**
     * Generar código único
     */
    generateCode(length = 16) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Generar PIN hash
     */
    generatePinHash(pin) {
        return crypto.createHash('sha256').update(pin).digest('hex');
    }

    /**
     * Buscar gift cards con información relacionada
     */
    async findAllWithDetails(filters = {}) {
        try {
            // Verificar si la tabla existe
            const tableExists = await this.db.get(
                `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
                [this.tableName]
            );
            
            if (!tableExists) {
                console.warn(`⚠️ Tabla ${this.tableName} no existe. Retornando array vacío.`);
                return [];
            }

            // Verificar qué columnas existen
            const giftCardCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
            const colNames = giftCardCols.map(c => c.name);
            const hasIssuedToCustomerId = colNames.includes('issued_to_customer_id');
            const hasCampaignId = colNames.includes('campaign_id');

            let sql = `SELECT gc.*`;
            
            if (hasIssuedToCustomerId) {
                sql += `, u.name as customer_name, u.email as customer_email`;
            } else {
                sql += `, NULL as customer_name, NULL as customer_email`;
            }
            
            if (hasCampaignId) {
                sql += `, gcc.name as campaign_name`;
            } else {
                sql += `, NULL as campaign_name`;
            }
            
            sql += ` FROM ${this.tableName} gc`;
            
            if (hasIssuedToCustomerId) {
                sql += ` LEFT JOIN users u ON gc.issued_to_customer_id = u.id`;
            }
            
            if (hasCampaignId) {
                sql += ` LEFT JOIN gift_card_campaigns gcc ON gc.campaign_id = gcc.id`;
            }
            
            sql += ` WHERE 1=1`;
            const params = [];

            // Verificar si la columna es 'state' o 'status'
            const hasState = colNames.includes('state');
            const hasStatus = colNames.includes('status');
            
            if (filters.state && hasState) {
                sql += ' AND gc.state = ?';
                params.push(filters.state);
            } else if (filters.status && hasStatus) {
                sql += ' AND gc.status = ?';
                params.push(filters.status);
            } else if (filters.state && hasStatus) {
                // Si se busca por state pero la columna es status
                sql += ' AND gc.status = ?';
                params.push(filters.state);
            }

            if (filters.customer_id && hasIssuedToCustomerId) {
                sql += ' AND gc.issued_to_customer_id = ?';
                params.push(filters.customer_id);
            }

            if (filters.campaign_id && hasCampaignId) {
                sql += ' AND gc.campaign_id = ?';
                params.push(filters.campaign_id);
            }

            sql += ' ORDER BY gc.created_at DESC';

            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }
            
            if (filters.offset !== undefined && filters.offset !== null) {
                sql += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }

            return await this.db.all(sql, params);
        } catch (error) {
            console.error(`Error en findAllWithDetails para ${this.tableName}:`, error);
            // Si hay error de tabla o columna no existe, retornar array vacío
            if (error.message && (error.message.includes('no such table') || error.message.includes('no such column'))) {
                return [];
            }
            throw error;
        }
    }

    /**
     * Crear gift card con código único
     */
    async createWithCode(data) {
        let code;
        let exists = true;
        
        // Generar código único
        while (exists) {
            code = this.generateCode();
            const existing = await this.db.get(
                `SELECT id FROM ${this.tableName} WHERE code = ?`,
                [code]
            );
            exists = !!existing;
        }

        // Validar expiración
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            throw new Error('No se puede crear una gift card con fecha de expiración pasada');
        }

        // Generar PIN si no se proporciona
        let pinHash = null;
        if (data.generate_pin) {
            const pin = Math.floor(1000 + Math.random() * 9000).toString();
            pinHash = this.generatePinHash(pin);
            data.pin = pin; // Guardar temporalmente para retornar
        } else if (data.pin) {
            pinHash = this.generatePinHash(data.pin);
        }

        const id = await this.create({
            ...data,
            code,
            pin_hash: pinHash,
            balance: data.balance !== undefined ? data.balance : (data.initial_value || 0)
        });

        const result = await this.findById(id);
        return {
            ...result,
            pin: data.pin || (data.generate_pin ? pin : undefined)
        };
    }

    /**
     * Crear múltiples gift cards (batch)
     */
    async createBatch(count, data) {
        const results = [];
        for (let i = 0; i < count; i++) {
            const result = await this.createWithCode(data);
            results.push(result);
        }
        return results;
    }

    /**
     * Buscar gift card por código
     */
    async findByCode(code) {
        const sql = `SELECT * FROM ${this.tableName} WHERE code = ? LIMIT 1`;
        return await this.db.get(sql, [code]);
    }

    /**
     * Activar gift card
     */
    async activate(id) {
        const card = await this.findById(id);
        if (!card) {
            throw new Error('Gift card no encontrada');
        }
        
        // Verificar qué columna existe (state o status)
        const tableCols = await this.db.all(`PRAGMA table_info(${this.tableName})`);
        const colNames = tableCols.map(c => c.name);
        const hasState = colNames.includes('state');
        const hasStatus = colNames.includes('status');
        
        const currentState = hasState ? card.state : (hasStatus ? card.status : null);
        
        if (currentState === 'active') {
            throw new Error('Gift card ya está activa');
        }
        
        if (hasStatus) {
            return await this.update(id, { status: 'active' });
        } else if (hasState) {
            return await this.update(id, { state: 'active' });
        } else {
            throw new Error('No se puede determinar el estado de la gift card');
        }
    }

    /**
     * Desactivar gift card
     */
    async disable(id) {
        const card = await this.findById(id);
        if (!card) {
            throw new Error('Gift card no encontrada');
        }

        return await this.update(id, {
            state: 'disabled'
        });
    }

    /**
     * Recargar gift card (top-up)
     */
    async topUp(id, amount) {
        const card = await this.findById(id);
        if (!card) {
            throw new Error('Gift card no encontrada');
        }

        if (card.state !== 'active') {
            throw new Error('Solo se pueden recargar gift cards activas');
        }

        const newBalance = card.balance + amount;

        // Actualizar balance
        await this.update(id, {
            balance: newBalance
        });

        // Crear transacción de top-up
        const GiftCardTransaction = require('./GiftCardTransaction');
        await GiftCardTransaction.create({
            gift_card_id: id,
            type: 'topup',
            amount: amount,
            balance_before: card.balance,
            balance_after: newBalance,
            source: 'ui'
        });

        return await this.findById(id);
    }

    /**
     * Ajustar saldo (vía transacción)
     */
    async adjustBalance(id, amount, notes = '') {
        const card = await this.findById(id);
        if (!card) {
            throw new Error('Gift card no encontrada');
        }

        const newBalance = card.balance + amount;

        if (newBalance < 0) {
            throw new Error('El saldo no puede ser negativo');
        }

        await this.update(id, {
            balance: newBalance
        });

        // Crear transacción
        const GiftCardTransaction = require('./GiftCardTransaction');
        await GiftCardTransaction.create({
            gift_card_id: id,
            type: amount > 0 ? 'topup' : 'adjustment',
            amount: Math.abs(amount),
            balance_before: card.balance,
            balance_after: newBalance,
            source: 'ui',
            notes
        });

        return await this.findById(id);
    }
}

// Exportar la clase para que pueda ser instanciada cuando sea necesario
module.exports = GiftCard;

