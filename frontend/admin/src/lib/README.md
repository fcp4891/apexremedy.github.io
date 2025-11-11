# Librerías compartidas (plan de migración)

Este directorio alojará implementaciones modulares (ESM) de los helpers globales actuales.  
Mientras se completa la migración existen adaptadores que delegan en las instancias expuestas en `window.*`.

- `apiClient.js`
- `authManager.js`
- `sessionManager.js`
- `notifications.js`
- `utils.js`
- `logger.js` (nuevo)
- `dom.js` (nuevo)

Durante la transición se expondrán adaptadores en `frontend/admin/js/*.legacy.js` para mantener la API global (`window.*`) sin romper el código existente.

## Uso temporal de proxies

```js
// Ejemplo (módulo experimental)
import { apiClientProxy } from '../src/lib/apiClient.js';
import { authManagerProxy } from '../src/lib/authManager.js';

async function loadUsers() {
  const auth = authManagerProxy;
  if (!auth.isAuthenticated?.()) return;

  const response = await apiClientProxy.get?.('/admin/users');
  return response?.data ?? [];
}
```

- `get*()` devuelve la instancia legacy (`window.api`, `window.authManager`, etc.).
- `*Proxy` expone un `Proxy` que reencamina llamadas conservando `this`.
- Si la instancia aún no está disponible, se registra un `console.warn` sin lanzar excepciones (modo change-safe).

> Próximo paso: crear archivos `frontend/admin/js/apiClient.legacy.js`, etc., que importen estos módulos al momento de modernizar cada vista.

