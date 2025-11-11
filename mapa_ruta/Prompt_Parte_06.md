✅ Prompt Parte 6: Panel Administrativo (CRUD, Import/Export, KPIs, Medicinal)
Actúa como frontend/admin engineer senior. Construye el **Panel Administrativo** del e-commerce (Vue 3 + Vite + Pinia + Tailwind), consumiendo la API REST de la Parte 4. Entrega vistas, componentes, stores y tests.

## 0) Principios
- Rutas bajo `/admin/*`, protegidas con guard `requireAdmin`.
- Diseño responsive con 3 áreas: Sidebar (navegación), Topbar (búsqueda/acciones), Content (tablas/gráficos).
- Tabla reutilizable con: paginación, search, filtros, orden, columnas visibles, export CSV.
- Formularios con validaciones (zod/yup) y toasts estandarizados.
- Acciones masivas (bulk): activar/desactivar, actualizar stock, categoría, precio.

## 1) Rutas y páginas
- `/admin/dashboard` → KPIs y gráficos.
- `/admin/products` → tabla + filtros + bulk + export/import CSV.
- `/admin/products/new` y `/admin/products/:id` → formulario con variantes e imágenes.
- `/admin/orders` → tabla + estados + detalle + cambio de estado + tracking.
- `/admin/users` → tabla + roles + activar/bloquear.
- `/admin/medicinal` → **revisión de documentos** (pending/approved/rejected).
- `/admin/coupons` → CRUD cupones.
- `/admin/logs` → auditoría (filtros por actor, acción, entidad, fecha).

## 2) Componentes UI (reutilizables)
- `AdminShell.vue` (layout con Sidebar/Topbar/Content).
- `DataTable.vue` (props: columns, rows, total, page, pageSize, sort; events: onPage, onSort, onFilter).
- `ColumnVisibility.vue`, `BulkActions.vue`, `FilterBar.vue`, `DateRangePicker.vue`.
- `CsvImporter.vue` (drag&drop .csv, mapea columnas, valida, preview, confirma).
- `ImageUploader.vue` (acepta múltiples, limita tamaño/MIME, muestra thumbnails).
- `KpiCard.vue`, `TrendChart.vue`, `BarChart.vue` (usa chart lib o ECharts).

## 3) Stores (Pinia)
### admin.products.store.ts
state: { list, total, loading, filters, selectedIds }
actions:
  - fetch({q, category, isActive, page, pageSize, sort})
  - create(productPayload)
  - update(id, payload)
  - remove(id)
  - bulkUpdate({ids, patch})
  - uploadImage(file) → /api/uploads/image
  - importCsv(rows[]) → /api/products/import (si no existe, usar bucle create)
getters: selectedCount

### admin.orders.store.ts
state: { list, total, filters, loading }
actions:
  - fetch({status, dateFrom, dateTo, q, page, pageSize})
  - getById(id)
  - setStatus(id, status)      // pending|paid|failed|shipped|delivered|cancelled
  - setTracking(id, {courier, tracking})
  - exportCsv(params)

### admin.users.store.ts
- fetch, updateRole, toggleActive, exportCsv

### admin.medicinal.store.ts
- fetch({status}), review(id, {status, notes}), getDocumentFile(id)

### admin.coupons.store.ts
- list/create/update/delete, toggleActive

### admin.logs.store.ts
- fetch({actor, action, entity, dateFrom, dateTo, page})

## 4) Dashboard (KPIs + gráficos)
KPIs (cards):
- Ventas del día (totalCents), Ventas 7 días, Órdenes pendientes, Stock bajo (<5).
Gráficos:
- Ventas por día (últimos 30) → /api/admin/analytics/salesByDay
- Top productos (unidades) → /api/admin/analytics/topProducts?limit=10
- Mapa de estados de órdenes (pie/bar) → /api/admin/analytics/ordersByStatus

Aceptación:
- Los endpoints deben existir en el backend o simularse temporalmente con `/admin/stats` y vistas SQL (Parte 3).

