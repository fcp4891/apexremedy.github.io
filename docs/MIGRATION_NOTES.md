# MIGRATION_NOTES

## 2025-11-09 – Frontend público

### Resumen
- Estructura `app-*`/`u-*` aplicada a todas las vistas cliente.
- Limpieza de CSS legacy: `style/catalogo.css`, bloques obsoletos en `style/perfil.css`, `style/registro.css`, `style/mis-pedidos.css`.
- Safelist Tailwind documentada en `frontend/style/tailwind.config.json`.
- Inventario final: 522 clases totales, 69 sin uso (ver `reports/selectors-review-20251109.md`).

### Cambios relevantes
1. `frontend/src/styles/` concentra tokens/base/utilities/components.
2. Vistas (`index`, `tienda`, `contacto`, `carrito`, `checkout`, `mis-pedidos`, `perfil`, `login`, `registro`, `marco-legal`, `nosotros`, `productos`) adoptan `app-section`, `app-card`, `app-button`, `u-container`.
3. Eliminado `frontend/style/catalogo.css`; mantener `frontend/catalogo/styles.css` sólo para la micro-app legacy.
4. Safelist Tailwind declarada en `frontend/style/tailwind.config.json` (necesaria para gradientes y utilidades dinámicas).

### Pasos pendientes
- Validar con stakeholders eliminación de estilos en: `frontend/catalogo/styles.css`, `frontend/ajustes_puntuales/css_modals.css`, `frontend/style/tienda.css`, `frontend/style/marco-legal.css`, `frontend/style/index.css`, `frontend/style/nosotros.css`, `frontend/style/checkout.css`.
- Ejecutar baseline de Lighthouse y registrar resultados.
- Configurar pipeline de build (PostCSS/Vite) para aplicar purge controlado.

