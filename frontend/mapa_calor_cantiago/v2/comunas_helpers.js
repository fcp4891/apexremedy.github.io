// helpers/comunas.js
// Utilidades para normalización y matching de comunas

/**
 * Catálogo completo de comunas RM con códigos CUT
 */
const COMUNAS_RM_CUT = {
  '13101': { nombre: 'Santiago', normalizado: 'SANTIAGO' },
  '13102': { nombre: 'Cerrillos', normalizado: 'CERRILLOS' },
  '13103': { nombre: 'Cerro Navia', normalizado: 'CERRO NAVIA' },
  '13104': { nombre: 'Conchalí', normalizado: 'CONCHALI' },
  '13105': { nombre: 'El Bosque', normalizado: 'EL BOSQUE' },
  '13106': { nombre: 'Estación Central', normalizado: 'ESTACION CENTRAL' },
  '13107': { nombre: 'Huechuraba', normalizado: 'HUECHURABA' },
  '13108': { nombre: 'Independencia', normalizado: 'INDEPENDENCIA' },
  '13109': { nombre: 'La Cisterna', normalizado: 'LA CISTERNA' },
  '13110': { nombre: 'La Florida', normalizado: 'LA FLORIDA' },
  '13111': { nombre: 'La Granja', normalizado: 'LA GRANJA' },
  '13112': { nombre: 'La Pintana', normalizado: 'LA PINTANA' },
  '13113': { nombre: 'La Reina', normalizado: 'LA REINA' },
  '13114': { nombre: 'Las Condes', normalizado: 'LAS CONDES' },
  '13115': { nombre: 'Lo Barnechea', normalizado: 'LO BARNECHEA' },
  '13116': { nombre: 'Lo Espejo', normalizado: 'LO ESPEJO' },
  '13117': { nombre: 'Lo Prado', normalizado: 'LO PRADO' },
  '13118': { nombre: 'Macul', normalizado: 'MACUL' },
  '13119': { nombre: 'Maipú', normalizado: 'MAIPU' },
  '13120': { nombre: 'Ñuñoa', normalizado: 'NUNOA' },
  '13121': { nombre: 'Pedro Aguirre Cerda', normalizado: 'PEDRO AGUIRRE CERDA' },
  '13122': { nombre: 'Peñalolén', normalizado: 'PENALOLEN' },
  '13123': { nombre: 'Providencia', normalizado: 'PROVIDENCIA' },
  '13124': { nombre: 'Pudahuel', normalizado: 'PUDAHUEL' },
  '13125': { nombre: 'Quilicura', normalizado: 'QUILICURA' },
  '13126': { nombre: 'Quinta Normal', normalizado: 'QUINTA NORMAL' },
  '13127': { nombre: 'Recoleta', normalizado: 'RECOLETA' },
  '13128': { nombre: 'Renca', normalizado: 'RENCA' },
  '13129': { nombre: 'San Joaquín', normalizado: 'SAN JOAQUIN' },
  '13130': { nombre: 'San Miguel', normalizado: 'SAN MIGUEL' },
  '13131': { nombre: 'San Ramón', normalizado: 'SAN RAMON' },
  '13132': { nombre: 'Vitacura', normalizado: 'VITACURA' },
  '13201': { nombre: 'Puente Alto', normalizado: 'PUENTE ALTO' },
  '13202': { nombre: 'Pirque', normalizado: 'PIRQUE' },
  '13203': { nombre: 'San José de Maipo', normalizado: 'SAN JOSE DE MAIPO' },
  '13301': { nombre: 'Colina', normalizado: 'COLINA' },
  '13302': { nombre: 'Lampa', normalizado: 'LAMPA' },
  '13303': { nombre: 'Tiltil', normalizado: 'TILTIL' },
  '13401': { nombre: 'San Bernardo', normalizado: 'SAN BERNARDO' },
  '13402': { nombre: 'Buin', normalizado: 'BUIN' },
  '13403': { nombre: 'Calera de Tango', normalizado: 'CALERA DE TANGO' },
  '13404': { nombre: 'Paine', normalizado: 'PAINE' },
  '13501': { nombre: 'Melipilla', normalizado: 'MELIPILLA' },
  '13502': { nombre: 'Alhué', normalizado: 'ALHUE' },
  '13503': { nombre: 'Curacaví', normalizado: 'CURACAVI' },
  '13504': { nombre: 'María Pinto', normalizado: 'MARIA PINTO' },
  '13505': { nombre: 'San Pedro', normalizado: 'SAN PEDRO' },
  '13601': { nombre: 'Talagante', normalizado: 'TALAGANTE' },
  '13602': { nombre: 'El Monte', normalizado: 'EL MONTE' },
  '13603': { nombre: 'Isla de Maipo', normalizado: 'ISLA DE MAIPO' },
  '13604': { nombre: 'Padre Hurtado', normalizado: 'PADRE HURTADO' },
  '13605': { nombre: 'Peñaflor', normalizado: 'PENAFLOR' }
};

