// addProducts.js
// Script modular para agregar nuevos productos (semillas y ropa)

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Estructura base de producto
 * Permite agregar distintos tipos de categorías (semillas, ropa, etc.)
 */
class Product {
  constructor({
    name,
    description,
    price,
    stock = 50,
    category,
    sku,
    breeder = null,
    image = null,
    image_hover = null,
    featured = 1,
    attributes = {},
    is_medicinal = false,
    requires_prescription = false,
    unit = 'unidad'
  }) {
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.category = category;
    this.breeder = breeder;
    this.sku = sku;
    this.featured = featured;
    this.image = image;
    this.image_hover = image_hover;
    this.attributes = JSON.stringify(attributes);
    this.is_medicinal = is_medicinal;
    this.requires_prescription = requires_prescription;
    this.unit = unit;
  }
}

/**
 * Inserta productos en la base de datos Apexremedy
 */
async function insertProducts(products) {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);

  const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

  for (const p of products) {
    await run(
      `
      INSERT INTO products (
        name, description, price, stock, category,
        breeder, sku, featured, image, image_hover,
        seed_attributes, is_medicinal, requires_prescription,
        unit, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        p.breeder,
        p.sku,
        p.featured,
        p.image,
        p.image_hover,
        p.attributes,
        p.is_medicinal,
        p.requires_prescription,
        p.unit
      ]
    );
    console.log(`✅ Producto insertado: ${p.name}`);
  }

  db.close();
  console.log('\n🎉 Inserción de productos completada.\n');
}

// ---------------------------
// 🌱 SEMILLAS DE COLECCIÓN
// ---------------------------
const semillasColeccion = [
  new Product({
    name: 'AK-47 Auto',
    description:
      'Variedad autofloreciente de renombre mundial. Mezcla genética entre Colombian, Mexican, Thai y Afghan. Efecto relajante y estimulante equilibrado.',
    price: 17990,
    category: 'semillas_coleccion',
    sku: 'SEED-AK47-AUTO',
    breeder: 'Serious Seeds',
    attributes: {
      thc: '19%',
      cbd: '1%',
      sativa: '60%',
      indica: '40%',
      floracion: '8-9 semanas',
      produccion: '450-500 g/m²'
    },
    image: '/assets/images/semillas/ak47.jpg',
    image_hover: '/assets/images/semillas/ak47_hover.jpg'
  }),

  new Product({
    name: 'Blue Dream',
    description:
      'Híbrido sativa dominante (70/30) originario de California. Efectos cerebrales estimulantes con relajación corporal. Perfil aromático dulce a bayas.',
    price: 19990,
    category: 'semillas_coleccion',
    sku: 'SEED-BLUE-DREAM',
    breeder: 'Humboldt Seeds',
    attributes: {
      thc: '20%',
      cbd: '0.5%',
      sativa: '70%',
      indica: '30%',
      floracion: '9-10 semanas',
      produccion: '500-600 g/m²'
    },
    image: '/assets/images/semillas/blue_dream.jpg',
    image_hover: '/assets/images/semillas/blue_dream_hover.jpg'
  }),

  new Product({
    name: 'Gorilla Glue #4',
    description:
      'Índica dominante (60/40) conocida por su potencia extrema y resina abundante. Cruce de Chem’s Sister x Sour Dubb x Chocolate Diesel.',
    price: 21990,
    category: 'semillas_coleccion',
    sku: 'SEED-GORILLA-GLUE-4',
    breeder: 'GG Strains',
    attributes: {
      thc: '27%',
      cbd: '0.2%',
      sativa: '40%',
      indica: '60%',
      floracion: '8-9 semanas',
      produccion: '550-650 g/m²'
    },
    image: '/assets/images/semillas/gorilla_glue_4.jpg',
    image_hover: '/assets/images/semillas/gorilla_glue_4_hover.jpg'
  })
];

// ---------------------------
// 👕 ROPA (POLERAS)
// ---------------------------
const ropaPoleras = [
  new Product({
    name: 'Polera Apex Classic Negra',
    description:
      'Polera 100% algodón premium con logo Apex Remedy bordado. Corte regular unisex.',
    price: 15990,
    category: 'ropa',
    sku: 'TSHIRT-APEX-BLACK',
    attributes: {
      talla: ['S', 'M', 'L', 'XL'],
      material: 'Algodón peinado 100%',
      color: 'Negro'
    },
    image: '/assets/images/ropa/polera_negra.jpg'
  }),
  new Product({
    name: 'Polera Apex Blanca Logo Minimal',
    description:
      'Polera blanca suave, diseño minimalista con logo frontal discreto.',
    price: 15990,
    category: 'ropa',
    sku: 'TSHIRT-APEX-WHITE',
    attributes: {
      talla: ['S', 'M', 'L', 'XL'],
      material: 'Algodón peinado 100%',
      color: 'Blanco'
    },
    image: '/assets/images/ropa/polera_blanca.jpg'
  }),
  new Product({
    name: 'Polera Apex Verde Oliva',
    description:
      'Polera verde oliva inspirada en la línea natural Apex Remedy. Suave y cómoda.',
    price: 16990,
    category: 'ropa',
    sku: 'TSHIRT-APEX-OLIVE',
    attributes: {
      talla: ['S', 'M', 'L', 'XL'],
      material: 'Algodón orgánico',
      color: 'Verde Oliva'
    },
    image: '/assets/images/ropa/polera_oliva.jpg'
  }),
  new Product({
    name: 'Polera Apex Vintage Washed',
    description:
      'Edición limitada con efecto “washed”. Logo retro en el pecho. Corte relajado.',
    price: 17990,
    category: 'ropa',
    sku: 'TSHIRT-APEX-VINTAGE',
    attributes: {
      talla: ['S', 'M', 'L', 'XL'],
      material: 'Algodón 95% + Elastano 5%',
      color: 'Gris Vintage'
    },
    image: '/assets/images/ropa/polera_vintage.jpg'
  })
];

// ---------------------------
// 🚀 EJECUCIÓN
// ---------------------------
(async () => {
  const nuevosProductos = [...semillasColeccion, ...ropaPoleras];
  await insertProducts(nuevosProductos);
})();
