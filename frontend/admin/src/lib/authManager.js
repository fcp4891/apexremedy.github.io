/**
 * Adaptador temporal para authManager (modo legacy).
 * Proporciona acceso seguro al `window.authManager` existente.
 */

const LEGACY_GLOBAL_KEY = 'authManager';

function resolveLegacyInstance() {
    const instance = window?.[LEGACY_GLOBAL_KEY];
    if (!instance) {
        console.warn('[legacy-adapter] authManager global no disponible todavía.');
    }
    return instance;
}

export function getAuthManager() {
    return resolveLegacyInstance();
}

export const authManagerProxy = new Proxy(
    {},
    {
        get(_target, prop) {
            // Evitar acceso recursivo a propiedades del Proxy
            if (prop === 'toJSON' || prop === Symbol.toPrimitive || prop === 'toString') {
                return undefined;
            }
            const instance = resolveLegacyInstance();
            if (!instance) {
                return undefined;
            }
            const value = instance[prop];
            if (typeof value === 'function') {
                return value.bind(instance);
            }
            return value;
        }
    }
);



