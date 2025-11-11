✅ Prompt Parte 5: Frontend (UX, rutas, estados, carrito, checkout, vistas protegidas)
Actúa como frontend senior. Construye el frontend completo de un e-commerce de dispensario usando:
- Vue 3 (Composition API) + Vite
- Pinia (estado global)
- Vue Router (rutas públicas, autenticadas y admin)
- TailwindCSS (estilos)
- Axios (API client con interceptores)
- Iconos (Font Awesome o Lucide)
- Testing (Vitest + Vue Test Utils)

## 0) Principios
- SPA responsiva (mobile-first), accesible (WCAG AA), rápida (lazy loading, code-splitting).
- UI limpia: cards, grids, skeleton loaders, toasts de feedback, validación de formularios.
- I18n (es/en) con mensajes clave listos.
- SEO básico: meta tags por ruta, OpenGraph en Home y Producto.

## 1) Estructura de carpetas
src/
  api/            # axios instances, services (auth, products, orders, payments, medicinal)
  assets/
  components/
    ui/           # Button, Input, Select, Modal, Drawer, Toast, Badge, Skeleton, EmptyState
    product/      # ProductCard, ProductGallery, VariantSelector, Price, StockBadge
    cart/         # CartMini, CartDrawer, CartLine
  layouts/        # PublicLayout, AccountLayout, AdminLayout
  pages/
    home/         # HomePage.vue
    catalog/      # CatalogPage.vue, ProductDetailPage.vue
    auth/         # Login.vue, Register.vue, Forgot.vue, Reset.vue
    account/      # Orders.vue, OrderDetail.vue, Profile.vue, Addresses.vue, MedicinalDocs.vue
    checkout/     # CheckoutAddress.vue, CheckoutShipping.vue, CheckoutPayment.vue, CheckoutReview.vue, CheckoutSuccess.vue
    admin/        # Dashboard.vue, Products.vue, ProductForm.vue, Orders.vue, Users.vue, MedicinalReview.vue, Coupons.vue
  router/         # index.ts (guards), routes.ts
  store/          # auth.store.ts, cart.store.ts, catalog.store.ts, checkout.store.ts, admin.store.ts, ui.store.ts
  utils/          # validators (RUT), currency, formatters
  styles/         # tailwind.css, globals.css
  main.ts, App.vue
  env.d.ts

## 2) Router + Guards
- Rutas públicas: home, catálogo, producto, login, registro.
- Rutas autenticadas (role: customer): perfil, direcciones, órdenes, documentos medicinales, checkout.
- Rutas admin (role: admin): dashboard, productos, órdenes, usuarios, validación medicinal, cupones.
- Guards:
  - `requireAuth`: redirige a `/login?next=/ruta`.
  - `requireAdmin`: verifica `auth.user.role === 'admin'`.
  - `medicinalGate`: oculta/deniega acceso a productos medicinales a usuarios no validados (ver §8).
- Lazy load: `() => import('...')` por página.
- Scroll behavior: to top por defecto, conservar al volver.

## 3) Estado (Pinia)
### auth.store.ts
state: { user, accessToken, refreshToken, expiresAt, isAuthenticated }
actions:
  - login(email, password) → guarda tokens, user
  - refresh() automático con interceptor
  - logout() → limpia estado
  - fetchMe() → /api/me
getters:
  - isAdmin, isMedicinalValidated

### cart.store.ts
state: { lines: [{productId, variantId, name, priceCents, qty, imageUrl}], subtotalCents, coupon }
actions:
  - addLine(product, variant, qty=1) (merge por variantId)
  - removeLine(variantId)
  - setQty(variantId, qty)
  - clear()
  - hydrateFromStorage(), persistToStorage() (localStorage)
getters:
  - totalItems, totalCents

### catalog.store.ts
state: { categories, products, filters, loading }
actions: fetchCategories(), fetchProducts(params), fetchProductById(id)
getters: filteredProducts

### checkout.store.ts
state: { address, shippingMethod, shippingPriceCents, paymentProvider, orderPreview, orderId }
actions:
  - preview(cart, address, shippingMethod, coupon?) → /api/checkout/preview
  - confirm() → /api/checkout/confirm (crea order pending)
  - startPayment(provider) → /api/payments/start
  - completePayment(token/params) → /api/payments/confirm
  - reset()

### admin.store.ts
productos CRUD, órdenes, usuarios, documentos medicinales, cupones.

## 4) API Client (Axios)
- `api/http.ts`: instancia base, `baseURL` por ENV, `withCredentials=false`.
- Interceptores:
  - request: añade `Authorization: Bearer ${accessToken}` si existe.
  - response: si 401 y hay refreshToken → intenta refresh → reintenta una vez; si falla → logout.
