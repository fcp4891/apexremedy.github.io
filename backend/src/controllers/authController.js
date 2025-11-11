// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { isValidRUT } = require('../utils/rutValidator');
const {
    issueAuthTokens,
    issueCsrfToken,
    clearAuthCookies,
    hashToken,
    refreshTokenModel
} = require('../utils/tokenService');

const userModel = new User();

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
            medical_notes,
            // Dirección
            addressLine1,
            addressLine2,
            region,
            city,
            commune
        } = req.body;

        // Validar campos requeridos
        if (!email || !password || !first_name || !last_name || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email, contraseña, nombre, apellido y teléfono son requeridos',
                error_code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Validar formato de email
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email.trim()) || email.length > 254) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido. Por favor, ingresa un email válido.',
                error_code: 'INVALID_EMAIL_FORMAT'
            });
        }

        // Verificar si el email ya existe
        const existingUserByEmail = await userModel.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(409).json({
                success: false,
                message: `El correo electrónico "${email}" ya está registrado en nuestra plataforma. Si ya tienes una cuenta, intenta iniciar sesión. Si olvidaste tu contraseña, puedes recuperarla.`,
                error_code: 'EMAIL_ALREADY_EXISTS',
                field: 'email'
            });
        }

        // Validar RUT si se proporciona
        if (rut && rut.trim() !== '') {
            console.log('🔍 Backend - RUT recibido para validar:', rut, 'Tipo:', typeof rut);
            
            // Validar formato y dígito verificador del RUT
            const rutIsValid = isValidRUT(rut);
            console.log('🔍 Backend - Resultado de isValidRUT:', rutIsValid);
            
            if (!rutIsValid) {
                console.error('❌ Backend - RUT inválido rechazado:', rut);
                return res.status(400).json({
                    success: false,
                    message: 'El RUT ingresado no es válido. Por favor, verifica que el formato sea correcto (ej: 12345678-9) y que el dígito verificador sea válido.',
                    error_code: 'INVALID_RUT',
                    field: 'rut'
                });
            }
            
            console.log('✅ Backend - RUT válido:', rut);
            
            // Verificar si el RUT ya existe
            const existingUserByRUT = await userModel.findByRUT(rut);
            if (existingUserByRUT) {
                return res.status(409).json({
                    success: false,
                    message: `El RUT "${rut}" ya está registrado en nuestra plataforma. Cada persona solo puede tener una cuenta asociada a su RUT. Si ya tienes una cuenta, intenta iniciar sesión.`,
                    error_code: 'RUT_ALREADY_EXISTS',
                    field: 'rut'
                });
            }
        }

        // Validar contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres',
                error_code: 'WEAK_PASSWORD'
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

        // Crear dirección si se proporciona
        if (addressLine1 && region && city && commune) {
            const db = require('../database/db').getInstance();
            try {
                await db.run(`
                    INSERT INTO addresses (
                        user_id, full_name, rut, line1, line2, 
                        commune, city, region, country, phone,
                        is_default_shipping, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
                `, [
                    userId,
                    `${first_name} ${last_name}`.trim(),
                    rut || null,
                    addressLine1,
                    addressLine2 || null,
                    commune,
                    city,
                    region,
                    'Chile',
                    phone || null
                ]);
                console.log(`✅ Dirección creada para usuario ${userId}`);
            } catch (error) {
                console.error('⚠️ Error al crear dirección (continuando):', error.message);
                // No fallar el registro si la dirección falla
            }
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
            console.log(`❌ Usuario no encontrado: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Obtener hash (puede estar en 'password' o 'password_hash')
        const storedHash = user.password_hash || user.password || null;
        
        if (!storedHash) {
            console.log(`❌ Usuario sin hash de contraseña: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña (soporta bcrypt y SHA-256 para compatibilidad)
        let isValidPassword = false;
        
        console.log('🔐 Verificando contraseña para:', email);
        console.log('🔑 Hash almacenado (primeros 20 chars):', storedHash.substring(0, 20) + '...');
        
        // Detectar tipo de hash: bcrypt siempre empieza con $2b$, $2a$ o $2y$
        if (storedHash.startsWith('$2')) {
            console.log('🔓 Usando bcrypt');
            // Hash bcrypt
            try {
                isValidPassword = await bcrypt.compare(password, storedHash);
                console.log('✅ Resultado bcrypt:', isValidPassword);
            } catch (error) {
                console.error('❌ Error en bcrypt.compare:', error);
                isValidPassword = false;
            }
        } else {
            console.log('🔓 Usando SHA-256 (compatibilidad con seed antiguo)');
            // Hash SHA-256 (usuarios seed antiguos)
            const crypto = require('crypto');
            const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
            console.log('🔑 Hash calculado:', sha256Hash.substring(0, 20) + '...');
            console.log('🔑 Hash almacenado:', storedHash.substring(0, 20) + '...');
            isValidPassword = (sha256Hash === storedHash);
            console.log('✅ Contraseña válida:', isValidPassword);
        }

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si la cuenta está activa
        // Para admins, permitir login incluso si está desactivado (para reactivar cuenta)
        const isAdmin = user.role === 'admin';
        const isActive = user.is_active !== undefined ? user.is_active : (user.status === 'active' ? 1 : 0);
        
        if (!isActive && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }
        
        // Para admins, permitir login siempre (para que puedan reactivar otras cuentas)
        if (!isActive && isAdmin) {
            console.log(`⚠️ Admin ${email} intentando login con cuenta desactivada - permitido`);
        }

        // ==========================================
        // VALIDAR ESTADO DE APROBACIÓN DE CUENTA
        // ==========================================
        // Verificar si tiene aprobación forzada
        const db = require('../database/db').getInstance();
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [user.id]
            );
            isForced = forcedApproval.length > 0;
        } catch (error) {
            // Si falla, continuar sin el flag
        }
        
        // Para admins, siempre aprobados
        if (isAdmin) {
            const account_status = 'approved';

            // Actualizar última fecha de login
            await userModel.updateLastLogin(user.id);

            console.log(`✅ Login exitoso (admin): ${email}`);

            // Crear objeto de usuario
            const userData = {
                id: user.id,
                email: user.email,
                first_name: user.first_name || null,
                last_name: user.last_name || null,
                phone: user.phone || null,
                role: user.role || 'admin',
                is_verified: user.is_verified || 1,
                is_active: isActive,
                account_status
            };

            if (user.first_name || user.last_name) {
                userData.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            } else if (user.name) {
                userData.name = user.name;
            } else {
                userData.name = 'Administrador';
            }

            console.log('🔐 [AUTH CONTROLLER] Emitiendo tokens para admin:', userData.email);
            await issueAuthTokens(res, { ...userData }, {
                userAgent: req.get('user-agent'),
                ip: req.ip
            });
            console.log('✅ [AUTH CONTROLLER] Tokens emitidos, emitiendo CSRF token...');
            issueCsrfToken(res);
            console.log('✅ [AUTH CONTROLLER] CSRF token emitido');

            const responseData = {
                success: true,
                message: 'Login exitoso',
                data: {
                    user: userData
                }
            };
            
            console.log('📤 [AUTH CONTROLLER] Enviando respuesta al frontend:');
            console.log('   - success:', responseData.success);
            console.log('   - message:', responseData.message);
            console.log('   - user.id:', responseData.data.user.id);
            console.log('   - user.email:', responseData.data.user.email);
            console.log('   - user.role:', responseData.data.user.role);
            console.log('   - user.account_status:', responseData.data.user.account_status);
            const setCookieHeader = res.getHeaders()['set-cookie'];
            const cookieCount = Array.isArray(setCookieHeader) ? setCookieHeader.length : (setCookieHeader ? 1 : 0);
            console.log('🍪 [AUTH CONTROLLER] Cookies en respuesta:', cookieCount);
            if (setCookieHeader) {
                console.log('🍪 [AUTH CONTROLLER] Headers Set-Cookie:');
                const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
                cookies.forEach((cookie, idx) => {
                    const name = cookie.split('=')[0];
                    console.log(`   ${idx + 1}. ${name}`);
                });
            }
            
            return res.json(responseData);
        }
        
        // Para usuarios no-admin, validar estado de aprobación
        const isVerified = user.is_verified !== undefined ? (user.is_verified === 1 || user.is_verified === true) : false;
        
        let account_status = 'pending';
        if (isForced && isVerified && isActive) {
            account_status = 'forced_approved';
        } else if (isVerified && isActive) {
            account_status = 'approved';
        } else if (!isActive && !isVerified) {
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

        console.log(`✅ Login exitoso: ${email} (${account_status})`);
        
        // Crear objeto de usuario con campo name combinado (incluyendo account_status)
        const userData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            phone: user.phone || null,
            role: user.role || 'customer', // Asegurar que role existe
            is_verified: user.is_verified || 0,
            is_active: user.is_active !== undefined ? user.is_active : (user.status === 'active' ? 1 : 0),
            account_status: account_status
        };
        
        // Agregar campo 'name' combinado para compatibilidad con frontend
        if (user.first_name || user.last_name) {
            userData.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.name) {
            // Si la BD tiene campo 'name' directamente
            userData.name = user.name;
        }
        
        // Si aún no tiene nombre, usar email o 'Administrador'
        if (!userData.name) {
            userData.name = userData.role === 'admin' ? 'Administrador' : (user.email || 'Usuario sin nombre');
        }

        await issueAuthTokens(res, { ...userData }, {
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
        issueCsrfToken(res);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
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

        let user;
        try {
            user = await userModel.findByIdWithMedicalInfo(userId);
        } catch (error) {
            // Si falla por tabla no existente, usar findById
            if (error.code === 'SQLITE_ERROR' && error.message.includes('user_medical_info')) {
                console.warn('⚠️ Usando findById como fallback para obtener usuario');
                user = await userModel.findById(userId);
            } else {
                throw error;
            }
        }

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
        
        // Mapear campos si es necesario
        if (user.status !== undefined && user.is_active === undefined) {
            user.is_active = (user.status === 'active') ? 1 : 0;
        }
        if (user.is_active === undefined) {
            user.is_active = 1;
        }
        if (!user.role) {
            user.role = user.email && user.email.toLowerCase().includes('admin') ? 'admin' : 'customer';
        }
        
        // Verificar si tiene aprobación forzada
        const db = require('../database/db').getInstance();
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [userId]
            );
            isForced = forcedApproval.length > 0;
        } catch (error) {
            // Si falla, continuar sin el flag
        }
        
        // Calcular account_status basado en is_active e is_verified
        // Para admins, siempre aprobado
        const isAdmin = user.role === 'admin';
        let account_status = 'pending';
        if (isAdmin) {
            account_status = 'approved';
        } else if (isForced && user.is_verified && user.is_active) {
            account_status = 'forced_approved';
        } else if (user.is_verified && user.is_active) {
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
        
        // Verificar si tiene aprobación forzada
        const db = require('../database/db').getInstance();
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [userId]
            );
            isForced = forcedApproval.length > 0;
        } catch (error) {
            // Si falla, continuar sin el flag
        }
        
        // Calcular account_status basado en is_active e is_verified (igual que en middleware)
        let account_status = 'pending';
        if (isForced && updatedUser.is_verified && updatedUser.is_active) {
            account_status = 'forced_approved';
        } else if (updatedUser.is_verified && updatedUser.is_active) {
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
        const refreshToken = req.cookies?.refresh_token;

        if (refreshToken) {
            try {
                const tokenHash = hashToken(refreshToken);
                const tokenRecord = await refreshTokenModel.findByHash(tokenHash);

                if (tokenRecord && !tokenRecord.revoked_at) {
                    await refreshTokenModel.markAsRevoked(tokenRecord.id, 'logout');
                }
            } catch (error) {
                // Si la tabla no existe, continuar de todas formas (la migración se ejecutará en el próximo inicio)
                if (error.message && error.message.includes('no such table')) {
                    console.warn('⚠️ Tabla user_refresh_tokens no existe aún. La migración se ejecutará en el próximo reinicio del servidor.');
                } else {
                    // Otro error, loggear pero continuar con el logout
                    console.warn('⚠️ Error al revocar refresh token (continuando con logout):', error.message);
                }
            }
        }

        clearAuthCookies(res);

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
        const refreshTokenCookie = req.cookies?.refresh_token;

        if (!refreshTokenCookie) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token requerido'
            });
        }

        const tokenHash = hashToken(refreshTokenCookie);
        const tokenRecord = await refreshTokenModel.findByHash(tokenHash);

        if (!tokenRecord) {
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido'
            });
        }

        if (tokenRecord.revoked_at) {
            await refreshTokenModel.revokeFamily(tokenRecord.user_id);
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Refresh token revocado'
            });
        }

        if (new Date(tokenRecord.expires_at) <= new Date()) {
            await refreshTokenModel.markAsRevoked(tokenRecord.id, 'expired');
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Refresh token expirado'
            });
        }

        const user = await userModel.findById(tokenRecord.user_id);

        if (!user || !user.is_active) {
            await refreshTokenModel.markAsRevoked(tokenRecord.id, 'user_inactive');
            clearAuthCookies(res);
            return res.status(401).json({
                success: false,
                message: 'Usuario inactivo'
            });
        }

        const db = require('../database/db').getInstance();
        let isForced = false;
        try {
            const forcedApproval = await db.all(
                'SELECT * FROM user_forced_approvals WHERE user_id = ? LIMIT 1',
                [user.id]
            );
            isForced = forcedApproval.length > 0;
        } catch (error) {
            // Ignorar error de tabla faltante
        }

        let account_status = 'pending';
        if (isForced && user.is_verified && user.is_active) {
            account_status = 'forced_approved';
        } else if (user.is_verified && user.is_active) {
            account_status = 'approved';
        } else if (!user.is_active && !user.is_verified) {
            account_status = 'rejected';
        }

        const userData = {
            id: user.id,
            email: user.email,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            phone: user.phone || null,
            role: user.role || 'customer',
            is_verified: user.is_verified || 0,
            is_active: user.is_active !== undefined ? user.is_active : 1,
            account_status
        };

        if (user.first_name || user.last_name) {
            userData.name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (user.name) {
            userData.name = user.name;
        } else if (!userData.name) {
            userData.name = userData.role === 'admin' ? 'Administrador' : (user.email || 'Usuario sin nombre');
        }

        const newRefreshToken = await issueAuthTokens(res, userData, {
            userAgent: req.get('user-agent'),
            ip: req.ip
        });

        await refreshTokenModel.markAsRevoked(
            tokenRecord.id,
            'rotated',
            newRefreshToken.refreshTokenHash
        );

        issueCsrfToken(res);

        res.json({
            success: true,
            data: {
                user: userData
            }
        });
    } catch (error) {
        console.error('❌ Error en refreshToken:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error al refrescar token',
            error: error.message
        });
    }
};

const getCsrfToken = (req, res) => {
    const token = issueCsrfToken(res);
    res.json({
        success: true,
        data: {
            csrfToken: token
        }
    });
};

module.exports = {
    register,
    login,
    getMe,
    getProfile,
    updateProfile,
    changePassword,
    logout,
    refreshToken,
    getCsrfToken
};