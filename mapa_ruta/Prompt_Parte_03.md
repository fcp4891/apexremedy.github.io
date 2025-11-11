✅ Prompt Parte 3: Base de Datos (Modelo Relacional + ORM + Seeds)
Actúa como arquitecto de datos senior. Construye el **modelo de base de datos** para un e-commerce de dispensario con ventas abiertas (growshop) y ventas restringidas (medicinales). Entrega:

1) Diagrama lógico (tablas + relaciones + claves).
2) DDL SQL estándar (PostgreSQL compatible) con constraints, índices y comentarios.
3) Alternativa ORM en **SQLModel** (FastAPI) con relaciones y tipos estrictos.
4) Datos seed mínimos coherentes para pruebas (productos, usuarios, variantes).
5) Vistas/materializadas útiles para analytics.
6) Estrategia de migraciones.

## 1) Requisitos de modelo (obligatorios)

- Usuarios y roles:
  - `users`: id, name, email (único), rut (único, validable), password_hash, role ∈ {customer, admin}, is_active.
  - `user_profiles`: user_id (PK/FK 1:1), phone, birthdate, address, comuna, region.
  - `auth_tokens` (opcional): id, user_id, jti, created_at, expires_at.

- Productos:
  - `categories`: id, slug único, name, is_medicinal (bool).
  - `products`: id, category_id (FK), slug único, name, description, image_url, is_active, created_at.
  - `product_variants`: id, product_id (FK), sku (único), option_label (ej: “1g”, “5g”, “M”, “L”), price_cents (int), stock (int), is_active.
  - Regla: stock decrece por **variant**, no por product.

- Medicinal:
  - `medicinal_documents`: id, user_id (FK), file_url, doc_type ∈ {receta, certificado}, status ∈ {pending, approved, rejected}, reviewed_by (FK admin), notes, created_at, updated_at.
  - Los productos medicinales solo pueden ser comprados si `users.validated_medicinal = true` (o si existe al menos un `medicinal_documents.status = approved`).

- Pedidos:
  - `orders`: id, user_id (FK), total_cents, status ∈ {pending, paid, failed, shipped, delivered, cancelled}, payment_provider ∈ {webpay, flow, mp, test}, payment_ref, shipping_method ∈ {retiro_tienda, chilexpress, starken, manual}, shipping_price_cents, shipping_address_id (FK), created_at, updated_at.
  - `order_items`: id, order_id (FK), product_id (FK), variant_id (FK), quantity, unit_price_cents, line_total_cents.
  - Integridad: `order_items.line_total_cents = quantity * unit_price_cents`.

- Envíos / direcciones:
  - `addresses`: id, user_id (FK), name, address_line, comuna, region, notes, is_default.

- Marketing (opcional pero recomendado):
  - `coupons`: id, code único, type ∈ {percent, fixed}, value_cents o percent_value, min_order_cents, starts_at, ends_at, usage_limit, used_count.
  - `product_reviews`: id, product_id (FK), user_id (FK), rating (1-5), title, body, is_visible, created_at.

- Auditoría:
  - `system_logs`: id, actor_user_id (FK), action (string), entity (string), entity_id, meta JSON, created_at.

## 2) DDL SQL (PostgreSQL) — incluye constraints + índices

- Define todas las tablas arriba con:
  - PKs `bigserial`.
  - FKs con `ON UPDATE CASCADE ON DELETE RESTRICT` (salvo `order_items` que puede ser `ON DELETE CASCADE`).
  - Únicos: email en users, rut en users, sku en product_variants, slug en categories/products, code en coupons.
  - Índices: 
    - `idx_products_category_id`, `idx_variants_product_id`, `idx_order_items_order_id`, 
    - `idx_orders_user_id_status_created_at`, 
    - `idx_medicinal_documents_user_id_status_created_at`.
  - CHECKs:
    - `rating BETWEEN 1 AND 5`,
    - `price_cents >= 0`, `stock >= 0`, `quantity > 0`,
    - status enums válidos con `CHECK (status IN (...))`.
  - Comentarios (`COMMENT ON`) en tablas/columnas clave.

## 3) Alternativa ORM (SQLModel)

- Implementa los modelos equivalentes:
  - `User`, `UserProfile`, `Category`, `Product`, `ProductVariant`, `MedicinalDocument`, `Order`, `OrderItem`, `Address`, `Coupon`, `ProductReview`, `SystemLog`.
- Incluye:
  - Tipos estrictos (`EmailStr`, `conint(ge=0)`, `Annotated[str, ...]`).
  - Relaciones bidireccionales (`Relationship(back_populates=...)`).
  - Enums como `Literal[...]` o `Enum`.
  - `table=True`, `__tablename__` explícitos.
  - Índices con `sqlmodel.Index(...)` donde aplique.

## 4) Seeds de prueba (coherentes)

- Crea:
  - 2 categorías: “semillas” (is_medicinal=false), “medicinal” (is_medicinal=true).
  - 4 productos: 2 por categoría. Incluye `product_variants` (ej: 1g, 5g, 10g) con precios distintos y stock inicial.
  - 2 usuarios: uno admin y uno customer. El customer con `validated_medicinal=false`.
  - 1 documento medicinal para el customer en `pending`.
  - 1 orden de ejemplo con 2 items (una variante de semilla y una de accesorios).
- Deja **scripts SQL o Python** para insertar estos seeds de forma idempotente.

## 5) Vistas para analytics

- `view_sales_by_day`: (fecha, orders_count, total_sales_cents).
- `view_top_products`: (product_id, product_name, units_sold, revenue_cents).
- `view_stock_low`: (variant_id, product, option_label, stock) donde `stock < 5`.
- `view_medicinal_status`: (user_id, email, last_doc_status, last_doc_date).

## 6) Migraciones

- Si usas **Alembic (SQLAlchemy/SQLModel)**:
  - Configura `alembic.ini` y `env.py`.
  - Crea plantilla de `revision --autogenerate` para DDL inicial.
- Si usas **Prisma/MikroORM/Knex** (Node), define equivalentes.
- Entrega:
  - `001_init.sql` (DDL),
  - `002_seed.sql` (seed),
  - `003_indexes.sql` (índices adicionales).

## 7) Reglas de integridad de negocio (triggers o lógicas)

- Al **pagar** una orden:
  - Disminuir `product_variants.stock` según `order_items.quantity`.
  - Rechazar pago si `stock` insuficiente.
- Si `category.is_medicinal = true`:
  - Validar que el comprador tenga `validated_medicinal = true` **o** un `medicinal_documents.status = 'approved'` vigente (regla a nivel de servicio/API).
- Mantener `orders.total_cents = SUM(line_total_cents)` consistente (trigger o cálculo al confirmar).
- `coupons.used_count` incrementar solo cuando `orders.status` pasa a `paid`.

## 8) Entregables finales

- DDL completo (SQL) con comentarios e índices.
- Código ORM (SQLModel) listo para `alembic upgrade head`.
- Script de seeds (SQL/Python).
- Vistas para analytics.
- Breve README: cómo crear DB, correr migraciones y cargar seeds.