## 5) Products (tabla + form)
Tabla:
- Columnas: imagen, nombre, categoría, activo, variantes, stock total (suma variantes), creado.
- Filtros: q (texto), categoría, activo, rango de precio (min/max).
- Acciones bulk: activar/desactivar, **actualizar stock** (+/-), mover de categoría, eliminar (con confirm).
- Export CSV: columnas visibles.
- Import CSV:
  - Cabeceras mínimas: `name,categorySlug,description,imageUrl,isActive,variantSku,variantLabel,variantPriceCents,variantStock`
  - Valida duplicados de `sku` y categorías inexistentes.
  - Vista previa con errores por fila antes de confirmar.
Formulario:
- Campos: nombre, slug auto, categoría, descripción, activo, imagen principal (uploader).
- Variantes: tabla editable (sku único, label “1g/5g/10g…”, precio, stock, activo).
- Guardar/Cancelar; toast de éxito/error.

## 6) Orders
Tabla:
- Columnas: #orden, cliente, total, estado, método pago, fecha, acciones.
- Filtros: estado, fecha desde/hasta, q (por email/ordenId/ref pago).
Detalle:
- Datos del comprador, dirección, líneas con variantes, total, costos de envío, cupón.
- Cambiar estado con dropdown (confirm modal).
- Guardar tracking (courier, número).

Reglas:
- Si pasa a `paid`: decrementar stock (backend).
- Si `cancelled`: no permitir volver a `paid`.
- Mostrar historial de cambios (logs si disponibles).

## 7) Users
Tabla:
- Columnas: email, nombre, rol, activo, creado.
- Filtros: rol, activo, q.
Acciones:
- Cambiar rol (customer/admin) con confirm.
- Activar/bloquear usuario.

## 8) Medicinal (revisión)
Tabla:
- Columnas: usuario, tipo doc (receta/certificado), estado, fecha, notas, archivo.
- Filtros: status, q (por email/nombre).
Detalle/SidePanel:
- Preview del archivo (PDF/img) en iframe o viewer.
- Botones: **Aprobar** / **Rechazar** + notas → actualiza `status` y `reviewedBy`.
- Al aprobar, marcar `user.validatedMedicinal=true` (backend).

## 9) Coupons
CRUD:
- Campos: code (único), tipo (percent/fixed), valor, mínimo, vigencia (desde/hasta), usageLimit, isActive.
- Tabla con filtros por vigencia/activo; contador `usedCount`.

## 10) Logs (auditoría)
- Tabla con columnas: fecha, actor (email/id), acción, entidad, entityId, meta (json collapsible).
- Filtros: actor, acción, entidad, rango fecha.
- Ver detalle expandible.

## 11) Integración API (contratos)
- Usa los endpoints de la Parte 4. Cuando falte alguno, propón `GET /api/admin/analytics/...` y `POST /api/products/import`.
- Errores con el **modelo unificado**:
  `{ error: { code, message, details?, traceId } }`
- Mapea `camelCase` en el cliente.

## 12) Accesibilidad y usabilidad
- Cada acción muestra toast (success/error).
- Botones de acción tienen `aria-label`.
- Formularios con mensajes de error por campo.
- Modales accesibles con focus trap y `Esc`.

## 13) Tests (Vitest)
- `DataTable` (paginación, sort, filtros).
- `CsvImporter` (mapeo, preview, errores).
- Flujos:
  - Crear producto con variantes.
  - Import masivo CSV con duplicados de sku (muestra errores).
  - Cambiar estado de orden (pending→paid; paid→shipped).
  - Aprobar documento medicinal (veo producto medicinal desde cliente autenticado).
- Mocks de API (msw) para rutas críticas.

## 14) Entregables
- Páginas: Dashboard, Products (+Form), Orders (+Detail), Users, Medicinal, Coupons, Logs.
- Componentes UI reusables (DataTable, CsvImporter, ImageUploader, KpiCard, TrendChart, etc.).
- Stores Pinia y services axios por módulo.
- README con scripts (`dev`, `build`, `preview`, `test`) y variables `.env` (API base).