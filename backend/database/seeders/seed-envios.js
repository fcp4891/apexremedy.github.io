// backend/database/seeders/seed-envios.js
// Seed para generar datos de logística y envíos relacionados con pedidos

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const createDbHelper = (db) => ({
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  }),
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  })
});

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split('T')[0] + ' ' + date.toISOString().split('T')[1].split('.')[0];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedEnvios() {
  const dbPath = path.join(__dirname, '../apexremedy.db');
  const db = new sqlite3.Database(dbPath);
  const dbHelper = createDbHelper(db);

  try {
    console.log('\n🚚 Iniciando seed de envíos y logística...\n');

    // Obtener datos necesarios
    const orders = await dbHelper.all('SELECT id, order_number, user_id, total, status FROM orders LIMIT 50');
    const shippingProviders = await dbHelper.all('SELECT id FROM shipping_providers LIMIT 5');
    const warehouses = await dbHelper.all('SELECT id FROM warehouses LIMIT 3');

    if (orders.length === 0) {
      console.log('⚠️  No hay pedidos disponibles para crear envíos');
      return;
    }

    // ============================================
    // 1. CREAR PROVEEDORES DE ENVÍO
    // ============================================
    console.log('📦 Creando proveedores de envío...');
    
    const providers = [
      {
        name: 'Starken',
        code: 'STARKEN',
        provider_type: 'external',
        description: 'Servicio de envío nacional en Chile',
        website: 'https://www.starken.cl',
        phone: '+56 2 2345 6789',
        is_active: 1,
        supports_tracking: 1,
        supports_labels: 1
      },
      {
        name: 'Chilexpress',
        code: 'CHILEXPRESS',
        provider_type: 'external',
        description: 'Servicio express de envíos',
        website: 'https://www.chilexpress.cl',
        phone: '+56 2 2345 6789',
        is_active: 1,
        supports_tracking: 1,
        supports_labels: 1
      },
      {
        name: 'Correos Chile',
        code: 'CORREOS',
        provider_type: 'external',
        description: 'Servicio postal nacional',
        website: 'https://www.correos.cl',
        phone: '+56 2 2345 6789',
        is_active: 1,
        supports_tracking: 1,
        supports_labels: 0
      },
      {
        name: 'Bluexpress',
        code: 'BLUEXPRESS',
        provider_type: 'external',
        description: 'Servicio de envío e-commerce',
        website: 'https://www.bluexpress.cl',
        phone: '+56 2 2345 6789',
        is_active: 1,
        supports_tracking: 1,
        supports_labels: 1
      },
      {
        name: 'Delivery Propio',
        code: 'INTERNAL',
        provider_type: 'internal',
        description: 'Delivery interno',
        website: null,
        phone: '+56 9 1234 5678',
        is_active: 1,
        supports_tracking: 1,
        supports_labels: 0
      }
    ];

    const providerIds = [];
    for (const provider of providers) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO shipping_providers 
           (name, code, provider_type, description, website, phone, is_active, supports_tracking, supports_labels, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            provider.name,
            provider.code,
            provider.provider_type,
            provider.description,
            provider.website,
            provider.phone,
            provider.is_active,
            provider.supports_tracking,
            provider.supports_labels,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          providerIds.push(result.lastID);
        } else {
          // Si ya existe, obtener el ID
          const existing = await dbHelper.get('SELECT id FROM shipping_providers WHERE code = ?', [provider.code]);
          if (existing) providerIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando proveedor ${provider.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${providerIds.length} proveedores creados\n`);

    // ============================================
    // 2. CREAR ZONAS DE ENVÍO INTERNAS
    // ============================================
    console.log('📍 Creando zonas de envío internas...');
    
    const zones = [
      {
        zone_name: 'Santiago Centro',
        description: 'Zona centro de Santiago',
        coverage_data: JSON.stringify({ regions: ['Metropolitana'], communes: ['Santiago', 'Providencia', 'Las Condes'] }),
        max_distance_km: 10,
        delivery_fee: 3000,
        estimated_days_min: 1,
        estimated_days_max: 2,
        is_active: 1
      },
      {
        zone_name: 'Gran Santiago',
        description: 'Gran área metropolitana',
        coverage_data: JSON.stringify({ regions: ['Metropolitana'], communes: ['Maipú', 'Puente Alto', 'San Bernardo'] }),
        max_distance_km: 30,
        delivery_fee: 5000,
        estimated_days_min: 2,
        estimated_days_max: 3,
        is_active: 1
      }
    ];

    for (const zone of zones) {
      try {
        await dbHelper.run(
          `INSERT OR IGNORE INTO internal_delivery_zones 
           (zone_name, description, coverage_data, max_distance_km, delivery_fee, estimated_days_min, estimated_days_max, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            zone.zone_name,
            zone.description,
            zone.coverage_data,
            zone.max_distance_km,
            zone.delivery_fee,
            zone.estimated_days_min,
            zone.estimated_days_max,
            zone.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Error creando zona ${zone.zone_name}:`, error.message);
      }
    }
    console.log(`  ✅ ${zones.length} zonas creadas\n`);

    // ============================================
    // 3. CREAR MATERIALES DE EMPAQUE
    // ============================================
    console.log('📦 Creando materiales de empaque...');
    
    const materials = [
      { code: 'BOLSA-01', name: 'Bolsa Segura 5g', type: 'bag', stock: 500, min_stock: 50, cost: 500 },
      { code: 'BOLSA-02', name: 'Bolsa Segura 10g', type: 'bag', stock: 300, min_stock: 30, cost: 800 },
      { code: 'CAJA-01', name: 'Caja Segura Pequeña', type: 'box', stock: 200, min_stock: 20, cost: 1500 },
      { code: 'CAJA-02', name: 'Caja Segura Mediana', type: 'box', stock: 150, min_stock: 15, cost: 2000 },
      { code: 'SELLO-01', name: 'Sello de Seguridad', type: 'seal', stock: 1000, min_stock: 100, cost: 100 }
    ];

    for (const material of materials) {
      try {
        await dbHelper.run(
          `INSERT OR IGNORE INTO packing_materials 
           (material_code, material_name, material_type, stock_quantity, min_stock_level, cost_per_unit, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            material.code,
            material.name,
            material.type,
            material.stock,
            material.min_stock,
            material.cost,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Error creando material ${material.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${materials.length} materiales creados\n`);

    // ============================================
    // 4. CREAR CENTROS DE DESPACHO
    // ============================================
    console.log('🏢 Creando centros de despacho...');
    
    const dispatchCenters = [
      {
        code: 'BODEGA-01',
        name: 'Bodega Principal Santiago',
        address: 'Av. Libertador Bernardo O\'Higgins 1234',
        commune: 'Santiago',
        city: 'Santiago',
        region: 'Metropolitana',
        phone: '+56 2 2345 6789',
        email: 'bodega1@apexremedy.cl',
        manager_name: 'Juan Pérez',
        operating_hours: 'Lun-Vie 8:00-18:00',
        is_active: 1
      },
      {
        code: 'BODEGA-02',
        name: 'Centro de Distribución Valparaíso',
        address: 'Av. Brasil 2000',
        commune: 'Valparaíso',
        city: 'Valparaíso',
        region: 'Valparaíso',
        phone: '+56 32 2345 6789',
        email: 'bodega2@apexremedy.cl',
        manager_name: 'María González',
        operating_hours: 'Lun-Vie 8:00-18:00',
        is_active: 1
      },
      {
        code: 'BODEGA-03',
        name: 'Almacén Concepción',
        address: 'Av. O\'Higgins 1500',
        commune: 'Concepción',
        city: 'Concepción',
        region: 'Biobío',
        phone: '+56 41 2345 6789',
        email: 'bodega3@apexremedy.cl',
        manager_name: 'Carlos Silva',
        operating_hours: 'Lun-Vie 8:00-18:00',
        is_active: 1
      }
    ];

    const dispatchCenterIds = [];
    for (const center of dispatchCenters) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO dispatch_centers 
           (code, name, address, commune, city, region, phone, email, manager_name, operating_hours, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            center.code,
            center.name,
            center.address,
            center.commune,
            center.city,
            center.region,
            center.phone,
            center.email,
            center.manager_name,
            center.operating_hours,
            center.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          dispatchCenterIds.push(result.lastID);
        } else {
          const existing = await dbHelper.get('SELECT id FROM dispatch_centers WHERE code = ?', [center.code]);
          if (existing) dispatchCenterIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando centro ${center.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${dispatchCenterIds.length} centros de despacho creados\n`);

    // ============================================
    // 5. CREAR CONDUCTORES Y FLOTA
    // ============================================
    console.log('🚗 Creando conductores y flota...');
    
    const fleetDrivers = [
      {
        name: 'Pedro Ramírez',
        phone: '+56 9 1234 5678',
        email: 'pedro.ramirez@apexremedy.cl',
        license_number: '12.345.678-9',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'ABCD12',
        vehicle_capacity_kg: 50.0,
        is_active: 1
      },
      {
        name: 'Ana Martínez',
        phone: '+56 9 2345 6789',
        email: 'ana.martinez@apexremedy.cl',
        license_number: '13.456.789-0',
        vehicle_type: 'car',
        vehicle_plate: 'EFGH34',
        vehicle_capacity_kg: 200.0,
        is_active: 1
      },
      {
        name: 'Luis Torres',
        phone: '+56 9 3456 7890',
        email: 'luis.torres@apexremedy.cl',
        license_number: '14.567.890-1',
        vehicle_type: 'bicycle',
        vehicle_plate: 'IJKL56',
        vehicle_capacity_kg: 10.0,
        is_active: 1
      },
      {
        name: 'Carmen López',
        phone: '+56 9 4567 8901',
        email: 'carmen.lopez@apexremedy.cl',
        license_number: '15.678.901-2',
        vehicle_type: 'van',
        vehicle_plate: 'MNOP78',
        vehicle_capacity_kg: 500.0,
        is_active: 1
      },
      {
        name: 'Roberto Sánchez',
        phone: '+56 9 5678 9012',
        email: 'roberto.sanchez@apexremedy.cl',
        license_number: '16.789.012-3',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'QRST90',
        vehicle_capacity_kg: 50.0,
        is_active: 1
      }
    ];

    const driverIds = [];
    for (const driver of fleetDrivers) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO fleet_drivers 
           (name, phone, email, license_number, vehicle_type, vehicle_plate, vehicle_capacity_kg, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            driver.name,
            driver.phone,
            driver.email,
            driver.license_number,
            driver.vehicle_type,
            driver.vehicle_plate,
            driver.vehicle_capacity_kg,
            driver.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          driverIds.push(result.lastID);
        } else {
          const existing = await dbHelper.get('SELECT id FROM fleet_drivers WHERE vehicle_plate = ?', [driver.vehicle_plate]);
          if (existing) driverIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando conductor ${driver.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${driverIds.length} conductores creados\n`);

    // ============================================
    // 6. CREAR PUNTOS DE RETIRO
    // ============================================
    console.log('📍 Creando puntos de retiro...');
    
    const pickupPoints = [
      {
        code: 'TIENDA-01',
        name: 'Tienda Principal Santiago',
        address: 'Av. Providencia 1234',
        commune: 'Providencia',
        city: 'Santiago',
        region: 'Metropolitana',
        phone: '+56 2 2345 6789',
        operating_hours: 'Lun-Dom 09:00-20:00',
        is_active: 1
      },
      {
        code: 'TIENDA-02',
        name: 'Sucursal Las Condes',
        address: 'Av. Apoquindo 5000',
        commune: 'Las Condes',
        city: 'Las Condes',
        region: 'Metropolitana',
        phone: '+56 2 3456 7890',
        operating_hours: 'Lun-Dom 10:00-21:00',
        is_active: 1
      },
      {
        code: 'TIENDA-03',
        name: 'Punto Retiro Providencia',
        address: 'Av. Nueva Providencia 2150',
        commune: 'Providencia',
        city: 'Providencia',
        region: 'Metropolitana',
        phone: '+56 2 4567 8901',
        operating_hours: 'Lun-Vie 09:30-19:30',
        is_active: 1
      },
      {
        code: 'TIENDA-04',
        name: 'Tienda Valparaíso',
        address: 'Av. Pedro Montt 2000',
        commune: 'Valparaíso',
        city: 'Valparaíso',
        region: 'Valparaíso',
        phone: '+56 32 2345 6789',
        operating_hours: 'Lun-Dom 10:00-20:00',
        is_active: 1
      }
    ];

    const pickupPointIds = [];
    for (const point of pickupPoints) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO pickup_points_dispensary 
           (code, name, address, commune, city, region, phone, operating_hours, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            point.code,
            point.name,
            point.address,
            point.commune,
            point.city,
            point.region,
            point.phone,
            point.operating_hours,
            point.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          pickupPointIds.push(result.lastID);
        } else {
          const existing = await dbHelper.get('SELECT id FROM pickup_points_dispensary WHERE code = ?', [point.code]);
          if (existing) pickupPointIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando punto de retiro ${point.name}:`, error.message);
      }
    }
    console.log(`  ✅ ${pickupPointIds.length} puntos de retiro creados\n`);

    // ============================================
    // 7. CREAR REGLAS DE ENVÍO GRATIS
    // ============================================
    console.log('🎁 Creando reglas de envío gratis...');
    
    const freeShippingRules = [
      {
        rule_name: 'Envío gratis sobre $50.000',
        min_order_amount: 50000,
        applies_to_regions: null,
        applies_to_zones: null,
        start_date: null,
        end_date: null,
        is_active: 1
      },
      {
        rule_name: 'Promoción Navidad 2024',
        min_order_amount: 0,
        applies_to_regions: 'Metropolitana,Valparaíso',
        applies_to_zones: null,
        start_date: '2024-12-01',
        end_date: '2024-12-31',
        is_active: 1
      },
      {
        rule_name: 'Envío gratis productos premium',
        min_order_amount: 0,
        applies_to_regions: null,
        applies_to_zones: '1,2',
        start_date: null,
        end_date: null,
        is_active: 1
      },
      {
        rule_name: 'Envío gratis clientes VIP',
        min_order_amount: 30000,
        applies_to_regions: null,
        applies_to_zones: null,
        start_date: null,
        end_date: null,
        is_active: 1
      }
    ];

    const freeShippingRuleIds = [];
    for (const rule of freeShippingRules) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO free_shipping_rules 
           (rule_name, min_order_amount, applies_to_regions, applies_to_zones, start_date, end_date, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rule.rule_name,
            rule.min_order_amount,
            rule.applies_to_regions,
            rule.applies_to_zones,
            rule.start_date,
            rule.end_date,
            rule.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          freeShippingRuleIds.push(result.lastID);
        } else {
          const existing = await dbHelper.get('SELECT id FROM free_shipping_rules WHERE rule_name = ?', [rule.rule_name]);
          if (existing) freeShippingRuleIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando regla ${rule.rule_name}:`, error.message);
      }
    }
    console.log(`  ✅ ${freeShippingRuleIds.length} reglas de envío gratis creadas\n`);

    // ============================================
    // 8. CREAR ZONAS RESTRINGIDAS
    // ============================================
    console.log('🚫 Creando zonas restringidas...');
    
    const restrictedZones = [
      {
        zone_name: 'Zona Restringida Isla de Pascua',
        restriction_type: 'complete',
        coverage_data: JSON.stringify({ regions: ['Isla de Pascua'] }),
        reason: 'Restricción por ubicación geográfica remota',
        is_active: 1
      },
      {
        zone_name: 'Zona Restringida Antártica',
        restriction_type: 'complete',
        coverage_data: JSON.stringify({ regions: ['Antártica Chilena'] }),
        reason: 'Restricción por ubicación geográfica extrema',
        is_active: 1
      },
      {
        zone_name: 'Comunas Restringidas - Región Metropolitana',
        restriction_type: 'partial',
        coverage_data: JSON.stringify({ communes: ['Lo Barnechea', 'Vitacura'] }),
        reason: 'Restricción por políticas de zonificación local',
        is_active: 1
      },
      {
        zone_name: 'Códigos Postales Restringidos',
        restriction_type: 'partial',
        coverage_data: JSON.stringify({ postal_codes: ['8320000', '8320001'] }),
        reason: 'Restricción por código postal específico',
        is_active: 1
      }
    ];

    const restrictedZoneIds = [];
    for (const zone of restrictedZones) {
      try {
        const result = await dbHelper.run(
          `INSERT OR IGNORE INTO restricted_zones 
           (zone_name, restriction_type, coverage_data, reason, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            zone.zone_name,
            zone.restriction_type,
            zone.coverage_data,
            zone.reason,
            zone.is_active,
            formatDate(new Date()),
            formatDate(new Date())
          ]
        );
        if (result.lastID) {
          restrictedZoneIds.push(result.lastID);
        } else {
          const existing = await dbHelper.get('SELECT id FROM restricted_zones WHERE zone_name = ?', [zone.zone_name]);
          if (existing) restrictedZoneIds.push(existing.id);
        }
      } catch (error) {
        console.warn(`⚠️ Error creando zona restringida ${zone.zone_name}:`, error.message);
      }
    }
    console.log(`  ✅ ${restrictedZoneIds.length} zonas restringidas creadas\n`);

    // ============================================
    // 9. CREAR ENVÍOS RELACIONADOS CON PEDIDOS
    // ============================================
    console.log('📦 Creando envíos relacionados con pedidos...');
    
    const statuses = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'];
    let inserted = 0;
    let skipped = 0;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);
    const endDate = new Date();

    for (let i = 0; i < Math.min(orders.length, 30); i++) {
      const order = orders[i];
      const provider = providerIds.length > 0 ? randomChoice(providerIds) : null;
      const status = randomChoice(statuses);
      const createdAt = randomDate(startDate, endDate);

      // Generar tracking number
      const trackingNumber = `${order.order_number}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Fechas según estado
      let shippedAt = null;
      let deliveredAt = null;
      let estimatedDelivery = null;

      if (['shipped', 'in_transit', 'delivered'].includes(status)) {
        shippedAt = formatDate(new Date(createdAt.getTime() + randomBetween(1, 3) * 86400000));
      }
      if (status === 'delivered') {
        deliveredAt = formatDate(new Date(createdAt.getTime() + randomBetween(3, 7) * 86400000));
      }
      if (['shipped', 'in_transit'].includes(status)) {
        estimatedDelivery = formatDate(new Date(createdAt.getTime() + randomBetween(5, 10) * 86400000));
      }

      try {
        const result = await dbHelper.run(
          `INSERT INTO shipments 
           (order_id, provider_id, tracking_number, carrier, service_code, weight, status, shipping_cost, 
            shipped_at, estimated_delivery, delivered_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            order.id,
            provider,
            trackingNumber,
            provider ? 'Starken' : 'Delivery Propio',
            'STANDARD',
            randomBetween(100, 2000) / 100, // peso en kg
            status,
            randomBetween(3000, 8000), // costo
            shippedAt,
            estimatedDelivery,
            deliveredAt,
            formatDate(createdAt),
            formatDate(createdAt)
          ]
        );

        const shipmentId = result.lastID;

        // Crear items del envío
        const orderItems = await dbHelper.all('SELECT id, product_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
        for (const item of orderItems) {
          try {
            await dbHelper.run(
              `INSERT INTO shipment_items 
               (shipment_id, order_item_id, product_id, quantity, weight_kg, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                shipmentId,
                item.id,
                item.product_id,
                item.quantity,
                randomBetween(50, 200) / 100,
                formatDate(createdAt)
              ]
            );
          } catch (error) {
            console.warn(`⚠️ Error creando item de envío:`, error.message);
          }
        }

        // Crear eventos de tracking
        const eventStatuses = ['pending', 'processing', 'shipped'];
        if (status === 'in_transit') eventStatuses.push('in_transit');
        if (status === 'delivered') {
          eventStatuses.push('in_transit', 'out_for_delivery', 'delivered');
        }

        for (let j = 0; j < eventStatuses.length; j++) {
          const eventStatus = eventStatuses[j];
          const eventDate = new Date(createdAt.getTime() + j * 86400000);
          
          try {
            await dbHelper.run(
              `INSERT INTO shipment_events 
               (shipment_id, status, location, description, event_at, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                shipmentId,
                eventStatus,
                eventStatus === 'delivered' ? 'Destino' : 'Centro de distribución',
                `Estado: ${eventStatus}`,
                formatDate(eventDate),
                formatDate(eventDate)
              ]
            );
          } catch (error) {
            console.warn(`⚠️ Error creando evento:`, error.message);
          }
        }

        inserted++;
        if (inserted % 10 === 0) {
          process.stdout.write(`   Progreso: ${inserted} envíos creados...\r`);
        }
      } catch (error) {
        skipped++;
        console.warn(`❌ Error insertando envío ${i + 1}:`, error.message);
      }
    }

    console.log(`\n✅ Seed de envíos completado\n`);
    console.log(`📊 Resumen:`);
    console.log(`   - Proveedores: ${providerIds.length}`);
    console.log(`   - Zonas de envío: ${zones.length}`);
    console.log(`   - Materiales: ${materials.length}`);
    console.log(`   - Centros de despacho: ${dispatchCenterIds.length}`);
    console.log(`   - Conductores: ${driverIds.length}`);
    console.log(`   - Puntos de retiro: ${pickupPointIds.length}`);
    console.log(`   - Reglas envío gratis: ${freeShippingRuleIds.length}`);
    console.log(`   - Zonas restringidas: ${restrictedZoneIds.length}`);
    console.log(`   - Envíos insertados: ${inserted}`);
    console.log(`   - Envíos omitidos: ${skipped}\n`);

  } catch (error) {
    console.error('❌ Error en seed de envíos:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Ejecutar
if (require.main === module) {
  seedEnvios()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedEnvios };
