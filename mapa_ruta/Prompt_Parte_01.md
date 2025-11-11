# 📋 Modelo de Datos E-commerce Mejorado
## Apex Remedy - Sistema Completo y Profesional

---

## 🎯 Resumen de Mejoras

Tu modelo **actual.js** ha sido ampliado y mejorado manteniendo **todos los nombres originales** de tablas y columnas. Se agregaron las siguientes funcionalidades profesionales:

### ✅ Mantenido del Modelo Original
- ✓ Todas las tablas existentes
- ✓ Todos los nombres de columnas
- ✓ Estructura de productos, categorías y marcas
- ✓ Sistema de variantes de precio
- ✓ Prescripciones
- ✓ Órdenes y pagos básicos
- ✓ Reseñas de productos

### 🆕 Nuevas Funcionalidades Agregadas

#### 1. **Sistema RBAC (Roles y Permisos)** 🔐
```
- roles
- permissions
- role_permissions
- user_roles
```
**Beneficio:** Control granular de accesos por rol (admin, gerente, farmacéutico, cliente, etc.)

#### 2. **Gestión de Inventario Multi-almacén** 📦
```
- warehouses
- inventory_items
- inventory_movements
```
**Beneficio:** Control preciso de stock por ubicación física, trazabilidad de movimientos

#### 3. **Sistema de Pagos Robusto** 💳
```
- payments (mejorada con más campos)
- refunds
- gift_cards
- gift_card_transactions
```
**Beneficio:** Gestión completa de pagos, reembolsos y tarjetas de regalo

#### 4. **Sistema de Envíos Completo** 🚚
```
- shipping_methods
- shipping_zones
- shipping_rates
- shipments
- shipment_events
```
**Beneficio:** Múltiples carriers, tracking, zonas geográficas, cálculo dinámico de costos

#### 5. **Sistema de Devoluciones** ↩️
```
- returns
- return_items
```
**Beneficio:** Gestión profesional de devoluciones con workflow de aprobación

#### 6. **Notificaciones Multi-canal** 🔔
```
- notifications
- message_log
- notification_preferences
```
**Beneficio:** Email, SMS, WhatsApp configurables por usuario

#### 7. **CMS y Blog** 📰
```
- cms_pages
- blog_posts
```
**Beneficio:** Contenido dinámico, SEO, marketing de contenidos

#### 8. **SEO Profesional** 🔍
```
- seo_meta (mejorada con OG tags)
- redirects (con conteo de hits)
- search_index_fts (búsqueda full-text)
```
**Beneficio:** Mejor posicionamiento, URLs amigables, búsqueda potente

#### 9. **Sistema KYC y Verificación** 📄
```
- user_document_files
- verification_queue
- cultivation_rights_cessions
```
**Beneficio:** Cumplimiento legal, verificación de documentos, cesión de derechos

#### 10. **Privacidad y GDPR** 🔒
```
- privacy_consents
- retention_policies
```
**Beneficio:** Cumplimiento legal, gestión de consentimientos, políticas de retención

#### 11. **Wishlist** ❤️
```
- wishlist
```
**Beneficio:** Funcionalidad estándar de e-commerce, aumenta conversión

#### 12. **Carritos Abandonados** 🛒
```
- abandoned_carts (mejorada)
```
**Beneficio:** Recovery emails, análisis de abandono, recuperación de ventas

#### 13. **Sistema de Recomendaciones** 🎯
```
- recommendations
```
**Beneficio:** Machine learning, cross-selling, up-selling

#### 14. **Auditoría y Eventos** 📋
```
- events
- audit_logs (mejorada con old/new values)
```
**Beneficio:** Trazabilidad completa, compliance, debugging

#### 15. **Jobs y Cron** ⚙️
```
- jobs
- cron_history
```
**Beneficio:** Tareas asíncronas, trabajos programados, procesamiento en background

#### 16. **Impuestos** 💼
```
- tax_rates
```
**Beneficio:** Configuración de IVA por región, múltiples tasas

---

## 📊 Modelo de Datos Completo

### Estructura de Tablas (60+ tablas)

#### 👤 USUARIOS Y AUTENTICACIÓN
1. **users** (extendida)
   - Agregados: `medicinal_blocked`, `two_factor_enabled`, `two_factor_secret`, `email_verified_at`, `phone_verified_at`, `last_login_at`, `login_attempts`, `locked_until`, `rut`

2. **roles** (nueva)
3. **permissions** (nueva)
4. **role_permissions** (nueva)
5. **user_roles** (nueva)
6. **addresses** (mejorada)

