✅ Prompt Parte 8: Seguridad Avanzada y Cumplimiento (Chile)
Actúa como Security Engineer. Refuerza la plataforma del e-commerce con controles de seguridad, cumplimiento legal y observabilidad. Implementa políticas, middlewares, validaciones, cifrado y registros de auditoría con estándar productivo.

## 0) Principios y alcance
- Modelo Zero-Trust a nivel API: todo endpoint sensible requiere autenticación y/o rol.
- Mínimo privilegio: RBAC estricto (admin vs customer) y separación de datos.
- Política de datos: privacidad por defecto; no exponer campos sensibles en respuestas.
- Todo cambio sensible debe quedar auditado (system_logs).

## 1) Gestión de identidades y sesiones
- Password hashing con bcrypt/argon2 (cost/rounds configurables por env).
- JWT de acceso (corto) + refresh (más largo). JTI único por token.
- Lista de revocación (blacklist) por jti y/o versión de sesión por usuario.
- Rotación automática del access token vía interceptor (refresh flow).
- En logout, revocar refresh; invalidar access asociado.
- `requireAuth` y `requireAdmin` como middlewares globales y reutilizables.

## 2) Protección de entradas (validación robusta)
- Validar **RUT chileno** (formato y dígito verificador) en registro y actualización de perfil (si se guarda).
- Sanitizar strings (strip, length bounds, blacklist HTML, normalización unicode).
- Límite de tamaño de payloads: JSON ≤ 200 KB, multipart ≤ 10 MB.
- Validar MIME y extensión de archivos (PDF/JPG/PNG) en subida de documentos medicinales e imágenes.
- Limitar número de variantes por producto en una sola petición (p. ej. ≤50).
- En checkout, revalidar precios y stock contra DB; jamás confiar en lo que envía el cliente.

## 3) Controles antiabuso / rate-limit
- Rate limit por IP:
  - `/api/auth/login`: p. ej., 5 intentos/5 min → luego backoff exponencial.
  - `/api/auth/register`: 10 req/hora/IP.
  - `/api/payments/*` y webhooks: 60 req/min con bucket por proveedor.
- Captcha (reCAPTCHA/Turnstile) en formularios públicos (login/registro/recuperar).
- Detección básica de bots: user-agent checks + honeytoken field invisible.
- Throttling/queue ante picos de `/start` de pagos para evitar brute-force de montos.

## 4) CORS, CSRF, XSS, Clickjacking
- CORS: lista blanca de `origins` por ENV; métodos/headers explícitos.
- CSRF:
  - Si hay cookies (same-site) en algún flujo, usa token CSRF con doble envío (header + cookie).
  - En flujos 100% JWT Bearer, mantén cookies desactivadas.
- XSS:
  - Escapar todas las salidas renderizadas (server y client).
  - Sanitizar HTML de reseñas o deshabilitar HTML (solo texto plano).
- Headers de seguridad (global):
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Content-Security-Policy` (CSP) restrictiva: no `unsafe-inline`; permitir solo orígenes de imágenes y CDN definidos.
  - `Strict-Transport-Security` (HSTS) en prod (preload si procede).

## 5) Cifrado y secretos
- **TLS** extremo a extremo (https) para front y backend.
- Secreto de app y claves de proveedores solo por variables de entorno (no en repo).
- Rotación de secretos semestral y ante incidentes.
- No almacenar datos de tarjeta (delegar a Webpay/Flow/MP). Guardar solo `payment_ref` y metadatos seguros.
- Archivos cargados (recetas/cedulas) en almacenamiento privado:
  - URLs firmadas temporales (S3/Cloudinary signed) para visualizar desde admin.
  - Retención y eliminación acorde a política (ver §10).

## 6) Seguridad en pagos y webhooks
- Verificación de firma y replay-attack:
  - Comparar timestamp y nonce; rechazar si >5 min o repetido (mantener cache “seen nonces”).
  - Validar HMAC o firma provista por el proveedor (clave en env).
- Idempotencia estricta:
  - Cabecera `Idempotency-Key` en `/start` y `/confirm`.
  - Transacciones guardan `providerTxnId` único con índice.
- Reconciliación:
  - Job diario que compara pagos `paid` del proveedor vs DB; alerta diferencias.
- Logging seguro: no loguear PAN ni datos sensibles; ofuscar tokens en trazas.

## 7) Autorización de recursos (objetos)
- Todo acceso `/api/orders/{id}` debe validar propiedad (dueño) o rol admin.
- `medicinal_documents`: solo dueño o admin; descargas con URL firmada temporal.
- `users`: impedir que un usuario normal modifique a otro; admin solo cambios permitidos.

## 8) Auditoría (system_logs) y trazabilidad
- En cada acción sensible, crear log:
  - `{ traceId, actorUserId, action, entity, entityId, meta, createdAt }`
- Acciones que SIEMPRE auditan:
  - Login exitoso/fallido (sin detallar contraseña).
  - Cambio de contraseña y de email.
  - CRUD de productos, precios y stock.
  - Estados de órdenes, cupones y documentos medicinales (aprobado/rechazado).
  - Pagos: `start`, `confirm`, `webhook`.
- `traceId` por request (middleware); propagar a logs de negocio.

## 9) Observabilidad y monitoreo
- Métricas básicas:
  - Latencia por endpoint (p50/p95), tasa de errores (5xx), RPS.
  - Métrica de pagos: `payments_started`, `payments_paid`, `payments_failed` por proveedor.
- Alertas:
  - Pago fallido > X% en 15 min.
  - Aumento de 401/403 inusual.
  - Errores (5xx) por encima de umbral.
- Dashboard (Grafana/Prometheus) o al menos logs JSON parseables por ELK.

## 10) Cumplimiento y políticas de datos (Chile)
- Política de privacidad clara (HTML público) y consentimiento explícito (cookies/analytics).
- Conservación:
  - Documentos medicinales: retención mínima para cumplir fin (ver Ley 20.000); eliminar bajo solicitud si no hay obligaciones legales pendientes.
  - Pedidos/facturación: conservar según SII y obligaciones tributarias (boletas).
- Derecho de acceso, rectificación y eliminación (ARCO): endpoint de solicitud, flujo manual en admin.
- Respuesta de incidentes:
  - Runbook: clasificación de severidad, contención, rotación de claves, notificación a afectados si aplica.
  - Bitácora de incidentes (no pública).

## 11) Tests de seguridad (automatizados)
- Password policy y hashing correcto.
- RUT inválidos rechazados.
- CSRF (si cookies): petición sin token → 403.
- CORS: origen no permitido → bloqueado.
- XSS: cadena `<script>` en reseñas → sanitizada/no ejecutable.
- Inyección SQL: pruebas con caracteres especiales en filtros → sin error/escape correcto.
- Webhooks: firmas inválidas → 401; duplicados → idempotente (sin cambiar estado).
- Accesos indebidos:
  - Usuario A no puede leer/alterar recursos de usuario B.
  - Medicinal: usuario no validado no accede a productos/compra.

## 12) Entregables
- Middlewares: auth, admin, rate-limit, cors, traceId, errorHandler, securityHeaders.
- Validadores: RUT, MIME/size archivos, payload bounds.
- Config de CSP y HSTS (prod).
- Scripts de seeds para usuario admin con password seguro.
- Documentación `SECURITY.md` con:
  - Arquitectura de seguridad (diagramas).
  - Políticas y configuraciones (CSP, CORS, tokens).
  - Procedimientos de rotación/backup/restore.