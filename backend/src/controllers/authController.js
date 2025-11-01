// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const userModel = new User();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Registrar nuevo usuario
 */
const register = async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            phone,
            // Información médica
            rut,
            date_of_birth,
            medical_conditions,
            current_medications,
            allergies,
            has_medical_cannabis_authorization,
            authorization_number,
            authorization_expires,
            prescribing_doctor,
            doctor_license,
            medical_notes
        } = req.body;

        // Validar campos requeridos
        if (!email || !password || !first_name || !last_name) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña, nombre y apellido son requeridos'
            });
        }

        // Verificar si el email ya existe
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }

        // Validar contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Hash de la contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Crear usuario
        const userId = await userModel.create({
            email,
            password_hash,
            first_name,
            last_name,
            phone,
            role: 'customer'
        });

        // Crear información médica si se proporciona
        if (rut || date_of_birth || medical_conditions || has_medical_cannabis_authorization) {
            await userModel.createMedicalInfo(userId, {
                rut,
                date_of_birth,
                medical_conditions,
                current_medications,
                allergies,
                has_medical_cannabis_authorization: has_medical_cannabis_authorization ? 1 : 0,
                authorization_number,
                authorization_expires,
                prescribing_doctor,
                doctor_license,
                medical_notes
            });
        }

        console.log(`✅ Usuario registrado: ${email} (ID: ${userId})`);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    email,
                    first_name,
                    last_name,
                    phone,
                    role: 'customer'
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en register:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/**
 * Iniciar sesión
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = await userModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña (soporta bcrypt y SHA-256 para compatibilidad)
        let isValidPassword = false;
        
        console.log('🔐 Verificando contraseña para:', email);
        console.log('🔑 Hash almacenado (primeros 20 chars):', user.password_hash ? user.password_hash.substring(0, 20) : 'null');
        
        // Detectar tipo de hash: bcrypt siempre empieza con $2b$, $2a$ o $2y$
        if (user.password_hash && user.password_hash.startsWith('$2')) {
            console.log('🔓 Usando bcrypt');
            // Hash bcrypt
            try {
                isValidPassword = await bcrypt.compare(password, user.password_hash);
            } catch (error) {
                console.error('Error en bcrypt.compare:', error);
                isValidPassword = false;
            }
        } else {
            console.log('🔓 Usando SHA-256');
            // Hash SHA-256 (usuarios seed)
            const crypto = require('crypto');
            const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
            console.log('🔑 Hash calculado:', sha256Hash.substring(0, 20) + '...');
            console.log('🔑 Hash almacenado:', user.password_hash.substring(0, 20) + '...');
            isValidPassword = (sha256Hash === user.password_hash);
            console.log('✅ Contraseña válida:', isValidPassword);
        }

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si la cuenta está activa
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }

        // ==========================================
        // VALIDAR ESTADO DE APROBACIÓN DE CUENTA
        // ==========================================
        // Determinar account_status basado en is_active e is_verified
        let account_status = 'pending';
        if (user.is_verified && user.is_active) {
            account_status = 'approved';
        } else if (!user.is_active && !user.is_verified) {
            account_status = 'rejected';
        }
        
        // Usuarios nuevos (no verificados) no pueden hacer login
        if (account_status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta está pendiente de aprobación. Te notificaremos cuando sea aprobada.',
                account_status: 'pending'
            });
        }
        
        // Usuarios rechazados no pueden hacer login
        if (account_status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido rechazada. Contacta al administrador para más información.',
                account_status: 'rejected'
            });
        }

        // Actualizar última fecha de login
        await userModel.updateLastLogin(user.id);

        // Generar token JWT (incluyendo account_status)
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                account_status: account_status
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log(`✅ Login exitoso: ${email} (${account_status})`);
        
        // Crear objeto de usuario con campo name combinado (incluyendo account_status)
        const userData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: user.role,
            is_verified: user.is_verified,
            is_active: user.is_active,
            account_status: account_status
        };
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (user.first_name || user.last_name) {
            userData.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        
        // Si aún no tiene nombre, usar email
        if (!userData.name) {
            userData.name = user.email || 'Usuario sin nombre';
        }

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                user: userData
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

/**
 * Obtener información del usuario autenticado
 */
