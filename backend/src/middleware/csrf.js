const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXCLUDED_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health'
];

function shouldSkip(method, path) {
    if (SAFE_METHODS.has(method.toUpperCase())) {
        return true;
    }

    return EXCLUDED_PATHS.some((prefix) => path.startsWith(prefix));
}

function csrfProtection(req, res, next) {
    if (shouldSkip(req.method, req.path)) {
        return next();
    }

    const csrfCookie = req.cookies?.csrf_token;
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token ausente'
        });
    }

    if (csrfCookie !== csrfHeader) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token inválido'
        });
    }

    next();
}

module.exports = csrfProtection;

