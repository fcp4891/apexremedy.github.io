// backend/src/controllers/roleController.js
const Role = require('../models/Role');

const roleModel = new Role();

// Obtener todos los roles
const getAll = async (req, res) => {
    try {
        const roles = await roleModel.findAll();
        
        // Obtener permisos para cada rol
        const rolesWithPermissions = await Promise.all(
            roles.map(async (role) => {
                const permissions = await roleModel.getPermissions(role.id);
                return { ...role, permissions };
            })
        );

        res.json({
            success: true,
            data: { roles: rolesWithPermissions }
        });
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener roles',
            error: error.message
        });
    }
};

// Obtener rol por ID
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await roleModel.findById(id);
        
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        const permissions = await roleModel.getPermissions(id);
        const users = await roleModel.getUsers(id);

        res.json({
            success: true,
            data: { 
                role: { ...role, permissions, users }
            }
        });
    } catch (error) {
        console.error('Error al obtener rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener rol',
            error: error.message
        });
    }
};

// Crear nuevo rol
const create = async (req, res) => {
    try {
        const { code, name, description } = req.body;

        if (!code || !name) {
            return res.status(400).json({
                success: false,
                message: 'Código y nombre son requeridos'
            });
        }

        // Verificar si el código ya existe
        const existingRole = await roleModel.findByCode(code);
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un rol con este código'
            });
        }

        const roleId = await roleModel.create({ code, name, description });
        const newRole = await roleModel.findById(roleId);

        res.status(201).json({
            success: true,
            message: 'Rol creado exitosamente',
            data: { role: newRole }
        });
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear rol',
            error: error.message
        });
    }
};

// Actualizar rol
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const role = await roleModel.findById(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        const updatedRole = await roleModel.update(id, { name, description });

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente',
            data: { role: updatedRole }
        });
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
};

// Eliminar rol
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await roleModel.findById(id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Rol no encontrado'
            });
        }

        // No permitir eliminar roles básicos
        const protectedRoles = ['super_admin', 'admin', 'customer'];
        if (protectedRoles.includes(role.code)) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar este rol (está protegido)'
            });
        }

        await roleModel.delete(id);

        res.json({
            success: true,
            message: 'Rol eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar rol',
            error: error.message
        });
    }
};

// Asignar permiso a rol
const assignPermission = async (req, res) => {
    try {
        const { roleId, permissionId } = req.body;

        if (!roleId || !permissionId) {
            return res.status(400).json({
                success: false,
                message: 'roleId y permissionId son requeridos'
            });
        }

        await roleModel.assignPermission(roleId, permissionId);

        res.json({
            success: true,
            message: 'Permiso asignado exitosamente'
        });
    } catch (error) {
        console.error('Error al asignar permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al asignar permiso',
            error: error.message
        });
    }
};

// Remover permiso de rol
const removePermission = async (req, res) => {
    try {
        const { roleId, permissionId } = req.body;

        if (!roleId || !permissionId) {
            return res.status(400).json({
                success: false,
                message: 'roleId y permissionId son requeridos'
            });
        }

        await roleModel.removePermission(roleId, permissionId);

        res.json({
            success: true,
            message: 'Permiso removido exitosamente'
        });
    } catch (error) {
        console.error('Error al remover permiso:', error);
        res.status(500).json({
            success: false,
            message: 'Error al remover permiso',
            error: error.message
        });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    assignPermission,
    removePermission
};









