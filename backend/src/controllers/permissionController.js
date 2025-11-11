// backend/src/controllers/permissionController.js
const Permission = require('../models/Permission');

const permissionModel = new Permission();

// Obtener todos los permisos
const getAll = async (req, res) => {
    try {
        const permissions = await permissionModel.findAll();

        res.json({
            success: true,
            data: { permissions }
        });
    } catch (error) {
        console.error('Error al obtener permisos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener permisos',
            error: error.message
        });
    }
};

// Obtener permisos por módulo
const getByModule = async (req, res) => {
    try {
        const { module } = req.params;
        const permissions = await permissionModel.findByModule(module);

        res.json({
            success: true,
            data: { permissions }
        });
    } catch (error) {
        console.error('Error al obtener permisos por módulo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener permisos',
            error: error.message
        });
    }
};

// Obtener módulos
const getModules = async (req, res) => {
    try {
        const modules = await permissionModel.getModules();

        res.json({
            success: true,
            data: { modules }
        });
    } catch (error) {
        console.error('Error al obtener módulos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener módulos',
            error: error.message
        });
    }
};

// Obtener permiso por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const permission = await permissionModel.findById(id);
        
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado'
            });
        }

        const roles = await permissionModel.getRoles(id);

        res.json({
            success: true,
            data: { 
                permission: { ...permission, roles }
            }
        });
    } catch (error) {
        console.error('Error al obtener permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener permiso',
            error: error.message
        });
    }
};

// Crear nuevo permiso
const create = async (req, res) => {
    try {
        const { code, description, module } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Código es requerido'
            });
        }

        // Verificar si el código ya existe
        const existingPermission = await permissionModel.findByCode(code);
        if (existingPermission) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un permiso con este código'
            });
        }

        const permissionId = await permissionModel.create({ code, description, module });
        const newPermission = await permissionModel.findById(permissionId);

        res.status(201).json({
            success: true,
            message: 'Permiso creado exitosamente',
            data: { permission: newPermission }
        });
    } catch (error) {
        console.error('Error al crear permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear permiso',
            error: error.message
        });
    }
};

// Actualizar permiso
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { description, module } = req.body;

        const permission = await permissionModel.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado'
            });
        }

        const updatedPermission = await permissionModel.update(id, { description, module });

        res.json({
            success: true,
            message: 'Permiso actualizado exitosamente',
            data: { permission: updatedPermission }
        });
    } catch (error) {
        console.error('Error al actualizar permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar permiso',
            error: error.message
        });
    }
};

// Eliminar permiso
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const permission = await permissionModel.findById(id);
        if (!permission) {
            return res.status(404).json({
                success: false,
                message: 'Permiso no encontrado'
            });
        }

        await permissionModel.delete(id);

        res.json({
            success: true,
            message: 'Permiso eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar permiso',
            error: error.message
        });
    }
};

module.exports = {
    getAll,
    getById,
    getByModule,
    getModules,
    create,
    update,
    remove
};









