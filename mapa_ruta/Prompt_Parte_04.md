✅ Prompt Parte 4: API REST (Contratos, Seguridad, Errores, Webhooks)
Actúa como ingeniero backend senior. Implementa una API REST para el e-commerce de dispensario descrito en las Partes 1–3. Entrega:

1) Especificación OpenAPI 3.1 (YAML/JSON) completa.
2) Controladores/routers por módulo, servicios, y capa de persistencia.
3) Validaciones y manejo de errores consistente.
4) Seguridad (JWT, roles, CORS, rate limiting).
5) Webhooks de pago y evidencias.
6) Tests de integración (happy/edge cases).

## 0) Lineamientos técnicos
- Lenguaje: (elige) Python FastAPI o Node/Express — sé consistente.
- Respuestas JSON con `camelCase`.
- Paginación estándar: `page`, `pageSize` (defaults: 1 y 20; máx: 100); devuelve `total`, `items`.
- Filtros y orden: `?q=`, `?category=`, `?isActive=`, `?sort=price,-createdAt`.
- Fechas en ISO8601 UTC.
- Incluye `healthz` y `readyz`.

## 1) Seguridad y middleware
- Autenticación: JWT (access + refresh). Expiración configurable. Revocación por `jti`.
- Autorización: RBAC básico `role in {admin, customer}`. Middlewares `requireAuth`, `requireAdmin`.
- CORS: restringe a dominios configurables (Pages y dominio de prod).
- Rate limiting: p. ej. 60 req/min por IP en rutas públicas sensibles (login, register).
- Validación de RUT chileno en endpoints de registro/actualización de perfil (si se provee).
- Sanitización contra XSS/SQLi (según stack).
- Subida de archivos: validar extensión, tamaño (≤10MB), antivirus opcional.

