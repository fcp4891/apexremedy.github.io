Mantenedores imprescindibles
1) Pagos (payments) — RUD + acciones operativas

CRUD:

Create: ❌ (los crea el checkout/webhook)

Read: ✅ filtros avanzados

Update: ✅ (solo campos operativos: notas, tags, marcar sospechoso)

Delete: ❌ (nunca)

Acciones: Capturar, Anular (void), Reintentar, Exportar.

Filtros comunes: rango fechas, estado (authorized/captured/failed/voided), método, order_id, customer, montos, proveedor.

2) Reembolsos (refunds) — CRUD con estados

CRUD:

Create: ✅ (total o parcial)

Read: ✅

Update: ✅ (hasta “processed”)

Delete: ⚠️ solo en draft/pending

Acciones: Aprobar, Procesar (dispara al PSP), Reversar si falló, Exportar.

Validaciones clave: monto ≤ capturado − reembolsado; reason_id obligatorio.

3) Gift Cards (gift_cards) — CRUD + lote

CRUD:

Create: ✅ individual y batch (N códigos o import CSV)

Read: ✅

Update: ✅ (estado, expiración, asignación a cliente, notas)

Delete: ⚠️ solo si sin movimientos

Acciones: Activar/Desactivar, Regenerar PIN, Ajuste de saldo (vía transacción), Exportar.

Validaciones: código único, no permitir expiración pasada al crear (a menos que sea import histórico).

4) Movimientos Gift Card (gift_card_transactions) — RO + operaciones controladas

CRUD:

Create: ✅ solo top-up (recarga) y reversal controlado

Read: ✅

Update: ❌

Delete: ❌

Acciones: Reversar movimientos aplicables (p.ej., un spend asociado a pago fallido).

Validaciones: no saldo negativo; mantener balance_before/after inmutables.

Mantenedores de apoyo (recomendados)
5) Motivos de reembolso (refund_reasons) — CRUD simple

Catálogo gestionado por Postventa/Finanzas; se usa en refunds.

6) Campañas de gift card (gift_card_campaigns) — CRUD

Para segmentar emisión, tracking y reportes (breakage por campaña).

7) Métodos/Proveedores de pago (payment_methods, payment_providers) — CRUD

Activa/desactiva métodos por canal, setea comisiones/quotas, credenciales (en vault).

8) Disputas/chargebacks (chargebacks) — CRUD con flujo

Alta por webhook/operador, estados por etapa, adjuntos/evidencias y deadlines.

9) Conciliaciones/settlements (payouts, settlement_files, settlement_lines) — CRUD

Subir CSV del PSP, matching con payments, marcar conciliado y generar ajustes.

10) Monitor webhooks/jobs (webhook_deliveries) — RO + reintentos

Listado, payload, estado, retry. (No es CRUD “clásico”, pero sí mantenedor operativo).

Campos y reglas mínimas por mantenedor (resumen)

payments: id, order_id, customer_id, method, provider_id, status, amount_gross, fee, amount_net, currency, authorized_at, captured_at, failure_code, risk_score, metadata

Acciones: capture/void/retry; no delete.

refunds: id, payment_id, amount, reason_id, status(draft/pending/approved/processed/failed), requested_by, approved_by, processed_at, provider_ref, notes

Reglas: monto ≤ capturado−reembolsado; reason obligatorio.

gift_cards: id, code, pin_hash, initial_value, balance, currency, state(active/disabled/expired), issued_to_customer_id, issued_at, expires_at, campaign_id, notes

Acciones: activar/desactivar, batch, importar, ajustar saldo (crea transacción).

gift_card_transactions: id, gift_card_id, type(issue/topup/spend/reversal), amount, balance_before, balance_after, related_payment_id, order_id, refund_id, created_at, source(api/ui), operator, notes

Reglas: inmutable; no edición; reversa crea contramov.

refund_reasons: id, code, name, is_active, sort_order.

gift_card_campaigns: id, name, description, start_at, end_at, is_active, terms_url.

payment_methods/providers: id, name, provider_key, channel(web/app), fee_config, installments_config, is_active, webhook_url, retries, timeout_ms.

chargebacks: id, payment_id, case_id, stage, deadline_at, evidence_links, status, outcome, notes.

settlements: id, provider_id, period, file_name, uploaded_at, status; lines: date, provider_tx_id, amount, fee, payout_id, matched_payment_id.

Endpoints (sugerencia REST, contract-first)

Ajusta a tu stack (FastAPI/Express). Naming consistente y acciones como sub-recursos.

Payments:

GET /payments GET /payments/{id}

POST /payments/{id}/capture POST /payments/{id}/void POST /payments/{id}/retry

PATCH /payments/{id} (notes,tags,risk_flags)

Refunds:

GET /refunds GET /refunds/{id} POST /refunds

POST /refunds/{id}/approve POST /refunds/{id}/process POST /refunds/{id}/reverse

PATCH /refunds/{id} DELETE /refunds/{id} (solo draft/pending)

Gift cards:

GET /gift-cards GET /gift-cards/{id} POST /gift-cards PATCH /gift-cards/{id} DELETE /gift-cards/{id}

POST /gift-cards/batch POST /gift-cards/import

POST /gift-cards/{id}/activate POST /gift-cards/{id}/disable

POST /gift-cards/{id}/top-up POST /gift-cards/{id}/adjust (genera transacción)

Gift card transactions:

GET /gift-card-transactions GET /gift-card-transactions/{id}

POST /gift-card-transactions/{id}/reverse (cuando aplique)

Catálogos y soporte:

CRUD /refund-reasons

CRUD /gift-card-campaigns

CRUD /payment-methods CRUD /payment-providers

CRUD /chargebacks

CRUD /settlements (+ POST /settlements/import)

Permisos rápidos

Finanzas: full en payments/refunds/settlements; ver gift cards.

Marketing: full en gift cards/campaigns.

Riesgo: chargebacks, reglas antifraude, marcar sospechosos.

Soporte: ver payments, crear refund (solicitud), ver movimientos gift card.

Auditor: solo lectura + export con PII enmascarada.