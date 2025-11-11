# RFC Refactor Front Público (09-11-2025)

## Objetivo
Refactorizar y optimizar el frontend público (`frontend/` excluyendo `frontend/admin`) eliminando deuda técnica, código duplicado/no usado y estandarizando estilos y scripts **sin alterar el comportamiento ni la experiencia visual publicada**. El trabajo se hará en etapas pequeñas con verificaciones manuales y automatizadas para mantener un enfoque *change-safe*.

## Alcance
- HTML, CSS, JS y assets ubicados en `frontend/` (home, tienda, catálogo, carrito, checkout, login, registro, perfil, mis pedidos, nosotros, contacto, marco legal, vistas de poder de cultivo y mapas).
- Componentes compartidos (`frontend/components/*.html`) y scripts globales (`frontend/js/*.js`, `frontend/js/api/*.js`).
- No se modifican contratos con backend ni APIs públicas (`window.authManager`, `window.cart`, `window.api`, endpoints REST).
- No se tocan archivos en `frontend/admin/**` (ya cubiertos por RFC anterior).

## Principios guía
- **Compatibilidad:** Mantener clases y APIs actuales mientras se introducen alias/puentes; eliminar definitivamente solo tras confirmar no uso.
- **Documentación continua:** Registrar cada eliminación/fusión/movimiento en `CHANGES.md` con secciones `removed`, `merged`, `candidate`.
- **Modularidad progresiva:** Extraer funciones puras primero, luego reemplazar usos globales; evitar reescrituras completas de una sola vez.
- **Selectores robustos:** Adoptar atributos `data-*` para nuevos selectores JS; evitar dependencias en clases destinadas a estilos.
- **CSS sin sorpresas:** Evitar `!important` salvo justificado; máximo tres niveles de anidación; un solo reset global.

## Convención aprobada
- **CSS:** Se adopta **BEM ligero + utilidades acotadas**. Bloques `app-*`, elementos `__`, modificadores `--`. Las utilidades se nombran `u-*` y viven en `utilities.css`. Se mantendrán alias de las clases actuales hasta que los HTML se actualicen.
- **JS:** Ficheros compartidos como ES modules en `src/lib/`, exportando funciones puras. Adaptadores legacy expondrán la API global (`window.*`) hasta completar migración.

## Estructura destino propuesta

```
frontend/
├── src/
│   ├── assets/                # Imágenes optimizadas (WebP cuando aplique)
│   ├── lib/                   # JS compartido (apiClient, auth, cart, template, utils, logger)
│   ├── styles/
│   │   ├── tokens.css         # :root { --color-*, --space-* }
│   │   ├── base.css           # Reset + tipografía + layout global
│   │   ├── utilities.css      # Clases u-*
│   │   ├── components.css     # Componentes reusables (nav, cards, modals, carrito)
│   │   └── themes/            # Overrides específicos (ej. modo oscuro futuro)
│   └── views/
│       ├── home/
│       │   ├── home.html
│       │   ├── home.css
│       │   └── home.js
│       ├── tienda/
│       ├── carrito/
│       ├── checkout/
│       ├── auth/              # login + registro
│       ├── perfil/
│       ├── mis-pedidos/
│       ├── informacion/       # nosotros, marco legal, contacto
│       └── especiales/        # poder_cultivo, mapas, catálogo legacy
├── public/                    # HTML legacy servido por GitHub Pages durante transición
├── package.json               # Dependencias bloqueadas + scripts build/test/lint
└── reports/, docs/            # Documentación consolidada
```

Los HTML actuales permanecerán en la raíz; se actualizarán sus `<link>` / `<script>` a medida que se generen assets compilados desde `src/`.

## Trabajo por fases

### Fase 0 – Baseline (día 0)
- [ ] Congelar capturas de vistas críticas (`index`, `tienda`, `productos`, `carrito`, `checkout`, `login`, `registro`, `perfil`, `mis-pedidos`, `contacto`, `nosotros`, `marco-legal`).
- [ ] Medir peso actual de CSS/JS (sin cache) y guardarlo en `reports/bundle-20251109.md`.
- [ ] Registrar resultados Lighthouse iniciales (Perf ≥75, BP ≥85) para comparativa.

### Fase 1 – CSS (semana 1)
- [ ] Extraer tokens de `style/css_home.css` hacia `src/styles/tokens.css`; reemplazar literales por variables (manteniendo fallback legacy).
- [ ] Separar reset y layout base en `base.css`; mover utilidades repetidas (`.container`, `.text-center`, `.cta-button`) a `utilities.css` / `components.css`.
- [ ] Crear wrappers temporales en `style/*.css` que importen/reenlacen nuevas hojas (o dupliquen reglas con comentarios `/* TODO migrate */`).
- [ ] Auditar selectores no usados con tooling (`postcss-selector-parser` + `rg`); marcar candidatos en `CHANGES.md`.

