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

✅ Prompt Parte 7: Pagos y Envíos (Webpay/Flow/MP + Webhooks + Simulador Dev)
Actúa como ingeniero de pagos senior. Implementa el subsistema de **Pagos y Envíos** del e-commerce (Partes 1–6). Entrega controladores, servicios, webhooks, contratos, tests y documentación operativa.

## 0) Reglas globales
- Moneda: CLP (entero, `amountCents` sin decimales contables; si el proveedor usa decimales, normaliza).
- Idempotencia: todas las operaciones críticas (`start`, `confirm`, webhooks) deben aceptar `Idempotency-Key` y evitar dobles cobros/duplicados.
- Rounding: define una sola regla (round half up) y testéala.
- Trazabilidad: `paymentRef` legible (ej. `ORD-<orderId>-<timestamp>`) + `traceId` en logs.
- Estados de order: `pending → paid → shipped → delivered` (y `failed/cancelled`). Cambios auditados en `system_logs`.

## 1) Proveedores soportados y sandbox
- **Webpay Plus (Transbank)**: `provider = "webpay"`.
- **Flow**: `provider = "flow"`.
- **MercadoPago**: `provider = "mp"`.
- **test**: proveedor interno para entorno dev.

> Implementa “drivers” con interfaz común:
```ts
interface PaymentDriver {
  start(input: { orderId:number; amountCents:number; returnUrl:string; notifyUrl:string; customer:{email:string} }): Promise<{ redirectUrl?:string; initPayload?:any; providerTxnId:string }>;
  confirm(input: { providerTxnId:string; token?:string; params?:any }): Promise<{ status:"paid"|"failed"; authCode?:string; paidAmountCents?:number; raw?:any }>;
  verifyWebhook(sigHeader:string, rawBody:Buffer): boolean; // si aplica
  parseWebhook(rawBody:any): { providerTxnId:string; status:"paid"|"failed"; paidAmountCents:number; raw:any };
}

2) Endpoints del backend (API Parte 4)

POST /api/payments/start (auth)

Body: { orderId:number, provider:"webpay"|"flow"|"mp"|"test" }

Respuesta: { provider, providerTxnId, redirectUrl?, initPayload? }

Reglas:

Valida order.pending, totales y stock aún disponible (soft-lock opcional por 10 min).

Guarda transacción en payments (o transactions) con status="initiated".

Genera returnUrl (front) y notifyUrl (webhook) por proveedor.

POST /api/payments/confirm (auth)

Body: { orderId, provider, token?, params? } (proveedor depende)

Acción:

Llama driver.confirm(), compara montos y actualiza orders.status y payments.status.

Si paid: decrementa stock variante y fija orders.paymentRef, authCode.

Respuesta: { status, orderId, paymentRef }

Webhooks (públicos):

POST /webhooks/payments/webpay

POST /webhooks/payments/flow

POST /webhooks/payments/mp

Pasos:

Verificar firma y replay-protection (timestamp + nonce + dedupe por jti/evtId).

driver.parseWebhook() → reconciliar providerTxnId ↔ orderId.

Upsert transacción; si paid y aún no aplicado → cerrar order (paid) y decrementar stock. Si ya aplicado → idempotencia = no-op.

Log estructurado + 200 OK siempre (retries manejados).

3) Modelo de datos (DB)

payments (o transactions):

id PK, order_id FK, provider, provider_txn_id, status ∈ {initiated, pending, paid, failed, refunded}, amount_cents, auth_code, raw_payload JSONB, created_at, updated_at, idempotency_key

Índices: idx_payments_provider_txn, idx_payments_order_status.

(Opcional) payment_events: historial de callbacks y confirmaciones (auditoría fina).

4) Implementación por proveedor (drivers)

Webpay:

start: crear transacción, obtener token y url → redirectUrl.

confirm: consumir commit con token_ws; validar amount, status=AUTHORIZED, authorization_code.

Webhook: no siempre disponible; soporta confirmación por return + reconciliación.

Flow:

start: crear pago, redirección con payment_url; firma HMAC.

Webhook: validar firma; estados paid/rejected.

MercadoPago:

start: preferencia → init_point.

Webhook: topic=payment/type=payment, validar x-signature y x-request-id; consulta estado a API si hace falta; approved=paid.

test:

start: retornar redirectUrl="/checkout/success?mock=1&orderId=...".

confirm: si params.mock === "paid" → paid; else failed.

Webhook: opcional.

Cada driver coloca sandbox keys vía .env y tiene mapper a nuestro modelo (paid|failed, authCode, paidAmountCents).

5) Flujo de orden y stock

Solo al estado paid:

Disminuir product_variants.stock por cada order_item.

Recalcular orders.totalCents y assert contra paidAmountCents.

Si mismatch → marcar payments.status="failed" + alerta (no cerrar orden).

Reintentos:

Si initiated o pending por >30 min → expirar y liberar soft-lock stock.

confirm debe ser idempotente (mismo providerTxnId no produce doble paid).

6) Envíos (shipping)

Métodos soportados:

retiro_tienda (costo 0 o tarifa).

courier: chilexpress, starken, manual.

Endpoint:

POST /api/shipping/quote (auth)

Body: { address, courier?, items:[{variantId, qty}] }

Retorna { methods:[{code, label, priceCents, etaDays}], best:string }

Estrategia por defecto: tabla por región/peso/total (config JSON).

Guardado en order:

orders.shippingMethod, orders.shippingPriceCents, orders.address_id.

Admin puede setear tracking: PATCH /api/admin/orders/{id}/tracking → { courier, tracking }.

Validación de dirección:

Formato mínimo: addressLine, comuna, region.

(Opcional) validador externo; si no, normaliza en backend.

7) Contratos de respuesta y errores (estándar Parte 4)

Para /start:

{ "provider":"webpay", "providerTxnId":"...", "redirectUrl":"https://..." }


Para /confirm:

{ "status":"paid", "orderId":123, "paymentRef":"ORD-123-20251102", "authCode":"ABCD12" }


Errores:

{ "error": { "code":"validation_error", "message":"Stock insuficiente en una línea", "details":[{"variantId":88,"issue":"no_stock"}], "traceId":"..." } }

8) Seguridad y antifraude

Verifica firma de webhooks (HMAC o firma asimétrica).

Clock-skew: acepta hasta ±5 min; rechaza más antiguo (replay).

Rate limit webhooks por IP/ASN conocido del proveedor (si posible) + key secreto.

Campos auditables: IP cliente en start/confirm, userAgent, fingerprint (opcional).

9) Tests (obligatorios)

Unit: PaymentService.start/confirm, drivers (mocks HTTP).

Integration:

checkout → start(webpay) → confirm(token_ws) → order.paid, stock decrece.

webhook paid duplicado → idempotencia (no duplica).

Monto proveedor ≠ order → marca failed y no decrementar stock.

provider=test con mock=paid y mock=failed.

shipping.quote devuelve métodos coherentes ante items y región.

E2E (opcional): flujo completo con provider=test.

10) Operación y documentación

.env.example:

WEBPAY keys (commerce code, api key), FLOW keys (apiKey, secret), MP (access token).

PUBLIC_BASE_URL (para return/notify).

README “Pagos y Envíos”:

Diagramas de secuencia para cada proveedor.

URLs de sandbox y pruebas.

Tabla de mapeo de estados proveedor → paid/failed.

Procedimiento de reconciliación diaria: listar pagos paid por proveedor y cruzar con orders.

Observabilidad: logs JSON incluyen traceId, orderId, provider, providerTxnId, latencyMs.