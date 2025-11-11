// backend/src/routes/permissions.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const permissionController = require('../controllers/permissionController');

// Todas las rutas requieren autenticación y rol admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/permissions
 * Obtener todos los permisos
 */
router.get('/', permissionController.getAll);

/**
 * GET /api/permissions/modules
 * Obtener módulos únicos
 */
router.get('/modules', permissionController.getModules);

/**
 * GET /api/permissions/module/:module
 * Obtener permisos por módulo
 */
router.get('/module/:module', permissionController.getByModule);

/**
 * GET /api/permissions/:id
 * Obtener permiso por ID con roles
 */
router.get('/:id', permissionController.getById);

/**
 * POST /api/permissions
 * Crear nuevo permiso
 */
router.post('/', permissionController.create);

/**
 * PUT /api/permissions/:id
 * Actualizar permiso
 */
router.put('/:id', permissionController.update);

/**
 * DELETE /api/permissions/:id
 * Eliminar permiso
 */
router.delete('/:id', permissionController.remove);

module.exports = router;









