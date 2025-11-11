# RFC Refactor Front/Admin (08-11-2025)

## Objetivo
Refactorizar `frontend/admin` y subcarpetas para reducir deuda técnica, eliminar código duplicado/no usado y estandarizar estilos y scripts SIN alterar comportamiento funcional ni layout publicado en producción (GitHub Pages). El enfoque es **change-safe**: cada paso contempla verificación visual/manual y pruebas existentes.

## Alcance
- HTML, CSS y JS ubicados en `frontend/admin/**`.
- Componentes compartidos (`frontend/admin/components`), scripts utilitarios y modales.
- No se tocan rutas críticas públicas (`/frontend/*.html` cliente) salvo consumo compartido.
- No se modifican contratos con backend (`apiClient`, endpoints, payloads) ni firmas públicas (`window.authManager`, `window.adminTemplate`, etc.).

## Principios guía
- Mantener compatibilidad hacia atrás; introducir alias o wrappers transitorios si es necesario.
- Reducir dependencias globales progresivamente, sin romper inline scripts existentes.
- Documentar cada movimiento en `CHANGES.md` con secciones *removed/merged/candidate*.
- Preferir módulos pequeños y funciones puras; evitar acceso directo al DOM desde helpers compartidos.

## Convenciones aprobadas
- **CSS:** Adopción BEM adaptado (`admin-sidebar__header`, `admin-sidebar--collapsed`). Se mantendrán clases actuales durante transición con alias para no romper HTML existente, registrando la limpieza final.
- **JS:** Organización modular tipo ES modules (cuando se migre), con exportaciones nominales (no `window.*`). Durante transición, se expondrán wrappers que deleguen a los nuevos módulos.
- **Tokens de diseño:** Centralizados en `src/styles/tokens.css` (`:root{--color-*}`) para ambos temas.

## Estructura destino propuesta

```
frontend/
└── admin/
    ├── src/
    │   ├── lib/               # Código compartido (apiClient, authManager, utils, logger)
    │   ├── components/        # Header, footer, modals → HTML + JS + CSS co-localizados
    │   ├── styles/
    │   │   ├── base.css       # Reset, tipografía, layout base
    │   │   ├── utilities.css  # Helpers, spacing, display
    │   │   ├── components.css # Patrones reutilizables (cards, tablas, badges, sidebar)
    │   │   └── tokens.css     # Variables (colores, espaciados)
    │   └── views/
    │       ├── dashboard/
    │       │   ├── dashboard.html
    │       │   ├── dashboard.js
    │       │   └── dashboard.css
    │       └── ...            # Una carpeta por vista admin
    ├── public/                # HTML legacy mientras dura la migración (sirve GitHub Pages)
    ├── index.html             # Wrapper que importa assets desde build output
    └── package.json (opcional para tooling ligero)
```

*Nota:* inicialmente continuaremos sirviendo los HTML existentes. Los nuevos assets (css/js) convivirán en paralelo hasta completar la migración.

## Trabajo por fases

### Fase 1 – Preparación (semana 1)
- [ ] Congelar baseline visual (capturas críticas: index, dashboard, users, products, orders, payments, perfil).
- [ ] Registrar bundle actual (peso total CSS/JS) en `reports/bundle-20251108.md`.
- [ ] Extraer tokens de color/typo/espaciado desde `css_admin.css` a `src/styles/tokens.css`.
- [ ] Crear `src/styles/{base,utilities,components}.css` con contenido migrado desde `css_admin.css` (sin eliminar clases legacy aún).
- [ ] Configurar `src/lib/logger.js` y `src/lib/dom.js` para centralizar warnings y selectores.

