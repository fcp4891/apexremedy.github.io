// analytics.routes.js
// Agregar estas rutas a tu backend Express

const express = require('express');
const router = express.Router();
const db = require('./database'); // Tu conexión a DB

// Catálogo de comunas RM con códigos CUT (para normalización)
const COMUNAS_RM = {
  '13101': 'Santiago',
  '13102': 'Maipú',
  '13103': 'Ñuñoa',
  '13104': 'Providencia',
  '13105': 'Recoleta',
  '13106': 'Renca',
  '13107': 'Las Condes',
  '13108': 'Vitacura',
  '13109': 'Lo Barnechea',
  '13110': 'La Florida',
  '13111': 'Peñalolén',
  '13112': 'La Reina',
  '13113': 'Macul',
  '13114': 'San Joaquín',
  '13115': 'La Granja',
  '13116': 'San Miguel',
  '13117': 'San Ramón',
  '13118': 'La Cisterna',
  '13119': 'El Bosque',
  '13120': 'Pedro Aguirre Cerda',
  '13121': 'Lo Espejo',
  '13122': 'Estación Central',
  '13123': 'Cerrillos',
  '13124': 'Quinta Normal',
  '13125': 'Lo Prado',
  '13126': 'Pudahuel',
  '13127': 'Cerro Navia',
  '13128': 'Conchalí',
  '13129': 'Quilicura',
  '13130': 'Huechuraba',
  '13131': 'Independencia',
  '13201': 'Puente Alto',
  '13202': 'San Bernardo',
  '13203': 'Buin',
  '13204': 'Calera de Tango',
  '13205': 'Paine',
  '13301': 'Colina',
  '13302': 'Lampa',
  '13303': 'Tiltil',
  '13401': 'San José de Maipo',
  '13402': 'Pirque',
  '13501': 'Melipilla',
  '13502': 'Alhué',
  '13503': 'Curacaví',
  '13504': 'María Pinto',
  '13505': 'San Pedro',
  '13601': 'Talagante',
  '13602': 'El Monte',
  '13603': 'Isla de Maipo',
  '13604': 'Padre Hurtado',
  '13605': 'Peñaflor'
};

// Helper: Normalizar nombres (sin acentos, mayúsculas)
const normalizar = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
};

/**
 * GET /analytics/orders-by-comuna
 * Retorna pedidos agregados por comuna (solo RM)
 * Query params: from, to, status (opcional)
 */
router.get('/orders-by-comuna', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    
    // Validación de fechas
    if (!from || !to) {
      return res.status(400).json({ error: 'Se requieren parámetros from y to (YYYY-MM-DD)' });
    }

    // Query base (ajusta según tu esquema)
    let query = `
      SELECT 
        UPPER(TRIM(comuna)) as comuna,
        COUNT(*) as orders
      FROM orders o
      WHERE o.created_at BETWEEN ? AND ?
        AND o.region_id = 13  -- Solo RM
    `;
    
    const params = [from + ' 00:00:00', to + ' 23:59:59'];

    // Filtro opcional por estado
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY UPPER(TRIM(comuna)) ORDER BY orders DESC';

    const rows = await db.all(query, params);

    // Normalizar nombres para match con GeoJSON
    const result = rows.map(row => ({
      comuna: row.comuna,
      orders: row.orders
    }));

    res.json(result);
  } catch (error) {
    console.error('Error en orders-by-comuna:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

/**
 * GET /analytics/orders-resto-por-region
 * Retorna pedidos por región (excluyendo RM)
 */
router.get('/orders-resto-por-region', async (req, res) => {
  try {
    const { from, to, status } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Se requieren parámetros from y to' });
    }

    let query = `
      SELECT 
        r.nombre as region,
        COUNT(o.id) as orders
      FROM orders o
      JOIN regiones r ON o.region_id = r.id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.region_id != 13  -- Excluir RM
    `;
    
    const params = [from + ' 00:00:00', to + ' 23:59:59'];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY r.nombre ORDER BY orders DESC';

    const rows = await db.all(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Error en orders-resto-por-region:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

/**
 * GET /analytics/top-comunas
 * Top 10 comunas con más pedidos (toda Chile)
 */
router.get('/top-comunas', async (req, res) => {
  try {
    const { from, to, limit = 10 } = req.query;
    
    const query = `
      SELECT 
        comuna,
        region_id,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY comuna, region_id
      ORDER BY orders DESC
      LIMIT ?
    `;

    const rows = await db.all(query, [
      from + ' 00:00:00',
      to + ' 23:59:59',
      parseInt(limit)
    ]);

    res.json(rows);
  } catch (error) {
    console.error('Error en top-comunas:', error);
    res.status(500).json({ error: 'Error al obtener top comunas' });
  }
});

module.exports = router;
