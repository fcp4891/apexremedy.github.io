# Registro de refactors front/admin

## 2025-11-08
- Se creó estructura `frontend/admin/src/styles/` con tokens, base, utilities y components (fase preparatoria, aún sin uso en producción).
- Se documentó la futura migración de helpers en `frontend/admin/src/lib/README.md`.
- Se agregaron adaptadores temporales (`get*`, `*Proxy`) en `frontend/admin/src/lib/` para consumir instancias legacy (`window.api`, `window.authManager`, etc.) sin modificar los scripts actuales.
- Se añadió `logger.js` y `dom.js` como cimientos para centralizar logs y manipulación del DOM.
- `style/css_admin.css` ahora importa `src/styles/tokens.css` y reemplaza colores literales por variables centralizadas para mantener consistencia cromática.
- Se agregaron archivos `frontend/admin/js/*.legacy.js` que importan los proxies ESM y aseguran la disponibilidad de `window.api`, `window.authManager`, `window.sessionManager`, `window.notify` y `window.Utils` sin alterar la carga actual.
- Todas las vistas admin (`*.html`) cargan `adminTemplate.legacy.js` como módulo para inicializar los adaptadores antes de los scripts existentes.
- `frontend/admin/index.html` verifica la disponibilidad de `APIClient` antes de crear `window.api` para evitar errores en carga inicial.
- Se crearon clases reutilizables para títulos y cabeceras de cards (`admin-section-title`, `admin-card-row`, `admin-card-heading`, etc.) y se eliminaron estilos inline en `frontend/admin/index.html` de forma change-safe.
- Nuevas utilidades `admin-page-*` estandarizan encabezados; `frontend/admin/products.html` adopta estas clases sin alterar el layout existente.
- `frontend/admin/orders.html` ahora consume `adminTemplate.legacy.js` y reutiliza `admin-page-*` para su cabecera, eliminando estilos inline previos.
- Se añadieron clases de botones (`admin-btn--primary`, `--accent`, `--warning`, `--danger`, `--muted`, `--compact`, `admin-btn__icon`) y se aplicaron en `index.html`, `products.html`, `orders.html`, `payments.html` y `users.html` para reducir duplicidad de estilos Tailwind sin alterar comportamiento.
- Se revisaron los modales principales (`products`, `orders`, `payments`) y no se detectaron botones con estilo "ghost/outline"; no se añadieron variantes adicionales en esta iteración.
- Las vistas de logística (`logistica.html`, `logistica-proveedores.html`, `logistica-centros.html`) ahora usan `admin-page-*` y los nuevos estilos de botón para mantener consistencia con el resto del panel.
- `checkout.html` y `carrito.html` adoptan encabezados `admin-page-*` y botones `admin-btn--*`, manteniendo animaciones/estados previos pero eliminando estilos inline.
- Normalicé `logistica-envios.html`, `logistica-materiales.html` y `logistica-conductores.html` con `admin-page-*`, botones reutilizables y controles de paginación/modales estandarizados.
- Se completó la adopción en `logistica-zonas.html`, `logistica-zonas-restringidas.html`, `logistica-envio-gratis.html` y `logistica-puntos-retiro.html`, incluyendo botones de paginación y controles de modales.
- Scripts dinámicos (`payments.js`, `adminProductModals.js`, y vistas logísticas) ahora generan botones con `admin-icon-btn` en lugar de clases Tailwind legacy.
- No se han eliminado ni fusionado archivos existentes en esta iteración.

