# Plan de migración de estilos (08-11-2025)

## Objetivo
Trasladar gradualmente los estilos de `frontend/admin/style/*.css` hacia la nueva estructura `frontend/admin/src/styles/` sin alterar la apariencia ni romper las vistas actuales.

## Estrategia por etapas

1. **Baseline**
   - Mantener `style/css_admin.css` como fuente de verdad durante la transición.
   - Registrar capturas y diffs visuales para `index`, `dashboard`, `users`, `products`, `orders`, `payments`, `perfil`, vistas `logistica*`.

2. **Tokens**
   - Validar que todos los valores de color, tipografía, espaciado y sombras estén definidos en `tokens.css`.
   - Reemplazar literales en `css_admin.css` por referencias a variables (buscar `#c05621`, `#7c2d12`, etc.).
   - Documentar variables críticas (ej. `--admin-primary-red`) en `tokens.css` con comentarios funcionales.

3. **Base & Utilities**
   - Sincronizar reglas de reset y contenedor (`.admin-container`) entre `css_admin.css` y `base.css`.
   - Identificar utilidades repetidas (`.text-right`, `.flex-center`, `.mb-3`) y mapearlas a la convención `u-*`.
   - Añadir, de forma no intrusiva, clases alias en `css_admin.css` (ej. `.admin-text-right { composes: u-text-right; }`) hasta completar la migración.

4. **Componentes**
   - Agrupar bloques reutilizados (cards, tablas, badges, botones, sidebar) en `components.css`.
   - En `css_admin.css`, reemplazar gradualmente las reglas por `@import "./src/styles/components.css";` (cuando se habilite bundler) o duplicar temporalmente manteniendo comentarios `/* TODO migrate */`.
   - Crear mapa de clases → BEM/utility (ej. `.admin-stat-card` → componente `admin-card admin-card--stat`).

5. **Vistas**
   - Mover estilos específicos (`index.css`, `dashboard.css`, etc.) a `src/views/{vista}/{vista}.css`.
   - Sustituir los `<link>` actuales por versiones compiladas (cuando exista pipeline), manteniendo alias legacy hasta confirmar ausencia de regresiones visuales.
   - Marcar en `CHANGES.md` cualquier clase eliminada o renombrada; si se duda sobre su uso, añadirla a sección *candidate*.

6. **Optimización**
   - Configurar safelist para clases generadas dinámicamente (`modal-open`, `is-active`, etc.).
   - Ejecutar análisis de selectores (`reports/deps-20251108.md`) para confirmar que no se eliminan clases utilizadas.
   - Preparar script de build (PostCSS/Tailwind prune) con pasos reproducibles.

## Riesgos y mitigación
- **Clases usadas en HTML embebido o JS**: Antes de eliminar, buscar referencias en `frontend/admin/**/*.html` y `frontend/admin/js/**/*.js`.
- **Dependencia de Tailwind CDN**: Mantener CDN hasta completar migración; documentar utilidades `tw-*` que se deban safelist.
- **Layouts GitHub Pages**: Verificar rutas relativas cuando se introduzcan archivos compilados (usar `window.BASE_PATH`).

## Checklist inmediato
- [ ] Reemplazar literales de color en `css_admin.css` por variables de `tokens.css`.
- [ ] Identificar utilidades candidatas y añadir equivalentes `u-*`.
- [ ] Catalogar componentes clave (sidebar, nav, stat cards) con mapping BEM.
- [ ] Registrar en `CHANGES.md` cualquier clase marcada como candidata antes de removerla.