### Fase 2 – CSS (semana 2)
- [ ] Migrar layout `admin-sidebar` a BEM dentro de `components.css`; mantener alias `.admin-sidebar-*` temporalmente.
- [ ] Consolidar tablas/badges en `components.css` y borrar duplicados en `orders.css`, `users.css`.
- [ ] Mover reglas estrictamente de página a `views/{vista}/{vista}.css`. Dejar `style/*.css` como wrappers que importen o inyecten alias mientras se actualizan `<link>`.
- [ ] Implementar safelist para clases generadas dinámicamente (`modal-open`, `is-active`, etc.) en futura purga.

### Fase 3 – JS (semana 3)
- [ ] Replicar `apiClient`, `authManager`, `sessionManager`, `notifications`, `utils` en `src/lib` como módulos ES (`export const apiClient = ...`).
- [ ] Crear adaptadores `frontend/admin/js/*.legacy.js` que importen los nuevos módulos y expongan la API global actual (`window.api = apiClient`).
- [ ] Refactorizar vistas (`products`, `users`, `orders`, `payments`) para usar módulos compartidos (modales, tablas, filtros) → eliminar listeners duplicados.
- [ ] Introducir `data-*` para selectores (ej. `data-admin="orders-table"`) y reemplazar queries complejas gradualmente.

### Fase 4 – Limpieza y optimización (semana 4)
- [ ] Remover assets no referenciados (imágenes, JSON obsoleto).
- [ ] Configurar build ligero (Vite sin SSR) para compilar CSS/JS; lock de versiones en `package.json`.
- [ ] Activar tree-shaking y code-splitting minimal (chunks por vista pesada: `dashboard`, `products`).
- [ ] Configurar purga CSS con safelist en `postcss.config.js`.
- [ ] Ejecutar Lighthouse (target: Perf ≥ 80, Best Practices ≥ 90) y bundle report (`reports/bundle-YYYYMMDD.md`).

### Fase 5 – Documentación y rollout
- [ ] Actualizar `README.md` con nueva estructura + comandos de build/test.
- [ ] Completar `CHANGES.md` con entradas por archivo eliminado/fusionado, alias creados y safelist.
- [ ] Elaborar `MIGRATION_NOTES.md` detallando rutas movidas, pasos para consumir módulos nuevos y cómo migrar HTML legacy a la nueva estructura.
- [ ] Validar manualmente rutas críticas (`index.html`, `dashboard.html`, `products.html`, `orders.html`, `payments.html`, `users.html`, `perfil.html`, `logistica*.html`).

## Riesgos y mitigaciones
- **GitHub Pages sin build:** Mientras no exista pipeline, necesitaremos copiar assets compilados a `frontend/admin` para mantener servicio. Mitigación: script `npm run publish:admin` que sincroniza `dist/` → `frontend/admin`.
- **Dependencias CDN (Tailwind/FontAwesome):** Purgar Tailwind sin romper clases inline requerirá safelist derivado de HTML. Mantener CDN hasta completar migración.
- **Auth estático vs backend:** `apiClient` mezcla JSON estático y backend real. Al modularizar, preservar ambos modos y probar login estático antes/después.
- **Clases usadas por tests E2E:** Catalogar atributos `data-testid`, `data-e2e` antes de renombrar. Documentar alias en `CHANGES.md`.

## Verificación
- Tests automáticos disponibles (si los hay) + smoke manual (login admin, CRUD productos, estado pedidos, pagos).
- Lighthouse comparativo (antes/después) guardado en `reports/lighthouse-YYYYMMDD.md`.
- `eslint`, `stylelint`, `prettier` ejecutados sobre nueva estructura antes de fusionar.

## Próximos pasos inmediatos
1. Crear skeleton `src/styles` y extraer tokens (sin tocar HTML).
2. Generar adaptadores JS (`apiClient.legacy.js`, etc.) y referenciarlos desde HTML como base para la migración progresiva.
3. Definir safelist y script de análisis de selectores (usando `postcss` + `rg`) para limpieza dirigida.

---
Autora: GPT-5 Codex (Arquitecto Front-End)  
Contacto: actualizar con responsable humano antes de ejecutar fases críticas.




