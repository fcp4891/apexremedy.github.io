/**
 * Adaptador temporal para Utils (modo legacy).
 * Permite uso modular delegando en `window.Utils`.
 */

const LEGACY_GLOBAL_KEY = 'Utils';

function resolveLegacyInstance() {
    const instance = window?.[LEGACY_GLOBAL_KEY];
    if (!instance) {
        console.warn('[legacy-adapter] Utils global no disponible todavía.');
    }
    return instance;
}

export function getUtils() {
    return resolveLegacyInstance();
}

export const utilsProxy = new Proxy(
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



