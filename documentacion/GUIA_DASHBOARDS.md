# 📊 Guía de Uso de Dashboards

## Introducción

Esta guía explica cómo usar todos los dashboards implementados en el sistema de administración de Apexremedy.

## Acceso a los Dashboards

1. Inicia sesión en el panel de administración
2. Navega a **Dashboard** desde el menú principal
3. Selecciona el dashboard deseado usando las tabs en la parte superior

## Estructura de Dashboards

### 1. Executive Dashboard
**Audiencia:** C-Level, CEO, Founders

**Métricas Principales:**
- Revenue total y crecimiento
- CAC (Costo de Adquisición de Cliente)
- LTV (Lifetime Value) y ratio LTV:CAC
- Tasa de conversión
- GMV (Gross Merchandise Value)
- Margen bruto y cash flow

**Cómo usar:**
- Selecciona el período de análisis (7d, 30d, 90d, 1y, YTD, MTD)
- Revisa el cumplimiento de objetivos en el gauge
- Analiza la tendencia de revenue en el gráfico de línea
- Explora el mapa geográfico para ver distribución de ventas

### 2. Dashboard Comercial/Ventas
**Audiencia:** Equipo de Ventas, Gerentes Comerciales

**Secciones:**
- **Revenue & Orders:** Ventas diarias, estado de pedidos, distribución por categoría y método de pago
- **Top Productos:** Mejores productos por revenue, unidades o margen
- **Performance Temporal:** Ventas por hora del día, día de semana, y heatmap

**Cómo usar:**
- Usa el selector de período para cambiar el rango de fechas
- Cambia el criterio de ordenamiento en "Top Productos" (revenue/units/margin)
- Analiza el heatmap para identificar patrones de compra

### 3. Dashboard de Clientes (CRM)
**Audiencia:** Equipo de Marketing, Customer Success

**Secciones:**
- **Adquisición:** Nuevos clientes, canales de adquisición
- **Segmentación RFM:** Clientes clasificados por Recency, Frequency, Monetary
- **Cohort Analysis:** Retención de clientes por cohorte
- **Top Clientes:** Clientes con mayor CLV

**Cómo usar:**
- Revisa la tabla RFM para identificar segmentos VIP, Champions, At Risk
- Analiza cohortes para entender retención a largo plazo
- Identifica clientes de alto valor para programas de lealtad

### 4. Dashboard de Marketing
**Audiencia:** CMO, Equipo de Marketing

**Secciones:**
- **Campañas:** ROAS, inversión, conversiones por campaña
- **Canales:** Performance por fuente/medio (UTM)
- **Email Marketing:** Open rates, click rates, entregados

**Cómo usar:**
- Identifica campañas con mejor ROAS (>3:1 es ideal)
- Compara performance de canales
- Optimiza estrategias basado en datos de email

### 5. Dashboard de Producto
**Audiencia:** Head of Product, Merchandising

**Secciones:**
- **Performance por Categoría:** Revenue y unidades vendidas
- **Productos sin Ventas:** Productos que requieren promoción
- **Devoluciones:** Productos con alta tasa de devolución

**Cómo usar:**
- Identifica categorías de alto rendimiento
- Revisa productos sin ventas para decidir promociones o descuentos
- Analiza devoluciones para mejorar calidad o descripción de productos

### 6. Dashboard de Inventario
**Audiencia:** Operaciones, Compras

**Secciones:**
- **KPIs:** Valor de inventario, stock bajo, sin stock
- **Productos con Stock Bajo:** Lista de productos que requieren reposición
- **Rotación:** Productos con mayor rotación

**Cómo usar:**
- Revisa diariamente productos con stock bajo
- Usa la rotación para optimizar compras
- Planifica reposiciones basado en demanda histórica

### 7. Dashboard de Operaciones
**Audiencia:** Head of Operations, Logística

