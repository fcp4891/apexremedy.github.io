✅ Prompt Parte 2: Módulos que el LLM debe construir

📌 En esta parte definimos los módulos que deben ser desarrollados — es el “mapa de construcción del e-commerce”

Debes construir las siguientes partes del sistema de forma modular y limpia:

1. FRONTEND (Tienda pública)
   - Catálogo de productos con categorías.
   - Filtro por tipo: semillas, accesorios, medicinales, ofertas.
   - Detalle de producto con imagen, stock, descripción, variantes (gramos, unidades, colores).
   - Carrito de compras persistente.
   - Checkout con dirección, tipo de envío y método de pago.
   - Inicio de sesión / registro de usuario.
   - Sección exclusiva para productos medicinales (solo clientes validados).
   - Perfil del usuario: datos personales, órdenes, descarga de boletas.

2. BACKEND (API REST)
   - CRUD de productos, categorías, usuarios, pedidos.
   - Autenticación con tokens JWT.
   - Endpoints para pagos: iniciar, validar, confirmar pago.
   - Subida de imágenes al servidor (o Cloudinary/AWS).
   - Validación de archivos PDF (recetas médicas, certificados).
   - Rutas protegidas para administrador (middleware role=admin).

3. BASE DE DATOS relacional
   - users (id, nombre, rut, correo, hash_password, rol, validado_medicamente)
   - products (id, nombre, descripción, categoría, stock, precio, imagen_url)
   - product_variants (producto, tipo, tamaño, stock, precio)
   - orders (id, user_id, total, estado, metodo_pago)
   - order_items (order_id, product_id, cantidad, precio_unitario)
   - medicinal_documents (user_id, archivo, estado, observaciones)

4. PANEL ADMINISTRATIVO
   - Dashboard: total ventas, pedidos pendientes, stock crítico.
   - CRUD productos con subida de imágenes.
   - Gestión de usuarios (bloquear, activar, hacer admin).
   - Validar / rechazar recetas médicas o certificados.
   - Ver todas las órdenes y cambiar su estado (pendiente, enviado, entregado).

5. PAGOS Y ENVÍOS
   - Integración con Webpay / Flow / MercadoPago.
   - Simulación de pago para entorno de desarrollo.
   - Cálculo de envío a regiones (Chilexpress, Starken o tarifas manuales).
   - Opción: retiro en tienda.

6. SEGURIDAD
   - Hash de contraseñas con bcrypt.
   - Validación de RUT chileno.
   - Tokens JWT con expiración.
   - Middleware para verificar rol admin/cliente.
   - Prevención de XSS, SQL Injection, CSRF.

Cuando respondas, construye cada módulo paso a paso y verifica dependencias.