// backend/database/seeders/seed-analytics.js
// Seed completo de datos de analytics relacionados
// Uso: node seed-analytics.js [--force] [--days=30] [--sessions=1000]

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// ============================================
// CONFIGURACIÓN
// ============================================

const args = process.argv.slice(2);
const options = {
    force: args.includes('--force'),
    days: parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '90'),
    sessions: parseInt(args.find(arg => arg.startsWith('--sessions='))?.split('=')[1] || '500')
};

// ============================================
// UTILIDADES
// ============================================

const createDbHelper = (db) => ({
    run: (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    }),
    all: (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    }),
    get: (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    })
});

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
}

// ============================================
// CANALES Y UTM
// ============================================

const UTM_SOURCES = ['google', 'facebook', 'instagram', 'direct', 'email', 'referral', 'organic'];
const UTM_MEDIUMS = ['cpc', 'social', 'email', 'organic', 'referral', 'direct'];
const CAMPAIGN_TYPES = ['paid_search', 'social_media', 'email', 'display', 'affiliate'];
const CHANNELS = ['Organic', 'Paid', 'Social', 'Email', 'Direct', 'Referral'];

const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const OS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];

const PAGES = [
    '/',
    '/productos',
    '/productos/flores-medicinales',
    '/productos/aceites-medicinales',
    '/productos/concentrados-medicinales',
    '/productos/capsulas-medicinales',
    '/productos/topicos-medicinales',
    '/productos/semillas',
    '/productos/vaporizadores',
    '/productos/accesorios',
    '/productos/cbd',
    '/carrito',
    '/checkout',
    '/login',
    '/registro',
    '/nosotros',
    '/contacto',
    '/marco-legal'
];

