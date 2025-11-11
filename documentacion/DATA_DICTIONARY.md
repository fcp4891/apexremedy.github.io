# 📚 Data Dictionary - Diccionario de Datos

## Tablas de Analytics

### web_sessions
Sesiones de usuarios en el sitio web.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| session_id | TEXT | Identificador único de sesión |
| user_id | INTEGER | Usuario (opcional, null si anónimo) |
| device_type | TEXT | desktop, mobile, tablet |
| browser | TEXT | Navegador |
| os | TEXT | Sistema operativo |
| utm_source | TEXT | Fuente UTM |
| utm_medium | TEXT | Medio UTM |
| utm_campaign | TEXT | Campaña UTM |
| landing_page | TEXT | Página de entrada |
| started_at | TEXT | Fecha/hora inicio |
| duration_seconds | INTEGER | Duración en segundos |
| page_views | INTEGER | Número de páginas vistas |
| is_bounce | INTEGER | 1 si es bounce (1 página) |

### pageviews
Páginas vistas individuales.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| session_id | TEXT | Sesión asociada |
| user_id | INTEGER | Usuario (opcional) |
| page_path | TEXT | Ruta de la página |
| time_on_page | INTEGER | Tiempo en segundos |
| scroll_depth | REAL | Profundidad de scroll (0-100) |
| exit_page | INTEGER | 1 si es página de salida |

### web_events
Eventos de analytics (clicks, conversiones, etc.).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| session_id | TEXT | Sesión asociada |
| event_type | TEXT | Tipo: page_view, product_view, add_to_cart, purchase, etc. |
| event_category | TEXT | Categoría: engagement, ecommerce |
| event_action | TEXT | Acción: view, add, remove, checkout |
| product_id | INTEGER | Producto (si aplica) |
| order_id | INTEGER | Orden (si aplica) |
| event_value | REAL | Valor del evento (revenue si es purchase) |

### marketing_campaigns
Campañas de marketing.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| name | TEXT | Nombre de la campaña |
| code | TEXT | Código único |
| campaign_type | TEXT | Tipo: paid_search, social_media, email, etc. |
| channel | TEXT | Canal: Organic, Paid, Social, Email |
| budget | REAL | Presupuesto total |
| spent | REAL | Gastado |
| impressions | INTEGER | Impresiones |
| clicks | INTEGER | Clics |
| conversions | INTEGER | Conversiones |
| revenue | REAL | Revenue atribuido |

**Métricas derivadas:**
- ROAS = revenue / spent
- CTR = clicks / impressions
- CVR = conversions / clicks

### customer_segments
Segmentación de clientes (RFM y otros).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| user_id | INTEGER | Usuario |
| segment_type | TEXT | Tipo: RFM, Behavioral, etc. |
| segment_code | TEXT | Código: VIP, Champion, Loyal, At Risk, Lost |
| rfm_recency | INTEGER | Score Recency (1-5) |
| rfm_frequency | INTEGER | Score Frequency (1-5) |
| rfm_monetary | INTEGER | Score Monetary (1-5) |
| rfm_score | INTEGER | Score total (111-555) |
| clv_predicted | REAL | CLV predicho |
| churn_probability | REAL | Probabilidad de churn (0-1) |

### customer_cohorts
Cohortes de clientes para análisis temporal.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| user_id | INTEGER | Usuario |
| cohort_period | TEXT | Período: YYYY-MM |
| cohort_type | TEXT | Tipo: month, week |
| first_order_date | TEXT | Fecha primera compra |
| last_order_date | TEXT | Fecha última compra |
| total_orders | INTEGER | Total de órdenes |
| total_revenue | REAL | Revenue total |
| lifetime_days | INTEGER | Días activo |

### site_searches
Búsquedas en el sitio.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| session_id | TEXT | Sesión |
| search_query | TEXT | Término de búsqueda |
| results_count | INTEGER | Resultados encontrados |
| clicked_result | INTEGER | 1 si hizo click |
| conversion | INTEGER | 1 si convirtió |

