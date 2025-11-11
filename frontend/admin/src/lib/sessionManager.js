/**
 * Adaptador temporal para sessionManager (modo legacy).
 * Delegamos en `window.sessionManager` sin modificar su implementación actual.
 */

const LEGACY_GLOBAL_KEY = 'sessionManager';

function resolveLegacyInstance() {
    const instance = window?.[LEGACY_GLOBAL_KEY];
    if (!instance) {
        console.warn('[legacy-adapter] sessionManager global no disponible todavía.');
    }
    return instance;
}

export function getSessionManager() {
    return resolveLegacyInstance();
}

export const sessionManagerProxy = new Proxy(
    {},
    {
        get(_target, prop) {
            const instance = resolveLegacyInstance();
            const value = instance?.[prop];
            if (typeof value === 'function') {
                return value.bind(instance);
            }
            return value;
        }
    }
);