#### 📦 CATÁLOGO
7. **product_categories** (original)
8. **brands** (original)
9. **products** (mejorada con `weight`, `dimensions`, `low_stock_threshold`)
10. **product_price_variants** (original + `compare_at_price`)
11. **product_images** (original + `updated_at`)
12. **product_variants** (mejorada con `compare_at_price`, `barcode`)

#### 🏢 INVENTARIO
13. **warehouses** (nueva)
14. **inventory_items** (nueva)
15. **inventory_movements** (nueva)

#### 🔍 SEO Y BÚSQUEDA
16. **seo_meta** (mejorada con OG tags)
17. **redirects** (mejorada con `hits`)
18. **search_index_fts** (nueva - búsqueda full-text)

#### 🛒 CARRITO Y VENTAS
19. **cart_items** (original)
20. **abandoned_carts** (mejorada)
21. **wishlist** (nueva)

#### 📝 ÓRDENES
22. **orders** (mejorada con más estados)
23. **order_items** (mejorada)
24. **order_status_history** (nueva)

#### 💳 PAGOS
25. **payments** (mejorada)
26. **refunds** (nueva)
27. **gift_cards** (nueva)
28. **gift_card_transactions** (nueva)

#### 🚚 ENVÍOS
29. **shipping_methods** (nueva)
30. **shipping_zones** (nueva)
31. **shipping_rates** (nueva)
32. **shipments** (nueva)
33. **shipment_events** (nueva)

#### ↩️ DEVOLUCIONES
34. **returns** (nueva)
35. **return_items** (nueva)

#### 💼 IMPUESTOS
36. **tax_rates** (nueva)

#### ⭐ RESEÑAS
37. **product_reviews** (mejorada)
38. **review_votes** (nueva)

#### 💊 MEDICINAL
39. **prescriptions** (mejorada)
40. **user_document_files** (nueva)
41. **verification_queue** (nueva)
42. **cultivation_rights_cessions** (nueva)

#### 🔒 PRIVACIDAD
43. **privacy_consents** (nueva)
44. **retention_policies** (nueva)

#### 🎁 PROMOCIONES
45. **promotions** (mejorada)
46. **promotion_usages** (nueva)

#### 🔔 NOTIFICACIONES
47. **notifications** (nueva)
48. **message_log** (nueva)
49. **notification_preferences** (nueva)

#### 📰 CMS
50. **cms_pages** (nueva)
51. **blog_posts** (nueva)

#### 🎯 RECOMENDACIONES
52. **recommendations** (nueva)

#### 📋 AUDITORÍA Y EVENTOS
53. **events** (nueva)
54. **audit_logs** (nueva)

#### ⚙️ JOBS
55. **jobs** (nueva)
56. **cron_history** (nueva)

---

## 🎨 Vistas Creadas

### 1. `v_user_has_valid_prescription`
Verifica si un usuario tiene prescripción válida activa.

### 2. `v_user_medicinal_eligibility`
Determina si un usuario puede comprar productos medicinales.

### 3. `v_product_inventory`
Resumen de inventario por producto con alertas de stock bajo.

### 4. `v_order_summary`
Vista consolidada de órdenes con información del cliente.

---

## ⚡ Triggers Implementados

### 1. `trg_cart_guard_after_update_user`
- **Qué hace:** Limpia automáticamente productos medicinales del carrito cuando se bloquea a un usuario
- **Cuándo:** Al actualizar `medicinal_blocked` en users

### 2. `trg_orders_updated_at`
- **Qué hace:** Actualiza automáticamente el timestamp al modificar una orden
- **Cuándo:** Al actualizar cualquier campo de orders

### 3. `trg_order_status_history`
- **Qué hace:** Registra automáticamente cambios de estado en historial
- **Cuándo:** Al cambiar el status de una orden

### 4. `trg_reserve_inventory_on_order`
- **Qué hace:** Reserva inventario automáticamente al crear items de orden
- **Cuándo:** Al insertar en order_items (si orden está confirmada)

---

## 🚀 Índices Optimizados (40+ índices)

### Índices Críticos para Rendimiento:
- **Búsquedas frecuentes:** email, slug, sku, status
- **Foreign keys:** Todas las relaciones
- **Filtros comunes:** medicinal, featured, fechas
- **Inventario único:** warehouse_id + product_id + variant_id
- **Auditoría:** actor, target, fecha

---

## 💾 Datos Iniciales Insertados

### 1. **Roles**
- super_admin
- admin
- manager
- pharmacist
- customer_service
- customer

### 2. **Categorías** (10 categorías)
- 5 medicinales
- 5 públicas