### cart_abandonment_events
Eventos de abandono de carrito.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único |
| session_id | TEXT | Sesión |
| user_id | INTEGER | Usuario (si logueado) |
| cart_value | REAL | Valor del carrito |
| items_count | INTEGER | Cantidad de items |
| abandoned_at | TEXT | Fecha/hora abandono |
| recovered_at | TEXT | Fecha/hora recuperación (null si no) |
| recovery_email_sent | INTEGER | 1 si se envió email |

## Métricas Calculadas

### Revenue Metrics
- **GMV (Gross Merchandise Value):** Valor total transaccionado
- **Net Revenue:** Revenue después de devoluciones y descuentos
- **AOV (Average Order Value):** Revenue total / Número de órdenes
- **Revenue Growth Rate:** ((Revenue actual - Revenue anterior) / Revenue anterior) * 100

### Customer Metrics
- **CAC (Customer Acquisition Cost):** Marketing Spend / Nuevos Clientes
- **LTV (Lifetime Value):** Revenue promedio generado por cliente durante su vida útil
- **LTV:CAC Ratio:** LTV / CAC (ideal >3:1)
- **CAC Payback Period:** CAC / Contribution Margin por orden

### Conversion Metrics
- **Conversion Rate:** (Órdenes / Sessions) * 100
- **Cart Abandonment Rate:** (Carritos abandonados / Carritos creados) * 100
- **Checkout Abandonment Rate:** (Checkouts abandonados / Checkouts iniciados) * 100

### Inventory Metrics
- **Inventory Turnover:** COGS / Average Inventory Value
- **Days of Inventory Outstanding (DIO):** (Average Inventory / COGS) * 365
- **Stockout Rate:** (Productos sin stock / Total productos) * 100

### Marketing Metrics
- **ROAS (Return on Ad Spend):** Revenue / Ad Spend
- **CTR (Click-Through Rate):** (Clicks / Impressions) * 100
- **CPC (Cost Per Click):** Ad Spend / Clicks
- **CVR (Conversion Rate):** (Conversions / Clicks) * 100

### Operational Metrics
- **Fulfillment Time:** Tiempo desde orden hasta envío
- **On-Time Delivery Rate:** (Entregas a tiempo / Total entregas) * 100
- **Return Rate:** (Unidades devueltas / Unidades vendidas) * 100

## Fórmulas Clave

### P&L Simplificado
```
Revenue
- COGS (60% del Revenue estimado)
= Gross Profit
- Marketing
- Shipping
- Payment Fees
= Net Profit
```

### Unit Economics
```
Revenue per Order = Revenue Total / Número de Órdenes
COGS per Order = COGS Total / Número de Órdenes
Contribution Margin = Revenue per Order - COGS per Order
```

### RFM Scoring
```
RFM Score = (Recency * 100) + (Frequency * 10) + Monetary
Segmentos:
- VIP: 444-555
- Champion: 333-443
- Loyal: 222-332
- At Risk: 111-221
- Lost: <111
```

## Convenciones de Nombres

### Estados de Órdenes
- `pending`: Pendiente de pago
- `processing`: En proceso
- `shipped`: Enviado
- `delivered`: Entregado
- `cancelled`: Cancelado

### Estados de Pago
- `pending`: Pendiente
- `authorized`: Autorizado
- `captured`: Capturado/completado
- `failed`: Fallido
- `refunded`: Reembolsado

### Tipos de Eventos
- `page_view`: Vista de página
- `product_view`: Vista de producto
- `add_to_cart`: Agregar al carrito
- `remove_from_cart`: Remover del carrito
- `checkout_start`: Inicio de checkout
- `purchase`: Compra completada
- `wishlist_add`: Agregar a wishlist
- `search`: Búsqueda

## Actualizaciones

Este diccionario se actualiza cuando se agregan nuevas métricas o tablas al sistema.