/**
 * Normaliza un string removiendo acentos, ñ → n, y convirtiendo a mayúsculas
 */
function normalizar(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remueve acentos
    .toUpperCase()
    .trim();
}

/**
 * Busca código CUT por nombre de comuna (fuzzy matching)
 */
function buscarCUT(nombreComuna) {
  const normBuscado = normalizar(nombreComuna);
  
  for (const [cut, data] of Object.entries(COMUNAS_RM_CUT)) {
    if (data.normalizado === normBuscado) {
      return cut;
    }
  }
  
  return null;
}

/**
 * Busca nombre oficial por código CUT
 */
function buscarNombrePorCUT(cut) {
  return COMUNAS_RM_CUT[cut]?.nombre || null;
}

/**
 * Valida si una comuna pertenece a la RM
 */
function esComunaRM(nombreComuna) {
  return buscarCUT(nombreComuna) !== null;
}

/**
 * Matchea un array de pedidos con códigos CUT
 * @param {Array} pedidos - [{comuna: "Santiago", orders: 123}, ...]
 * @returns {Array} - [{cut: "13101", comuna: "Santiago", orders: 123}, ...]
 */
function matchearPedidosConCUT(pedidos) {
  return pedidos.map(p => {
    const cut = buscarCUT(p.comuna);
    return {
      ...p,
      cut,
      comunaNormalizada: COMUNAS_RM_CUT[cut]?.nombre || p.comuna
    };
  }).filter(p => p.cut); // Solo comunas válidas de RM
}

/**
 * Genera lookup inverso: nombre normalizado → nombre GeoJSON
 * Útil para matchear con properties.NOM_COM del GeoJSON
 */
function generarLookupGeoJSON(geojson) {
  const lookup = {};
  
  geojson.features.forEach(feature => {
    const nomGeo = feature.properties.NOM_COM || feature.properties.name;
    const cutGeo = feature.properties.CUT_COM;
    
    if (nomGeo) {
      const normGeo = normalizar(nomGeo);
      lookup[normGeo] = {
        nombreGeoJSON: nomGeo,
        cut: cutGeo
      };
    }
  });
  
  return lookup;
}

/**
 * Completa comunas faltantes con 0 pedidos
 * @param {Array} pedidos - Pedidos reales
 * @returns {Array} - Todas las comunas RM (con 0 si no hay datos)
 */
function completarComunasRM(pedidos) {
  const mapa = {};
  
  // Mapear pedidos existentes
  pedidos.forEach(p => {
    const cut = buscarCUT(p.comuna);
    if (cut) {
      mapa[cut] = p.orders;
    }
  });
  
  // Completar todas las comunas
  return Object.entries(COMUNAS_RM_CUT).map(([cut, data]) => ({
    cut,
    comuna: data.nombre,
    orders: mapa[cut] || 0
  }));
}

// Exportar funciones
module.exports = {
  COMUNAS_RM_CUT,
  normalizar,
  buscarCUT,
  buscarNombrePorCUT,
  esComunaRM,
  matchearPedidosConCUT,
  generarLookupGeoJSON,
  completarComunasRM
};

// Ejemplo de uso:
/*
const { matchearPedidosConCUT, completarComunasRM } = require('./helpers/comunas');

const pedidos = [
  { comuna: 'Santiago', orders: 412 },
  { comuna: 'Maipú', orders: 355 },
  { comuna: 'Ñuñoa', orders: 234 }
];

// Agregar CUT
const conCUT = matchearPedidosConCUT(pedidos);
console.log(conCUT);
// [
//   { cut: '13101', comuna: 'Santiago', orders: 412, comunaNormalizada: 'Santiago' },
//   { cut: '13119', comuna: 'Maipú', orders: 355, comunaNormalizada: 'Maipú' },
//   ...
// ]

// Completar con 0s
const todas = completarComunasRM(pedidos);
console.log(todas.length); // 52 (todas las comunas RM)
*/
