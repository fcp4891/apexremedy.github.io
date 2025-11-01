// backend/database/seeds/seed.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    })
});

async function seedProductos() {
    const dbPath = path.join(__dirname, '..', 'apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('🌱 Iniciando seed de productos completo...\n');

    try {
        console.log('📋 Obteniendo categorías...');
        const categories = {};
        const catRows = await dbHelper.all('SELECT id, slug FROM product_categories');
        catRows.forEach(cat => { categories[cat.slug] = cat.id; });
        console.log('✅ Categorías cargadas:', Object.keys(categories).length, '\n');

        console.log('🏷️  Obteniendo marcas...');
        const brands = {};
        const brandRows = await dbHelper.all('SELECT id, slug FROM brands');
        brandRows.forEach(brand => { brands[brand.slug] = brand.id; });
        console.log('✅ Marcas cargadas:', Object.keys(brands).length, '\n');

        // FLORES MEDICINALES
        console.log('🌿 Insertando flores medicinales...');
        const floresMedicinales = [
            {
                name: 'Purple Kush · Indica Pura',
                slug: 'purple-kush-indica-pura',
                sku: 'MED-FLOWER-PURPLEKUSH-001',
                description: 'Indica pura 100% originaria de California. Perfecta para manejo de dolor crónico severo e insomnio.',
                short_description: 'Indica 100% para dolor crónico e insomnio',
                category_id: categories['medicinal-flores'],
                product_type: 'flower',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 15000,
                stock_quantity: 500,
                stock_unit: 'gramos',
                unit_type: 'weight',
                base_unit: 'g',
                unit_size: 1,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 22.5, cbd: 0.8, cbn: 1.2, cbg: 0.5, thcv: 0.3 },
                terpene_profile: { 'Mirceno': 0.8, 'Cariofileno': 0.6, 'Limoneno': 0.3, 'Pineno': 0.2 },
                strain_info: { type: 'Indica', genetics: '100% Indica Pura', lineage: 'Hindu Kush x Purple Afghani', flowering_time: '8 semanas', origin: 'California, USA' },
                therapeutic_info: { conditions: ['Dolor crónico severo', 'Fibromialgia', 'Insomnio crónico'], benefits: ['Relajación muscular profunda', 'Alivio del dolor intenso'], effects: ['Relajante', 'Sedante'] },
                usage_info: { recommended_time: 'Nocturno', dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, administration: ['Vaporización 175-185°C'], onset: '2-5 minutos', duration: '2-4 horas' },
                safety_info: { contraindications: ['Hipotensión severa', 'Embarazo y lactancia'], side_effects: ['Somnolencia intensa', 'Boca seca'], interactions: ['Sedantes y benzodiacepinas', 'Alcohol'] },
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
                category_id: categories['medicinal-flores'],
                product_type: 'flower',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 16000,
                stock_quantity: 400,
                stock_unit: 'gramos',
                unit_type: 'weight',
                base_unit: 'g',
                unit_size: 1,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 20.0, cbd: 0.5, cbn: 0.3, cbg: 1.2, thcv: 0.7 },
                terpene_profile: { 'Pineno': 0.7, 'Terpinoleno': 0.5, 'Cariofileno': 0.4, 'Mirceno': 0.3 },
                strain_info: { type: 'Sativa dominante', genetics: '55% Sativa / 45% Indica', lineage: 'Haze x Northern Lights #5 x Shiva Skunk', origin: 'Países Bajos' },
                therapeutic_info: { conditions: ['Fatiga crónica', 'Depresión', 'TDAH', 'Falta de apetito'], benefits: ['Energía sin ansiedad', 'Claridad mental', 'Creatividad'], effects: ['Energizante', 'Euforia', 'Concentración'] },
                usage_info: { recommended_time: 'Diurno/matutino', dosage: { beginner: '0.2-0.3g', intermediate: '0.3-0.5g', advanced: '0.5-1g' }, administration: ['Vaporización 175-185°C'], onset: '2-5 minutos', duration: '3-4 horas' },
                safety_info: { contraindications: ['Ansiedad severa', 'Taquicardia', 'Trastornos psicóticos'], side_effects: ['Boca seca', 'Ojos rojos', 'Posible ansiedad en dosis altas'], interactions: ['Estimulantes', 'Antidepresivos IMAO'] },
                attributes: { aroma: 'Pino, Especiado, Terroso', flavor: 'Pino, Hierbas, Madera', appearance: 'Cogollos verde claro con pelos naranjas' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'ACDC · CBD Medicinal',
                slug: 'acdc-cbd-medicinal',
                sku: 'MED-FLOWER-ACDC-001',
                description: 'Cepa CBD dominante. Ratio 20:1 CBD:THC. Sin psicoactividad. Ideal para ansiedad, dolor e inflamación sin efectos psicoactivos.',
                short_description: 'CBD dominante sin psicoactividad',
                category_id: categories['medicinal-flores'],
                product_type: 'flower',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'cbd',
                base_price: 18000,
                stock_quantity: 300,
                stock_unit: 'gramos',
                unit_type: 'weight',
                base_unit: 'g',
                unit_size: 1,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 1.0, cbd: 20.0, cbn: 0.2, cbg: 0.8, cbc: 0.5 },
                terpene_profile: { 'Mirceno': 0.5, 'Pineno': 0.4, 'Cariofileno': 0.3, 'Limoneno': 0.3 },
                strain_info: { type: 'CBD dominante', genetics: 'Cannatonic phenotype', origin: 'California, USA' },
                therapeutic_info: { conditions: ['Ansiedad generalizada', 'Dolor crónico sin sedación', 'Inflamación', 'Epilepsia'], benefits: ['Ansiolítico potente', 'Antiinflamatorio', 'Neuroprotector', 'Sin psicoactividad'], effects: ['Calma', 'Relajación', 'Claridad mental'] },
                usage_info: { recommended_time: 'Cualquier hora', dosage: { beginner: '0.3-0.5g', intermediate: '0.5-1g', advanced: '1-2g' }, administration: ['Vaporización 160-175°C'], onset: '2-5 minutos', duration: '3-5 horas' },
                safety_info: { contraindications: ['Hipersensibilidad a cannabinoides'], side_effects: ['Fatiga leve', 'Boca seca'], interactions: ['Anticoagulantes'] },
                attributes: { aroma: 'Terroso, Dulce, Floral', flavor: 'Herbal, Dulce, Suave', appearance: 'Cogollos verde claro con tricomas abundantes' },
                featured: 1,
                status: 'active'
            }
        ];

        for (const flower of floresMedicinales) {
            const result = await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    medical_category, base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    cannabinoid_profile, terpene_profile, strain_info,
                    therapeutic_info, usage_info, safety_info, attributes,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                flower.name, flower.slug, flower.sku, flower.description, flower.short_description,
                flower.category_id, flower.product_type, flower.is_medicinal, flower.requires_prescription,
                flower.medical_category, flower.base_price, flower.stock_quantity, flower.stock_unit,
                flower.unit_type, flower.base_unit, flower.unit_size, flower.brand_id,
                JSON.stringify(flower.cannabinoid_profile),
                JSON.stringify(flower.terpene_profile),
                JSON.stringify(flower.strain_info),
                JSON.stringify(flower.therapeutic_info),
                JSON.stringify(flower.usage_info),
                JSON.stringify(flower.safety_info),
                JSON.stringify(flower.attributes),
                flower.featured, flower.status,
                new Date().toISOString(), new Date().toISOString()
            ]);

            const productId = result.lastID;
            const variants = [
                { variant_name: '1g', quantity: 1, price: flower.base_price },
                { variant_name: '5g', quantity: 5, price: flower.base_price * 4.5 },
                { variant_name: '10g', quantity: 10, price: flower.base_price * 8.5 },
                { variant_name: '28g', quantity: 28, price: flower.base_price * 22 }
            ];

            for (const variant of variants) {
                await dbHelper.run(`
                    INSERT INTO product_price_variants (
                        product_id, variant_name, variant_type, quantity, unit,
                        price, is_default, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    productId, variant.variant_name, 'weight', variant.quantity, 'g',
                    variant.price, variant.variant_name === '1g' ? 1 : 0, 'active',
                    new Date().toISOString()
                ]);
            }

            console.log(`  ✓ ${flower.name}`);
        }

        console.log(`✅ ${floresMedicinales.length} flores medicinales insertadas\n`);

        // ACEITES MEDICINALES
        console.log('💧 Insertando aceites medicinales...');
        const aceitesMedicinales = [
            {
                name: 'Aceite CBD 10% · 30ml',
                slug: 'aceite-cbd-10-30ml',
                sku: 'MED-OIL-CBD10-30ML',
                description: 'Aceite CBD espectro completo en base MCT orgánica. 3000mg CBD total. Extracción CO2 supercrítico.',
                short_description: 'CBD 10% para ansiedad e inflamación',
                category_id: categories['medicinal-aceites'],
                product_type: 'oil',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'cbd',
                base_price: 65000,
                stock_quantity: 100,
                stock_unit: 'unidades',
                unit_type: 'volume',
                base_unit: 'ml',
                unit_size: 30,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 0.2, cbd: 100, cbn: 0.5, cbg: 2.5, cbc: 1.2 },
                terpene_profile: { 'Mirceno': 0.4, 'Pineno': 0.3, 'Limoneno': 0.3, 'Linalool': 0.2 },
                strain_info: { type: 'CBD Full Spectrum', extraction: 'CO2 Supercrítico', carrier_oil: 'MCT orgánico' },
                therapeutic_info: { conditions: ['Ansiedad generalizada', 'Dolor crónico', 'Inflamación', 'Insomnio'], benefits: ['Ansiolítico', 'Antiinflamatorio', 'Mejora sueño'], effects: ['Calma', 'Relajación'] },
                usage_info: { recommended_time: 'Según necesidad', dosage: { initial: '0.5ml', standard: '1ml', maximum: '2ml' }, administration: ['Sublingual 60-90 segundos'], onset: '15-45 minutos', duration: '6-8 horas' },
                safety_info: { contraindications: ['Anticoagulantes', 'Hepatopatía severa'], side_effects: ['Somnolencia leve', 'Diarrea transitoria'], interactions: ['Inhibidor CYP450'] },
                specifications: { volume: '30ml', concentration: '100mg/ml', total_cbd: '3000mg', thc: '<0.2%' },
                attributes: { color: 'Dorado', taste: 'Natural herbal', texture: 'Líquido oleoso' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'Aceite THC:CBD 1:1 · 30ml',
                slug: 'aceite-thc-cbd-1-1-30ml',
                sku: 'MED-OIL-THCCBD-30ML',
                description: 'Aceite balance THC:CBD ratio 1:1. 1500mg THC + 1500mg CBD. Ideal para dolor crónico con efecto balanceado.',
                short_description: 'Balance THC:CBD para dolor moderado',
                category_id: categories['medicinal-aceites'],
                product_type: 'oil',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 85000,
                stock_quantity: 80,
                stock_unit: 'unidades',
                unit_type: 'volume',
                base_unit: 'ml',
                unit_size: 30,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 50, cbd: 50, cbn: 1.5, cbg: 2.0 },
                strain_info: { type: 'THC:CBD 1:1', extraction: 'CO2 Supercrítico', carrier_oil: 'MCT orgánico' },
                therapeutic_info: { conditions: ['Dolor crónico moderado', 'Espasmos musculares', 'Artritis', 'Cáncer'], benefits: ['Analgesia efectiva', 'CBD reduce ansiedad del THC', 'Antiinflamatorio'], effects: ['Relajación', 'Alivio dolor', 'Leve euforia'] },
                usage_info: { recommended_time: 'Noche o según necesidad', dosage: { initial: '0.25ml', standard: '0.5ml', maximum: '1ml' }, administration: ['Sublingual 60-90 segundos'], onset: '30-60 minutos', duration: '6-8 horas' },
                safety_info: { contraindications: ['Embarazo', 'Lactancia', 'Trastornos psicóticos'], side_effects: ['Somnolencia', 'Boca seca', 'Mareos leves'], interactions: ['Sedantes', 'Anticoagulantes'] },
                specifications: { volume: '30ml', thc_concentration: '50mg/ml', cbd_concentration: '50mg/ml', total_thc: '1500mg', total_cbd: '1500mg' },
                attributes: { color: 'Ámbar oscuro', taste: 'Herbal intenso', texture: 'Oleoso' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'Aceite THC 30% · 10ml',
                slug: 'aceite-thc-30-10ml',
                sku: 'MED-OIL-THC30-10ML',
                description: 'Aceite THC alta potencia. 300mg/ml. Para dolor severo y cáncer. Uso bajo supervisión médica estricta.',
                short_description: 'THC 30% para dolor severo',
                category_id: categories['medicinal-aceites'],
                product_type: 'oil',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 120000,
                stock_quantity: 40,
                stock_unit: 'unidades',
                unit_type: 'volume',
                base_unit: 'ml',
                unit_size: 10,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 300, cbd: 2, cbn: 3, cbg: 1 },
                strain_info: { type: 'THC High Potency', extraction: 'CO2 Supercrítico', carrier_oil: 'MCT orgánico' },
                therapeutic_info: { conditions: ['Dolor crónico severo', 'Cáncer terminal', 'Náuseas por quimioterapia'], benefits: ['Analgesia potente', 'Antiemético', 'Estimulante apetito'], effects: ['Sedación', 'Euforia', 'Analgesia profunda'] },
                usage_info: { recommended_time: 'Nocturno', dosage: { initial: '0.1ml', standard: '0.25ml', maximum: '0.5ml' }, administration: ['Sublingual 90 segundos'], onset: '30-90 minutos', duration: '8-12 horas' },
                safety_info: { contraindications: ['Embarazo', 'Lactancia', 'Trastornos psicóticos', 'Hipotensión severa'], side_effects: ['Somnolencia profunda', 'Mareos', 'Confusión', 'Taquicardia'], interactions: ['Sedantes', 'Alcohol', 'Benzodiacepinas'] },
                specifications: { volume: '10ml', concentration: '300mg/ml', total_thc: '3000mg' },
                attributes: { color: 'Ámbar muy oscuro', taste: 'Cannabis intenso', texture: 'Muy viscoso' },
                featured: 0,
                status: 'active'
            }
        ];

        for (const aceite of aceitesMedicinales) {
            await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    medical_category, base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    cannabinoid_profile, terpene_profile, strain_info,
                    therapeutic_info, usage_info, safety_info,
                    specifications, attributes,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                aceite.name, aceite.slug, aceite.sku, aceite.description, aceite.short_description,
                aceite.category_id, aceite.product_type, aceite.is_medicinal, aceite.requires_prescription,
                aceite.medical_category, aceite.base_price, aceite.stock_quantity, aceite.stock_unit,
                aceite.unit_type, aceite.base_unit, aceite.unit_size, aceite.brand_id,
                JSON.stringify(aceite.cannabinoid_profile),
                aceite.terpene_profile ? JSON.stringify(aceite.terpene_profile) : null,
                JSON.stringify(aceite.strain_info),
                JSON.stringify(aceite.therapeutic_info),
                JSON.stringify(aceite.usage_info),
                JSON.stringify(aceite.safety_info),
                JSON.stringify(aceite.specifications),
                JSON.stringify(aceite.attributes),
                aceite.featured, aceite.status,
                new Date().toISOString(), new Date().toISOString()
            ]);

            console.log(`  ✓ ${aceite.name}`);
        }

        console.log(`✅ ${aceitesMedicinales.length} aceites medicinales insertados\n`);

        // CONCENTRADOS MEDICINALES
        console.log('💎 Insertando concentrados medicinales...');
        const concentradosMedicinales = [
            {
                name: 'Wax Purple Punch · 85% THC',
                slug: 'wax-purple-punch-85',
                sku: 'MED-CONC-WAX-PP85',
                description: 'Wax de alta pureza 85% THC. Extracción BHO purificada. Perfil terpénico preservado. Uso con vaporizador.',
                short_description: 'Wax 85% THC para dolor severo',
                category_id: categories['medicinal-concentrados'],
                product_type: 'concentrate',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 45000,
                stock_quantity: 50,
                stock_unit: 'gramos',
                unit_type: 'weight',
                base_unit: 'g',
                unit_size: 1,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 85, cbd: 0.5, cbn: 2.5, cbg: 1.0 },
                strain_info: { type: 'Indica dominant concentrate', genetics: 'Purple Punch', extraction: 'BHO purificado' },
                therapeutic_info: { conditions: ['Dolor crónico severo', 'Insomnio severo', 'Espasticidad'], benefits: ['Analgesia intensa', 'Sedación profunda'], effects: ['Relajación profunda', 'Sedación', 'Euforia'] },
                usage_info: { recommended_time: 'Nocturno', dosage: { beginner: '0.01-0.02g', intermediate: '0.02-0.05g', advanced: '0.05-0.1g' }, administration: ['Vaporización 315-370°C', 'Dabbing'], onset: 'Inmediato', duration: '2-4 horas' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'Shatter GSC · 90% THC',
                slug: 'shatter-gsc-90',
                sku: 'MED-CONC-SHATTER-GSC90',
                description: 'Shatter cristalino 90% THC. Girl Scout Cookies. Máxima pureza. Extracción CO2 + Winterización.',
                short_description: 'Shatter 90% THC ultra puro',
                category_id: categories['medicinal-concentrados'],
                product_type: 'concentrate',
                is_medicinal: 1,
                requires_prescription: 1,
                medical_category: 'thc',
                base_price: 55000,
                stock_quantity: 30,
                stock_unit: 'gramos',
                unit_type: 'weight',
                base_unit: 'g',
                unit_size: 1,
                brand_id: brands['apex-remedy'],
                cannabinoid_profile: { thc: 90, cbd: 0.3, cbn: 1.8, cbg: 0.8 },
                strain_info: { type: 'Hybrid concentrate', genetics: 'Girl Scout Cookies', extraction: 'CO2 + Winterización' },
                therapeutic_info: { conditions: ['Dolor neuropático', 'Cáncer', 'Náuseas severas'], benefits: ['Analgesia extrema', 'Antiemético potente'], effects: ['Euforia intensa', 'Relajación', 'Sedación'] },
                usage_info: { recommended_time: 'Según necesidad', dosage: { beginner: '0.01g', intermediate: '0.03g', advanced: '0.05g' }, administration: ['Dabbing', 'Vaporización alta temperatura'], onset: 'Inmediato', duration: '3-5 horas' },
                featured: 1,
                status: 'active'
            }
        ];

        for (const concentrado of concentradosMedicinales) {
            const result = await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    medical_category, base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    cannabinoid_profile, strain_info, therapeutic_info, usage_info,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                concentrado.name, concentrado.slug, concentrado.sku, concentrado.description, concentrado.short_description,
                concentrado.category_id, concentrado.product_type, concentrado.is_medicinal, concentrado.requires_prescription,
                concentrado.medical_category, concentrado.base_price, concentrado.stock_quantity, concentrado.stock_unit,
                concentrado.unit_type, concentrado.base_unit, concentrado.unit_size, concentrado.brand_id,
                JSON.stringify(concentrado.cannabinoid_profile),
                JSON.stringify(concentrado.strain_info),
                JSON.stringify(concentrado.therapeutic_info),
                JSON.stringify(concentrado.usage_info),
                concentrado.featured, concentrado.status,
                new Date().toISOString(), new Date().toISOString()
            ]);

            const productId = result.lastID;
            const variants = [
                { variant_name: '0.5g', quantity: 0.5, price: concentrado.base_price * 0.55 },
                { variant_name: '1g', quantity: 1, price: concentrado.base_price },
                { variant_name: '2g', quantity: 2, price: concentrado.base_price * 1.9 }
            ];

            for (const variant of variants) {
                await dbHelper.run(`
                    INSERT INTO product_price_variants (
                        product_id, variant_name, variant_type, quantity, unit,
                        price, is_default, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    productId, variant.variant_name, 'weight', variant.quantity, 'g',
                    variant.price, variant.variant_name === '1g' ? 1 : 0, 'active',
                    new Date().toISOString()
                ]);
            }

            console.log(`  ✓ ${concentrado.name}`);
        }

        console.log(`✅ ${concentradosMedicinales.length} concentrados insertados\n`);

        // SEMILLAS
        console.log('🌱 Insertando semillas...');
        const semillas = [
            {
                name: 'Northern Lights Auto · Royal Queen',
                slug: 'northern-lights-auto-rqs',
                sku: 'SEED-NL-AUTO-3PK',
                description: 'Autofloreciente clásica. 100% Indica. Ciclo 65-75 días. Perfecta para principiantes. Resistente y productiva.',
                short_description: 'Auto indica clásica para principiantes',
                category_id: categories['semillas'],
                product_type: 'seed',
                is_medicinal: 0,
                requires_prescription: 0,
                base_price: 15000,
                stock_quantity: 200,
                stock_unit: 'packs',
                unit_type: 'unit',
                base_unit: 'pack',
                unit_size: 3,
                brand_id: brands['sensi-seeds'],
                strain_info: { type: 'Indica Auto', genetics: 'Northern Lights x Ruderalis', flowering_time: '65-75 días desde semilla', yield: '400-450g/m²', thc: '14-18%', cbd: '<1%' },
                specifications: { seeds_per_pack: 3, feminized: 'Sí', autoflowering: 'Sí', difficulty: 'Fácil', height: '90-120cm', climate: 'Interior/Exterior' },
                attributes: { harvest_time: 'Todo el año', aroma: 'Dulce, Terroso', effects: 'Relajante, Sedante' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'Blue Dream Fem · Barney\'s Farm',
                slug: 'blue-dream-fem-barneys',
                sku: 'SEED-BD-FEM-5PK',
                description: 'Feminizada Sativa dominante. Legendaria cepa californiana. Alto rendimiento. 9-10 semanas floración.',
                short_description: 'Sativa legendaria alto rendimiento',
                category_id: categories['semillas'],
                product_type: 'seed',
                is_medicinal: 0,
                requires_prescription: 0,
                base_price: 25000,
                stock_quantity: 150,
                stock_unit: 'packs',
                unit_type: 'unit',
                base_unit: 'pack',
                unit_size: 5,
                brand_id: brands['barneys-farm'],
                strain_info: { type: 'Sativa dominant', genetics: 'Blueberry x Haze', flowering_time: '9-10 semanas', yield: '600-650g/m²', thc: '19-24%', cbd: '0.1-0.2%' },
                specifications: { seeds_per_pack: 5, feminized: 'Sí', autoflowering: 'No', difficulty: 'Media', height: '120-180cm', climate: 'Interior/Exterior cálido' },
                attributes: { harvest_time: 'Octubre (exterior)', aroma: 'Bayas, Dulce, Haze', effects: 'Eufórico, Creativo, Energético' },
                featured: 1,
                status: 'active'
            }
        ];

        for (const semilla of semillas) {
            await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size, brand_id,
                    strain_info, specifications, attributes,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                semilla.name, semilla.slug, semilla.sku, semilla.description, semilla.short_description,
                semilla.category_id, semilla.product_type, semilla.is_medicinal, semilla.requires_prescription,
                semilla.base_price, semilla.stock_quantity, semilla.stock_unit,
                semilla.unit_type, semilla.base_unit, semilla.unit_size, semilla.brand_id,
                JSON.stringify(semilla.strain_info),
                JSON.stringify(semilla.specifications),
                JSON.stringify(semilla.attributes),
                semilla.featured, semilla.status,
                new Date().toISOString(), new Date().toISOString()
            ]);

            console.log(`  ✓ ${semilla.name}`);
        }

        console.log(`✅ ${semillas.length} semillas insertadas\n`);

        // VAPORIZADORES
        console.log('💨 Insertando vaporizadores...');
        const vaporizadores = [
            {
                name: 'PAX 3 · Dual Use',
                slug: 'pax-3-dual-use',
                sku: 'VAP-PAX3-BLACK',
                description: 'Vaporizador portátil premium. Doble uso: hierbas y concentrados. Calentamiento 15 segundos. Control por app.',
                short_description: 'Premium dual use con app',
                category_id: categories['vaporizadores'],
                product_type: 'accessory',
                is_medicinal: 0,
                requires_prescription: 0,
                base_price: 189990,
                stock_quantity: 15,
                stock_unit: 'unidades',
                unit_type: 'unit',
                base_unit: 'unidad',
                unit_size: 1,
                specifications: { material: 'Hierbas secas y concentrados', heating: 'Conducción', temp_range: '182-215°C', battery: '8-10 sesiones', warranty: '10 años' },
                attributes: { color: 'Negro mate', size: 'Portátil 9.8x3x2.1cm', weight: '93g', features: 'Control App, Vibraciones' },
                featured: 1,
                status: 'active'
            },
            {
                name: 'Mighty+ · Storz & Bickel',
                slug: 'mighty-plus-storz-bickel',
                sku: 'VAP-MIGHTY-PLUS',
                description: 'El vaporizador portátil más potente. Tecnología médica alemana. Calidad excepcional. Batería mejorada.',
                short_description: 'Top tier portátil alemán',
                category_id: categories['vaporizadores'],
                product_type: 'accessory',
                is_medicinal: 0,
                requires_prescription: 0,
                base_price: 399990,
                stock_quantity: 8,
                stock_unit: 'unidades',
                unit_type: 'unit',
                base_unit: 'unidad',
                unit_size: 1,
                specifications: { material: 'Hierbas secas', heating: 'Convección + Conducción', temp_range: '40-210°C', battery: '50% más capacidad', warranty: '3 años' },
                attributes: { color: 'Negro/Gris', features: 'Pantalla LED, USB-C, Cámara cerámica' },
                featured: 1,
                status: 'active'
            }
        ];

        for (const vaporizador of vaporizadores) {
            await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    base_price, stock_quantity, stock_unit,
                    unit_type, base_unit, unit_size,
                    specifications, attributes,
                    featured, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                vaporizador.name, vaporizador.slug, vaporizador.sku, vaporizador.description, vaporizador.short_description,
                vaporizador.category_id, vaporizador.product_type, vaporizador.is_medicinal, vaporizador.requires_prescription,
                vaporizador.base_price, vaporizador.stock_quantity, vaporizador.stock_unit,
                vaporizador.unit_type, vaporizador.base_unit, vaporizador.unit_size,
                JSON.stringify(vaporizador.specifications),
                vaporizador.attributes ? JSON.stringify(vaporizador.attributes) : null,
                vaporizador.featured, vaporizador.status,
                new Date().toISOString(), new Date().toISOString()
            ]);

            console.log(`  ✓ ${vaporizador.name}`);
        }

        console.log(`✅ ${vaporizadores.length} vaporizadores insertados\n`);

        // ROPA
        console.log('👕 Insertando ropa...');
        const ropa = [
            {
                name: 'Polera Apex Classic Negra',
                slug: 'polera-apex-black',
                sku: 'APPAREL-TSHIRT-BLACK',
                description: 'Polera 100% algodón premium. Logo Apex Remedy bordado. Corte regular unisex. Suave y durable.',
                short_description: 'Polera clásica negra',
                category_id: categories['ropa'],
                product_type: 'apparel',
                is_medicinal: 0,
                requires_prescription: 0,
                base_price: 15990,
                stock_quantity: 100,
                stock_unit: 'unidades',
                specifications: { material: 'Algodón peinado 100%', weight: '180 GSM', sizes: 'S, M, L, XL, XXL', care: 'Lavar a máquina agua fría' },
                attributes: { color: 'Negro', fit: 'Regular unisex', print: 'Logo bordado pecho' },
                status: 'active'
            }
        ];

        for (const prenda of ropa) {
            await dbHelper.run(`
                INSERT INTO products (
                    name, slug, sku, description, short_description,
                    category_id, product_type, is_medicinal, requires_prescription,
                    base_price, stock_quantity, stock_unit,
                    specifications, attributes, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                prenda.name, prenda.slug, prenda.sku, prenda.description, prenda.short_description,
                prenda.category_id, prenda.product_type, prenda.is_medicinal, prenda.requires_prescription,
                prenda.base_price, prenda.stock_quantity, prenda.stock_unit,
                JSON.stringify(prenda.specifications),
                JSON.stringify(prenda.attributes),
                prenda.status, new Date().toISOString(), new Date().toISOString()
            ]);

            console.log(`  ✓ ${prenda.name}`);
        }

        console.log(`✅ ${ropa.length} prendas insertadas\n`);

        console.log('🎉 SEED COMPLETO!\n');
        console.log('📊 Resumen:');
        console.log(`  - Flores medicinales: ${floresMedicinales.length}`);
        console.log(`  - Aceites medicinales: ${aceitesMedicinales.length}`);
        console.log(`  - Concentrados: ${concentradosMedicinales.length}`);
        console.log(`  - Semillas: ${semillas.length}`);
        console.log(`  - Vaporizadores: ${vaporizadores.length}`);
        console.log(`  - Ropa: ${ropa.length}`);
        console.log(`  - TOTAL: ${floresMedicinales.length + aceitesMedicinales.length + concentradosMedicinales.length + semillas.length + vaporizadores.length + ropa.length} productos\n`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        db.close();
    }
}

seedProductos()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });