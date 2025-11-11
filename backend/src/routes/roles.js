// backend/src/routes/roles.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const roleController = require('../controllers/roleController');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/roles
 * Obtener todos los roles con sus permisos
 */
router.get('/', roleController.getAll);

/**
 * GET /api/roles/:id
 * Obtener rol por ID con permisos y usuarios
 */
router.get('/:id', roleController.getById);

/**
 * POST /api/roles
 * Crear nuevo rol
 */
router.post('/', roleController.create);

/**
 * PUT /api/roles/:id
 * Actualizar rol
 */
router.put('/:id', roleController.update);

/**
 * DELETE /api/roles/:id
 * Eliminar rol
 */
router.delete('/:id', roleController.remove);

/**
 * POST /api/roles/permissions/assign
 * Asignar permiso a rol
 */
router.post('/permissions/assign', roleController.assignPermission);

/**
 * POST /api/roles/permissions/remove
 * Remover permiso de rol
 */
router.post('/permissions/remove', roleController.removePermission);

module.exports = router;









