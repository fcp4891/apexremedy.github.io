1) Datos que necesitas (agregados diarios o por rango)

Output del backend (JSON):

{
  "range": {"from":"2025-10-01","to":"2025-11-04"},
  "unit":"orders",
  "totals": {
    "RM": [
      {"comuna":"Santiago","orders":412},
      {"comuna":"Maipú","orders":355},
      {"comuna":"La Florida","orders":298}
      // ...
    ],
    "RESTO": [
      {"region":"Valparaíso","comuna":"Viña del Mar","orders":82},
      {"region":"Biobío","comuna":"Concepción","orders":61}
      // ...
    ]
  }
}


SQL (ejemplo SQLite/Postgres):

-- Agrega por comuna, con filtro por fecha y estado de pedido entregado/pagado
SELECT comuna, region, COUNT(*) AS orders
FROM orders
WHERE paid_at BETWEEN :from AND :to
  AND status IN ('paid','fulfilled','delivered')
GROUP BY comuna, region;


Tabla de referencia (1 vez): comunas_cl

comuna, region, cut_comuna (código), cut_region (código), lat, lng

La usarás para mapear nombres inconsistentes (acentos, mayúsculas) y para unir con GeoJSON.

2) GeoJSON de la RM (Santiago)

Carga una capa GeoJSON de comunas de la RM (una sola vez en el frontend o via CDN interno).

Guarda el archivo como rm_comunas.geojson y regístralo en ECharts con echarts.registerMap('rm_comunas', geoJson).

Tip: mantén un diccionario de normalización { "SANTIAGO": "Santiago", "MAIPU":"Maipú", ... } para que los nombres coincidan con el properties.NOM_COM del GeoJSON.

3) API minimal (REST)

GET /analytics/orders-by-comuna?from=YYYY-MM-DD&to=YYYY-MM-DD

Responde el JSON del punto 1.

(Opcional) GET /geo/rm-comunas → sirve el GeoJSON.

4) Frontend ECharts — Mapa de calor RM + Barras resto
4.1. Registro del mapa y normalización
// 1) Carga el geojson (fetch local o endpoint)
const geoJson = await fetch('/geo/rm-comunas').then(r => r.json());
echarts.registerMap('rm_comunas', geoJson);

// 2) Normalizador de nombres (ejemplo)
const normalize = s => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toUpperCase().trim();

4.2. Preparar datos para el mapa y las barras
const data = await fetch(`/analytics/orders-by-comuna?from=${from}&to=${to}`).then(r=>r.json());

// RM → [{name, value}]
const rmMapData = data.totals.RM.map(d => ({
  name: d.comuna,    // Debe coincidir con properties.NOM_COM del GeoJSON
  value: d.orders
}));

// RESTO → agregamos por región y rankeamos top-N
const byRegion = {};
for (const r of data.totals.RESTO) {
  byRegion[r.region] = (byRegion[r.region] || 0) + r.orders;
}
const restoSeries = Object.entries(byRegion)
  .map(([region, orders]) => ({ region, orders }))
  .sort((a,b)=>b.orders-a.orders);

4.3. Opción ECharts – Panel 1: Mapa de Calor RM
const optionRM = {
  title: { text: 'Heatmap de Pedidos por Comuna (RM)', left: 'center' },
  tooltip: {
    trigger: 'item',
    formatter: p => `${p.name}<br/>Pedidos: ${p.value?.toLocaleString() ?? 0}`
  },
  visualMap: {
    min: 0,
    max: Math.max(...rmMapData.map(d=>d.value), 1),
    left: 'left',
    top: 'bottom',
    calculable: true
  },
  series: [{
    name: 'Pedidos',
    type: 'map',
    map: 'rm_comunas',
    roam: true,
    emphasis: { label: { show: false } },
    data: rmMapData
  }]
};

4.4. Opción ECharts – Panel 2: Barras (Resto de Chile por Región)
const categories = restoSeries.map(r => r.region);
const values = restoSeries.map(r => r.orders);

const optionResto = {
  title: { text: 'Pedidos por Región (Resto de Chile)', left: 'center' },
  tooltip: { trigger: 'axis' },
  grid: { left: 80, right: 20, bottom: 40, top: 60 },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: categories },
  series: [{
    type: 'bar',
    data: values,
    label: { show: true, position: 'right' }
  }]
};


Sugerencia UI: coloca ambos paneles lado a lado en un layout 2 columnas con la misma barra de rango de fechas y filtros (estado de pedido, método de envío, bodega).

5) Filtros clave (para que sea útil al negocio)

Fecha (desde/hasta, presets: 7 días, 30 días, FY YTD).

Estado de pedido (paid, fulfilled, delivered).

Método/Proveedor de envío (Starken, Chilexpress, Delivery propio).

Bodega/Dispatch center (si tienen múltiple origen).

Tipo de producto (medicinal vs no medicinal; subcategorías).

Ticket mínimo (ej. > $25.000 para ver dónde convendría envío gratis).

6) Decisiones que podrás tomar con estas vistas

Zonas calientes en RM → define rutas y horarios de repartidores propios.

Regiones con alto costo/envío lento → renegocia carrier o pickup en sucursal.

Detección de “bolsillos” emergentes de demanda fuera de RM → campañas locales.

Dónde ofrecer Free Shipping: cruza este tablero con margen y costo logístico.

7) Consideraciones prácticas

Normaliza nombres de comuna (acentos, mayúsculas) y guarda una clave CUT para uniones confiables.

Cachea agregados (ej. 15 minutos) para que el mapa sea fluido.

Datos faltantes: si una comuna no aparece en el JSON, muestra 0 (no quiebres el mapa).

Privacidad: si hay muy pocos pedidos en una comuna (ej. < 3), agrega suavizado o agrupa por región.