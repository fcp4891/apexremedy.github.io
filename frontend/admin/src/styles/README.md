# Estilos Admin (fase de migración)

- `tokens.css`: variables de diseño compartidas (colores, tipografía, efectos).
- `base.css`: reset ligero y layout general. Depende de `tokens.css`.
- `utilities.css`: clases utilitarias neutras (`u-*`), pensadas para reemplazar helpers inline.
- `components.css`: patrones comunes (tarjetas, botones, tablas, badges).

> Estos archivos todavía no se importan desde los HTML legacy. Se usarán progresivamente al refactorizar `style/css_admin.css` y las hojas por vista.



