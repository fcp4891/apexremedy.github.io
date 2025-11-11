// backend/database/seeders/data/products-data.js
// Datos centralizados de productos - Fácil de actualizar

const { CATEGORIES, BRANDS, PRODUCT_TYPES, MEDICAL_CATEGORIES } = require('./seed-config');

// ============================================
// FLORES MEDICINALES
// ============================================
const FLORES_MEDICINALES = [
  {
    name: 'Citron Lemon · Sativa Energizante',
    slug: 'citron-lemon-sativa',
    sku: 'MED-FLOWER-CITRON-001',
    description: 'Sativa dominante (60/40) con intenso perfil cítrico. THC 16%. Ideal para uso diurno con efectos energizantes y enfoque mental.',
    short_description: 'Sativa 60% cítrica energizante',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 13500,
    stock_quantity: 300,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 16.0, cbd: 0.4, cbn: 0.2, cbg: 0.8, thcv: 0.5 },
    terpene_profile: { 'Limoneno': 1.2, 'Pineno': 0.6, 'Mirceno': 0.4, 'Terpinoleno': 0.5 },
    strain_info: { 
      type: 'Sativa dominante', 
      genetics: '60% Sativa / 40% Indica', 
      lineage: 'Lemon Skunk x Unknown Sativa',
      origin: 'Países Bajos' 
    },
    therapeutic_info: { 
      conditions: ['Fatiga', 'Depresión leve', 'Falta de concentración', 'Pérdida de apetito'],
      benefits: ['Energía sostenida', 'Claridad mental', 'Mejora del ánimo', 'Creatividad'],
      effects: ['Energizante', 'Eufórico', 'Enfoque', 'Sociable']
    },
    usage_info: { 
      recommended_time: 'Diurno/matutino',
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '2-3 horas'
    },
    safety_info: { 
      contraindications: ['Ansiedad severa', 'Trastornos del corazón'],
      side_effects: ['Boca seca', 'Ojos rojos', 'Leve ansiedad en dosis altas'],
      interactions: ['Estimulantes', 'Antidepresivos']
    },
    attributes: { aroma: 'Limón, Cítrico, Fresco', flavor: 'Limón intenso, Dulce', appearance: 'Cogollos verde claro con pistilos naranjas' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Fruit Spirit · Sativa Potente',
    slug: 'fruit-spirit-sativa-potente',
    sku: 'MED-FLOWER-FRUITSPIRIT-001',
    description: 'Sativa potente (60/40) con 27% THC. Perfil frutal intenso. Energía extrema y creatividad. Para usuarios experimentados.',
    short_description: 'Sativa 60% ultra potente 27% THC',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 18000,
    stock_quantity: 250,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 27.0, cbd: 0.3, cbn: 0.4, cbg: 1.0, thcv: 0.8 },
    terpene_profile: { 'Limoneno': 0.9, 'Mirceno': 0.7, 'Cariofileno': 0.5, 'Pineno': 0.4 },
    strain_info: { 
      type: 'Sativa dominante', 
      genetics: '60% Sativa / 40% Indica',
      lineage: 'Blueberry x White Widow',
      origin: 'Países Bajos'
    },
    therapeutic_info: { 
      conditions: ['Fatiga crónica severa', 'Depresión resistente', 'TDAH'],
      benefits: ['Energía intensa', 'Euforia marcada', 'Creatividad extrema'],
      effects: ['Muy energizante', 'Eufórico', 'Concentración', 'Motivación']
    },
    usage_info: { 
      recommended_time: 'Diurno',
      dosage: { beginner: '0.1-0.2g', intermediate: '0.2-0.3g', advanced: '0.3-0.5g' },
      administration: ['Vaporización 175-185°C'],
      onset: '2-5 minutos',
      duration: '3-4 horas'
    },
    safety_info: { 
      contraindications: ['Ansiedad', 'Paranoia', 'Taquicardia', 'Trastornos psicóticos'],
      side_effects: ['Boca seca severa', 'Taquicardia leve', 'Posible ansiedad'],
      interactions: ['Estimulantes fuertes', 'Antidepresivos IMAO']
    },
    attributes: { aroma: 'Frutas tropicales, Bayas, Dulce', flavor: 'Frutal intenso, Dulce, Cremoso', appearance: 'Cogollos densos con tricomas abundantes' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Critical Kush · Indica Extrema',
    slug: 'critical-kush-indica-extrema',
    sku: 'MED-FLOWER-CRITIKUSH-001',
    description: 'Indica dominante (80/20) con 27% THC. Relajación profunda extrema. Ideal para dolor severo e insomnio crónico.',
    short_description: 'Indica 80% potencia extrema',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 18000,
    stock_quantity: 280,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 27.0, cbd: 0.4, cbn: 2.5, cbg: 0.7, thcv: 0.2 },
    terpene_profile: { 'Mirceno': 1.5, 'Cariofileno': 0.9, 'Limoneno': 0.4, 'Humuleno': 0.5 },
    strain_info: { 
      type: 'Indica dominante',
      genetics: '80% Indica / 20% Sativa',
      lineage: 'Critical Mass x OG Kush',
      origin: 'California, USA'
    },
    therapeutic_info: { 
      conditions: ['Dolor crónico severo', 'Insomnio grave', 'Espasticidad', 'Ansiedad severa'],
      benefits: ['Sedación profunda', 'Alivio dolor intenso', 'Relajación muscular extrema'],
      effects: ['Muy sedante', 'Relajante profundo', 'Somnolencia']
    },
    usage_info: { 
      recommended_time: 'Nocturno exclusivamente',
      dosage: { beginner: '0.1-0.2g', intermediate: '0.2-0.3g', advanced: '0.3-0.5g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '3-5 horas'
    },
    safety_info: { 
      contraindications: ['Hipotensión severa', 'Embarazo', 'Operación de maquinaria'],
      side_effects: ['Somnolencia extrema', 'Boca seca severa', 'Sedación prolongada'],
      interactions: ['Sedantes', 'Benzodiacepinas', 'Alcohol']
    },
    attributes: { aroma: 'Terroso, Especias, Pino', flavor: 'Terroso, Picante, Kush', appearance: 'Cogollos muy densos púrpura oscuro' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Secreto del Pescador · Sativa Premium',
    slug: 'secreto-pescador-sativa',
    sku: 'MED-FLOWER-PESCADOR-001',
    description: 'Sativa exclusiva (60/40) con 27% THC. Genética única chilena. Efectos cerebrales potentes y creatividad extrema.',
    short_description: 'Sativa premium 60% exclusiva',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 19000,
    stock_quantity: 200,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 27.0, cbd: 0.5, cbn: 0.3, cbg: 1.2, thcv: 0.9 },
    terpene_profile: { 'Terpinoleno': 1.0, 'Pineno': 0.8, 'Limoneno': 0.7, 'Mirceno': 0.5 },
    strain_info: { 
      type: 'Sativa dominante',
      genetics: '60% Sativa / 40% Indica',
      lineage: 'Genética exclusiva chilena',
      origin: 'Chile'
    },
    therapeutic_info: { 
      conditions: ['Depresión severa', 'Fatiga extrema', 'Creatividad bloqueada', 'TDAH'],
      benefits: ['Euforia sostenida', 'Claridad mental superior', 'Creatividad explosiva'],
      effects: ['Muy energizante', 'Eufórico', 'Creativo', 'Sociable']
    },
    usage_info: { 
      recommended_time: 'Diurno/actividades creativas',
      dosage: { beginner: '0.1-0.2g', intermediate: '0.2-0.4g', advanced: '0.4-0.6g' },
      administration: ['Vaporización 175-185°C'],
      onset: '2-5 minutos',
      duration: '3-4 horas'
    },
    safety_info: { 
      contraindications: ['Ansiedad', 'Paranoia', 'Trastornos psicóticos'],
      side_effects: ['Boca seca', 'Ojos rojos', 'Taquicardia leve'],
      interactions: ['Estimulantes', 'Antidepresivos']
    },
    attributes: { aroma: 'Pino fresco, Marino, Cítrico', flavor: 'Único, Fresco, Herbal', appearance: 'Cogollos alargados verde brillante' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Kush Mintz · Indica Premium',
    slug: 'kush-mintz-indica-premium',
    sku: 'MED-FLOWER-KUSHMINTZ-001',
    description: 'Indica dominante (70/30) con 26% THC. Perfil menta-kush único. Relajación profunda sin sedación excesiva.',
    short_description: 'Indica 70% menta premium',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 17500,
    stock_quantity: 260,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 26.0, cbd: 0.6, cbn: 1.8, cbg: 0.9, thcv: 0.4 },
    terpene_profile: { 'Cariofileno': 1.0, 'Limoneno': 0.8, 'Mirceno': 0.7, 'Linalol': 0.6 },
    strain_info: { 
      type: 'Indica dominante',
      genetics: '70% Indica / 30% Sativa',
      lineage: 'Bubba Kush x Animal Mints',
      origin: 'California, USA'
    },
    therapeutic_info: { 
      conditions: ['Ansiedad', 'Dolor muscular', 'Insomnio moderado', 'Estrés'],
      benefits: ['Relajación sin sedación', 'Alivio dolor', 'Calma mental'],
      effects: ['Relajante', 'Euforia leve', 'Calma']
    },
    usage_info: { 
      recommended_time: 'Tarde/noche',
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-0.8g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '2-4 horas'
    },
    safety_info: { 
      contraindications: ['Hipotensión', 'Embarazo'],
      side_effects: ['Somnolencia moderada', 'Boca seca', 'Ojos rojos'],
      interactions: ['Sedantes', 'Alcohol']
    },
    attributes: { aroma: 'Menta fresca, Kush, Terroso', flavor: 'Menta, Cremoso, Dulce', appearance: 'Cogollos densos con tricomas blancos' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Kyoto · Indica Balanceada',
    slug: 'kyoto-indica-balanceada',
    sku: 'MED-FLOWER-KYOTO-001',
    description: 'Indica dominante (60/40) con 25% THC. Genética japonesa única. Balance perfecto entre relajación y funcionalidad.',
    short_description: 'Indica 60% japonesa balanceada',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 17000,
    stock_quantity: 240,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 25.0, cbd: 0.7, cbn: 1.2, cbg: 0.8, thcv: 0.3 },
    terpene_profile: { 'Mirceno': 0.9, 'Linalol': 0.7, 'Cariofileno': 0.6, 'Humuleno': 0.4 },
    strain_info: { 
      type: 'Indica dominante',
      genetics: '60% Indica / 40% Sativa',
      lineage: 'Genética asiática',
      origin: 'Japón'
    },
    therapeutic_info: { 
      conditions: ['Estrés', 'Ansiedad moderada', 'Dolor crónico', 'Tensión muscular'],
      benefits: ['Relajación funcional', 'Claridad mental', 'Alivio del dolor'],
      effects: ['Relajante', 'Euforia suave', 'Tranquilidad']
    },
    usage_info: { 
      recommended_time: 'Tarde',
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '2-4 horas'
    },
    safety_info: { 
      contraindications: ['Embarazo', 'Lactancia'],
      side_effects: ['Somnolencia leve', 'Boca seca', 'Relajación'],
      interactions: ['Sedantes leves', 'Alcohol']
    },
    attributes: { aroma: 'Floral, Terroso, Herbal', flavor: 'Suave, Floral, Té verde', appearance: 'Cogollos compactos verde jade' },
    featured: 0,
    status: 'active'
  },
  {
    name: 'Runtz · Híbrido Balanceado',
    slug: 'runtz-hibrido-balanceado',
    sku: 'MED-FLOWER-RUNTZ-001',
    description: 'Híbrido balanceado (50/50) con 27% THC. Perfil dulce intenso. Efecto equilibrado cuerpo-mente. Muy popular.',
    short_description: 'Híbrido 50/50 dulce potente',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.BALANCED,
    base_price: 18500,
    stock_quantity: 320,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 27.0, cbd: 0.5, cbn: 0.8, cbg: 1.0, thcv: 0.6 },
    terpene_profile: { 'Limoneno': 1.1, 'Cariofileno': 0.8, 'Linalol': 0.7, 'Mirceno': 0.6 },
    strain_info: { 
      type: 'Híbrido balanceado',
      genetics: '50% Sativa / 50% Indica',
      lineage: 'Zkittlez x Gelato',
      origin: 'California, USA'
    },
    therapeutic_info: { 
      conditions: ['Dolor', 'Ansiedad', 'Depresión', 'Falta de apetito'],
      benefits: ['Balance perfecto', 'Euforia sostenida', 'Relajación funcional'],
      effects: ['Eufórico', 'Relajante', 'Creativo', 'Sociable']
    },
    usage_info: { 
      recommended_time: 'Cualquier hora',
      dosage: { beginner: '0.1-0.2g', intermediate: '0.2-0.4g', advanced: '0.4-0.6g' },
      administration: ['Vaporización 175-185°C'],
      onset: '2-5 minutos',
      duration: '3-4 horas'
    },
    safety_info: { 
      contraindications: ['Trastornos psicóticos', 'Ansiedad severa en dosis altas'],
      side_effects: ['Boca seca', 'Ojos rojos', 'Posible mareo leve'],
      interactions: ['Sedantes', 'Alcohol']
    },
    attributes: { aroma: 'Caramelo, Frutas, Dulce intenso', flavor: 'Dulce, Frutal, Cremoso', appearance: 'Cogollos multicolor con resina abundante' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Gelato · Indica Cremosa',
    slug: 'gelato-indica-cremosa',
    sku: 'MED-FLOWER-GELATO-001',
    description: 'Indica dominante (60/40) con 25% THC. Perfil cremoso único. Relajación balanceada con euforia.',
    short_description: 'Indica 60% cremosa premium',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 17000,
    stock_quantity: 290,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 25.0, cbd: 0.5, cbn: 1.0, cbg: 0.9, thcv: 0.4 },
    terpene_profile: { 'Cariofileno': 0.9, 'Limoneno': 0.7, 'Humuleno': 0.5, 'Linalol': 0.6 },
    strain_info: { 
      type: 'Indica dominante',
      genetics: '60% Indica / 40% Sativa',
      lineage: 'Sunset Sherbet x Thin Mint GSC',
      origin: 'California, USA'
    },
    therapeutic_info: { 
      conditions: ['Ansiedad', 'Dolor', 'Insomnio leve', 'Estrés'],
      benefits: ['Relajación', 'Euforia', 'Alivio del dolor'],
      effects: ['Relajante', 'Eufórico', 'Felicidad']
    },
    usage_info: { 
      recommended_time: 'Tarde/noche',
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-0.8g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '2-4 horas'
    },
    safety_info: { 
      contraindications: ['Embarazo', 'Lactancia'],
      side_effects: ['Somnolencia', 'Boca seca', 'Ojos rojos'],
      interactions: ['Sedantes', 'Alcohol']
    },
    attributes: { aroma: 'Cremoso, Dulce, Bayas', flavor: 'Gelato, Cremoso, Dulce', appearance: 'Cogollos púrpura y naranja' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Celosa · Indica Dominante Premium',
    slug: 'celosa-indica-premium',
    sku: 'MED-FLOWER-CELOSA-001',
    description: 'Genética exclusiva 60% Índica / 40% Sativa con 25% de THC. Efecto relajante profundo sin llegar a sedación extrema. Ideal para usuarios intermedios a avanzados que buscan alivio físico, control de ansiedad y relajación emocional sin perder funcionalidad completa.',
    short_description: '25% THC · 60% Índica · Relajación profunda sin sedación total',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 16500, // Puedes ajustar
    stock_quantity: 200,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
  
    cannabinoid_profile: { thc: 25.0, cbd: 0.4, cbn: 1.2, cbg: 0.9, thcv: 0.2 },
    terpene_profile: { 'Mirceno': 1.4, 'Limoneno': 0.9, 'Cariofileno': 0.7, 'Humuleno': 0.5 },
  
    strain_info: {
      type: 'Indica dominante',
      genetics: '60% Indica / 40% Sativa',
      lineage: 'Cruce híbrido de Gelato x Zkittlez (referencial)',
      origin: 'EE.UU. (fenotipo adaptado)'
    },
  
    therapeutic_info: {
      conditions: ['Ansiedad moderada', 'Estrés crónico', 'Dolores musculares', 'Falta de apetito', 'Tensión corporal'],
      benefits: ['Relajación física y mental', 'Bienestar emocional', 'Calma muscular', 'Ligera euforia positiva'],
      effects: ['Relajante', 'Efecto corporal cálido', 'Ligera euforia', 'Sensación de calma']
    },
  
    usage_info: {
      recommended_time: 'Tarde o noche — ideal después del trabajo o para relajarse sin quedar sedado',
      dosage: { beginner: '0.05-0.1g', intermediate: '0.1-0.25g', advanced: '0.25-0.4g' },
      administration: ['Vaporización 175-185°C', 'Combustión tradicional'],
      onset: '2-4 minutos',
      duration: '2-4 horas'
    },
  
    safety_info: {
      contraindications: ['Usuarios sin experiencia', 'Personas con ansiedad severa no controlada', 'Conducir vehículos', 'Embarazo o lactancia'],
      side_effects: ['Boca seca', 'Ojos rojos', 'Somnolencia leve a moderada', 'Aumento del apetito'],
      interactions: ['Alcohol', 'Ansiolíticos', 'Antidepresivos ISRS', 'Antipsicóticos']
    },
  
    attributes: {
      aroma: 'Dulce, cremoso, con notas frutales y terrosas',
      flavor: 'Helado frutal con toques cítricos y vainilla suave',
      appearance: 'Cogollos compactos con resina visible, pistilos anaranjados y tricomas abundantes'
    },
  
    featured: 1,
    status: 'active'
  },  
  {
    name: 'Leche Lunar · Indica Ultra Potente',
    slug: 'leche-lunar-indica-ultra',
    sku: 'MED-FLOWER-LECHELUNA-001',
    description: 'Indica dominante (60/40) con 28% THC. La más potente de la colección. Sedación profunda. Solo usuarios muy experimentados.',
    short_description: 'Indica 60% máxima potencia 28% THC',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 19500,
    stock_quantity: 180,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 28.0, cbd: 0.6, cbn: 2.8, cbg: 1.1, thcv: 0.3 },
    terpene_profile: { 'Mirceno': 1.8, 'Cariofileno': 1.2, 'Linalol': 0.8, 'Limoneno': 0.5 },
    strain_info: { 
      type: 'Indica dominante',
      genetics: '60% Indica / 40% Sativa',
      lineage: 'Genética exclusiva',
      origin: 'Chile'
    },
    therapeutic_info: { 
      conditions: ['Dolor crónico severo', 'Insomnio severo', 'Espasmos musculares', 'Ansiedad extrema'],
      benefits: ['Sedación extrema', 'Alivio dolor máximo', 'Sueño profundo garantizado'],
      effects: ['Muy sedante', 'Relajación profunda', 'Somnolencia intensa']
    },
    usage_info: { 
      recommended_time: 'Nocturno exclusivamente - antes de dormir',
      dosage: { beginner: 'NO RECOMENDADO', intermediate: '0.1-0.2g', advanced: '0.2-0.4g' },
      administration: ['Vaporización 170-180°C'],
      onset: '2-5 minutos',
      duration: '4-6 horas'
    },
    safety_info: { 
      contraindications: ['Usuarios novatos', 'Hipotensión severa', 'Embarazo', 'Conducir', 'Operación de maquinaria'],
      side_effects: ['Somnolencia extrema', 'Sedación prolongada', 'Boca muy seca', 'Posible desorientación'],
      interactions: ['Sedantes fuertes', 'Benzodiacepinas', 'Alcohol', 'Opioides']
    },
    attributes: { aroma: 'Cremoso, Dulce, Terroso, Único', flavor: 'Leche, Dulce, Suave', appearance: 'Cogollos blancos por tricomas, muy densos' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Purple Kush · Indica Pura',
    slug: 'purple-kush-indica-pura',
    sku: 'MED-FLOWER-PURPLEKUSH-001',
    description: 'Indica pura 100% originaria de California. Perfecta para manejo de dolor crónico severo e insomnio.',
    short_description: 'Indica 100% para dolor crónico e insomnio',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 15000,
    stock_quantity: 500,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 22.5, cbd: 0.8, cbn: 1.2, cbg: 0.5, thcv: 0.3 },
    terpene_profile: { 'Mirceno': 0.8, 'Cariofileno': 0.6, 'Limoneno': 0.3, 'Pineno': 0.2 },
    strain_info: { 
      type: 'Indica', 
      genetics: '100% Indica Pura', 
      lineage: 'Hindu Kush x Purple Afghani', 
      flowering_time: '8 semanas', 
      origin: 'California, USA' 
    },
    therapeutic_info: { 
      conditions: ['Dolor crónico severo', 'Fibromialgia', 'Insomnio crónico'], 
      benefits: ['Relajación muscular profunda', 'Alivio del dolor intenso'], 
      effects: ['Relajante', 'Sedante'] 
    },
    usage_info: { 
      recommended_time: 'Nocturno', 
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, 
      administration: ['Vaporización 175-185°C'], 
      onset: '2-5 minutos', 
      duration: '2-4 horas' 
    },
    safety_info: { 
      contraindications: ['Hipotensión severa', 'Embarazo y lactancia'], 
      side_effects: ['Somnolencia intensa', 'Boca seca'], 
      interactions: ['Sedantes y benzodiacepinas', 'Alcohol'] 
    },
    attributes: { aroma: 'Terroso, Uva, Dulce', flavor: 'Uva, Bayas, Terroso', appearance: 'Cogollos densos púrpura oscuro' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Jack Herer · Sativa Medicinal',
    slug: 'jack-herer-sativa-medicinal',
    sku: 'MED-FLOWER-JACKHERER-001',
    description: 'Sativa dominante (55/45) galardonada. Excelente para fatiga, depresión y falta de concentración.',
    short_description: 'Sativa para fatiga, depresión y concentración',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 16000,
    stock_quantity: 400,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 20.0, cbd: 0.5, cbn: 0.3, cbg: 1.2, thcv: 0.7 },
    terpene_profile: { 'Pineno': 0.7, 'Terpinoleno': 0.5, 'Cariofileno': 0.4, 'Mirceno': 0.3 },
    strain_info: { 
      type: 'Sativa dominante', 
      genetics: '55% Sativa / 45% Indica', 
      lineage: 'Haze x Northern Lights #5 x Shiva Skunk', 
      origin: 'Países Bajos' 
    },
    therapeutic_info: { 
      conditions: ['Fatiga crónica', 'Depresión', 'TDAH', 'Falta de apetito'], 
      benefits: ['Energía sin ansiedad', 'Claridad mental', 'Creatividad'], 
      effects: ['Energizante', 'Euforia', 'Concentración'] 
    },
    usage_info: { 
      recommended_time: 'Diurno/matutino', 
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, 
      administration: ['Vaporización 175-185°C'], 
      onset: '2-5 minutos', 
      duration: '3-4 horas' 
    },
    safety_info: { 
      contraindications: ['Ansiedad severa', 'Taquicardia', 'Trastornos psicóticos'], 
      side_effects: ['Boca seca', 'Ojos rojos', 'Posible ansiedad en dosis altas'], 
      interactions: ['Estimulantes', 'Antidepresivos IMAO'] 
    },
    attributes: { aroma: 'Pino, Especiado, Terroso', flavor: 'Pino, Hierbas, Madera', appearance: 'Cogollos verde claro con pelos naranjas' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'ACDC · CBD Medicinal',
    slug: 'acdc-cbd-medicinal',
    sku: 'MED-FLOWER-ACDC-001',
    description: 'Cepa CBD dominante. Ratio 20:1 CBD:THC. Sin psicoactividad. Ideal para ansiedad, dolor e inflamación.',
    short_description: 'CBD dominante sin psicoactividad',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 18000,
    stock_quantity: 300,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 1.0, cbd: 20.0, cbn: 0.2, cbg: 0.8, cbc: 0.5 },
    terpene_profile: { 'Mirceno': 0.5, 'Pineno': 0.4, 'Cariofileno': 0.3, 'Limoneno': 0.3 },
    strain_info: { type: 'CBD dominante', genetics: 'Cannatonic phenotype', origin: 'California, USA' },
    therapeutic_info: { 
      conditions: ['Ansiedad generalizada', 'Dolor crónico sin sedación', 'Inflamación', 'Epilepsia'], 
      benefits: ['Ansiolítico potente', 'Antiinflamatorio', 'Neuroprotector', 'Sin psicoactividad'], 
      effects: ['Calma', 'Relajación', 'Claridad mental'] 
    },
    usage_info: { 
      recommended_time: 'Cualquier hora', 
      dosage: { beginner: '0.3-0.5g', intermediate: '0.5-1g', advanced: '1-2g' }, 
      administration: ['Vaporización 160-175°C'], 
      onset: '2-5 minutos', 
      duration: '3-5 horas' 
    },
    safety_info: { 
      contraindications: ['Hipersensibilidad a cannabinoides'], 
      side_effects: ['Fatiga leve', 'Boca seca'], 
      interactions: ['Anticoagulantes'] 
    },
    attributes: { aroma: 'Terroso, Dulce, Floral', flavor: 'Herbal, Dulce, Suave', appearance: 'Cogollos verde claro con tricomas abundantes' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'OG Kush · Híbrido Balanceado',
    slug: 'og-kush-hibrido',
    sku: 'MED-FLOWER-OGKUSH-001',
    description: 'Híbrido legendario 50/50. Ideal para dolor y ansiedad. Efecto balanceado cuerpo-mente.',
    short_description: 'Híbrido balanceado para dolor y ansiedad',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.BALANCED,
    base_price: 17000,
    stock_quantity: 350,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 21.0, cbd: 0.6, cbn: 0.8, cbg: 0.9, thcv: 0.4 },
    terpene_profile: { 'Mirceno': 0.6, 'Limoneno': 0.5, 'Cariofileno': 0.5, 'Linalol': 0.3 },
    strain_info: { 
      type: 'Híbrido', 
      genetics: '50% Indica / 50% Sativa', 
      lineage: 'Chemdawg x Lemon Thai x Pakistani Kush', 
      origin: 'California, USA' 
    },
    therapeutic_info: { 
      conditions: ['Dolor crónico', 'Ansiedad', 'Estrés', 'Migraña'], 
      benefits: ['Relajación sin sedación excesiva', 'Alivio del dolor', 'Mejora del ánimo'], 
      effects: ['Euforia', 'Relajación', 'Felicidad'] 
    },
    usage_info: { 
      recommended_time: 'Tarde/noche', 
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, 
      administration: ['Vaporización 175-185°C'], 
      onset: '2-5 minutos', 
      duration: '2-4 horas' 
    },
    safety_info: { 
      contraindications: ['Ansiedad severa en dosis altas', 'Embarazo'], 
      side_effects: ['Ojos rojos', 'Boca seca', 'Mareos leves'], 
      interactions: ['Sedantes', 'Alcohol'] 
    },
    attributes: { aroma: 'Terroso, Pino, Cítrico', flavor: 'Tierra, Limón, Especias', appearance: 'Cogollos densos verde oscuro' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Northern Lights · Indica Clásica',
    slug: 'northern-lights-indica',
    sku: 'MED-FLOWER-NORTHLIGHTS-001',
    description: 'Indica clásica legendaria. Perfecta para insomnio, dolor y relajación profunda.',
    short_description: 'Indica clásica para insomnio',
    category: CATEGORIES.MEDICINAL_FLORES,
    product_type: PRODUCT_TYPES.FLOWER,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 14500,
    stock_quantity: 450,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.SENSI,
    cannabinoid_profile: { thc: 18.0, cbd: 0.4, cbn: 1.5, cbg: 0.6, thcv: 0.2 },
    terpene_profile: { 'Mirceno': 0.9, 'Cariofileno': 0.4, 'Limoneno': 0.2, 'Humuleno': 0.3 },
    strain_info: { 
      type: 'Indica', 
      genetics: '95% Indica / 5% Sativa', 
      lineage: 'Afghani x Thai', 
      origin: 'Países Bajos' 
    },
    therapeutic_info: { 
      conditions: ['Insomnio', 'Dolor muscular', 'Ansiedad', 'Espasmos'], 
      benefits: ['Relajación profunda', 'Sedación', 'Alivio del dolor'], 
      effects: ['Relajante', 'Somnolencia', 'Euforia'] 
    },
    usage_info: { 
      recommended_time: 'Nocturno', 
      dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, 
      administration: ['Vaporización 170-180°C'], 
      onset: '2-5 minutos', 
      duration: '2-3 horas' 
    },
    safety_info: { 
      contraindications: ['Hipotensión', 'Embarazo'], 
      side_effects: ['Somnolencia', 'Boca seca', 'Ojos rojos'], 
      interactions: ['Sedantes', 'Hipnóticos'] 
    },
    attributes: { aroma: 'Dulce, Especiado, Terroso', flavor: 'Dulce, Pino, Terroso', appearance: 'Cogollos compactos con resina' },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// ACEITES MEDICINALES
// ============================================
const ACEITES_MEDICINALES = [
  {
    name: 'Aceite Full Spectrum THC 20% · 30ml',
    slug: 'aceite-thc-20-30ml',
    sku: 'MED-OIL-THC20-30ML',
    description: 'Aceite de cannabis full spectrum con 20% THC. Extracción CO2 supercrítico. Efecto entourage completo.',
    short_description: 'Aceite THC 20% full spectrum',
    category: CATEGORIES.MEDICINAL_ACEITES,
    product_type: PRODUCT_TYPES.OIL,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 45000,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 20.0, cbd: 1.0, cbn: 0.5, cbg: 0.8, cbc: 0.3 },
    specifications: {
      volume: '30ml',
      thc_per_ml: '20mg',
      total_thc: '600mg',
      extraction: 'CO2 Supercrítico',
      carrier_oil: 'Aceite MCT de coco',
      spectrum: 'Full Spectrum'
    },
    therapeutic_info: {
      conditions: ['Dolor crónico', 'Insomnio', 'Náuseas', 'Falta de apetito'],
      benefits: ['Dosificación precisa', 'Efecto prolongado', 'Absorción sublingual rápida'],
      effects: ['Relajante', 'Analgésico', 'Sedante']
    },
    usage_info: {
      recommended_time: 'Tarde/noche',
      dosage: { beginner: '0.25ml (5mg THC)', intermediate: '0.5ml (10mg THC)', advanced: '1ml (20mg THC)' },
      administration: ['Sublingual - mantener 60 segundos'],
      onset: '15-45 minutos',
      duration: '4-6 horas'
    },
    safety_info: {
      contraindications: ['Embarazo', 'Lactancia', 'Enfermedad hepática severa'],
      side_effects: ['Somnolencia', 'Mareos', 'Boca seca'],
      interactions: ['Sedantes', 'Anticoagulantes', 'Alcohol']
    },
    attributes: { packaging: 'Frasco gotero ámbar', concentration: 'Alta potencia', storage: 'Lugar fresco y oscuro' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Aceite CBD 15% · 30ml',
    slug: 'aceite-cbd-15-30ml',
    sku: 'MED-OIL-CBD15-30ML',
    description: 'Aceite CBD 15% sin THC psicoactivo. Ideal para ansiedad, dolor e inflamación sin efectos psicoactivos.',
    short_description: 'Aceite CBD 15% sin psicoactividad',
    category: CATEGORIES.MEDICINAL_ACEITES,
    product_type: PRODUCT_TYPES.OIL,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 38000,
    stock_quantity: 150,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0.3, cbd: 15.0, cbn: 0.1, cbg: 0.5, cbc: 0.4 },
    specifications: {
      volume: '30ml',
      cbd_per_ml: '15mg',
      total_cbd: '450mg',
      extraction: 'CO2 Supercrítico',
      carrier_oil: 'Aceite de hemp orgánico',
      spectrum: 'Broad Spectrum (sin THC)'
    },
    therapeutic_info: {
      conditions: ['Ansiedad', 'Inflamación', 'Dolor neuropático', 'Trastornos del sueño'],
      benefits: ['Sin psicoactividad', 'Antiinflamatorio', 'Ansiolítico', 'Neuroprotector'],
      effects: ['Calma', 'Claridad mental', 'Relajación']
    },
    usage_info: {
      recommended_time: 'Cualquier hora',
      dosage: { beginner: '0.5ml (7.5mg CBD)', intermediate: '1ml (15mg CBD)', advanced: '2ml (30mg CBD)' },
      administration: ['Sublingual - mantener 60 segundos'],
      onset: '15-45 minutos',
      duration: '4-8 horas'
    },
    safety_info: {
      contraindications: ['Hipersensibilidad a cannabinoides'],
      side_effects: ['Fatiga leve', 'Cambios en apetito'],
      interactions: ['Anticoagulantes', 'Anticonvulsivos']
    },
    attributes: { packaging: 'Frasco gotero ámbar', concentration: 'Media-alta potencia', storage: 'Temperatura ambiente' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Aceite Balanceado 1:1 (THC:CBD) · 30ml',
    slug: 'aceite-balanced-1-1-30ml',
    sku: 'MED-OIL-BAL11-30ML',
    description: 'Aceite balanceado ratio 1:1 THC:CBD (10:10). Efecto sinérgico ideal para dolor y ansiedad.',
    short_description: 'Ratio balanceado 1:1 THC:CBD',
    category: CATEGORIES.MEDICINAL_ACEITES,
    product_type: PRODUCT_TYPES.OIL,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.BALANCED,
    base_price: 42000,
    stock_quantity: 120,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 10.0, cbd: 10.0, cbn: 0.3, cbg: 0.6, cbc: 0.4 },
    specifications: {
      volume: '30ml',
      thc_per_ml: '10mg',
      cbd_per_ml: '10mg',
      total_thc: '300mg',
      total_cbd: '300mg',
      extraction: 'CO2 Supercrítico',
      carrier_oil: 'Aceite MCT',
      spectrum: 'Full Spectrum'
    },
    therapeutic_info: {
      conditions: ['Dolor crónico', 'Ansiedad', 'Inflamación', 'Espasticidad'],
      benefits: ['Efecto sinérgico', 'CBD modera efectos del THC', 'Versatilidad terapéutica'],
      effects: ['Relajación equilibrada', 'Alivio del dolor', 'Calma mental']
    },
    usage_info: {
      recommended_time: 'Tarde/noche',
      dosage: { beginner: '0.5ml (5mg:5mg)', intermediate: '1ml (10mg:10mg)', advanced: '2ml (20mg:20mg)' },
      administration: ['Sublingual - mantener 60 segundos'],
      onset: '15-45 minutos',
      duration: '5-7 horas'
    },
    safety_info: {
      contraindications: ['Embarazo', 'Lactancia'],
      side_effects: ['Somnolencia leve', 'Boca seca'],
      interactions: ['Sedantes', 'Anticoagulantes']
    },
    attributes: { packaging: 'Frasco gotero ámbar', concentration: 'Balanceada', storage: 'Lugar fresco' },
    featured: 1,
    status: 'active'
  }
];

// ============================================
// CONCENTRADOS MEDICINALES
// ============================================
const CONCENTRADOS_MEDICINALES = [
  {
    name: 'Aceite CBD Full Spectrum · 5000mg',
    slug: 'aceite-cbd-full-5000mg',
    sku: 'MED-OIL-CBDFULL-5000',
    description: 'Aceite CBD Full Spectrum 5000mg en 30ml. Extracción premium 120-73 micrones. Máxima potencia y efecto séquito completo.',
    short_description: 'CBD 5000mg full spectrum ultra potente',
    category: CATEGORIES.MEDICINAL_ACEITES,
    product_type: PRODUCT_TYPES.OIL,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 70000,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 1.5, cbd: 166.7, cbn: 0.5, cbg: 3.0, cbc: 2.0 },
    specifications: {
      volume: '30ml',
      cbd_per_ml: '166.7mg',
      total_cbd: '5000mg',
      extraction: 'CO2 Supercrítico + Presión (120-73 micrones)',
      carrier_oil: 'Aceite MCT orgánico',
      spectrum: 'Full Spectrum'
    },
    therapeutic_info: {
      conditions: ['Dolor crónico severo', 'Inflamación severa', 'Ansiedad severa', 'Epilepsia', 'Insomnio'],
      benefits: ['Máxima potencia CBD', 'Efecto séquito completo', 'Extracción premium'],
      effects: ['Relajación profunda', 'Antiinflamatorio potente', 'Ansiolítico fuerte']
    },
    usage_info: {
      recommended_time: 'Mañana y noche',
      dosage: { beginner: '0.3ml (50mg CBD)', intermediate: '0.6ml (100mg CBD)', advanced: '1ml (166mg CBD)' },
      administration: ['Sublingual - mantener 90 segundos'],
      onset: '15-45 minutos',
      duration: '6-8 horas'
    },
    safety_info: {
      contraindications: ['Hipersensibilidad a cannabinoides', 'Enfermedad hepática severa'],
      side_effects: ['Somnolencia leve', 'Boca seca', 'Cambios en apetito'],
      interactions: ['Anticoagulantes', 'Anticonvulsivos', 'Sedantes']
    },
    attributes: { packaging: 'Frasco gotero ámbar premium', concentration: 'Ultra alta potencia', storage: 'Lugar fresco y oscuro' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Live Resin · Purple Punch',
    slug: 'live-resin-purple-punch',
    sku: 'MED-CONC-LIVERESIN-PP',
    description: 'Live resin de máxima calidad. Extracción flash frozen. Terpenos preservados. THC 75%+.',
    short_description: 'Live resin premium 75% THC',
    category: CATEGORIES.MEDICINAL_CONCENTRADOS,
    product_type: PRODUCT_TYPES.CONCENTRATE,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 35000,
    stock_quantity: 50,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 75.0, cbd: 0.5, cbn: 2.0, cbg: 1.5, thca: 5.0 },
    terpene_profile: { 'Mirceno': 1.2, 'Cariofileno': 0.8, 'Limoneno': 0.6, 'Linalol': 0.5 },
    specifications: {
      extraction_method: 'Butano (BHO) + Flash Frozen',
      consistency: 'Sauce/Crystals',
      purity: '92%+',
      residual_solvents: '<100ppm',
      lab_tested: 'Sí'
    },
    therapeutic_info: {
      conditions: ['Dolor severo', 'Insomnio severo', 'Náuseas intensas'],
      benefits: ['Potencia extrema', 'Alivio rápido', 'Perfil terpenico completo'],
      effects: ['Sedante potente', 'Euforia', 'Relajación profunda']
    },
    usage_info: {
      recommended_time: 'Nocturno',
      dosage: { beginner: '0.05-0.1g (50-100mg)', intermediate: '0.1-0.2g', advanced: '0.2-0.3g' },
      administration: ['Dabbing 315-370°C', 'Vaporizador de concentrados'],
      onset: 'Inmediato (1-3 minutos)',
      duration: '2-4 horas'
    },
    safety_info: {
      contraindications: ['Usuarios novatos', 'Embarazo', 'Trastornos psiquiátricos'],
      side_effects: ['Somnolencia intensa', 'Paranoia en dosis altas', 'Tos'],
      interactions: ['Sedantes potentes', 'Alcohol']
    },
    attributes: { appearance: 'Cristales + sauce', aroma: 'Uva, Bayas, Dulce', storage: 'Refrigeración recomendada' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Shatter CBD · 80% CBD',
    slug: 'shatter-cbd-80',
    sku: 'MED-CONC-SHATTER-CBD80',
    description: 'Shatter de CBD puro 80%. Sin THC. Transparente como vidrio. Rápido alivio sin psicoactividad.',
    short_description: 'Shatter CBD 80% sin THC',
    category: CATEGORIES.MEDICINAL_CONCENTRADOS,
    product_type: PRODUCT_TYPES.CONCENTRATE,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 32000,
    stock_quantity: 60,
    stock_unit: 'gramos',
    unit_type: 'weight',
    base_unit: 'g',
    unit_size: 1,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0.2, cbd: 80.0, cbn: 0.1, cbg: 2.0, cbc: 1.5 },
    specifications: {
      extraction_method: 'CO2 + Winterización',
      consistency: 'Shatter (vidrio)',
      purity: '95%+',
      thc_content: '<0.3%',
      lab_tested: 'Sí'
    },
    therapeutic_info: {
      conditions: ['Dolor crónico', 'Inflamación aguda', 'Ansiedad', 'Epilepsia'],
      benefits: ['Altísima concentración CBD', 'Sin psicoactividad', 'Alivio rápido'],
      effects: ['Relajación', 'Antiinflamatorio', 'Claridad mental']
    },
    usage_info: {
      recommended_time: 'Cualquier hora',
      dosage: { beginner: '0.1g (80mg CBD)', intermediate: '0.2g', advanced: '0.3-0.5g' },
      administration: ['Dabbing 260-315°C', 'Vaporizador'],
      onset: 'Inmediato (1-3 minutos)',
      duration: '3-5 horas'
    },
    safety_info: {
      contraindications: ['Hipersensibilidad'],
      side_effects: ['Fatiga leve', 'Boca seca'],
      interactions: ['Anticoagulantes']
    },
    attributes: { appearance: 'Ámbar transparente', aroma: 'Suave, herbal', storage: 'Temperatura ambiente' },
    featured: 1,
    status: 'active'
  }
];