const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await userModel.findByIdWithMedicalInfo(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // No enviar password_hash
        delete user.password_hash;
        delete user.verification_token;
        delete user.reset_token;
        delete user.reset_token_expires;
        
        // Calcular account_status basado en is_active e is_verified (igual que en middleware)
        let account_status = 'pending';
        if (user.is_verified && user.is_active) {
            account_status = 'approved';
        } else if (!user.is_active && !user.is_verified) {
            account_status = 'rejected';
        }
        user.account_status = account_status;
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (!user.name && (user.first_name || user.last_name)) {
            user.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
        
        // Si aún no tiene nombre, usar email
        if (!user.name) {
            user.name = user.email || 'Usuario sin nombre';
        }

        // Parsear JSON fields de información médica
        if (user.medical_conditions) {
            try {
                user.medical_conditions = JSON.parse(user.medical_conditions);
            } catch (e) {}
        }
        if (user.current_medications) {
            try {
                user.current_medications = JSON.parse(user.current_medications);
            } catch (e) {}
        }
        if (user.allergies) {
            try {
                user.allergies = JSON.parse(user.allergies);
            } catch (e) {}
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('❌ Error en getMe:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/**
 * Obtener perfil del usuario (alias de getMe)
 */
const getProfile = async (req, res) => {
    return await getMe(req, res);
};

/**
 * Actualizar perfil del usuario
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            first_name,
            last_name,
            phone,
            email,
            // Información médica
            rut,
            date_of_birth,
            medical_conditions,
            current_medications,
            allergies,
            has_medical_cannabis_authorization,
            authorization_number,
            authorization_expires,
            prescribing_doctor,
            doctor_license,
            medical_notes
        } = req.body;

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar si el email ya existe (excluyendo el usuario actual)
        if (email && email !== user.email) {
            const emailExists = await userModel.emailExists(email, userId);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está en uso'
                });
            }
        }

        // Actualizar datos básicos del usuario
        const updateData = {};
        
        // Si viene 'name' del frontend, dividirlo en first_name y last_name
        if (name) {
            const nameParts = name.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                updateData.first_name = nameParts[0];
                updateData.last_name = nameParts.slice(1).join(' ');
            } else {
                updateData.first_name = nameParts[0];
                updateData.last_name = '';
            }
        } else {
            // Si vienen por separado
            if (first_name) updateData.first_name = first_name;
            if (last_name !== undefined) updateData.last_name = last_name;
        }
        
        if (phone !== undefined) updateData.phone = phone;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
            await userModel.update(userId, updateData);
        }

        // Actualizar información médica
        const medicalData = {};
        if (rut !== undefined) medicalData.rut = rut;
        if (date_of_birth !== undefined) medicalData.date_of_birth = date_of_birth;
        if (medical_conditions !== undefined) medicalData.medical_conditions = medical_conditions;
        if (current_medications !== undefined) medicalData.current_medications = current_medications;
        if (allergies !== undefined) medicalData.allergies = allergies;
        if (has_medical_cannabis_authorization !== undefined) medicalData.has_medical_cannabis_authorization = has_medical_cannabis_authorization ? 1 : 0;
        if (authorization_number !== undefined) medicalData.authorization_number = authorization_number;
        if (authorization_expires !== undefined) medicalData.authorization_expires = authorization_expires;
        if (prescribing_doctor !== undefined) medicalData.prescribing_doctor = prescribing_doctor;
        if (doctor_license !== undefined) medicalData.doctor_license = doctor_license;
        if (medical_notes !== undefined) medicalData.medical_notes = medical_notes;

        if (Object.keys(medicalData).length > 0) {
            // Verificar si ya existe información médica
            const existingMedicalInfo = await userModel.getMedicalInfo(userId);
            
            if (existingMedicalInfo) {
                await userModel.updateMedicalInfo(userId, medicalData);
            } else {
                await userModel.createMedicalInfo(userId, medicalData);
            }
        }

        const updatedUser = await userModel.findByIdWithMedicalInfo(userId);
        delete updatedUser.password_hash;
        delete updatedUser.verification_token;
        delete updatedUser.reset_token;
        delete updatedUser.reset_token_expires;
        
        // Calcular account_status basado en is_active e is_verified (igual que en middleware)
        let account_status = 'pending';
        if (updatedUser.is_verified && updatedUser.is_active) {
            account_status = 'approved';
        } else if (!updatedUser.is_active && !updatedUser.is_verified) {
            account_status = 'rejected';
        }
        updatedUser.account_status = account_status;
        
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
            message: 'Perfil actualizado correctamente',
            data: { user: updatedUser }
        });

    } catch (error) {
        console.error('❌ Error en updateProfile:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

/**
 * Cambiar contraseña
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Contraseña actual y nueva contraseña son requeridas'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe tener al menos 6 caracteres'
            });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(current_password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Hash de la nueva contraseña
        const new_password_hash = await bcrypt.hash(new_password, 10);

        // Actualizar contraseña
        await userModel.update(userId, { password_hash: new_password_hash });

        console.log(`✅ Contraseña cambiada: User #${userId}`);

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('❌ Error en changePassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

/**
 * Cerrar sesión (principalmente del lado del cliente)
 */
const logout = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión',
            error: error.message
        });
    }
};

/**
 * Refrescar token (opcional)
 */
const refreshToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verificar que el usuario existe
        const user = await userModel.findById(decoded.id);

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        // Calcular account_status actual
        let account_status = 'pending';
        if (user.is_verified && user.is_active) {
            account_status = 'approved';
        } else if (!user.is_active && !user.is_verified) {
            account_status = 'rejected';
        }

        // Generar nuevo token (incluyendo account_status actualizado)
        const newToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                account_status: account_status
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            data: { token: newToken }
        });

    } catch (error) {
        console.error('❌ Error en refreshToken:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al refrescar token',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    getProfile,
    updateProfile,
    changePassword,
    logout,
    refreshToken
};