✅ 1. Mantenedores necesarios para un Sistema de Envíos completo (CRUD + configuración)
✅ 📦 1.1. Proveedores de Envío (Carriers externos y Logística interna)
✅ Mantenedor	¿Qué almacena?	Ejemplos
✅ shipping_providers	Datos de empresas externas	Starken, Chilexpress, Correos Chile, Bluexpress
✅ provider_service_types	Tipos de servicio por proveedor	Starken: "Domicilio", "Sucursal"; Chilexpress: "Express", "Next Day"
✅ provider_zones	Cobertura por región, comuna o código postal	Región Metropolitana, Valparaíso, Magallanes
✅ provider_credentials	API Keys, tokens, URLs para integración	Token Chilexpress API, cuenta cliente Starken
✅ provider_pickup_points	Sucursales habilitadas para retiro	Sucursal Starken Maipú, Chilexpress Ahumada
✅ 🏢 1.2. Operativa del Dispensario (Logística propia)
✅ Mantenedor	Objetivo
✅ dispatch_centers / warehouses	Bodegas desde donde se despacha
✅ internal_delivery_zones	Cobertura de delivery propio (ej. comunas dentro de 5km)
✅ fleet_drivers	Conductores y vehículos para delivery local
✅ pickup_points_dispensary	Puntos de retiro en tienda o sucursales propias
✅ packing_materials	Gestión de stock de bolsas, cajas, sellos de seguridad
✅ delivery_time_slots	Horarios de entrega disponibles para agendar
✅ 💰 1.3. Tarifas y reglas de costos
✅ Mantenedor	Función
✅ shipping_zones	Zonas geográficas internas (RM, Norte, Patagonia, etc.)
✅ shipping_rates	Tarifas por proveedor, peso, zona y tipo de entrega
✅ free_shipping_rules	Monto mínimo o promociones con envío gratis
✅ restricted_zones	Comunas donde no se puede enviar por sustancias reguladas
✅ package_dimensions	Pesos y tamaños típicos (5g, 10g, 20g, medicinal)
✅ insurance_rules	Valor asegurado para productos de alto costo
✅ 🚚 1.4. Gestión operativa de envíos de pedidos
✅ Mantenedor	¿Qué registra?
✅ shipments	Envío creado, fecha, carrier, costo y tracking number
✅ shipment_items	Qué productos se enviaron y en qué cantidad
✅ shipment_events / tracking_events	Historial del tracking: "En tránsito", "En bodega", "Entregado"
✅ delivery_attempts	Intentos fallidos de entrega
✅ returns / shipment_returns	Devoluciones o paquetes rechazados
✅ lost_or_damaged_shipments	Casos de pérdida o productos dañados

✅ Puedo ayudarte con cualquiera de estos puntos:
✅ ✔️ revisa si ya existen las tablas o si debemos crear tablas faltantes para un SQL completas de estos mantenedores, genera un seed_envios.js para la data dummy, todos los registros deben estar correctamente relacionados con nuestra seccion de pedidos.
✅ ✔️ Generar la API REST (FastAPI / Node / Laravel) para este módulo
⏳ ✔️ Crear flujo de checkout con selección de método de envío (pendiente para siguiente fase)