const SEARCH_QUERIES = [
    'cannabis medicinal',
    'aceite cbd',
    'flores medicinales',
    'vaporizador',
    'semillas',
    'cannabis chile',
    'cbd',
    'thc',
    'marihuana medicinal',
    'prescripción cannabis'
];

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function seedAnalytics() {
    const dbPath = path.join(__dirname, '../apexremedy.db');
    const db = new sqlite3.Database(dbPath);
    const dbHelper = createDbHelper(db);

    console.log('📊 Iniciando seed de Analytics...\n');

    try {
        // Obtener datos existentes
        const users = await dbHelper.all('SELECT id, email, created_at FROM users WHERE status = "active" LIMIT 100');
        const products = await dbHelper.all('SELECT id, name, base_price FROM products WHERE status = "active" LIMIT 100');
        const orders = await dbHelper.all('SELECT id, user_id, created_at, total, status FROM orders LIMIT 500');
        const categories = await dbHelper.all('SELECT id, name FROM product_categories WHERE status = "active"');

        if (users.length === 0) {
            console.log('⚠️  No hay usuarios. Ejecuta seed-users.js primero.');
            db.close();
            return;
        }

        if (products.length === 0) {
            console.log('⚠️  No hay productos. Ejecuta seed-products.js primero.');
            db.close();
            return;
        }

        console.log(`✅ Usuarios encontrados: ${users.length}`);
        console.log(`✅ Productos encontrados: ${products.length}`);
        console.log(`✅ Órdenes encontradas: ${orders.length}`);

        // Calcular fechas
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - options.days);

        // ============================================
        // 1. MARKETING CAMPAIGNS
        // ============================================
        console.log('\n📢 Creando campañas de marketing...');
        
        // Verificar si ya existen campañas
        const existingCampaigns = await dbHelper.get('SELECT COUNT(*) as count FROM marketing_campaigns');
        if (existingCampaigns.count > 0 && !options.force) {
            console.log(`  ⚠️  Ya existen ${existingCampaigns.count} campañas. Usa --force para agregar más.`);
        } else {
            const campaigns = [];
            for (let i = 0; i < 15; i++) {
                const campaignStart = randomDate(startDate, endDate);
                const campaignEnd = new Date(campaignStart);
                campaignEnd.setDate(campaignEnd.getDate() + randomInt(7, 60));
                
                const budget = randomInt(50000, 500000);
                const spent = randomInt(Math.floor(budget * 0.3), budget);
                const impressions = randomInt(10000, 100000);
                const clicks = randomInt(Math.floor(impressions * 0.01), Math.floor(impressions * 0.05));
                const conversions = randomInt(Math.floor(clicks * 0.01), Math.floor(clicks * 0.05));
                const revenue = conversions * randomInt(30000, 150000);

                await dbHelper.run(`
                    INSERT OR IGNORE INTO marketing_campaigns 
                    (name, code, campaign_type, channel, start_date, end_date, budget, spent, 
                     impressions, clicks, conversions, revenue, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
            `, [
                `Campaña ${randomChoice(['Verano', 'Invierno', 'Black Friday', 'Navidad', 'Año Nuevo', 'Día del Cannabis', 'Salud'])} ${i + 1}`,
                `CAMP-${String(Date.now() + i).padStart(3, '0')}`,
                randomChoice(CAMPAIGN_TYPES),
                randomChoice(CHANNELS),
                campaignStart.toISOString(),
                campaignEnd.toISOString(),
                budget,
                spent,
                impressions,
                clicks,
                conversions,
                revenue,
                new Date().toISOString(),
                new Date().toISOString()
            ]);
            }
            console.log('  ✅ Campañas creadas');
        }

        // ============================================
        // 2. WEB SESSIONS
        // ============================================
        console.log('\n🌐 Creando sesiones web...');
        
        const sessions = [];
        for (let i = 0; i < options.sessions; i++) {
            const sessionStart = randomDate(startDate, endDate);
            const duration = randomInt(30, 3600); // 30s a 1h
            const sessionEnd = new Date(sessionStart.getTime() + duration * 1000);
            const user = Math.random() < 0.3 ? randomChoice(users) : null; // 30% usuarios logueados
            const pageViews = randomInt(1, 20);
            const isBounce = Math.random() < 0.4 && pageViews === 1; // 40% bounce rate
            const utmSource = Math.random() < 0.6 ? randomChoice(UTM_SOURCES) : null;
            const utmMedium = utmSource ? randomChoice(UTM_MEDIUMS) : null;
            const utmCampaign = utmSource ? `campaign-${randomInt(1, 15)}` : null;

            const sessionId = generateSessionId();
            const result = await dbHelper.run(`
                INSERT INTO web_sessions 
                (session_id, user_id, device_type, browser, os, referrer, utm_source, utm_medium, 
                 utm_campaign, landing_page, country, region, city, started_at, ended_at, 
                 duration_seconds, page_views, is_bounce, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                sessionId,
                user ? user.id : null,
                randomChoice(DEVICE_TYPES),
                randomChoice(BROWSERS),
                randomChoice(OS),
                Math.random() < 0.3 ? 'https://google.com' : null,
                utmSource,
                utmMedium,
                utmCampaign,
                randomChoice(PAGES),
                'Chile',
                'Metropolitana de Santiago',
                randomChoice(['Santiago', 'Maipú', 'La Florida', 'Las Condes', 'Providencia', 'Ñuñoa']),
                sessionStart.toISOString(),
                sessionEnd.toISOString(),
                duration,
                pageViews,
                isBounce ? 1 : 0,
                sessionStart.toISOString()
            ]);

            sessions.push({ 
                session_id: sessionId, 
                user_id: user ? user.id : null, 
                pageViews,
                started_at: sessionStart.toISOString()
            });
        }
        console.log(`  ✅ ${sessions.length} sesiones creadas`);

        // ============================================
        // 3. PAGEVIEWS
        // ============================================
        console.log('\n📄 Creando pageviews...');
        
        // Obtener sesiones con sus fechas
        const sessionsWithDates = await dbHelper.all(`
            SELECT session_id, user_id, started_at, page_views 
            FROM web_sessions 
            ORDER BY started_at DESC
            LIMIT ?
        `, [sessions.length]);

        let pageviewCount = 0;
        for (const session of sessionsWithDates) {
            const pageCount = session.page_views;
            const sessionStart = new Date(session.started_at);
            for (let p = 0; p < pageCount; p++) {
                const pageTime = new Date(sessionStart);
                pageTime.setSeconds(pageTime.getSeconds() + p * randomInt(10, 120));
                
                const pagePath = randomChoice(PAGES);
                const timeOnPage = randomInt(10, 300);
                const scrollDepth = Math.random() * 100;

                await dbHelper.run(`
                    INSERT INTO pageviews 
                    (session_id, user_id, page_path, page_title, referrer, time_on_page, 
                     scroll_depth, exit_page, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    session.session_id,
                    session.user_id,
                    pagePath,
                    `Página ${pagePath}`,
                    p === 0 ? 'https://google.com' : null,
                    timeOnPage,
                    scrollDepth,
                    p === pageCount - 1 ? 1 : 0,
                    pageTime.toISOString()
                ]);
                pageviewCount++;
            }
        }
        console.log(`  ✅ ${pageviewCount} pageviews creados`);

        // ============================================
        // 4. WEB EVENTS
        // ============================================
        console.log('\n🎯 Creando eventos web...');
        
        const eventTypes = [
            { type: 'page_view', category: 'engagement', action: 'view', prob: 0.4 },
            { type: 'product_view', category: 'ecommerce', action: 'view', prob: 0.2 },
            { type: 'add_to_cart', category: 'ecommerce', action: 'add', prob: 0.15 },
            { type: 'remove_from_cart', category: 'ecommerce', action: 'remove', prob: 0.05 },
            { type: 'checkout_start', category: 'ecommerce', action: 'checkout', prob: 0.08 },
            { type: 'purchase', category: 'ecommerce', action: 'purchase', prob: 0.05 },
            { type: 'wishlist_add', category: 'engagement', action: 'wishlist', prob: 0.05 },
            { type: 'search', category: 'engagement', action: 'search', prob: 0.02 }
        ];

        let eventCount = 0;
        const sessionsForEvents = sessionsWithDates.slice(0, Math.floor(sessionsWithDates.length * 0.8));
        for (const session of sessionsForEvents) {
            const eventsPerSession = randomInt(1, 5);
            const sessionStart = new Date(session.started_at);
            for (let e = 0; e < eventsPerSession; e++) {
                const eventTime = new Date(sessionStart);
                eventTime.setSeconds(eventTime.getSeconds() + e * randomInt(30, 180));
                
                const rand = Math.random();
                let cumulative = 0;
                let selectedEvent = eventTypes[0];
                for (const evt of eventTypes) {
                    cumulative += evt.prob;
                    if (rand <= cumulative) {
                        selectedEvent = evt;
                        break;
                    }
                }

                const productId = selectedEvent.type.includes('product') ? randomChoice(products).id : null;
                const orderId = selectedEvent.type === 'purchase' && orders.length > 0 ? randomChoice(orders).id : null;

                await dbHelper.run(`
                    INSERT INTO web_events 
                    (session_id, user_id, event_type, event_category, event_action, 
                     event_label, event_value, page_path, product_id, order_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    session.session_id,
                    session.user_id,
                    selectedEvent.type,
                    selectedEvent.category,
                    selectedEvent.action,
                    selectedEvent.type,
                    selectedEvent.type === 'purchase' ? randomInt(30000, 200000) : null,
                    randomChoice(PAGES),
                    productId,
                    orderId,
                    eventTime.toISOString()
                ]);
                eventCount++;
            }
        }
        console.log(`  ✅ ${eventCount} eventos creados`);

        // ============================================
        // 5. SITE SEARCHES
        // ============================================
        console.log('\n🔍 Creando búsquedas...');
        
        let searchCount = 0;
        for (let i = 0; i < Math.floor(sessionsWithDates.length * 0.15); i++) {
            const session = randomChoice(sessionsWithDates);
            const searchTime = randomDate(startDate, endDate);
            const query = randomChoice(SEARCH_QUERIES);
            const resultsCount = randomInt(0, 50);
            const clickedResult = Math.random() < 0.6 ? 1 : 0;
            const conversion = clickedResult && Math.random() < 0.1 ? 1 : 0;

            await dbHelper.run(`
                INSERT INTO site_searches 
                (session_id, user_id, search_query, results_count, clicked_result, conversion, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                session.session_id,
                session.user_id,
                query,
                resultsCount,
                clickedResult,
                conversion,
                searchTime.toISOString()
            ]);
            searchCount++;
        }
        console.log(`  ✅ ${searchCount} búsquedas creadas`);

        // ============================================
        // 6. CART ABANDONMENT EVENTS
        // ============================================
        console.log('\n🛒 Creando eventos de abandono de carrito...');
        
        let abandonmentCount = 0;
        const sessionsWithCart = sessionsWithDates.filter(() => Math.random() < 0.25); // 25% tienen carrito
        
        for (const session of sessionsWithCart) {
            const abandonedAt = randomDate(startDate, endDate);
            const cartValue = randomInt(30000, 200000);
            const itemsCount = randomInt(1, 5);
            const recovered = Math.random() < 0.15; // 15% recuperación
            const recoveredAt = recovered ? new Date(abandonedAt.getTime() + randomInt(3600000, 86400000 * 3)) : null;
            const emailSent = Math.random() < 0.5 ? 1 : 0;

            await dbHelper.run(`
                INSERT INTO cart_abandonment_events 
                (session_id, user_id, cart_value, items_count, abandoned_at, recovered_at, 
                 recovery_email_sent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                session.session_id,
                session.user_id,
                cartValue,
                itemsCount,
                abandonedAt.toISOString(),
                recoveredAt ? recoveredAt.toISOString() : null,
                emailSent,
                abandonedAt.toISOString()
            ]);
            abandonmentCount++;
        }
        console.log(`  ✅ ${abandonmentCount} eventos de abandono creados`);

        // ============================================
        // 7. CUSTOMER SEGMENTS (RFM)
        // ============================================
        console.log('\n👥 Creando segmentación RFM...');
        
        let segmentCount = 0;
        for (const user of users) {
            // Obtener órdenes del usuario
            const userOrders = orders.filter(o => o.user_id === user.id);
            if (userOrders.length === 0) continue;

            // Calcular RFM
            const lastOrder = userOrders[userOrders.length - 1];
            const daysSinceLastOrder = Math.floor((endDate - new Date(lastOrder.created_at)) / (1000 * 60 * 60 * 24));
            const frequency = userOrders.length;
            const monetary = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            // Score RFM (1-5)
            const recency = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 60 ? 4 : daysSinceLastOrder <= 90 ? 3 : daysSinceLastOrder <= 180 ? 2 : 1;
            const freq = frequency >= 10 ? 5 : frequency >= 5 ? 4 : frequency >= 3 ? 3 : frequency >= 2 ? 2 : 1;
            const mon = monetary >= 500000 ? 5 : monetary >= 300000 ? 4 : monetary >= 150000 ? 3 : monetary >= 50000 ? 2 : 1;

            const rfmScore = (recency * 100) + (freq * 10) + mon;
            
            // Determinar segmento
            let segmentCode = 'Lost';
            if (rfmScore >= 444) segmentCode = 'VIP';
            else if (rfmScore >= 333) segmentCode = 'Champion';
            else if (rfmScore >= 222) segmentCode = 'Loyal';
            else if (rfmScore >= 111) segmentCode = 'At Risk';

            const clvPredicted = monetary * 1.5; // Predicción simple
            const churnProb = daysSinceLastOrder > 180 ? 0.8 : daysSinceLastOrder > 90 ? 0.5 : daysSinceLastOrder > 60 ? 0.3 : 0.1;

            await dbHelper.run(`
                INSERT OR REPLACE INTO customer_segments 
                (user_id, segment_type, segment_code, rfm_recency, rfm_frequency, rfm_monetary, 
                 rfm_score, clv_predicted, churn_probability, last_calculated_at, created_at, updated_at)
                VALUES (?, 'RFM', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                user.id,
                segmentCode,
                recency,
                freq,
                mon,
                rfmScore,
                clvPredicted,
                churnProb,
                endDate.toISOString(),
                new Date().toISOString(),
                new Date().toISOString()
            ]);
            segmentCount++;
        }
        console.log(`  ✅ ${segmentCount} segmentos RFM creados`);

        // ============================================
        // 8. CUSTOMER COHORTS
        // ============================================
        console.log('\n📊 Creando cohortes de clientes...');
        
        let cohortCount = 0;
        for (const user of users) {
            const userOrders = orders.filter(o => o.user_id === user.id);
            if (userOrders.length === 0) continue;

            const firstOrder = userOrders[0];
            const lastOrder = userOrders[userOrders.length - 1];
            const firstOrderDate = new Date(firstOrder.created_at);
            const cohortPeriod = `${firstOrderDate.getFullYear()}-${String(firstOrderDate.getMonth() + 1).padStart(2, '0')}`;
            const lifetimeDays = Math.floor((new Date(lastOrder.created_at) - firstOrderDate) / (1000 * 60 * 60 * 24));
            const totalRevenue = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            await dbHelper.run(`
                INSERT OR REPLACE INTO customer_cohorts 
                (user_id, cohort_period, cohort_type, first_order_date, last_order_date, 
                 total_orders, total_revenue, lifetime_days, created_at, updated_at)
                VALUES (?, ?, 'month', ?, ?, ?, ?, ?, ?, ?)
            `, [
                user.id,
                cohortPeriod,
                firstOrder.created_at,
                lastOrder.created_at,
                userOrders.length,
                totalRevenue,
                lifetimeDays,
                new Date().toISOString(),
                new Date().toISOString()
            ]);
            cohortCount++;
        }
        console.log(`  ✅ ${cohortCount} cohortes creadas`);

        console.log('\n✅ Seed de Analytics completado exitosamente!\n');
        console.log('📊 Resumen:');
        console.log(`   - Campañas: 15`);
        console.log(`   - Sesiones: ${sessions.length}`);
        console.log(`   - Pageviews: ${pageviewCount}`);
        console.log(`   - Eventos: ${eventCount}`);
        console.log(`   - Búsquedas: ${searchCount}`);
        console.log(`   - Abandonos: ${abandonmentCount}`);
        console.log(`   - Segmentos RFM: ${segmentCount}`);
        console.log(`   - Cohortes: ${cohortCount}\n`);

    } catch (error) {
        console.error('❌ Error en seed de analytics:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar
if (require.main === module) {
    seedAnalytics()
        .then(() => {
            console.log('✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { seedAnalytics };