- `api/services/*.ts`:
  - auth: login, register, me, refresh
  - products: list, get, create, update, remove, variants
  - orders: list, get, create/confirm, cancel
  - payments: start, confirm
  - addresses: CRUD
  - medicinal: upload, list, admin review
  - coupons: admin CRUD

## 5) Componentes clave
- `ProductCard.vue`: imagen portada (con placeholder), nombre, categoría, precio, botón “Agregar”.
- `VariantSelector.vue`: para 1g/5g/10g; deshabilita sin stock.
- `CartDrawer.vue`: slide-over con líneas, total, CTA “Ir a pagar”.
- `Checkout` en 4 pasos (wizard): Address → Shipping → Payment → Review.
- `MedicinalDocs.vue`: uploader con drag & drop (PDF/JPG/PNG, ≤10MB), listado de estados (pending/approved/rejected).
- `Admin`:
  - `Products.vue` (tabla, búsqueda, filtros, paginación, bulk import CSV)
  - `ProductForm.vue` (subida de imágenes, manejo de variantes)
  - `Orders.vue` (tabla, estado, filtros por fecha, export CSV)
  - `MedicinalReview.vue` (revisar docs, aprobar/rechazar, comentarios)

## 6) UI/UX
- Skeleton loaders en cards/tabla mientras carga.
- Toasts estándar (success, error, info).
- Formularios con validaciones en tiempo real (zod/yup opcional).
- Accesibilidad: roles ARIA, focus ring, skip-to-content.
- Modo oscuro (opcional): `prefers-color-scheme`.

## 7) Catálogo, búsqueda y filtros
- Búsqueda por `q`, filtros por categoría, rango de precio, orden por precio/fecha.
- Paginación SSR-like (desde API) y scroll a top.
- Mostrar badge “Medicinal” en cards donde aplique; ocultar si usuario no validado (ver §8).

## 8) Visibilidad de productos medicinales
- Si `category.isMedicinal = true`, entonces:
  - En catálogo: si user no autenticado o no validado → **no mostrar precio** ni botón comprar; botón “Ver requisitos” (link a MedicinalDocs).
  - En detalle: mostrar card informativa “Requiere validación medicinal”.
  - Guard adicional `medicinalGate` para rutas de compra.

## 9) Checkout (flujo completo)
- Address: formulario con validaciones (nombre, RUT opcional, comuna, región, dirección, notas).
- Shipping: radio options (retiro tienda, courier, tarifa plana).
- Payment:
  - Providers: `webpay`, `flow`, `mp`, `test`.
  - `startPayment` → si `redirectUrl` → redirige; si payload → mostrar botón “Pagar”.
- Review: resumen de líneas, envío, cupón aplicado; confirmar.
- Success: muestra número de orden y estado de pago.
- Edge cases:
  - Stock insuficiente al confirmar → mostrar error y refrescar carrito.
  - Cupón inválido/expirado → feedback claro.
  - Doble envío de form → prevenir con `isSubmitting`.

## 10) Performance y calidad
- Code-splitting por rutas.
- Imágenes con `loading="lazy"` y `srcset`.
- Prettier + ESLint (config recomendada Vue 3).
- Tests:
  - Unit: `ProductCard`, `VariantSelector`, `CartStore`, `AuthStore`.
  - E2E (opcional): Playwright/Cypress para flujo “agregar al carrito → checkout”.

## 11) Entregables del LLM
- Proyecto Vite + Vue 3 funcional, con:
  - Router configurado + guards.
  - Pinia stores implementados y testeados.
  - Páginas y componentes listados arriba.
  - API client con interceptores y services.
  - Tailwind configurado (modo JIT).
  - `.env.example` (VITE_API_BASE_URL).
  - Scripts: `dev`, `build`, `preview`, `test`.
- Al terminar, entregar:
  - **Árbol de archivos**,
  - Códigos fuente principales,
  - Instrucciones de ejecución (`README.md`),
  - Casos de prueba mínimos.

## 12) Snippets guía (obligatorios)

### router/index.ts
- Define rutas y aplica guards `requireAuth`, `requireAdmin`, `medicinalGate`.

### store/cart.store.ts
- Métodos `addLine`, `setQty`, `removeLine`, `persistToStorage`.

### components/product/ProductCard.vue
- Usa `getPrimaryImage(product)` con fallback placeholder y `object-cover`.

### pages/checkout/*
- 4 pasos con barra de progreso y validaciones.

### pages/account/MedicinalDocs.vue
- `input type="file"` con drag & drop, preview, subida a `/api/medicinal/me/docs`.

Asegúrate de que el código compile y los imports sean correctos.