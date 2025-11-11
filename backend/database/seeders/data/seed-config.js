// backend/database/seeders/data/seed-config.js
// Configuración centralizada de datos para seed
// Facilita actualización y mantenimiento

const CATEGORIES = {
    // Medicinales
    MEDICINAL_FLORES: 'medicinal-flores',
    MEDICINAL_ACEITES: 'medicinal-aceites',
    MEDICINAL_CONCENTRADOS: 'medicinal-concentrados',
    MEDICINAL_CAPSULAS: 'medicinal-capsulas',
    MEDICINAL_TOPICOS: 'medicinal-topicos',
    
    // Públicas
    SEMILLAS: 'semillas',
    VAPORIZADORES: 'vaporizadores',
    ACCESORIOS: 'accesorios',
    ROPA: 'ropa',
    CBD: 'cbd'
  };
  
  const BRANDS = {
    APEX_REMEDY: 'apex-remedy',
    AURORA: 'aurora-cannabis',
    TILRAY: 'tilray',
    CANOPY: 'canopy-growth',
    BEDROCAN: 'bedrocan',
    PAX: 'pax-labs',
    STORZ: 'storz-bickel',
    SENSI: 'sensi-seeds',
    BARNEYS: 'barneys-farm'
  };
  
  const PRODUCT_TYPES = {
    FLOWER: 'flower',
    OIL: 'oil',
    CONCENTRATE: 'concentrate',
    CAPSULE: 'capsule',
    TOPICAL: 'topical',
    SEED: 'seed',
    ACCESSORY: 'accessory',
    APPAREL: 'apparel'
  };
  
  const MEDICAL_CATEGORIES = {
    THC: 'thc',
    CBD: 'cbd',
    BALANCED: 'balanced'
  };
  
  module.exports = {
    CATEGORIES,
    BRANDS,
    PRODUCT_TYPES,
    MEDICAL_CATEGORIES
  };