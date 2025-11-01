// ============================================
// CONTROLADOR: Users
// ============================================

const bcrypt = require('bcrypt');
const User = require('../models/User');
const userModel = new User();

// Obtener todos los usuarios (ADMIN)
const getAllUsers = async (req, res) => {
    try {
        const { role, limit, offset } = req.query;

        const users = await userModel.getAll({ role });

        const limitNum = limit ? parseInt(limit) : 10;
        const offsetNum = offset ? parseInt(offset) : 0;
        const total = users.length;
        const pages = Math.ceil(total / limitNum);
        const currentPage = Math.floor(offsetNum / limitNum) + 1;
        
        const paginatedUsers = users.slice(offsetNum, offsetNum + limitNum);
        paginatedUsers.forEach(user => {
            if (user.password_hash) delete user.password_hash;
            if (user.password) delete user.password;
            
            // Agregar campo 'name' combinado para compatibilidad con frontend
            if (!user.name && (user.first_name || user.last_name)) {
                user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            }
            
            // Si aún no tiene nombre, usar email
            if (!user.name) {
                user.name = user.email || 'Usuario sin nombre';
            }
        });

        res.json({
            success: true,
            data: {
                users: paginatedUsers,
                count: paginatedUsers.length,
                total: total,
                pagination: {
                    page: currentPage,
                    pages: pages,
                    limit: limitNum,
                    total: total
                }
            }
        });
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findByIdWithMedicalInfo(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (user.password_hash) delete user.password_hash;
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (!user.name && (user.first_name || user.last_name)) {
            user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        
        // Si aún no tiene nombre, usar email
        if (!user.name) {
            user.name = user.email || 'Usuario sin nombre';
        }

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        console.error('Error en getUserById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    try {
        console.log('🔍 updateUser llamado con:', { params: req.params, body: req.body });
        
        const { id } = req.params;
        const { name, first_name, last_name, email, phone, rut, password, role, is_active, is_verified, account_status } = req.body;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        console.log('📝 Usuario encontrado:', { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name });

        const updateData = {};
        
        // Si viene 'name' del frontend, dividirlo en first_name y last_name
        if (name && name.trim() !== '') {
            console.log('✏️ Dividiendo name:', name);
            const nameParts = name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                updateData.first_name = nameParts[0];
                updateData.last_name = nameParts.slice(1).join(' ');
            } else {
                updateData.first_name = nameParts[0];
                updateData.last_name = '';
            }
            console.log('✅ name dividido:', { first_name: updateData.first_name, last_name: updateData.last_name });
        } else {
            // Si vienen por separado
            if (first_name) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
        }
        
        if (phone !== undefined) updateData.phone = phone;
        if (email) updateData.email = email;
        if (role && ['customer', 'admin'].includes(role)) updateData.role = role;
        if (account_status && ['pending', 'approved', 'rejected'].includes(account_status)) {
            // Mapear account_status a is_active e is_verified
            updateData.is_active = account_status === 'approved' ? 1 : 0;
            updateData.is_verified = account_status === 'approved' ? 1 : 0;
        }
        if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;
        if (is_verified !== undefined) updateData.is_verified = is_verified ? 1 : 0;

        if (email && email !== user.email) {
            const emailExists = await userModel.emailExists(email, id);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }
            updateData.email = email;
        }

        if (password && password.trim() !== '') {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            updateData.password_hash = await bcrypt.hash(password, 10);
        }

        console.log('📦 updateData:', updateData);

        if (Object.keys(updateData).length > 0) {
            await userModel.update(id, updateData);
            console.log('✅ Usuario actualizado en la base de datos');
        } else {
            console.log('⚠️ No hay datos para actualizar');
        }

        // Actualizar información médica si viene
        if (rut !== undefined) {
            const medicalData = { rut };
            const existingMedicalInfo = await userModel.getMedicalInfo(id);
            
            if (existingMedicalInfo) {
                await userModel.updateMedicalInfo(id, medicalData);
            } else {
                await userModel.createMedicalInfo(id, medicalData);
            }
        }

        const updatedUser = await userModel.findByIdWithMedicalInfo(id);
        if (updatedUser.password_hash) delete updatedUser.password_hash;
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (!updatedUser.name && (updatedUser.first_name || updatedUser.last_name)) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
        }
        
        // Si aún no tiene nombre, usar email
        if (!updatedUser.name) {
            updatedUser.name = updatedUser.email || 'Usuario sin nombre';
        }

        console.log('📤 Usuario actualizado enviado:', {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name
        });

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Error en updateUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// Eliminar usuario (ADMIN)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (req.user.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes eliminar tu propia cuenta'
            });
        }

        await userModel.delete(id);

        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error en deleteUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

// Actualizar rol de usuario (ADMIN)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['customer', 'admin'];
        
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol inválido. Valores permitidos: customer, admin'
            });
        }

        const user = await userModel.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (req.user.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'No puedes cambiar tu propio rol'
            });
        }

        await userModel.update(id, { role });
        const updatedUser = await userModel.findById(id);
        if (updatedUser.password_hash) delete updatedUser.password_hash;
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (!updatedUser.name && (updatedUser.first_name || updatedUser.last_name)) {
            updatedUser.name = `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim();
        }
        
        // Si aún no tiene nombre, usar email
        if (!updatedUser.name) {
            updatedUser.name = updatedUser.email || 'Usuario sin nombre';
        }

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Error en updateUserRole:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
};

// Obtener estadísticas de usuarios (ADMIN)
const getUserStats = async (req, res) => {
    try {
        const allUsers = await userModel.getAll();
        const admins = allUsers.filter(u => u.role === 'admin');
        const customers = allUsers.filter(u => u.role === 'customer');

        const stats = {
            total: allUsers.length,
            admins: admins.length,
            customers: customers.length
        };

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        console.error('Error en getUserStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ============================================
// EXPORTAR TODAS LAS FUNCIONES
// ============================================

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    getUserStats
};