**Secciones:**
- **Fulfillment:** Tiempo de procesamiento, estados
- **Shipping:** Performance por carrier, tiempos de entrega
- **Devoluciones:** Tasa y razones de devolución

**Cómo usar:**
- Monitorea SLA de fulfillment
- Compara performance de carriers
- Identifica problemas recurrentes en devoluciones

### 8. Dashboard UX & Web
**Audiencia:** Product, UX/UI, Marketing

**Secciones:**
- **Sessions:** Total, usuarios únicos, duración, bounce rate
- **Funnel:** Conversión por etapa (homepage → producto → carrito → checkout → compra)
- **Páginas Más Visitadas:** Top páginas con métricas
- **Cart Abandonment:** Abandonos y recuperaciones

**Cómo usar:**
- Analiza el funnel para identificar puntos de fricción
- Revisa páginas más visitadas para optimización
- Implementa estrategias de recuperación de carrito

### 9. Dashboard Financiero
**Audiencia:** CFO, Contabilidad

**Secciones:**
- **P&L:** Revenue, COGS, gastos operativos, net profit
- **Unit Economics:** Revenue por orden, COGS por orden, contribution margin

**Cómo usar:**
- Revisa P&L para entender rentabilidad
- Analiza unit economics para optimizar modelos de negocio
- Compara períodos para identificar tendencias

### 10. Dashboard Servicio al Cliente
**Audiencia:** Customer Success, Soporte

**Secciones:**
- **Tickets:** Volumen, tiempo de respuesta, tasa de resolución
- **Categorías:** Distribución de tickets por tipo

**Cómo usar:**
- Monitorea tiempo de respuesta (objetivo: <24h)
- Identifica problemas recurrentes
- Optimiza procesos de soporte

## Selector de Período

Todos los dashboards incluyen un selector de período en la parte superior:
- **7d:** Últimos 7 días
- **30d:** Últimos 30 días (recomendado)
- **90d:** Últimos 90 días
- **1y:** Último año
- **YTD:** Año actual (Year to Date)
- **MTD:** Mes actual (Month to Date)

## Actualización de Datos

- **Manual:** Click en el botón "Actualizar" en la parte superior
- **Automática:** Los dashboards se actualizan automáticamente al cambiar de tab

## Interpretación de Métricas

### KPIs Clave
- **CAC:** Debe ser menor que LTV (ideal: LTV:CAC > 3:1)
- **Conversion Rate:** Típicamente 1-3% para e-commerce
- **Bounce Rate:** <40% es bueno
- **Cart Abandonment:** 70-80% es normal, objetivo: recuperar 10-15%

### Segmentos RFM
- **VIP (444+):** Máximo valor, mantener con programas exclusivos
- **Champion (333+):** Clientes leales, upsell/cross-sell
- **Loyal (222+):** Clientes regulares, mantener engagement
- **At Risk (111+):** Clientes en peligro, campañas de reactivación
- **Lost (<111):** Clientes dormidos, campañas de recuperación

## Mejores Prácticas

1. **Revisa diariamente:** Executive, Comercial, Inventario
2. **Revisa semanalmente:** Marketing, Producto, Operaciones
3. **Revisa mensualmente:** Clientes (RFM), Financiero, UX
4. **Configura alertas:** Para stock crítico y anomalías
5. **Compara períodos:** Usa YTD y comparativas año vs año

## Troubleshooting

### No se cargan los datos
- Verifica conexión con el backend
- Asegúrate de estar autenticado como admin
- Revisa la consola del navegador para errores

### Gráficos vacíos
- Ejecuta los seeds: `node seed-all.js`
- Verifica que hay datos en el período seleccionado
- Cambia el período si es necesario

### Datos desactualizados
- Click en "Actualizar"
- Verifica que el backend esté corriendo
- Revisa logs del servidor

## Soporte

Para problemas o preguntas sobre los dashboards, contacta al equipo de desarrollo.