### Fase 2 – Componentes y vistas (semana 2)
- [ ] Reestructurar `components/header*.html` y `footer*.html` para eliminar estilos inline, usando clases BEM nuevas (`app-header`, `app-footer`).
- [ ] Co-localizar estilos y scripts por vista en `src/views/*`; los HTML legacy cargarán versiones compiladas.
- [ ] Unificar estilos duplicados de secciones (`.section-header`, `.about-grid`, `.registration-notice-section`) en `components.css`.
- [ ] Implementar `data-*` en markup crítico para facilitar JS (ej. `data-cart-toggle`, `data-auth-section`).

### Fase 3 – JS compartido (semana 3)
- [ ] Migrar `template.js`, `carrito.js`, `productModal.js`, `checkout.js`, `utils.js`, `auth.js`, `notifications.js`, `api/apiClient.js` a `src/lib/` con exports nominales.
- [ ] Crear adaptadores legacy (`js/template.legacy.js`, etc.) que importen los nuevos módulos (via build) y mantengan `window.*`.
- [ ] Centralizar lógica de carrito en `lib/cartService.js` (estado, render, eventos) y reutilizar en `tienda`, `carrito`, `checkout`, `productos`.
- [ ] Sustituir listeners duplicados por delegación (`document.addEventListener('click', handler)` con `data-action`).

### Fase 4 – Optimización (semana 4)
- [ ] Configurar bundler ligero (Vite preferido) con tree-shaking, code-splitting por vista y PostCSS (autoprefixer + cssnano + purge con safelist).
- [ ] Minimizar CSS eliminando reglas no usadas y usando purge sobre HTML/JS (whitelist `modal-open`, `is-active`, `cart-open`, etc.).
- [ ] Optimizar assets (convertir PNG pesados a WebP, aplicar `srcset` si aplica).
- [ ] Generar `reports/bundle-202511??.md` comparando pesos y documentar mejoras.

### Fase 5 – Documentación y rollout (semana 5)
- [ ] Actualizar `docs/README.md` (índice) con guías unificadas (instalación, build, lint, tests).
- [ ] Complementar `CHANGES.md` con lista de archivos eliminados/unificados y safelist CSS.
- [ ] Redactar `MIGRATION_NOTES.md` para rutas movidas y alias temporales.
- [ ] Validar lighthouse post-refactor (Perf ≥ baseline, ideal +5 pts) y smoke manual en rutas críticas.

## Riesgos y mitigaciones
- **GitHub Pages sin pipeline:** Mientras no exista build automatizado, se generará tarea `npm run publish:front` que copia `dist/` → `frontend/` conservando estructura esperada por Pages.
- **Clases usadas por JS/tests:** Antes de renombrar, mapear dependencias con búsqueda (`rg`) y documentar alias en `CHANGES.md`. Mantener clase legacy como alias hasta eliminar todos los usos.
- **Tailwind CDN:** Mantener CDN hasta confirmar que utilidades usadas tengan equivalente local o safelist en purge. Documentar clases tailwind en `CHANGES.md`.
- **Catalogo legacy (`frontend/catalogo/`):** Micro-app independiente con su propio build. Se aislará bajo `src/views/catalogo/` pero se mantendrá bundle legacy hasta replicar funcionalidad.
- **Inline styles críticos:** Migrarlos gradualmente garantizando que componentes mantengan layout. Validar con capturas antes de eliminar inline.

## Verificación
- Ejecutar `npm run lint` (eslint + stylelint + prettier) sobre nuevo código.
- Tests manuales: login, agregar al carrito, checkout, actualización de perfil, visualización de catálogo, formulario de contacto.
- Lighthouse antes/después guardado en `reports/lighthouse-20251109.md` y `reports/lighthouse-YYYYMMDD.md`.
- Smoke en dispositivos móviles (Chrome devtools) para hero, nav, carrito lateral.

## Próximos pasos inmediatos
1. Crear `src/styles/{tokens,base,utilities,components}.css` y replicar tokens desde `style/css_home.css` (sin borrar legacy).
2. Preparar script de extracción de selectores para identificar reglas no usadas antes de purgar.
3. Definir plan de safelist inicial para clases dinámicas y utilidades Tailwind.
4. Documentar en `CHANGES.md` la creación de inventario (`reports/deps-20251109.md`) y RFC.

---
Autor: GPT-5 Codex (Arquitecto Front-End)  
Contacto: coordinar con responsable humano antes de ejecutar fases destructivas.



