const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshTokenModel = require('../models/RefreshToken');

const refreshTokenModel = new RefreshTokenModel();

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambialo_en_produccion';
const ACCESS_TOKEN_TTL = process.env.JWT_EXPIRES_IN || '10m';
const REFRESH_TOKEN_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';
const SECURE_COOKIE = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : NODE_ENV !== 'development';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

function resolveSameSite() {
    switch (COOKIE_SAMESITE) {
        case 'strict':
            return 'strict';
        case 'none':
            return 'none';
        case 'lax':
            return 'lax';
        default:
            return 'strict';
    }
}

function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function generateRefreshToken() {
    return crypto.randomBytes(48).toString('hex');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function calculateExpiryDate(ttl) {
    const now = new Date();
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
        now.setDate(now.getDate() + 7);
        return now.toISOString();
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            now.setSeconds(now.getSeconds() + value);
            break;
        case 'm':
            now.setMinutes(now.getMinutes() + value);
            break;
        case 'h':
            now.setHours(now.getHours() + value);
            break;
        case 'd':
        default:
            now.setDate(now.getDate() + value);
            break;
    }

    return now.toISOString();
}

function setCookie(res, name, value, options = {}) {
    const baseOptions = {
        httpOnly: true,
        secure: SECURE_COOKIE,
        sameSite: resolveSameSite(),
        domain: COOKIE_DOMAIN,
        path: '/',
        ...options
    };
    res.cookie(name, value, baseOptions);
}

function clearCookie(res, name, options = {}) {
    res.clearCookie(name, {
        httpOnly: true,
        secure: SECURE_COOKIE,
        sameSite: resolveSameSite(),
        domain: COOKIE_DOMAIN,
        path: '/',
        ...options
    });
}

async function issueAuthTokens(res, user, context = {}) {
    console.log('🔐 [TOKEN SERVICE] Iniciando issueAuthTokens para:', user.email, '| Role:', user.role);
    
    const accessPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        account_status: user.account_status
    };

    const accessToken = generateAccessToken(accessPayload);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const refreshExpiresAt = calculateExpiryDate(REFRESH_TOKEN_TTL);

    console.log('🔑 [TOKEN SERVICE] Tokens generados - Access token (primeros 20):', accessToken.substring(0, 20) + '...');
    console.log('🔑 [TOKEN SERVICE] Refresh token (primeros 20):', refreshToken.substring(0, 20) + '...');

    // Intentar crear refresh token
    let refreshTokenId = null;
    try {
        refreshTokenId = await refreshTokenModel.create({
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: refreshExpiresAt,
            userAgent: context.userAgent,
            ipAddress: context.ip
        });
        console.log('✅ [TOKEN SERVICE] Refresh token guardado en BD - ID:', refreshTokenId);
    } catch (error) {
        // Si la tabla no existe, intentar crear la tabla y reintentar
        if (error.message && error.message.includes('no such table')) {
            console.warn('⚠️ [TOKEN SERVICE] Tabla user_refresh_tokens no existe. Intentando crear...');
            try {
                const addRefreshTokensTable = require('../../database/migrations/add_refresh_tokens_table');
                await addRefreshTokensTable();
                // Reintentar después de crear la tabla
                refreshTokenId = await refreshTokenModel.create({
                    userId: user.id,
                    tokenHash: refreshTokenHash,
                    expiresAt: refreshExpiresAt,
                    userAgent: context.userAgent,
                    ipAddress: context.ip
                });
                console.log('✅ [TOKEN SERVICE] Refresh token creado después de crear la tabla - ID:', refreshTokenId);
            } catch (migrationError) {
                console.error('❌ [TOKEN SERVICE] Error al crear tabla user_refresh_tokens:', migrationError.message);
                // Continuar sin refresh token (el login funcionará pero sin refresh)
                console.warn('⚠️ [TOKEN SERVICE] Continuando sin refresh token. El login funcionará pero la sesión no se podrá refrescar.');
            }
        } else {
            // Otro error, loggear pero continuar (no fallar el login por esto)
            console.warn('⚠️ [TOKEN SERVICE] Error al crear refresh token (continuando con login):', error.message);
        }
    }

    const accessTokenMaxAge = parseDurationMs(ACCESS_TOKEN_TTL);
    const refreshTokenMaxAge = parseDurationMs(REFRESH_TOKEN_TTL);
    
    console.log('🍪 [TOKEN SERVICE] Estableciendo cookies:');
    console.log('   - access_token: maxAge =', accessTokenMaxAge, 'ms (', Math.floor(accessTokenMaxAge / 1000 / 60), 'minutos)');
    console.log('   - refresh_token: maxAge =', refreshTokenMaxAge, 'ms (', Math.floor(refreshTokenMaxAge / 1000 / 60), 'minutos)');
    console.log('   - Cookie domain:', COOKIE_DOMAIN || 'undefined (sin dominio)');
    console.log('   - Cookie secure:', SECURE_COOKIE);
    console.log('   - Cookie sameSite:', resolveSameSite());

    setCookie(res, 'access_token', accessToken, {
        maxAge: accessTokenMaxAge
    });

    setCookie(res, 'refresh_token', refreshToken, {
        maxAge: refreshTokenMaxAge,
        path: '/api/auth'
    });
    
    console.log('✅ [TOKEN SERVICE] Cookies establecidas en respuesta');

    return {
        refreshTokenHash,
        refreshTokenId,
        refreshExpiresAt
    };
}

function parseDurationMs(ttl) {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
        return 7 * 24 * 60 * 60 * 1000;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
        default:
            return value * 24 * 60 * 60 * 1000;
    }
}

function issueCsrfToken(res) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, {
        httpOnly: false,
        secure: SECURE_COOKIE,
        sameSite: resolveSameSite(),
        domain: COOKIE_DOMAIN,
        path: '/'
    });
    return token;
}

function clearAuthCookies(res) {
    clearCookie(res, 'access_token');
    clearCookie(res, 'refresh_token', { path: '/api/auth' });
    clearCookie(res, 'csrf_token', { httpOnly: false });
}

module.exports = {
    ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL,
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    issueAuthTokens,
    issueCsrfToken,
    clearAuthCookies,
    refreshTokenModel,
    parseDurationMs
};