## 2) Modelo de error unificado
Estructura de error **estándar** en todas las rutas:
```json
{
  "error": {
    "code": "string_constant",
    "message": "Human readable",
    "details": [{"field":"email","issue":"invalid_format"}],
    "traceId": "uuid"
  }
}

Usa códigos: validation_error, not_found, unauthorized, forbidden, conflict, rate_limited, internal_error.

Incluir traceId (correlación de logs).

3) Autenticación & Usuarios

Rutas

POST /api/auth/register → crea usuario (customer).

POST /api/auth/login → JWT (access/refresh).

POST /api/auth/refresh

POST /api/auth/logout → revoca token (opcional con blacklist/jti).

GET /api/me (auth) → perfil actual.

PATCH /api/me (auth) → actualiza nombre, email, RUT (valida formato), dirección por defecto (si aplica).

Admin:

GET /api/users (admin, paginado + filtros por q, role, isActive)

GET /api/users/{id} (admin)

PATCH /api/users/{id} (admin, cambios de role, isActive)

DELETE /api/users/{id} (admin)

Validaciones clave

Email único, RUT único (si se almacena).

Password: min 8, complejidad básica.

Hash con bcrypt/argon2.

4) Productos & Categorías

Rutas públicas

GET /api/categories (filtros: isMedicinal)

GET /api/products (paginado, filtros: q, category, isActive, priceMin, priceMax)

GET /api/products/{id}

GET /api/products/{id}/variants

Rutas admin

POST /api/categories (admin)

PATCH /api/categories/{id} (admin)

DELETE /api/categories/{id} (admin; rechaza si tiene productos)

POST /api/products (admin) — incluye subida de imagen principal (multipart).

PATCH /api/products/{id} (admin)

DELETE /api/products/{id} (admin)

POST /api/products/{id}/variants (admin)

PATCH /api/variants/{id} (admin)

DELETE /api/variants/{id} (admin)

Reglas

sku único por variant.

stock y priceCents ≥ 0.

Medicinal: category.isMedicinal=true bloquea visualización/compra a usuarios no validados.

5) Carrito & Checkout (lado servidor)

POST /api/cart (auth) → crea/recupera carrito activo del usuario (o usar carrito en cliente y solo enviar al checkout).

POST /api/checkout/preview (auth) → calcula totales: líneas, descuentos, envío.

POST /api/checkout/confirm (auth) → genera order en estado pending + inicia pago en proveedor.

POST /api/checkout/coupon/apply (auth) → aplica cupón si válido (fecha, límite, mínimo).

Validaciones de stock

Antes de confirmar order, valida stock por variantId.

Reserva/lock de stock (opcional) con expiración.

6) Órdenes

GET /api/orders (auth, paginado; devuelve solo las del usuario actual)

GET /api/orders/{id} (auth; dueño o admin)

GET /api/admin/orders (admin, filtros por status, paymentProvider, dateFrom/dateTo)

PATCH /api/admin/orders/{id} (admin; cambia status entre: pending, paid, failed, shipped, delivered, cancelled)

POST /api/orders/{id}/cancel (auth; si pending, permitir cancelar)

GET /api/orders/{id}/invoice → descarga/URL de comprobante (opcional)

Reglas de negocio

Al pasar a paid: decrementar stock variantes (quantity).

totalCents = sum(lineTotalCents) consistente.

Cambios de estado auditan system_logs.

7) Pagos (Chile)

Proveedores soportados: webpay, flow, mp (mercado pago), test.

POST /api/payments/start (auth) → body: { orderId, provider } → devuelve redirectUrl o initPayload del proveedor.

POST /api/payments/confirm (auth) → para flujos que vuelven al sitio con token/transactionId.

Webhooks:

POST /webhooks/payments/webpay

POST /webhooks/payments/flow

POST /webhooks/payments/mp

Validar firma y origen en webhooks; actualizar orders.status según resultado.

Guardar payment_ref, montos, raw_payload en tabla de evidencias/transactions.

8) Productos medicinales (documentos y acceso)

GET /api/medicinal/me/docs (auth)

POST /api/medicinal/me/docs (auth, multipart) → docType in {receta, certificado}, PDF/JPG/PNG.

DELETE /api/medicinal/me/docs/{id} (auth, si status != approved)

Admin:

GET /api/admin/medicinal/docs (admin, filtros por status)

PATCH /api/admin/medicinal/docs/{id} (admin) → status in {approved, rejected}, notes, reviewedBy

Regla de visibilidad/compra:

Si category.isMedicinal=true, solo mostrar/permitir compra cuando user.validatedMedicinal=true o al menos un doc approved.

9) Envíos & Direcciones

GET /api/addresses (auth)

POST /api/addresses (auth)

PATCH /api/addresses/{id} (auth)

DELETE /api/addresses/{id} (auth)

POST /api/shipping/quote (auth) → calcula costos (tabla interna o integración con courier).

PATCH /api/admin/orders/{id}/tracking (admin) → guarda courier, tracking, fecha estimada.

10) Reseñas y marketing

GET /api/products/{id}/reviews (paginado)

POST /api/products/{id}/reviews (auth; solo si compró el producto) → rating 1–5, texto moderado (longitud/insultos).

Admin: PATCH /api/reviews/{id} (toggle isVisible)

Cupones:

GET /api/coupons (admin)

POST /api/coupons (admin)

Validación de vigencia/uso en checkout; incrementar usedCount al paid.

11) Imágenes y archivos

POST /api/uploads/image (admin, multipart) → devuelve url, valida mime y tamaño.

POST /api/uploads/doc (auth, multipart) → documentos medicinales del usuario.

Opcional: integración Cloudinary/AWS S3 — devuelve URLs firmadas.

12) Logs y auditoría

GET /api/admin/logs (admin, filtros: actor, action, entity, dateFrom/dateTo)

Cada acción relevante (CRUD, cambio de estado, login fallido) debe crear una entrada en system_logs:

{ actorUserId, action, entity, entityId, meta, createdAt }

13) Esquemas de request/response (OpenAPI)

Define schemas reutilizables:

User, UserPublic, UserCreate, UserUpdate

AuthTokens (access, refresh, expiresIn)

Category, Product, ProductVariant

ProductListResponse (paginado)

Order, OrderItem, OrderListResponse

Address, Coupon, Review, MedicinalDocument

ErrorResponse
Incluye ejemplos (example) por cada schema y por cada endpoint.

14) Testing

Tests de integración con base de datos temporal:

Registro/login, expiración de tokens.

CRUD productos/categorías (admin vs customer).

Flujo de checkout: carrito → preview → confirm → pago test → webhook → paid → stock decrementado.

Medicinal: subir documento → admin aprueba → usuario puede ver/comprar medicinal.

Seguridad: rutas protegidas, rate limiting, CORS.

Casos límite: stock 0, cupón expirado, pedido cancelado.

15) Observabilidad

Middleware para requestId/traceId.

Logs estructurados JSON (nivel info/warn/error), incluyendo traceId, userId, method, path, latencyMs.

Endpoint GET /metrics (si usas Prometheus), o al menos contadores básicos en logs.

16) Entregables

Carpeta src/ con routes/, services/, models/, repositories/, middlewares/, utils/.

openapi.yaml generado/actualizado.

dockerfile y compose.yaml para levantar API + DB (Postgres recomendado).

Script seed para datos mínimos.

README.md con instrucciones de run, .env, claves de pago test, y tabla de rutas.