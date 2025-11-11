/**
 * Adaptador temporal para apiClient (modo legacy).
 * Expone un getter seguro que delega al objeto global `window.api`
 * sin modificar la implementación existente.
 */

const LEGACY_GLOBAL_KEY = 'api';

function resolveLegacyInstance() {
    const instance = window?.[LEGACY_GLOBAL_KEY];
    if (!instance) {
        console.warn('[legacy-adapter] apiClient global no disponible todavía.');
    }
    return instance;
}

/**
 * Devuelve la instancia legacy actual (`window.api`).
 * @returns {any | undefined}
 */
export function getApiClient() {
    return resolveLegacyInstance();
}

/**
 * Proxy ligero que reencamina llamadas a `window.api`.
 * Permite usar `apiClientProxy.get(...)` manteniendo la API actual.
 */
export const apiClientProxy = new Proxy(
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



