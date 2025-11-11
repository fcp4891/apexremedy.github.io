# Inventario CTA Admin (08-11-2025)

## Objetivo
Identificar patrones repetidos en botones de acción (CTA) dentro de `frontend/admin` para unificarlos en utilidades o componentes reutilizables sin modificar el comportamiento actual.

## Metodología
- Búsqueda con `rg` sobre la carpeta `frontend/admin` para detectar repeticiones de clases Tailwind/inline (`bg-*-600 hover:bg-*-700 text-white px-*`).
- Revisión manual de vistas representativas (`index.html`, `products.html`, `orders.html`, `payments.html`) y scripts relacionados (`paymentsCRUD.js`).

## Patrones principales detectados

| Patrón | Apariciones | Contexto |
| --- | --- | --- |
| `bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg` | 26 | Botones “Actualizar”, “Nuevo”, “Confirmar” en `orders`, `products`, `payments`, `users`, `logistica*`, `carrito`, `checkout`. |
| `bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg` | 8 | Acciones primarias “Generar Catálogo”, “Filtrar”, “Buscar” (spacings varían entre `px-4` y `px-6`). |
| `bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg` | 7 | Botones secundarios “Limpiar” (filtros), cancelaciones rápidas. |
| `px-2 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm` | 4 | Accesos rápidos dentro de filtros (reset). |
| `bg-red-500 hover:bg-red-600 text-white` + `rounded-lg` | 5 | Acciones de advertencia (modal medicinal, filtros). |

## Oportunidades de estandarización
1. **Crear utilidades `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost`, etc.** en `css_admin.css` o `components.css`:
   - `btn-primary` → verde (`bg-green-600`, hover `bg-green-700`).
   - `btn-accent` → azul (`bg-blue-600`, hover `bg-blue-700`).
   - `btn-danger` → rojo (`bg-red-500`, hover `bg-red-600`).
   - `btn-muted` → gris (`bg-gray-300`, hover `bg-gray-400`, texto gris oscuro).
   - Variantes compactas (`btn-icon`, `btn-xs`) para los controles `px-2 py-3`.

2. **Unificar padding y tipografía**:
   - Actualmente varía entre `px-4 py-2`, `px-6 py-3`, `px-2 py-3`. Proponer escalas (`--btn-pad-sm`, `--btn-pad-md`, ...).

3. **Considerar icon spacing**:
   - Muchas instancias usan `i` con `mr-2`; podría encapsularse con `btn__icon`.

## Recomendaciones siguientes
- Implementar las clases sugeridas en `components.css` y mapear progresivamente los botones (`class="admin-btn admin-btn--primary"`).
- Mantener alias de transición (`.admin-btn--primary { @apply bg-green-600 ... }`) para migrar sin romper las vistas.
- Actualizar `CHANGES.md` por cada vista migrada y documentar en `CHANGES.md` cualquier clase eliminada tras la consolidación.

> Esta etapa solo inventaría; no se modificaron las vistas en este commit para preservar la funcionalidad vigente.