### 3. **Marcas** (9 marcas)
- Incluye Apex Remedy, Aurora, Tilray, etc.

### 4. **Almacén**
- Almacén Principal (MAIN)

### 5. **Métodos de Envío**
- Retiro en Tienda
- Envío Express
- Envío Estándar

### 6. **Tasa de Impuesto**
- IVA Chile (19%)

### 7. **Políticas de Retención**
- Cuentas de usuario (5 años)
- Datos de órdenes (7 años)
- Registros médicos (10 años)
- Logs de auditoría (3 años)

---

## 🔄 Workflows Implementados

### 1. **Workflow de Orden**
```
pending → confirmed → processing → shipped → delivered
                   ↓
                cancelled
```

### 2. **Workflow de Pago**
```
pending → processing → completed
                    ↓
                  failed / refunded
```

### 3. **Workflow de Devolución**
```
requested → approved → received → completed
                    ↓
                 rejected
```

### 4. **Workflow de Verificación KYC**
```
pending → in_review → approved
                   ↓
            rejected / observed
```

---

## 🎯 Casos de Uso Cubiertos

### ✅ E-commerce Básico
- Catálogo de productos
- Carrito de compras
- Checkout y pagos
- Órdenes y seguimiento
- Reseñas de clientes

### ✅ E-commerce Avanzado
- Multi-almacén
- Variantes de productos
- Promociones y cupones
- Gift cards
- Wishlist
- Recomendaciones
- Abandono de carrito

### ✅ Cannabis Medicinal
- Prescripciones
- Verificación de documentos
- Cesión de derechos de cultivo
- Control de elegibilidad
- Productos restringidos

### ✅ Operaciones
- Gestión de inventario
- Múltiples métodos de envío
- Tracking de envíos
- Devoluciones
- Reembolsos

### ✅ Marketing
- SEO completo
- CMS y blog
- Email marketing
- Recuperación de carritos
- Sistema de recomendaciones

### ✅ Compliance
- RBAC
- Auditoría completa
- Privacidad y consentimientos
- Retención de datos
- KYC

### ✅ Técnico
- Jobs asíncronos
- Notificaciones multi-canal
- Búsqueda full-text
- Triggers automáticos
- Vistas optimizadas

---

## 📈 Ventajas del Modelo Mejorado

### 1. **Escalabilidad** 📊
- Multi-almacén desde el inicio
- Jobs asíncronos para operaciones pesadas
- Índices optimizados para rendimiento

### 2. **Compliance Legal** ⚖️
- Sistema KYC completo
- Gestión de consentimientos
- Políticas de retención
- Auditoría completa

### 3. **Experiencia de Usuario** 😊
- Wishlist
- Recomendaciones
- Notificaciones personalizadas
- Múltiples opciones de pago
- Tracking de envíos

### 4. **Operaciones Eficientes** 🎯
- Gestión de inventario
- Workflow de devoluciones
- Sistema de reembolsos
- Alertas de stock bajo

### 5. **Marketing Potente** 🚀
- SEO profesional
- CMS integrado
- Promociones flexibles
- Recovery de carritos
- Sistema de recomendaciones

### 6. **Seguridad** 🔒
- RBAC granular
- 2FA preparado
- Bloqueo de cuentas
- Auditoría de acciones

---

## 🔧 Tecnología Utilizada

- **Base de datos:** SQLite
- **Búsqueda:** FTS5 (Full-Text Search)
- **Integridad:** Foreign Keys, Triggers, Constraints
- **Optimización:** 40+ índices estratégicos
- **Vistas:** SQL Views para queries complejas
- **Automatización:** Triggers para lógica de negocio

---

## 📝 Próximos Pasos Recomendados

1. **Backend API**
   - Implementar endpoints REST
   - Middleware de autenticación
   - Validación de permisos RBAC

2. **Jobs y Workers**
   - Procesamiento de notificaciones
   - Sincronización de inventario
   - Generación de reportes
   - Recovery de carritos

3. **Integraciones**
   - Pasarelas de pago (Webpay, Mercadopago)
   - Carriers (Chilexpress, Correos Chile)
   - Email service (SendGrid, AWS SES)
   - SMS/WhatsApp (Twilio)

4. **Dashboard Admin**
   - Panel de control
   - Gestión de productos
   - Gestión de órdenes
   - Reportes y analytics
   - Gestión de usuarios y roles

5. **Frontend**
   - Catálogo de productos
   - Carrito y checkout
   - Perfil de usuario
   - Tracking de órdenes
   - Sistema de reseñas

---