// ============================================
// CÁPSULAS MEDICINALES
// ============================================
const CAPSULAS_MEDICINALES = [
  {
    name: 'Cápsulas THC 10mg · 30 unidades',
    slug: 'capsulas-thc-10mg-30u',
    sku: 'MED-CAPS-THC10-30',
    description: 'Cápsulas de gelatina blanda con 10mg THC cada una. Dosificación precisa. Efecto prolongado.',
    short_description: 'Cápsulas THC 10mg precisas',
    category: CATEGORIES.MEDICINAL_CAPSULAS,
    product_type: PRODUCT_TYPES.CAPSULE,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.THC,
    base_price: 28000,
    stock_quantity: 200,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'cápsula',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 10.0, cbd: 0.5, cbn: 0.3 },
    specifications: {
      capsules_per_container: 30,
      thc_per_capsule: '10mg',
      total_thc: '300mg',
      capsule_type: 'Gelatina blanda',
      carrier: 'Aceite MCT',
      shelf_life: '12 meses'
    },
    therapeutic_info: {
      conditions: ['Insomnio', 'Dolor crónico', 'Ansiedad nocturna'],
      benefits: ['Dosificación exacta', 'Discreción', 'Efecto prolongado'],
      effects: ['Relajante', 'Sedante', 'Analgésico']
    },
    usage_info: {
      recommended_time: 'Noche',
      dosage: { beginner: '1 cápsula (10mg)', intermediate: '1-2 cápsulas', advanced: '2-3 cápsulas' },
      administration: ['Vía oral con agua'],
      onset: '45-90 minutos',
      duration: '6-8 horas'
    },
    safety_info: {
      contraindications: ['Embarazo', 'Lactancia', 'Enfermedad hepática'],
      side_effects: ['Somnolencia', 'Boca seca', 'Mareos'],
      interactions: ['Sedantes', 'Alcohol']
    },
    attributes: { packaging: 'Frasco sellado', portability: 'Portátil y discreto', storage: 'Temperatura ambiente' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Cápsulas CBD 25mg · 60 unidades',
    slug: 'capsulas-cbd-25mg-60u',
    sku: 'MED-CAPS-CBD25-60',
    description: 'Cápsulas CBD 25mg cada una. Sin THC. Ideal para uso diario de ansiedad e inflamación.',
    short_description: 'Cápsulas CBD 25mg uso diario',
    category: CATEGORIES.MEDICINAL_CAPSULAS,
    product_type: PRODUCT_TYPES.CAPSULE,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 35000,
    stock_quantity: 180,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'cápsula',
    unit_size: 60,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0.3, cbd: 25.0, cbg: 0.5 },
    specifications: {
      capsules_per_container: 60,
      cbd_per_capsule: '25mg',
      total_cbd: '1500mg',
      capsule_type: 'Vegetal (HPMC)',
      carrier: 'Aceite de hemp orgánico',
      shelf_life: '18 meses'
    },
    therapeutic_info: {
      conditions: ['Ansiedad', 'Inflamación crónica', 'Dolor neuropático'],
      benefits: ['Sin psicoactividad', 'Uso diario', 'Antiinflamatorio'],
      effects: ['Calma', 'Claridad', 'Bienestar']
    },
    usage_info: {
      recommended_time: 'Mañana y noche',
      dosage: { beginner: '1 cápsula (25mg)', intermediate: '2 cápsulas', advanced: '3 cápsulas' },
      administration: ['Vía oral con comida'],
      onset: '30-60 minutos',
      duration: '6-8 horas'
    },
    safety_info: {
      contraindications: ['Hipersensibilidad'],
      side_effects: ['Fatiga leve', 'Cambios en apetito'],
      interactions: ['Anticoagulantes']
    },
    attributes: { packaging: 'Frasco 60 cápsulas', vegan: 'Cápsulas vegetales', storage: 'Lugar fresco y seco' },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// TÓPICOS MEDICINALES
// ============================================
const TOPICOS_MEDICINALES = [
  {
    name: 'Bálsamo CBD · 500mg',
    slug: 'balsamo-cbd-500mg',
    sku: 'MED-TOP-BALM-CBD500',
    description: 'Bálsamo de CBD 500mg para aplicación tópica. Ideal para dolor muscular, artritis e inflamación localizada.',
    short_description: 'Bálsamo CBD 500mg para dolor',
    category: CATEGORIES.MEDICINAL_TOPICOS,
    product_type: PRODUCT_TYPES.TOPICAL,
    is_medicinal: 1,
    requires_prescription: 0,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 25000,
    stock_quantity: 150,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 60,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0, cbd: 500 },
    specifications: {
      total_cbd: '500mg',
      volume: '60ml',
      base: 'Manteca de karité, cera de abejas, aceite de coco',
      additional_ingredients: 'Árnica, mentol, lavanda',
      absorption: 'Tópica (no sistémica)',
      application: 'Aplicar 2-3 veces al día'
    },
    therapeutic_info: {
      conditions: ['Dolor muscular', 'Artritis', 'Inflamación localizada', 'Lesiones deportivas'],
      benefits: ['Alivio localizado', 'Sin efectos sistémicos', 'Antiinflamatorio'],
      effects: ['Alivio del dolor', 'Reducción inflamación', 'Relajación muscular']
    },
    usage_info: {
      recommended_time: 'Cuando sea necesario',
      dosage: { application: 'Cantidad generosa en área afectada' },
      administration: ['Tópica - masajear hasta absorber'],
      onset: '15-30 minutos',
      duration: '3-5 horas'
    },
    safety_info: {
      contraindications: ['Piel con heridas abiertas', 'Alergia a componentes'],
      side_effects: ['Irritación leve en pieles sensibles'],
      interactions: ['Ninguna conocida']
    },
    attributes: { texture: 'Cremosa', scent: 'Lavanda y mentol', packaging: 'Tarro 60ml' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Crema THC+CBD · 1:1 · 200mg',
    slug: 'crema-thc-cbd-1-1-200mg',
    sku: 'MED-TOP-CREAM-11-200',
    description: 'Crema balanceada 1:1 THC:CBD. Total 200mg cannabinoides. Absorción transdérmica para dolor profundo.',
    short_description: 'Crema 1:1 THC:CBD para dolor profundo',
    category: CATEGORIES.MEDICINAL_TOPICOS,
    product_type: PRODUCT_TYPES.TOPICAL,
    is_medicinal: 1,
    requires_prescription: 1,
    medical_category: MEDICAL_CATEGORIES.BALANCED,
    base_price: 28000,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 50,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 100, cbd: 100 },
    specifications: {
      total_thc: '100mg',
      total_cbd: '100mg',
      volume: '50ml',
      base: 'Crema base hipoalergénica',
      additional_ingredients: 'Mentol, eucalipto, caléndula',
      absorption: 'Transdérmica mejorada',
      application: '2-4 veces al día'
    },
    therapeutic_info: {
      conditions: ['Dolor neuropático', 'Artritis reumatoide', 'Fibromialgia', 'Dolor crónico severo'],
      benefits: ['Efecto sinérgico THC+CBD', 'Penetración profunda', 'Alivio prolongado'],
      effects: ['Analgésico potente', 'Antiinflamatorio', 'Relajante muscular']
    },
    usage_info: {
      recommended_time: 'Según necesidad',
      dosage: { application: 'Aplicar generosamente y masajear' },
      administration: ['Tópica - absorción transdérmica'],
      onset: '20-40 minutos',
      duration: '4-6 horas'
    },
    safety_info: {
      contraindications: ['Heridas abiertas', 'Embarazo', 'Lactancia'],
      side_effects: ['Posible enrojecimiento leve'],
      interactions: ['Ninguna sistémica']
    },
    attributes: { texture: 'Suave y absorbente', scent: 'Mentol y eucalipto', packaging: 'Tubo 50ml' },
    featured: 1,
    status: 'active'
  }
];

