# 📊 GUÍA COMPLETA: Analytics & Dashboards para E-commerce

Listado exhaustivo de métricas, KPIs, gráficos y dashboards que aportan valor estratégico 
y mejoran la toma de decisiones en e-commerce.

---

## 📋 ÍNDICE

1. [Dashboards Principales](#dashboards-principales)
2. [Métricas Financieras](#métricas-financieras)
3. [Métricas de Producto](#métricas-de-producto)
4. [Métricas de Cliente](#métricas-de-cliente)
5. [Métricas de Marketing](#métricas-de-marketing)
6. [Métricas de Operaciones](#métricas-de-operaciones)
7. [Métricas de Experiencia de Usuario](#métricas-de-experiencia)
8. [Analytics Predictivos](#analytics-predictivos)
9. [Reportes por Stakeholder](#reportes-por-stakeholder)

---

## 1. DASHBOARDS PRINCIPALES

### 1.1 Executive Dashboard (C-Level)
**Objetivo:** Vista global del negocio en tiempo real

**Métricas clave:**
- Revenue total (actual vs objetivo)
- Pedidos totales
- Ticket promedio
- Tasa de conversión
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- Ratio LTV:CAC
- GMV (Gross Merchandise Value)
- Margen bruto
- Cash flow operativo

**Gráficos:**
- 📈 Line chart: Revenue YoY, MoM, WoW
- 📊 Bar chart: Comparativa mensual vs año anterior
- 🎯 Gauge: Cumplimiento de objetivos (%)
- 🔢 Big numbers: KPIs principales con variación %
- 🗺️ Heatmap geográfico: Ventas por región/comuna

---

### 1.2 Dashboard Comercial/Ventas
**Objetivo:** Monitorear performance de ventas y tendencias

**Secciones:**

#### A) Revenue & Orders
- Ventas diarias/semanales/mensuales
- Pedidos por estado (pendiente, pagado, enviado, entregado)
- Ventas por canal (web, app, marketplace)
- Ventas por categoría de producto
- Ventas por método de pago
- Devoluciones y cancelaciones

**Gráficos:**
- 📈 Time series: Revenue diario con proyección
- 📊 Stacked bar: Ventas por categoría + subcategoría
- 🥧 Pie chart: Distribución por método de pago
- 📉 Funnel: Pedidos por estado (embudo de conversión)
- 📅 Calendar heatmap: Ventas por día del mes

#### B) Productos Top & Flop
- Top 10 productos por revenue
- Top 10 por unidades vendidas
- Top 10 por margen
- Productos con más devoluciones
- Productos con stock crítico + alta demanda
- Cross-selling más efectivo

**Gráficos:**
- 📊 Horizontal bars: Top 10 productos
- 📈 Sparklines: Tendencia de cada producto
- 🎯 Scatter plot: Margen vs Volumen de ventas
- 🔥 Treemap: Categorías por revenue

#### C) Performance Temporal
- Ventas por hora del día
- Ventas por día de la semana
- Estacionalidad mensual
- Comparativa año vs año
- Días con peaks de venta

**Gráficos:**
- 📊 Heatmap: Día x Hora (cuándo compran más)
- 📈 Line chart: Comparativa WoW, MoM, YoY
- 📅 Time series decomposition: Tendencia + Estacionalidad

---

### 1.3 Dashboard de Clientes (CRM)
**Objetivo:** Entender comportamiento y valor del cliente

#### A) Adquisición
- Nuevos clientes por día/semana/mes
- Clientes por canal de adquisición
- Costo por adquisición (CPA/CAC)
- Tasa de conversión de visitante → cliente
- First purchase revenue

**Gráficos:**
- 📈 Line chart: Nuevos clientes vs returning
- 📊 Bar chart: Clientes por fuente de tráfico
- 🎯 Funnel: Visitor → Lead → Customer

#### B) Retención & Engagement
- Tasa de retención (cohort analysis)
- Churn rate
- Repeat purchase rate
- Frecuencia de compra promedio
- Tiempo entre compras
- Customer lifetime (días activo)
- RFM Score (Recency, Frequency, Monetary)

**Gráficos:**
- 📊 Cohort retention table: % clientes que regresan
- 📈 Line chart: Repeat purchase rate por cohorte
- 🔥 Heatmap: RFM segmentation
- 📉 Survival curve: % clientes activos vs tiempo

#### C) Valor del Cliente
- Customer Lifetime Value (CLV/LTV)
- Average Order Value (AOV)
- Revenue per customer
- Margen por cliente
- Customer profitability score

**Gráficos:**
- 📊 Histogram: Distribución de CLV
- 🎯 Scatter: CLV vs Frecuencia de compra
- 📈 Line chart: Evolución AOV en el tiempo

#### D) Segmentación
- Clientes VIP (top 20% revenue)
- Clientes en riesgo de churn
- Clientes dormidos (no compran hace X días)
- One-time buyers vs Loyal customers
- Segmentos demográficos (edad, género, ubicación)

**Gráficos:**
- 🥧 Pie chart: Distribución de segmentos
- 📊 Bar chart: Revenue por segmento
- 🗺️ Geographic map: Clientes por región

---

### 1.4 Dashboard de Marketing
**Objetivo:** ROI y efectividad de campañas

#### A) Performance de Campañas
- ROAS (Return on Ad Spend) por campaña
- CTR (Click Through Rate)
- CPC (Cost Per Click)
- CPM (Cost Per Mille)
- Conversión por campaña
- Revenue atribuido por canal

**Gráficos:**
- 📊 Bar chart: ROAS por campaña
- 📈 Time series: CTR evolution
- 🎯 Scatter: Inversión vs Revenue
- 🥧 Pie: Budget distribution

#### B) Canales de Adquisición
- Tráfico por canal (Orgánico, Paid, Social, Email, Direct, Referral)
- Revenue por canal
- Conversión por canal
- CAC por canal
- Multi-touch attribution

**Gráficos:**
- 📊 Stacked area: Tráfico por canal en el tiempo
- 🎯 Funnel: Traffic → Sessions → Conversions por canal
- 📈 Line chart: Evolución de cada canal

#### C) Email Marketing
- Open rate
- Click rate
- Unsubscribe rate
- Revenue por email enviado
- Segmentos más responsive
- Automations performance (cart abandonment, welcome series)

**Gráficos:**
- 📊 Bar chart: Performance por tipo de email
- 📈 Time series: Engagement metrics
- 🎯 Sankey diagram: Email → Click → Purchase

#### D) SEO & Content
- Organic traffic
- Rankings por keyword
- Páginas más visitadas
- Bounce rate por página
- Conversión por landing page

**Gráficos:**
- 📊 Table: Top keywords + posición + tráfico
- 📈 Line: Organic traffic trend
- 🔥 Heatmap: Páginas por tráfico + conversión

---

### 1.5 Dashboard de Producto
**Objetivo:** Performance y estrategia de catálogo

#### A) Análisis de Catálogo
- Productos activos vs inactivos
- Productos sin stock
- Productos con baja rotación
- Productos sin ventas (últimos 30/60/90 días)
- Ratio productos nuevos vs establecidos

**Gráficos:**
- 📊 Bar chart: Productos por estado
- 🥧 Pie: Distribución de inventario
- 📈 Time series: Lanzamientos de productos

#### B) Performance por Categoría
- Revenue por categoría/subcategoría
- Margen por categoría
- Units sold por categoría
- Tasa de conversión por categoría
- Add-to-cart rate por categoría

**Gráficos:**
- 🔥 Treemap: Revenue por categoría + subcategoría
- 📊 Waterfall chart: Contribución al revenue total
- 📈 Line: Tendencia por categoría

#### C) Pricing & Margins
- Precio promedio por categoría
- Margen promedio
- Elasticidad de precio
- Descuentos aplicados (% y $)
- Revenue lost por descuentos

**Gráficos:**
- 🎯 Scatter: Precio vs Volumen vendido
- 📊 Box plot: Distribución de márgenes
- 📈 Line: Precio promedio evolution

#### D) Product Analytics
- Views → Add to cart → Purchase (funnel por producto)
- Tasa de abandono de carrito por producto
- Productos vistos juntos
- Frequently bought together
- Productos reemplazados (substitution)

**Gráficos:**
- 🎯 Funnel: Conversion funnel por producto
- 🔗 Network graph: Product relationships
- 📊 Sankey: Product journey

---

### 1.6 Dashboard de Inventario
**Objetivo:** Optimizar stock y logística

#### A) Stock Management
- Stock actual por SKU
- Stock crítico (< X unidades)
- Stock overstock (> X días sin venta)
- Valor del inventario ($)
- Rotation rate (turnover)
- Days of inventory outstanding (DIO)

**Gráficos:**
- 🎯 Gauge: Nivel de inventario (óptimo/crítico/overstock)
- 📊 Bar chart: SKUs con stock crítico
- 📈 Time series: Evolución del inventario
- 🔥 Heatmap: SKU x Bodega (disponibilidad)

#### B) Forecasting & Reorder
- Demanda proyectada por producto
- Punto de reorden sugerido
- Cantidad óptima de compra
- Lead time por proveedor
- Stockout risk

**Gráficos:**
- 📈 Line chart: Demanda real vs forecast
- 📊 Waterfall: Movimientos de inventario
- 🎯 Alert indicators: Productos a reponer

#### C) Shrinkage & Losses
- Pérdidas por vencimiento (productos con fecha)
- Pérdidas por daño
- Devoluciones procesadas
- Write-offs

**Gráficos:**
- 📊 Bar chart: Pérdidas por razón
- 📈 Time series: Shrinkage rate
- 🥧 Pie: Distribución de pérdidas

---

### 1.7 Dashboard de Operaciones & Logística
**Objetivo:** Eficiencia operativa y fulfillment

#### A) Order Fulfillment
- Pedidos pendientes de picking
- Pedidos pendientes de packing
- Pedidos listos para envío
- Pedidos en tránsito
- Average fulfillment time
- SLA compliance (%)

**Gráficos:**
- 📊 Stacked bar: Pedidos por estado operativo
- 📈 Line: Fulfillment time trend
- 🎯 Gauge: SLA compliance
- 📅 Calendar heatmap: Volumen por día

#### B) Shipping & Delivery
- Pedidos por carrier (Starken, Chilexpress, Correos, etc.)
- Costo de envío promedio
- Tiempo de entrega promedio por carrier
- Pedidos con retraso
- Pedidos perdidos/dañados
- First attempt delivery rate
- Costo de última milla

**Gráficos:**
- 📊 Bar chart: Performance por carrier
- 📈 Line: Delivery time evolution
- 🗺️ Map: Zonas con retrasos frecuentes
- 🎯 Scatter: Costo vs Tiempo de entrega

#### C) Devoluciones
- Return rate (%)
- Razones de devolución
- Tiempo promedio de devolución
- Costo de reverse logistics
- Revenue lost por devoluciones

**Gráficos:**
- 🥧 Pie: Razones de devolución
- 📊 Bar: Return rate por categoría
- 📈 Time series: Evolución de devoluciones

#### D) Warehouse Efficiency
- Picking accuracy
- Packing time promedio
- Orders per hour (productividad)
- Error rate
- Space utilization

**Gráficos:**
- 📊 Bar chart: KPIs por bodega
- 📈 Line: Productividad trend
- 🎯 Gauge: Accuracy rate

---

### 1.8 Dashboard de UX & Comportamiento Web
**Objetivo:** Optimizar experiencia de usuario

#### A) Traffic & Sessions
- Visitas totales
- Usuarios únicos
- Páginas vistas
- Session duration promedio
- Bounce rate
- Páginas por sesión
- Dispositivo (Mobile vs Desktop vs Tablet)

**Gráficos:**
- 📈 Line: Tráfico diario
- 🥧 Pie: Dispositivos
- 📊 Bar: Páginas más visitadas
- 🔥 Heatmap: Día x Hora de visitas

#### B) Conversion Funnel
- Homepage → Category → Product → Add to Cart → Checkout → Purchase
- Drop-off rate en cada etapa
- Micro-conversiones (newsletter signup, account creation)

**Gráficos:**
- 🎯 Funnel visualization con %
- 📊 Bar chart: Drop-off por etapa
- 🔗 Sankey: User journey

#### C) Cart & Checkout
- Cart abandonment rate
- Checkout abandonment rate
- Average cart value
- Items per cart
- Razones de abandono (encuestas)
- Payment failures

**Gráficos:**
- 📉 Funnel: Cart → Checkout → Purchase
- 🥧 Pie: Razones de abandono
- 📈 Time series: Abandonment rate trend

#### D) Site Performance
- Page load time
- Time to first byte (TTFB)
- Largest contentful paint (LCP)
- First input delay (FID)
- Cumulative layout shift (CLS)
- Error rate (4xx, 5xx)

**Gráficos:**
- 📊 Bar: Load time por página
- 📈 Time series: Core Web Vitals
- 🎯 Gauge: Performance score

#### E) Search & Navigation
- Búsquedas más frecuentes
- Búsquedas sin resultados
- CTR en resultados de búsqueda
- Filters más usados
- Navegación por breadcrumb

**Gráficos:**
- 📊 Table: Top searches + CTR
- 🔥 Word cloud: Términos de búsqueda
- 📈 Line: Search usage trend

---

### 1.9 Dashboard Financiero
**Objetivo:** Salud financiera del negocio

#### A) P&L (Profit & Loss)
- Revenue total
- COGS (Cost of Goods Sold)
- Gross profit & margin
- Operating expenses
  - Marketing spend
  - Personnel costs
  - Shipping costs
  - Platform fees
  - Payment processing fees
- EBITDA
- Net profit & margin

**Gráficos:**
- 📊 Waterfall: P&L breakdown
- 📈 Line: Margen evolution
- 📊 Stacked bar: Expenses por categoría

#### B) Cash Flow
- Operating cash flow
- Days sales outstanding (DSO)
- Days payable outstanding (DPO)
- Cash conversion cycle
- Working capital

**Gráficos:**
- 📈 Line chart: Cash flow mensual
- 📊 Bar: DSO, DIO, DPO comparison
- 🎯 Gauge: Working capital ratio

#### C) Unit Economics
- Revenue per order
- COGS per order
- Shipping cost per order
- Payment processing per order
- Marketing cost per order
- Contribution margin per order
- CAC payback period

**Gráficos:**
- 📊 Stacked bar: Cost breakdown por order
- 📈 Line: Contribution margin trend
- 🎯 Scatter: CAC vs LTV

---

### 1.10 Dashboard de Servicio al Cliente
**Objetivo:** Calidad de atención y satisfacción

#### A) Support Tickets
- Tickets abiertos/cerrados
- First response time
- Average resolution time
- CSAT (Customer Satisfaction Score)
- NPS (Net Promoter Score)
- Tickets por categoría

**Gráficos:**
- 📊 Bar: Tickets por estado
- 📈 Line: Response time trend
- 🥧 Pie: Tickets por categoría
- 🎯 Gauge: CSAT, NPS

#### B) Quality Metrics
- First contact resolution (FCR)
- Escalation rate
- Reopened tickets rate
- Agent productivity (tickets/day)
- Customer effort score (CES)

**Gráficos:**
- 📊 Bar chart: KPIs por agente
- 📈 Time series: Quality metrics trend
- 🔥 Heatmap: Tickets por hora/día

---

## 2. MÉTRICAS FINANCIERAS DETALLADAS

### 2.1 Revenue Metrics
- **GMV (Gross Merchandise Value):** Valor total transaccionado
- **Net Revenue:** Revenue después de devoluciones y descuentos
- **Revenue Growth Rate:** Crecimiento MoM, QoQ, YoY
- **Revenue per Visitor (RPV)**
- **Revenue per Session**
- **Revenue per User**
- **Average Order Value (AOV)**
- **Average Transaction Value (ATV)**
- **Units per Transaction (UPT)**

### 2.2 Profitability Metrics
- **Gross Profit Margin:** (Revenue - COGS) / Revenue
- **Contribution Margin:** Revenue - Variable Costs
- **Operating Margin:** EBITDA / Revenue
- **Net Profit Margin:** Net Income / Revenue
- **Return on Ad Spend (ROAS):** Revenue / Ad Spend
- **Marketing Efficiency Ratio (MER):** Total Revenue / Total Marketing Spend
- **Blended CAC:** Total Marketing + Sales Costs / New Customers

### 2.3 Cost Metrics
- **Cost of Goods Sold (COGS)**
- **Fulfillment Cost per Order**
- **Shipping Cost per Order**
- **Payment Processing Fee per Order**
- **Return/Refund Cost**
- **Customer Service Cost per Order**
- **Technology & Platform Costs**

### 2.4 Cash & Working Capital
- **Cash Runway:** Meses de operación con cash actual
- **Burn Rate:** Cash gastado por mes
- **Days Sales Outstanding (DSO):** Días promedio para cobrar
- **Days Inventory Outstanding (DIO):** Días de inventario en stock
- **Days Payable Outstanding (DPO):** Días promedio para pagar proveedores
- **Cash Conversion Cycle:** DSO + DIO - DPO

---

## 3. MÉTRICAS DE PRODUCTO

### 3.1 Product Performance
- **Product Conversion Rate:** Visitors → Purchasers por producto
- **Add-to-Cart Rate**
- **Cart-to-Purchase Rate**
- **Product View-to-Cart Rate**
- **Revenue per Product View**
- **Sell-Through Rate:** Units vendidas / Stock inicial
- **Inventory Turnover:** COGS / Average Inventory Value

### 3.2 Product Mix
- **SKU Count:** Activos vs inactivos
- **SKU Productivity:** Revenue per SKU
- **Product Concentration:** % Revenue top 10/20/50 productos
- **New Product Revenue %**
- **Category Mix:** % Revenue por categoría

### 3.3 Pricing Intelligence
- **Price Elasticity:** Cambio en demanda vs cambio en precio
- **Discount Depth:** % promedio de descuento
- **Discount Frequency:** % órdenes con descuento
- **Markdown Rate:** Revenue lost por descuentos
- **Competitive Price Index:** Tu precio vs competencia

### 3.4 Product Quality
- **Return Rate por producto**
- **Defect Rate**
- **Customer Rating promedio**
- **Reviews per Product**
- **Review Velocity:** Reviews por semana

---

## 4. MÉTRICAS DE CLIENTE

### 4.1 Acquisition
- **Customer Acquisition Cost (CAC):** Marketing Spend / New Customers
- **CAC por canal**
- **Conversion Rate:** Visitors → Customers
- **New Customer Rate:** % de orders de nuevos clientes
- **Customer Acquisition Payback Period:** CAC / Contribution Margin

### 4.2 Retention & Loyalty
- **Customer Retention Rate:** (Customers end - New) / Customers start
- **Churn Rate:** 1 - Retention Rate
- **Repeat Purchase Rate:** % clientes con >1 compra
- **Average Purchase Frequency:** Orders / Unique Customers
- **Time Between Purchases**
- **Customer Lifespan:** Promedio de tiempo activo

### 4.3 Customer Value
- **Customer Lifetime Value (CLV/LTV):** NPV de profit futuro
- **Historic CLV:** Revenue total generado por cliente
- **Predictive CLV:** Projection basada en comportamiento
- **LTV:CAC Ratio:** Idealmente >3:1
- **Customer Profitability:** Revenue - Costs atribuibles

### 4.4 Engagement
- **Active Customer Rate:** % clientes con compra en últimos X días
- **Dormant Customer Rate:** % sin compra en últimos X días
- **At-Risk Customers:** Clientes con alta probabilidad de churn
- **Email Engagement Rate**
- **App Engagement Rate (DAU/MAU)**

### 4.5 Segmentation Metrics
- **RFM Score:** Recency + Frequency + Monetary
- **One-Time Buyer %**
- **VIP Customer %:** Top 20% revenue
- **Customer Cohort Performance:** Revenue por cohorte en el tiempo

---

## 5. MÉTRICAS DE MARKETING

### 5.1 Paid Advertising
- **CPC (Cost Per Click)**
- **CPM (Cost Per Mille - 1000 impressions)**
- **CTR (Click-Through Rate)**
- **CPA (Cost Per Acquisition)**
- **CVR (Conversion Rate)**
- **ROAS (Return on Ad Spend):** Revenue / Ad Spend
- **Impression Share**
- **Quality Score (Google Ads)**

### 5.2 Organic/SEO
- **Organic Traffic**
- **Organic Revenue**
- **Keyword Rankings:** Top 3, Top 10, Top 50
- **Domain Authority**
- **Backlinks Count**
- **Indexed Pages**
- **Crawl Errors**

### 5.3 Email Marketing
- **Open Rate**
- **Click Rate**
- **Click-to-Open Rate (CTOR)**
- **Conversion Rate**
- **Unsubscribe Rate**
- **Bounce Rate**
- **Revenue per Email Sent**
- **List Growth Rate**

### 5.4 Social Media
- **Follower Growth Rate**
- **Engagement Rate:** (Likes + Comments + Shares) / Followers
- **Click-Through Rate**
- **Social Commerce Revenue**
- **Share of Voice:** Tu marca vs competencia
- **Sentiment Score:** Positivo/Negativo/Neutro

### 5.5 Content Marketing
- **Blog Traffic**
- **Time on Page**
- **Scroll Depth**
- **Content Conversion Rate**
- **Cost per Lead (CPL)**
- **Content ROI**

### 5.6 Attribution
- **First-Touch Attribution**
- **Last-Touch Attribution**
- **Multi-Touch Attribution (Linear, Time-Decay, U-Shaped)**
- **Assisted Conversions**
- **Attribution Window:** 7d, 30d, 90d

---

## 6. MÉTRICAS DE OPERACIONES

### 6.1 Order Management
- **Order Processing Time**
- **Order Accuracy Rate**
- **Perfect Order Rate:** Correcto + Completo + A tiempo + Sin daño
- **Order Cancellation Rate**
- **Backorder Rate**

### 6.2 Fulfillment
- **Pick Accuracy**
- **Pack Time per Order**
- **Orders Shipped per Hour**
- **Order Lead Time:** Pedido → Envío
- **SLA Compliance Rate**

### 6.3 Shipping & Delivery
- **Average Delivery Time**
- **On-Time Delivery Rate**
- **Delivery Success Rate (First Attempt)**
- **Shipping Cost as % of Revenue**
- **Cost per Shipment**
- **Carrier Performance Score**

### 6.4 Returns & Reverse Logistics
- **Return Rate:** Units devueltas / Units vendidas
- **Return Reasons Distribution**
- **Return Processing Time**
- **Restocking Rate:** % productos reingresados
- **Return Cost per Unit**
- **Refund Processing Time**

### 6.5 Warehouse
- **Warehouse Capacity Utilization**
- **Inventory Accuracy**
- **Stockout Rate**
- **Overstock Rate**
- **Inventory Carrying Cost**
- **Warehouse Cost per Order**

---

## 7. MÉTRICAS DE EXPERIENCIA DE USUARIO

### 7.1 Website Performance
- **Page Load Time**
- **Core Web Vitals:** LCP, FID, CLS
- **Mobile Performance Score**
- **Error Rate (4xx, 5xx)**
- **API Response Time**

### 7.2 Engagement
- **Bounce Rate**
- **Pages per Session**
- **Average Session Duration**
- **Return Visitor Rate**
- **New vs Returning Ratio**

### 7.3 Conversion Optimization
- **Overall Conversion Rate**
- **Micro-Conversion Rates:** Newsletter, Account Creation, Wishlist
- **Cart Abandonment Rate**
- **Checkout Abandonment Rate**
- **Form Completion Rate**

### 7.4 Mobile Experience
- **Mobile Traffic %**
- **Mobile Conversion Rate**
- **Mobile AOV vs Desktop AOV**
- **App Downloads**
- **App DAU/MAU Ratio**

### 7.5 Search & Discovery
- **Site Search Usage Rate**
- **Search Refinement Rate**
- **Zero-Result Searches**
- **Search-to-Purchase Rate**
- **Filter Usage Rate**

### 7.6 Customer Satisfaction
- **CSAT (Customer Satisfaction Score):** 1-5 scale
- **NPS (Net Promoter Score):** -100 to +100
- **CES (Customer Effort Score)**
- **Product Review Rating Average**
- **Trust Score (Trustpilot, etc.)**

---

## 8. ANALYTICS PREDICTIVOS & AVANZADOS

### 8.1 Forecasting
- **Demand Forecasting:** Predicción de ventas por SKU
- **Revenue Forecasting:** Proyección mensual/anual
- **Churn Prediction:** Probabilidad de abandono por cliente
- **CLV Prediction:** Valor futuro estimado
- **Inventory Forecasting:** Necesidades de reposición

**Gráficos:**
- 📈 Time series: Actual vs Forecast con banda de confianza
- 📊 Bar: Accuracy del forecast (MAPE, MAE)

### 8.2 Segmentation & Clustering
- **Customer Segments:** K-means, RFM, Behavioral
- **Product Affinities:** Market basket analysis
- **Channel Affinities:** Usuarios por preferencia de canal
- **Geographic Clusters:** Zonas con comportamiento similar

**Gráficos:**
- 🔵 Scatter plot 3D: Segmentos visualizados
- 🔥 Heatmap: Segment characteristics
- 🥧 Pie: Segment distribution

### 8.3 Optimization
- **Price Optimization:** Precio óptimo por segmento
- **Inventory Optimization:** Stock óptimo por SKU
- **Marketing Mix Modeling:** Optimal budget allocation
- **Delivery Route Optimization**

**Gráficos:**
- 📈 Curve: Price vs Revenue (optimal point)
- 🎯 Scatter: Budget allocation efficiency

### 8.4 Anomaly Detection
- **Revenue Anomalies:** Picos/caídas inusuales
- **Traffic Anomalies**
- **Fraud Detection:** Pedidos sospechosos
- **Inventory Discrepancies**

**Gráficos:**
- 📈 Time series con alertas (banderas rojas)
- 📊 Control charts con límites de control

### 8.5 Causality & Attribution
- **Incrementality Testing:** Lift de campañas
- **A/B Test Results:** Variante ganadora
- **Multi-Touch Attribution Models**
- **Marketing Mix Modeling (MMM)**

**Gráficos:**
- 📊 Bar: Lift % por canal
- 🎯 Waterfall: Attribution contribution
- 📈 Time series: Incrementality over time

---

## 9. REPORTES POR STAKEHOLDER

### 9.1 Para CEO/Founders
**Frecuencia:** Semanal + Mensual

**Métricas clave:**
- Revenue & Growth rate
- Gross margin
- CAC & LTV
- Cash runway
- Active customers
- Top strategic initiatives progress

**Formato:** Executive summary (1 página) + Dashboard interactivo

---

### 9.2 Para CFO
**Frecuencia:** Semanal + Mensual + Trimestral

**Métricas clave:**
- P&L completo
- Cash flow
- Unit economics
- Working capital
- EBITDA & Net margin
- Budget vs Actual

**Formato:** Financial statements + variance analysis

---

### 9.3 Para CMO
**Frecuencia:** Diaria + Semanal + Mensual

**Métricas clave:**
- ROAS por canal
- CAC por canal
- Traffic & Conversions
- Campaign performance
- Brand metrics (awareness, consideration)
- Content performance

**Formato:** Marketing dashboard + campaign reports

---

### 9.4 Para Head of Operations
**Frecuencia:** Diaria + Semanal

**Métricas clave:**
- Order fulfillment SLA
- Inventory levels
- Stockouts & Overstock
- Delivery performance
- Return rate
- Operational costs

**Formato:** Operations dashboard + daily summary

---

### 9.5 Para Head of Product
**Frecuencia:** Semanal + Mensual

**Métricas clave:**
- Product performance (revenue, margin, units)
- Conversion funnel por producto
- Product ratings & reviews
- Inventory turnover
- New product performance
- Cannibalization analysis

**Formato:** Product analytics dashboard + monthly review

---

### 9.6 Para Customer Success
**Frecuencia:** Diaria + Semanal

**Métricas clave:**
- CSAT & NPS
- Ticket volume & resolution time
- Repeat contact rate
- Customer effort score
- Top issues/complaints
- Agent performance

**Formato:** Support dashboard + quality reports

---

## 10. DASHBOARDS ESPECIALIZADOS

### 10.1 Cohort Analysis Dashboard
- Retención por cohorte
- Revenue per cohort over time
- LTV por cohorte
- Repeat purchase behavior

**Gráficos:**
- 🔥 Retention heatmap
- 📈 Cohort revenue curves
- 📊 Stacked area: Cohort contribution

---

### 10.2 A/B Testing Dashboard
- Tests activos
- Sample size & statistical significance
- Lift por variante
- Conversion rates comparison
- Revenue impact

**Gráficos:**
- 📊 Bar: Variantes comparison
- 📈 Time series: Cumulative results
- 🎯 Confidence intervals

---

### 10.3 Fraud & Risk Dashboard
- Pedidos marcados como sospechosos
- Chargebacks
- Failed payments
- High-risk geographic zones
- Fraud detection scores

**Gráficos:**
- 🗺️ Map: Fraud hotspots
- 📊 Bar: Fraud by payment method
- 📈 Time series: Fraud rate trend

---

### 10.4 Competitive Intelligence Dashboard
- Price comparison vs competitors
- Assortment overlap
- Market share estimación
- Competitive promotions tracking
- Share of voice

**Gráficos:**
- 📊 Bar: Price positioning
- 🎯 Scatter: Price vs Features matrix
- 📈 Line: Market share evolution

---

### 10.5 Seasonality & Trends Dashboard
- YoY growth by month
- Seasonal peaks identification
- Trend decomposition (Trend + Season + Residual)
- Holiday performance
- Weather correlation (si aplica)

**Gráficos:**
- 📈 Time series decomposition
- 📊 Heatmap: Month x Year performance
- 📅 Calendar: Sales by day

---

## 11. HERRAMIENTAS & STACK TECNOLÓGICO RECOMENDADO

### 11.1 Analytics & BI
- **Google Analytics 4:** Web analytics
- **Mixpanel / Amplitude:** Product analytics
- **Tableau / Power BI / Looker:** Business Intelligence
- **Metabase / Redash:** Open source BI
- **Apache Superset:** BI open source

### 11.2 Data Warehouse
- **Snowflake**
- **BigQuery**
- **Redshift**
- **PostgreSQL** (para startups)

### 11.3 ETL/ELT
- **Fivetran / Stitch:** Conectores pre-built
- **Airbyte:** Open source
- **dbt (data build tool):** Transformación

### 11.4 Event Tracking
- **Segment:** Customer data platform
- **RudderStack:** Open source CDP
- **Snowplow:** Event analytics

### 11.5 A/B Testing
- **Optimizely**
- **VWO**
- **Google Optimize** (deprecado, migrar a otros)
- **Split.io**

### 11.6 Heatmaps & Session Recording
- **Hotjar**
- **FullStory**
- **Crazy Egg**
- **Microsoft Clarity** (gratis)

### 11.7 Customer Feedback
- **Typeform / Google Forms:** Encuestas
- **Delighted / Promoter.io:** NPS
- **Qualtrics:** Enterprise feedback
- **UserTesting:** User research

---

## 12. PRIORIZACIÓN DE DASHBOARDS (PARA APEXREMEDY)

### 🔴 FASE 1 - CRÍTICO (implementar YA)
1. **Executive Dashboard:** Vista general del negocio
2. **Dashboard Comercial:** Revenue, orders, productos top
3. **Dashboard de Inventario:** Stock crítico, reposición
4. **Dashboard Operaciones:** Fulfillment, envíos

### 🟡 FASE 2 - IMPORTANTE (1-2 meses)
5. **Dashboard de Clientes:** CLV, retención, segmentos
6. **Dashboard de Marketing:** ROAS, canales, campañas
7. **Dashboard Geográfico:** Heatmap RM + regiones (ya lo tienes!)
8. **Dashboard de Producto:** Performance por SKU

### 🟢 FASE 3 - NICE TO HAVE (3-6 meses)
9. **Dashboard UX:** Funnel, abandono de carrito
10. **Dashboard Financiero:** P&L, cash flow
11. **Cohort Analysis:** Retención temporal
12. **Predictive Analytics:** Forecasting, churn prediction

---

## 13. CHECKLIST DE IMPLEMENTACIÓN

### ✅ Data Foundation
- [x] Identificar fuentes de datos (DB, APIs, logs)
- [x] Configurar Data Warehouse (SQLite con tablas de analytics)
- [x] Implementar ETL/pipelines (endpoints de analytics creados)
- [x] Establecer data governance (Data Dictionary y documentación creada)

### ✅ Tracking & Instrumentation
- [x] Event tracking (tablas web_events, pageviews, web_sessions creadas)
- [x] E-commerce tracking (tracking de transacciones, cart, checkout)
- [x] Custom events (wishlist, product views, etc. - estructura creada)
- [x] UTM parameters en todas las campañas (tabla web_sessions con campos UTM, seed incluye datos)

### ✅ Dashboards
- [x] Definir KPIs por área (según dashboards.md)
- [x] Diseñar mockups de dashboards (HTML con tabs implementado)
- [x] Implementar en herramienta BI (dashboard.html completo con Chart.js y ECharts)
- [x] Configurar actualizaciones automáticas (botón refresh y auto-load)
- [x] Permisos por rol (middleware requireAdmin en todos los endpoints)

### ✅ Automation & Alerts
- [x] Reportes automáticos por email (estructura creada, ver backend/scripts/run-alerts.js)
- [x] Alertas de anomalías (alertService.detectRevenueAnomalies implementado)
- [x] Notificaciones de stock crítico (alertService.checkLowStock implementado)
- [x] Alertas de fraude (alertService.detectFraud implementado)

### ✅ Documentation
- [x] Documentar definiciones de métricas (dashboards.md completo)
- [x] Guías de uso de dashboards (documentacion/GUIA_DASHBOARDS.md)
- [x] Data dictionary (documentacion/DATA_DICTIONARY.md)
- [x] Playbooks de acción (documentacion/PLAYBOOKS_ACCION.md)

### ✅ Data Seeding
- [x] Seed de órdenes completas con direcciones y envíos (seed-orders.js)
- [x] Seed de analytics y tracking (seed-analytics.js)
- [x] Seed integrado en seed-all.js
- [x] Validación de datos (validate-dashboards.js)

### ✅ Testing & Validation
- [x] Script de validación de dashboards (validate-dashboards.js)
- [x] Script de alertas funcional (run-alerts.js)
- [x] Todos los endpoints de analytics implementados
- [x] Frontend completo con visualizaciones

---

## 14. MÉTRICAS ESPECÍFICAS PARA CANNABIS E-COMMERCE

### 14.1 Compliance & Regulatory
- **ID Verification Rate:** % clientes verificados
- **Age Gate Pass Rate**
- **Regulatory Compliance Score**
- **Audit-Ready Transaction %**
- **ISP Compliance:** Validación de recetas

### 14.2 Product Categories
- **Revenue by Product Type:** Flores, Aceites, Concentrados, Edibles
- **THC/CBD Ratio Sales**
- **Medicinal vs Recreational (si aplica)**
- **Strain Performance:** Indica, Sativa, Hybrid

### 14.3 Dosage & Usage
- **Average Dosage per Customer**
- **Refill Rate:** Clientes que recompran mismo producto
- **Cross-Category Purchase:** % clientes con >1 categoría

### 14.4 Medical & Prescriptions
- **Prescription Upload Rate**
- **Doctor Referral Rate**
- **Medical Consultation Conversion**
- **Renewal Rate de recetas**