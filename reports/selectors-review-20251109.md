# Revisión de selectores – 09-11-2025

Baseline generado con `npm run front:scan-selectors` (sin warnings tras corregir llaves en CSS legacy).

## Resumen
- Total de clases detectadas: 435
- Clases sin uso encontrado: **51**
- Áreas principales con deuda:
  - CSS histórico del micro-app `frontend/catalogo/` (aún referenciado por la mini-app legacy).
  - Modales puntuales en `frontend/ajustes_puntuales/`.
  - Secciones residuales del customer site (`perfil`: blockers por modal no migrado).
  - Nuevos estilos `app-*` y utilidades `u-*` (ya adoptados por la mayoría de vistas; faltan limpiezas finas).

## Clasificación

### 1. Nuevas utilidades/ componentes (mantener)
- `frontend/src/styles/components.css`: clases `app-*` (14 pendientes tras adoptar navbar) → alias BEM planificados para botones, secciones, modales.
- `frontend/src/styles/utilities.css`: clases `u-*` (7 pendientes, `u-container` ya en uso).  
> Acción: mantener; documentado en `docs/selector-audit.md` como “reservado para migración”.

### 2. CSS legacy con candidatas claras

| Archivo | Candidatas (resumen) | Observaciones |
| --- | --- | --- |
| `frontend/style/catalogo.css` (21) | `cover-page`, `products-page`, `hash-*`, `oil-*`, `save-btn`, `cancel-btn`, etc. | No referencias en `catalogo/**/*.html|js`; parecen remanentes del editor antiguo. |
| `frontend/ajustes_puntuales/css_modals.css` (16) | `product-badge-*`, `product-grid-4`, `product-loading-*`, `pulse`, `shake`, etc. | No aparecen en `ajustes_puntuales/html_modals.html` ni `js_modal.js`. Probable experimento ya descontinuado. |
| `frontend/style/perfil.css` (0) | — | Bloques legacy eliminados (hero y modal); sin pendientes. |
| `frontend/style/mis-pedidos.css` (0) | — | Eliminado modal de transferencia legacy. |
| `frontend/style/registro.css` (0) | — | Se limpiaron indicadores/comandos no usados; solo permanecen utilidades activas. |
| `frontend/style/tienda.css` + `frontend/style/css_home.css` (coincidentes) | `shop-filters`, `filter-container`, `search-box`, `product-modal-content`, `tienda-filter-card`, etc. | El layout actual usa Tailwind + `cta-button`; investigar si se planean filtros antes de borrar. |
| `frontend/style/marco-legal.css` (4) | `hero-legal`, `hero-legal-content`, `stat-*`. | El hero actual usa `legal-hero` + utilidades inline; confirmar antes de remover. |
| `frontend/style/index.css` (3) | `product-modal-*`, `registro-catalogo-grid`. | Elementos del experimento de modal; sin referencias actuales. |
| `frontend/style/nosotros.css` (2) | `hero-about`, `hero-icon`. | El markup utiliza `about-section` y `card-icon`; posible renombre pendiente. |
| `frontend/style/checkout.css` (1) | `skeleton`. | No se usa; fallback de skeleton loader. |

### 3. Siguientes pasos sugeridos
1. Validar con stakeholders de catálogo y ajustes puntuales antes de eliminar sus clases.
2. Para cada archivo, mover candidatos a `CHANGES.md` sección *candidate* indicando fecha y motivo.
3. Tras confirmación, eliminar estilos y re-ejecutar `npm run front:scan-selectors` + smoke visual.
4. Al migrar vistas al nuevo sistema (`app-*`, `u-*`), actualizar reporte para asegurar adopción.

> Nota: Mantener `frontend/src/styles/tailwind.safelist.json` sincronizado cuando se eliminen clases; algunas (`shop-filters`, `search-box`) podrían pasar a utilidades en lugar de borrarse si se activan filtros.

