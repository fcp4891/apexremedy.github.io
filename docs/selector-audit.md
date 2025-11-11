# Auditoría de selectores (frontend público)

## Objetivo
Identificar clases CSS definidas en el frontend público que no tienen uso real en HTML/JS y preparar la transición hacia purga segura de estilos.

## Herramientas
- Script principal: `scripts/analyze-front-selectors.js`
- Safelist Tailwind: `frontend/src/styles/tailwind.safelist.json`
- Resultado por defecto: `reports/selectors-YYYYMMDD.json`

## Ejecución
```bash
npm run front:scan-selectors
```
Opciones:
- `--verbose`: muestra progreso y archivos analizados.
- Sin `--write`: imprime el JSON en consola en lugar de guardarlo.

Example manual:
```bash
node scripts/analyze-front-selectors.js --verbose
```

## Flujo recomendado
1. Ejecutar el script y revisar `reports/selectors-YYYYMMDD.json`.
2. Las entradas con `"isUnused": true` son candidatas para limpieza; validar manualmente antes de eliminar.
3. Documentar decisiones en `CHANGES.md` (sección *removed/merged/candidate*).
4. Actualizar `frontend/src/styles/tailwind.safelist.json` con las clases dinámicas necesarias antes de activar purga.
5. Registrar análisis narrativo en `reports/selectors-review-YYYYMMDD.md` para dejar contexto (ejemplo: `reports/selectors-review-20251109.md`).

## Advertencias actuales
- Algunos CSS legacy contienen errores de sintaxis (`Unexpected }`). El script los ignora y reporta `warn` en la consola; corregir esos archivos antes de depender al 100 % del reporte.
- La detección de uso se basa en coincidencias de texto simples; revisa manualmente casos especiales (clases generadas en runtime o plantillas string).

## Próximos pasos sugeridos
- Expandir el script para detectar selectores de atributos y estados (`[data-*]`, pseudo-clases).
- Integrarlo con un pipeline de build (Vite/PostCSS) para generar reporting post-build.
- Añadir pruebas unitarias mínimas para el script en cuanto se estabilice.

