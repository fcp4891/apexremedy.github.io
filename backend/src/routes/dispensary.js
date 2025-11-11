// backend/src/routes/dispensary.js
// Rutas para gestionar datos del dispensario

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const db = require('../database/db').getInstance();

// GET /api/dispensary
// Obtener datos del dispensario (público para el formulario de poder de cultivo)
router.get('/', async (req, res) => {
    try {
        // Permitir acceso público para el formulario de poder de cultivo
        // pero solo devolver datos básicos (sin información sensible)

        const dispensary = await db.get(
            'SELECT * FROM dispensary_data LIMIT 1'
        );

        if (dispensary) {
            res.json({
                success: true,
                data: dispensary
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'No hay datos del dispensario configurados'
            });
        }
    } catch (error) {
        console.error('Error obteniendo datos del dispensario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del dispensario',
            error: error.message
        });
    }
});

// POST /api/dispensary
// Guardar o actualizar datos del dispensario
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, rut, address, email, signature } = req.body;

        // Validar datos requeridos
        if (!name || !rut || !address || !email) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (name, rut, address, email)'
            });
        }

        // Verificar si ya existe
        const existing = await db.get('SELECT * FROM dispensary_data LIMIT 1');

        if (existing) {
            // Actualizar
            await db.run(
                `UPDATE dispensary_data 
                 SET name = ?, rut = ?, address = ?, email = ?, signature = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [name, rut, address, email, signature || null, existing.id]
            );
        } else {
            // Crear
            await db.run(
                `INSERT INTO dispensary_data (name, rut, address, email, signature, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [name, rut, address, email, signature || null]
            );
        }

        // Obtener datos actualizados
        const updated = await db.get('SELECT * FROM dispensary_data LIMIT 1');

        res.json({
            success: true,
            message: 'Datos del dispensario guardados correctamente',
            data: updated
        });
    } catch (error) {
        console.error('Error guardando datos del dispensario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar datos del dispensario',
            error: error.message
        });
    }
});

// DELETE /api/dispensary
// Eliminar el registro del dispensario
router.delete('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.run('DELETE FROM dispensary_data');

        res.json({
            success: true,
            message: 'Datos del dispensario eliminados correctamente'
        });
    } catch (error) {
        console.error('Error eliminando datos del dispensario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar datos del dispensario',
            error: error.message
        });
    }
});

module.exports = router;