## 2025-11-09
- Se generó inventario del frontend público en `reports/deps-20251109.md`, mapeando dependencias HTML→CSS/JS y detectando duplicidades sin alterar código.
- Se redactó `RFC-REFactor-20251109.md` para definir plan change-safe de migración (BEM + utilidades, estructura `src/`, fases de trabajo, riesgos).
- No se realizaron cambios funcionales ni eliminaciones; sólo documentación preparatoria.
- Se creó estructura `frontend/src/styles/{tokens,base,utilities,components}.css` replicando tokens y estilos base como paso inicial de la migración; los HTML legacy aún consumen los archivos originales.
- Se registró baseline de peso de bundles en `reports/bundle-20251109.md` (CSS ≈200 KB, JS ≈626 KB) para medir futuros ahorros.
- Se añadió tooling de auditoría: `scripts/analyze-front-selectors.js` (npm script `front:scan-selectors`) genera `reports/selectors-YYYYMMDD.json` con clases no usadas; las advertencias actuales marcan CSS inválidos existentes.
- Se creó safelist inicial de Tailwind en `frontend/src/styles/tailwind.safelist.json` y documentación en `docs/selector-audit.md` + índice `docs/README.md`.
- Se corrigieron desbalances de llaves en CSS público (`style/catalogo.css`, `checkout.css`, `contacto.css`, `marco-legal.css`, `mis-pedidos.css`, `nosotros.css`, `perfil.css`) permitiendo que el analizador se ejecute sin warnings.
- Se documentó el primer barrido de clases candidatas en `reports/selectors-review-20251109.md`, diferenciando utilidades nuevas (`app-*`, `u-*`) de estilos legacy sin uso.
- `style/css_home.css` ahora importa `src/styles/{components,utilities}.css`; los headers (`components/header*.html`) añaden clases `app-navbar*`/`u-container` y `template.js` sincroniza `app-navbar__link--active` para mantener estilo activo sin romper clases legacy.
- Footer público (`components/footer*.html`) añade las clases `app-footer*`/`u-container`; las reglas de `css_home.css` ahora contemplan ambos prefijos para facilitar la migración hacia `components.css`.
- Se actualizaron `index.html` y `tienda.html` para aplicar `app-section*`, `app-button*` y `u-container` en secciones clave y CTAs sin eliminar clases legacy; el inventario (`npm run front:scan-selectors`) refleja la reducción de clases sin uso a 109.
- `contacto.html` adopta `app-section*`, `app-button*`, `u-container` y `app-card` en formularios/tarjetas, manteniendo estilos existentes; nuevas utilidades replicadas en `style/contacto.css`. El inventario de selectores se actualizó a 108 clases sin uso.
- `carrito.html` y `checkout.html` migraron hero/containers a `app-section` + `u-container`, los resúmenes usan `app-card` y las acciones principales `app-button (--primary/--secondary/--danger)` preservando clases legacy para compatibilidad; `checkout.css` y scripts inline se ajustaron acorde.
- `mis-pedidos.html` y `perfil.html` integran `app-section`, `u-container`, `app-card` y `app-button` en sus flujos principales (listas, formularios, CTA). El inventario de clases sin uso baja a 107 tras reejecutar `npm run front:scan-selectors`.
- `login.html` y `registro.html` incorporan `app-section`, `u-container`, `app-card` y variantes `app-button`; se actualizaron multiples botones secundarios/danger y el sidebar del carrito legacy mantiene compatibilidad.
- `marco-legal.html` y `nosotros.html` ahora aplican `app-section`, `u-container`, `app-card` y `app-button` en timelines, valores, equipo y CTA sin perder estilos anteriores; `style/marco-legal.css`/`nosotros.css` mantienen alias legacy. El inventario se mantiene con 107 clases sin uso.
- Se eliminó el micro-estilo legacy `frontend/style/catalogo.css` y se documentó su dependencia en `frontend/catalogo/`. Además, se limpió el modal de filtros móvil. El inventario final queda en 435 clases totales y 51 sin uso.
- Se restauró `frontend/catalogo/styles.css` tras detectar regresión visual; queda pendiente migrar la micro-app a la nueva estructura (`src/views/catalogo/`) sin romper estilos.
- Se añadieron estilos dedicados para `.confirm-modal` en `frontend/catalogo/styles.css` para recuperar el diseño del diálogo de confirmación.
- Se unificaron las vistas de políticas en `frontend/catalogo/index.html` (una sola página combina contenido, imagen de pie y footer) y se ajustaron `script.js`/`styles.css` para reflejar el nuevo orden y layout.
- Se habilitó la carga y drag & drop de imágenes dentro del mantenedor del catálogo (`frontend/catalogo/index.html`, `script.js`, `visual-editor.js`, `visual-editor-styles.css`), sin afectar la navegación pública.
- Se renovó la sección “Imágenes y Media” del modal admin (`frontend/admin/js/adminEditModals.js`, `frontend/admin/style/products-modal-enhanced.css`) permitiendo adjuntar archivos locales, visualizar previsualizaciones y restaurar la imagen existente sin depender de URLs externas.

### Candidate (pendiente de confirmación antes de eliminar)
- `frontend/catalogo/styles.css`: `hash-*`, `oil-*`, `logo-icon`, etc. (micro-app legacy).
- `frontend/ajustes_puntuales/css_modals.css`: `product-badge-*`, `product-grid-4`, `product-input-*`, `product-loading-*`, `pulse`, `shake`, `valid-feedback`.
- `frontend/style/tienda.css` / `frontend/style/css_home.css`: `shop-filters`, `filter-container`, `filter-select`, `search-box`, `tienda-filter-card`, `product-modal-content` (verificar roadmap de filtros antes de eliminar).
- `frontend/style/marco-legal.css`: `hero-legal`, `hero-legal-content`, `stat-*` (confirmar con contenido legal).
- `frontend/style/index.css`: `product-modal-*`, `registro-catalogo-grid` (modal experimental sin uso actual).
- `frontend/style/nosotros.css`: `hero-about`, `hero-icon` (posible renombre pendiente).
- `frontend/style/checkout.css`: `skeleton` (loader desactivado).