// ============================================
// SEMILLAS
// ============================================
const SEMILLAS = [
  {
    name: 'Northern Lights Auto · 5 semillas',
    slug: 'northern-lights-auto-5seeds',
    sku: 'SEED-NL-AUTO-5',
    description: 'Autofloreciente clásica. Índica dominante. Fácil cultivo. Cosecha en 8-9 semanas desde germinación.',
    short_description: 'Auto indica fácil cultivo',
    category: CATEGORIES.SEMILLAS,
    product_type: PRODUCT_TYPES.SEED,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 18000,
    stock_quantity: 150,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'pack',
    unit_size: 5,
    brand: BRANDS.SENSI,
    strain_info: { 
      type: 'Indica dominante', 
      genetics: 'Northern Lights Auto', 
      flowering_time: '8-9 semanas totales', 
      yield: '400-450g/m²', 
      thc: '14-18%', 
      cbd: '0.1-0.5%' 
    },
    specifications: { 
      seeds_per_pack: 5, 
      feminized: 'Sí', 
      autoflowering: 'Sí', 
      difficulty: 'Fácil', 
      height: '60-100cm', 
      climate: 'Interior/Exterior' 
    },
    attributes: { 
      harvest_time: 'Independiente del fotoperiodo', 
      aroma: 'Dulce, Terroso', 
      effects: 'Relajante, Sedante' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Amnesia Haze · 5 semillas',
    slug: 'amnesia-haze-5seeds',
    sku: 'SEED-AMN-HAZE-5',
    description: 'Sativa clásica galardonada. Alto THC. Cultivo intermedio. Floración 11-12 semanas.',
    short_description: 'Sativa clásica alto THC',
    category: CATEGORIES.SEMILLAS,
    product_type: PRODUCT_TYPES.SEED,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 22000,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'pack',
    unit_size: 5,
    brand: BRANDS.SENSI,
    strain_info: { 
      type: 'Sativa dominante', 
      genetics: '80% Sativa / 20% Indica', 
      flowering_time: '11-12 semanas', 
      yield: '600-650g/m²', 
      thc: '20-25%', 
      cbd: '0.1-0.3%' 
    },
    specifications: { 
      seeds_per_pack: 5, 
      feminized: 'Sí', 
      autoflowering: 'No', 
      difficulty: 'Intermedia', 
      height: '140-180cm', 
      climate: 'Interior/Exterior mediterráneo' 
    },
    attributes: { 
      harvest_time: 'Octubre (exterior)', 
      aroma: 'Cítrico, Terroso, Especiado', 
      effects: 'Eufórico, Creativo, Energético' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Gorilla Glue #4 · 5 semillas',
    slug: 'gorilla-glue-4-5seeds',
    sku: 'SEED-GG4-5',
    description: 'Híbrido potente. THC extremo 25%+. Rendimiento alto. Cultivo intermedio-avanzado.',
    short_description: 'Híbrido extremo THC 25%+',
    category: CATEGORIES.SEMILLAS,
    product_type: PRODUCT_TYPES.SEED,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 25000,
    stock_quantity: 80,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'pack',
    unit_size: 5,
    brand: BRANDS.BARNEYS,
    strain_info: { 
      type: 'Híbrido', 
      genetics: 'Chem Sister x Sour Dubb x Chocolate Diesel', 
      flowering_time: '8-9 semanas', 
      yield: '550-600g/m²', 
      thc: '25-28%', 
      cbd: '0.1%' 
    },
    specifications: { 
      seeds_per_pack: 5, 
      feminized: 'Sí', 
      autoflowering: 'No', 
      difficulty: 'Intermedia-Avanzada', 
      height: '100-140cm', 
      climate: 'Interior recomendado' 
    },
    attributes: { 
      harvest_time: 'Septiembre-Octubre', 
      aroma: 'Diesel, Terroso, Pino', 
      effects: 'Eufórico, Relajante, Potente' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Blue Dream CBD · 5 semillas',
    slug: 'blue-dream-cbd-5seeds',
    sku: 'SEED-BDCBD-5',
    description: 'Variedad CBD dominante. Ratio 1:1 THC:CBD. Ideal para uso medicinal. Fácil cultivo.',
    short_description: 'CBD 1:1 medicinal fácil',
    category: CATEGORIES.SEMILLAS,
    product_type: PRODUCT_TYPES.SEED,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 24000,
    stock_quantity: 90,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'pack',
    unit_size: 5,
    brand: BRANDS.SENSI,
    strain_info: { 
      type: 'Híbrido CBD', 
      genetics: 'Blue Dream x CBD strain', 
      flowering_time: '9-10 semanas', 
      yield: '500-550g/m²', 
      thc: '8-10%', 
      cbd: '8-10%' 
    },
    specifications: { 
      seeds_per_pack: 5, 
      feminized: 'Sí', 
      autoflowering: 'No', 
      difficulty: 'Fácil', 
      height: '120-160cm', 
      climate: 'Interior/Exterior' 
    },
    attributes: { 
      harvest_time: 'Octubre', 
      aroma: 'Bayas, Dulce, Herbal', 
      effects: 'Relajante, Terapéutico, Claridad' 
    },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// VAPORIZADORES
// ============================================
const VAPORIZADORES = [
  {
    name: 'PAX 3 · Dual Use',
    slug: 'pax-3-dual-use',
    sku: 'VAP-PAX3-BLACK',
    description: 'Vaporizador portátil premium. Doble uso: hierbas y concentrados. Calentamiento 15 segundos. Control por app.',
    short_description: 'Premium dual use con app',
    category: CATEGORIES.VAPORIZADORES,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 189990,
    stock_quantity: 15,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    brand: BRANDS.PAX,
    specifications: { 
      material: 'Hierbas secas y concentrados', 
      heating: 'Conducción', 
      temp_range: '182-215°C', 
      battery: '8-10 sesiones', 
      warranty: '10 años' 
    },
    attributes: { 
      color: 'Negro mate', 
      size: 'Portátil 9.8x3x2.1cm', 
      weight: '93g', 
      features: 'Control App, Vibraciones' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Mighty+ · Storz & Bickel',
    slug: 'mighty-plus-storz-bickel',
    sku: 'VAP-MIGHTY-PLUS',
    description: 'El vaporizador portátil más potente. Tecnología médica alemana. Calidad excepcional. Batería mejorada.',
    short_description: 'Top tier portátil alemán',
    category: CATEGORIES.VAPORIZADORES,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 399990,
    stock_quantity: 8,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    brand: BRANDS.STORZ,
    specifications: { 
      material: 'Hierbas secas', 
      heating: 'Convección + Conducción', 
      temp_range: '40-210°C', 
      battery: '50% más capacidad', 
      warranty: '3 años' 
    },
    attributes: { 
      color: 'Negro/Gris', 
      features: 'Pantalla LED, USB-C, Cámara cerámica' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Volcano Hybrid · Storz & Bickel',
    slug: 'volcano-hybrid-storz-bickel',
    sku: 'VAP-VOLCANO-HYBRID',
    description: 'El vaporizador de mesa legendario. Tecnología médica. Modo globo y directo. El estándar de oro.',
    short_description: 'Legendario vaporizador de mesa',
    category: CATEGORIES.VAPORIZADORES,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 699990,
    stock_quantity: 5,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    brand: BRANDS.STORZ,
    specifications: { 
      material: 'Hierbas secas', 
      heating: 'Convección + Conducción híbrida', 
      temp_range: '40-230°C', 
      modes: 'Globo y tubo directo', 
      warranty: '3 años' 
    },
    attributes: { 
      type: 'Mesa', 
      features: 'Control App, Calentamiento 40seg, Certificado médico' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'DynaVap M Plus · 2024',
    slug: 'dynavap-m-plus-2024',
    sku: 'VAP-DYNAVAP-MPLUS',
    description: 'Vaporizador manual sin batería. Acero inoxidable. Eficiente y económico. Calentamiento con antorcha.',
    short_description: 'Manual sin batería eficiente',
    category: CATEGORIES.VAPORIZADORES,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 89990,
    stock_quantity: 25,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    brand: BRANDS.PAX,
    specifications: { 
      material: 'Hierbas secas', 
      heating: 'Manual con antorcha', 
      temp_range: 'Variable según técnica', 
      battery: 'Sin batería', 
      warranty: '2 años' 
    },
    attributes: { 
      color: 'Acero inoxidable', 
      size: 'Compacto 92mm', 
      features: 'Cap Captive, Adjust-a-Bowl' 
    },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// ACCESORIOS
// ============================================
const ACCESORIOS = [
  {
    name: 'Grinder Metálico 4 Piezas · Premium',
    slug: 'grinder-metal-4pcs-premium',
    sku: 'ACC-GRINDER-4PC-PREM',
    description: 'Grinder de aluminio anodizado. 4 piezas con recolector de kief. Imanes potentes. Dientes diamante.',
    short_description: 'Grinder 4 piezas premium',
    category: CATEGORIES.ACCESORIOS,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 12990,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      material: 'Aluminio anodizado',
      pieces: '4 piezas',
      diameter: '63mm',
      features: 'Recolector kief, Imanes, Dientes diamante'
    },
    attributes: {
      color: 'Gris metálico',
      durability: 'Alta resistencia',
      cleaning: 'Fácil limpieza'
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Bong Vidrio Borosilicato · 30cm',
    slug: 'bong-glass-30cm',
    sku: 'ACC-BONG-GLASS-30',
    description: 'Bong de vidrio borosilicato premium. Percolador difusor. Base estable. Fácil limpieza.',
    short_description: 'Bong vidrio 30cm con percolador',
    category: CATEGORIES.ACCESORIOS,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 29990,
    stock_quantity: 40,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      material: 'Vidrio borosilicato',
      height: '30cm',
      percolator: 'Difusor',
      joint: '14mm hembra',
      thickness: '5mm'
    },
    attributes: {
      color: 'Transparente',
      features: 'Base estable, Fácil limpieza',
      includes: 'Bowl 14mm macho'
    },
    featured: 0,
    status: 'active'
  },
  {
    name: 'Paper RAW Organic · King Size Slim',
    slug: 'paper-raw-organic-ks',
    sku: 'ACC-PAPER-RAW-KS',
    description: 'Papeles RAW Organic certificados. 100% sin blanquear. King Size Slim. 32 hojas por librito.',
    short_description: 'Papers RAW Organic certificados',
    category: CATEGORIES.ACCESORIOS,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 2990,
    stock_quantity: 500,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'librito',
    unit_size: 1,
    specifications: {
      brand: 'RAW',
      type: 'Organic',
      size: 'King Size Slim (110mm)',
      papers_per_pack: 32,
      certification: 'Orgánico certificado'
    },
    attributes: {
      material: 'Cáñamo sin blanquear',
      burn: 'Quemado lento y uniforme',
      eco_friendly: 'Biodegradable'
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Humidor Vidrio Hermético · 500ml',
    slug: 'humidor-glass-500ml',
    sku: 'ACC-HUM-GLASS-500',
    description: 'Frasco hermético para almacenamiento. Vidrio UV protector. Sello hermético. Mantiene frescura.',
    short_description: 'Frasco hermético UV 500ml',
    category: CATEGORIES.ACCESORIOS,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 8990,
    stock_quantity: 150,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      material: 'Vidrio violeta UV',
      capacity: '500ml',
      seal: 'Hermético con junta silicona',
      protection: 'Protección UV'
    },
    attributes: {
      color: 'Violeta oscuro',
      durability: 'Resistente y reutilizable',
      features: 'Mantiene humedad y frescura'
    },
    featured: 0,
    status: 'active'
  },
  {
    name: 'Bandeja RAW Rolling · Mediana',
    slug: 'bandeja-raw-rolling-med',
    sku: 'ACC-TRAY-RAW-MED',
    description: 'Bandeja metálica RAW para armar. Bordes curvos. Superficie antiadherente. Mediana 27x16cm.',
    short_description: 'Bandeja RAW mediana 27x16cm',
    category: CATEGORIES.ACCESORIOS,
    product_type: PRODUCT_TYPES.ACCESSORY,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 6990,
    stock_quantity: 200,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      brand: 'RAW',
      size: 'Mediana 27x16cm',
      material: 'Metal con recubrimiento',
      features: 'Bordes curvos, Antiadherente'
    },
    attributes: {
      color: 'Diseño RAW clásico',
      durability: 'Resistente',
      cleaning: 'Fácil limpieza'
    },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// ROPA Y MERCHANDISING
// ============================================
const ROPA = [
  {
    name: 'Polera Apex Classic Negra',
    slug: 'polera-apex-black',
    sku: 'APPAREL-TSHIRT-BLACK',
    description: 'Polera 100% algodón premium. Logo Apex Remedy bordado. Corte regular unisex. Suave y durable.',
    short_description: 'Polera clásica negra',
    category: CATEGORIES.ROPA,
    product_type: PRODUCT_TYPES.APPAREL,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 15990,
    stock_quantity: 100,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: { 
      material: 'Algodón peinado 100%', 
      weight: '180 GSM', 
      sizes: 'S, M, L, XL, XXL', 
      care: 'Lavar a máquina agua fría' 
    },
    attributes: { 
      color: 'Negro', 
      fit: 'Regular unisex', 
      print: 'Logo bordado pecho' 
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Gorro Apex Remedy · Negro',
    slug: 'gorro-apex-black',
    sku: 'APPAREL-BEANIE-BLACK',
    description: 'Gorro de lana acrílica suave. Logo Apex bordado. Talla única ajustable. Perfecto para invierno.',
    short_description: 'Gorro de lana negro',
    category: CATEGORIES.ROPA,
    product_type: PRODUCT_TYPES.APPAREL,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 9990,
    stock_quantity: 80,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      material: 'Acrílico suave',
      size: 'Talla única',
      care: 'Lavar a mano'
    },
    attributes: {
      color: 'Negro',
      style: 'Clásico',
      logo: 'Bordado frontal'
    },
    featured: 0,
    status: 'active'
  },
  {
    name: 'Hoodie Apex Premium · Gris',
    slug: 'hoodie-apex-grey',
    sku: 'APPAREL-HOODIE-GREY',
    description: 'Hoodie premium 80% algodón 20% poliéster. Logo bordado grande. Capucha ajustable. Bolsillo canguro.',
    short_description: 'Hoodie premium gris',
    category: CATEGORIES.ROPA,
    product_type: PRODUCT_TYPES.APPAREL,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 34990,
    stock_quantity: 60,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'unidad',
    unit_size: 1,
    specifications: {
      material: '80% Algodón / 20% Poliéster',
      weight: '320 GSM',
      sizes: 'S, M, L, XL, XXL',
      care: 'Lavar a máquina agua fría'
    },
    attributes: {
      color: 'Gris jaspeado',
      fit: 'Regular unisex',
      features: 'Capucha ajustable, Bolsillo canguro'
    },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Calcetines Cannabis Leaf · Pack 3',
    slug: 'calcetines-cannabis-3pack',
    sku: 'APPAREL-SOCKS-3PACK',
    description: 'Pack 3 pares de calcetines con diseño hoja de cannabis. Algodón suave. Talla única 38-45.',
    short_description: 'Pack 3 calcetines cannabis',
    category: CATEGORIES.ROPA,
    product_type: PRODUCT_TYPES.APPAREL,
    is_medicinal: 0,
    requires_prescription: 0,
    base_price: 12990,
    stock_quantity: 120,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'pack',
    unit_size: 3,
    specifications: {
      material: '80% Algodón / 15% Poliéster / 5% Elastano',
      sizes: 'Talla única 38-45',
      pairs: '3 pares',
      care: 'Lavar a máquina'
    },
    attributes: {
      colors: 'Negro, Verde, Gris',
      design: 'Hoja cannabis bordada',
      comfort: 'Elásticos cómodos'
    },
    featured: 0,
    status: 'active'
  }
];

// ============================================
// PRODUCTOS CBD (SIN RECETA)
// ============================================
const CBD_PUBLICO = [
  {
    name: 'Aceite CBD 5% · Uso Diario · 15ml',
    slug: 'aceite-cbd-5-15ml-publico',
    sku: 'CBD-OIL-5-15ML',
    description: 'Aceite CBD 5% de venta libre. Ideal para principiantes. Ansiedad leve y bienestar general.',
    short_description: 'CBD 5% uso diario sin receta',
    category: CATEGORIES.CBD,
    product_type: PRODUCT_TYPES.OIL,
    is_medicinal: 0,
    requires_prescription: 0,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 19990,
    stock_quantity: 200,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 15,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0, cbd: 5.0 },
    specifications: {
      volume: '15ml',
      cbd_per_ml: '5mg',
      total_cbd: '75mg',
      thc_content: '0% THC',
      extraction: 'CO2',
      carrier_oil: 'Aceite de hemp'
    },
    therapeutic_info: {
      conditions: ['Ansiedad leve', 'Estrés', 'Bienestar general'],
      benefits: ['Sin receta', 'Uso diario', 'Sin psicoactividad'],
      effects: ['Calma', 'Relajación', 'Equilibrio']
    },
    usage_info: {
      recommended_time: 'Cualquier hora',
      dosage: { beginner: '0.5ml', intermediate: '1ml', advanced: '2ml' },
      administration: ['Sublingual 60 segundos'],
      onset: '20-40 minutos',
      duration: '4-6 horas'
    },
    safety_info: {
      contraindications: ['Hipersensibilidad'],
      side_effects: ['Ninguno reportado en dosis normales'],
      interactions: ['Ninguna significativa']
    },
    attributes: { otc: 'Venta libre', beginner_friendly: 'Sí', packaging: 'Gotero 15ml' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Gummies CBD 10mg · 30 unidades',
    slug: 'gummies-cbd-10mg-30u',
    sku: 'CBD-GUMMIES-10MG-30',
    description: 'Gummies sabor frutas con 10mg CBD cada una. Sin azúcar. Veganas. Fácil dosificación.',
    short_description: 'Gummies CBD 10mg veganas',
    category: CATEGORIES.CBD,
    product_type: PRODUCT_TYPES.CAPSULE,
    is_medicinal: 0,
    requires_prescription: 0,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 22990,
    stock_quantity: 150,
    stock_unit: 'unidades',
    unit_type: 'unit',
    base_unit: 'frasco',
    unit_size: 30,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0, cbd: 10.0 },
    specifications: {
      gummies_per_container: 30,
      cbd_per_gummy: '10mg',
      total_cbd: '300mg',
      thc_content: '0% THC',
      sweetener: 'Sin azúcar (stevia)',
      vegan: 'Sí'
    },
    therapeutic_info: {
      conditions: ['Ansiedad', 'Estrés', 'Bienestar'],
      benefits: ['Sabor agradable', 'Discreto', 'Dosificación fácil'],
      effects: ['Calma', 'Relajación']
    },
    usage_info: {
      recommended_time: 'Cualquier hora',
      dosage: { beginner: '1 gummy', intermediate: '2 gummies', advanced: '3 gummies' },
      administration: ['Masticar y tragar'],
      onset: '30-60 minutos',
      duration: '4-6 horas'
    },
    safety_info: {
      contraindications: ['Ninguna conocida'],
      side_effects: ['Ninguno en dosis normales'],
      interactions: ['Ninguna significativa']
    },
    attributes: { flavors: 'Frutas mixtas', otc: 'Venta libre', kid_friendly: 'No (adultos)' },
    featured: 1,
    status: 'active'
  },
  {
    name: 'Crema CBD 100mg · Alivio Muscular',
    slug: 'crema-cbd-100mg-muscular',
    sku: 'CBD-CREAM-100MG',
    description: 'Crema CBD 100mg con mentol y árnica. Ideal para dolores musculares leves y después del ejercicio.',
    short_description: 'Crema CBD alivio muscular',
    category: CATEGORIES.CBD,
    product_type: PRODUCT_TYPES.TOPICAL,
    is_medicinal: 0,
    requires_prescription: 0,
    medical_category: MEDICAL_CATEGORIES.CBD,
    base_price: 16990,
    stock_quantity: 180,
    stock_unit: 'unidades',
    unit_type: 'volume',
    base_unit: 'ml',
    unit_size: 60,
    brand: BRANDS.APEX_REMEDY,
    cannabinoid_profile: { thc: 0, cbd: 100 },
    specifications: {
      total_cbd: '100mg',
      volume: '60ml',
      additional_ingredients: 'Mentol, Árnica, Aloe vera',
      application: '2-3 veces al día',
      absorption: 'Tópica'
    },
    therapeutic_info: {
      conditions: ['Dolor muscular leve', 'Dolores post-ejercicio', 'Tensión'],
      benefits: ['Alivio localizado', 'Refrescante', 'Sin receta'],
      effects: ['Alivio', 'Frescura', 'Relajación muscular']
    },
    usage_info: {
      recommended_time: 'Después del ejercicio o cuando sea necesario',
      dosage: { application: 'Aplicar cantidad generosa' },
      administration: ['Masajear en área afectada'],
      onset: '10-20 minutos',
      duration: '2-4 horas'
    },
    safety_info: {
      contraindications: ['Heridas abiertas', 'Alergia a componentes'],
      side_effects: ['Ninguno reportado'],
      interactions: ['Ninguna']
    },
    attributes: { otc: 'Venta libre', scent: 'Mentol refrescante', packaging: 'Tubo 60ml' },
    featured: 0,
    status: 'active'
  }
];

// EXPORTAR TODOS LOS PRODUCTOS
module.exports = {
  FLORES_MEDICINALES,
  ACEITES_MEDICINALES,
  CONCENTRADOS_MEDICINALES,
  CAPSULAS_MEDICINALES,
  TOPICOS_MEDICINALES,
  SEMILLAS,
  VAPORIZADORES,
  ACCESORIOS,
  ROPA,
  CBD_PUBLICO
};