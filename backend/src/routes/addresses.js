// backend/src/routes/addresses.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../database/db').getInstance();

/**
 * GET /api/addresses
 * Obtener todas las direcciones del usuario autenticado
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const addresses = await db.all(
            `SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default_shipping DESC, created_at DESC`,
            [userId]
        );
        
        res.json({
            success: true,
            data: { addresses }
        });
    } catch (error) {
        console.error('❌ Error en GET /addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener direcciones',
            error: error.message
        });
    }
});

/**
 * GET /api/addresses/:id
 * Obtener una dirección específica
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        const address = await db.get(
            'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
            [addressId, userId]
        );
        
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: { address }
        });
    } catch (error) {
        console.error('❌ Error en GET /addresses/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dirección',
            error: error.message
        });
    }
});

/**
 * POST /api/addresses
 * Crear una nueva dirección
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            label,
            full_name,
            rut,
            line1,
            line2,
            commune,
            city,
            region,
            country = 'Chile',
            postal_code,
            phone,
            is_default_shipping = 0,
            is_default_billing = 0
        } = req.body;
        
        // Validaciones
        if (!full_name || !line1 || !commune || !city || !region || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: full_name, line1, commune, city, region, phone'
            });
        }
        
        // Si se marca como default, quitar otros defaults
        if (is_default_shipping) {
            await db.run(
                'UPDATE addresses SET is_default_shipping = 0 WHERE user_id = ?',
                [userId]
            );
        }
        
        if (is_default_billing) {
            await db.run(
                'UPDATE addresses SET is_default_billing = 0 WHERE user_id = ?',
                [userId]
            );
        }
        
        const result = await db.run(
            `INSERT INTO addresses (
                user_id, label, full_name, rut, line1, line2, commune, city, region, country,
                postal_code, phone, is_default_shipping, is_default_billing, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
                userId, label || null, full_name, rut || null, line1, line2 || null,
                commune, city, region, country, postal_code || null, phone,
                is_default_shipping ? 1 : 0, is_default_billing ? 1 : 0
            ]
        );
        
        const newAddress = await db.get(
            'SELECT * FROM addresses WHERE id = ?',
            [result.lastID]
        );
        
        res.status(201).json({
            success: true,
            message: 'Dirección creada correctamente',
            data: { address: newAddress }
        });
    } catch (error) {
        console.error('❌ Error en POST /addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear dirección',
            error: error.message
        });
    }
});

/**
 * PUT /api/addresses/:id
 * Actualizar una dirección
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        // Verificar que la dirección pertenece al usuario
        const existing = await db.get(
            'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
            [addressId, userId]
        );
        
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada'
            });
        }
        
        const {
            label,
            full_name,
            rut,
            line1,
            line2,
            commune,
            city,
            region,
            country,
            postal_code,
            phone,
            is_default_shipping,
            is_default_billing
        } = req.body;
        
        // Si se marca como default, quitar otros defaults
        if (is_default_shipping) {
            await db.run(
                'UPDATE addresses SET is_default_shipping = 0 WHERE user_id = ? AND id != ?',
                [userId, addressId]
            );
        }
        
        if (is_default_billing) {
            await db.run(
                'UPDATE addresses SET is_default_billing = 0 WHERE user_id = ? AND id != ?',
                [userId, addressId]
            );
        }
        
        const updateFields = [];
        const updateValues = [];
        
        if (label !== undefined) { updateFields.push('label = ?'); updateValues.push(label); }
        if (full_name !== undefined) { updateFields.push('full_name = ?'); updateValues.push(full_name); }
        if (rut !== undefined) { updateFields.push('rut = ?'); updateValues.push(rut); }
        if (line1 !== undefined) { updateFields.push('line1 = ?'); updateValues.push(line1); }
        if (line2 !== undefined) { updateFields.push('line2 = ?'); updateValues.push(line2); }
        if (commune !== undefined) { updateFields.push('commune = ?'); updateValues.push(commune); }
        if (city !== undefined) { updateFields.push('city = ?'); updateValues.push(city); }
        if (region !== undefined) { updateFields.push('region = ?'); updateValues.push(region); }
        if (country !== undefined) { updateFields.push('country = ?'); updateValues.push(country); }
        if (postal_code !== undefined) { updateFields.push('postal_code = ?'); updateValues.push(postal_code); }
        if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone); }
        if (is_default_shipping !== undefined) { updateFields.push('is_default_shipping = ?'); updateValues.push(is_default_shipping ? 1 : 0); }
        if (is_default_billing !== undefined) { updateFields.push('is_default_billing = ?'); updateValues.push(is_default_billing ? 1 : 0); }
        
        updateFields.push("updated_at = datetime('now')");
        updateValues.push(addressId);
        
        await db.run(
            `UPDATE addresses SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        const updatedAddress = await db.get(
            'SELECT * FROM addresses WHERE id = ?',
            [addressId]
        );
        
        res.json({
            success: true,
            message: 'Dirección actualizada correctamente',
            data: { address: updatedAddress }
        });
    } catch (error) {
        console.error('❌ Error en PUT /addresses/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar dirección',
            error: error.message
        });
    }
});

/**
 * DELETE /api/addresses/:id
 * Eliminar una dirección
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const userId = req.user.id;
        
        // Verificar que la dirección pertenece al usuario
        const existing = await db.get(
            'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
            [addressId, userId]
        );
        
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Dirección no encontrada'
            });
        }
        
        await db.run(
            'DELETE FROM addresses WHERE id = ?',
            [addressId]
        );
        
        res.json({
            success: true,
            message: 'Dirección eliminada correctamente'
        });
    } catch (error) {
        console.error('❌ Error en DELETE /addresses/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar dirección',
            error: error.message
        });
    }
});

module.exports = router;







