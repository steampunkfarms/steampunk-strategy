# Working Spec: 20260316-cleanpunk-medusa-migration

**Date:** 2026-03-16
**Repo:** cleanpunk-shop
**Tier:** 3 (Strategic — Platform Migration)
**Status:** In Progress — Phase 1

## Problem

Medusa Cloud is unreliable: env vars vanish, Dependabot breaks lockfiles, the backend crash-loops on missing Stripe keys, and the shop has been unable to process payments. The Cleanpunk soap shop has had zero sales during a clearance event because the commerce backend is down.

## Decision

Replace the Medusa v2 backend entirely with:
- **Neon PostgreSQL + Prisma** (same stack as all other Steampunk projects)
- **Stripe Checkout Sessions** (hosted payment page, no custom card forms)
- **Next.js API routes** (replace Medusa REST API)

## Phase 1 Scope — Get The Store Selling

### 1. Prisma Schema

New models in `prisma/schema.prisma` (storefront project, new Neon DB):

```prisma
model Product {
  id          String   @id @default(cuid())
  handle      String   @unique
  title       String
  subtitle    String?
  description String?
  thumbnail   String?
  status      String   @default("published") // published, draft, archived
  metadata    Json?    // ambassador, vibe_tags, scent_profile, exfoliation_level, etc.
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  variants    ProductVariant[]
  images      ProductImage[]
  tags        ProductTag[]
  @@map("products")
}

model ProductVariant {
  id                String   @id @default(cuid())
  productId         String   @map("product_id")
  title             String   // e.g., "6oz Bar"
  sku               String?  @unique
  barcode           String?
  priceAmount       Int      // cents (e.g., 1595 = $15.95)
  compareAtPrice    Int?     @map("compare_at_price") // for sale pricing
  inventoryQuantity Int      @default(0) @map("inventory_quantity")
  weight            Float?
  metadata          Json?
  product           Product  @relation(fields: [productId], references: [id])
  cartItems         CartItem[]
  orderItems        OrderItem[]
  @@map("product_variants")
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String  @map("product_id")
  url       String
  altText   String? @map("alt_text")
  position  Int     @default(0)
  product   Product @relation(fields: [productId], references: [id])
  @@map("product_images")
}

model ProductTag {
  id        String  @id @default(cuid())
  productId String  @map("product_id")
  value     String
  product   Product @relation(fields: [productId], references: [id])
  @@index([value])
  @@map("product_tags")
}

model Cart {
  id              String     @id @default(cuid())
  customerId      String?    @map("customer_id")
  email           String?
  metadata        Json?      // partner_channel, donation_per_item, etc.
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")
  items           CartItem[]
  @@map("carts")
}

model CartItem {
  id        String         @id @default(cuid())
  cartId    String         @map("cart_id")
  variantId String         @map("variant_id")
  quantity  Int            @default(1)
  metadata  Json?          // wrapping, custom_notes
  cart      Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variant   ProductVariant @relation(fields: [variantId], references: [id])
  @@unique([cartId, variantId])
  @@map("cart_items")
}

model Order {
  id                String      @id @default(cuid())
  orderNumber       String      @unique @map("order_number") // CP-0001
  customerId        String?     @map("customer_id")
  email             String
  status            String      @default("pending") // pending, confirmed, shipped, delivered, cancelled
  subtotal          Int         // cents
  shippingTotal     Int         @map("shipping_total")
  taxTotal          Int         @default(0) @map("tax_total")
  donationTotal     Int         @default(0) @map("donation_total")
  total             Int         // cents
  stripePaymentId   String?     @unique @map("stripe_payment_id")
  stripeSessionId   String?     @unique @map("stripe_session_id")
  shippingName      String?     @map("shipping_name")
  shippingAddress1  String?     @map("shipping_address_1")
  shippingAddress2  String?     @map("shipping_address_2")
  shippingCity      String?     @map("shipping_city")
  shippingState     String?     @map("shipping_state")
  shippingZip       String?     @map("shipping_zip")
  shippingCountry   String      @default("US") @map("shipping_country")
  trackingNumber    String?     @map("tracking_number")
  trackingCarrier   String?     @map("tracking_carrier")
  metadata          Json?       // partner_channel, promo_code, etc.
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")
  items             OrderItem[]
  @@map("orders")
}

model OrderItem {
  id            String         @id @default(cuid())
  orderId       String         @map("order_id")
  variantId     String         @map("variant_id")
  productTitle  String         @map("product_title")
  variantTitle  String         @map("variant_title")
  quantity      Int
  unitPrice     Int            @map("unit_price") // cents
  metadata      Json?
  order         Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  variant       ProductVariant @relation(fields: [variantId], references: [id])
  @@map("order_items")
}

model PromoCode {
  id            String    @id @default(cuid())
  code          String    @unique
  discountType  String    @map("discount_type") // percentage, fixed
  discountValue Int       @map("discount_value") // percentage (10 = 10%) or cents (500 = $5)
  minPurchase   Int?      @map("min_purchase") // cents
  maxUses       Int?      @map("max_uses")
  usedCount     Int       @default(0) @map("used_count")
  startsAt      DateTime? @map("starts_at")
  expiresAt     DateTime? @map("expires_at")
  active        Boolean   @default(true)
  @@map("promo_codes")
}
```

### 2. Tiered Shipping (ported from Medusa module)

```typescript
// lib/shipping.ts
export function calculateShipping(itemCount: number): number {
  // Skip donation items (caller filters them)
  if (itemCount <= 0) return 0;
  const fullBoxes = Math.floor(itemCount / 20);
  const remainder = itemCount % 20;
  let cost = fullBoxes * 2495; // $24.95 per full box
  if (remainder >= 1 && remainder <= 3) cost += 695;
  else if (remainder >= 4 && remainder <= 6) cost += 995;
  else if (remainder >= 7 && remainder <= 9) cost += 1495;
  else if (remainder >= 10 && remainder <= 15) cost += 1995;
  else if (remainder >= 16) cost += 2495;
  return cost; // cents
}
```

### 3. Checkout Flow (Stripe Checkout Sessions)

Replace multi-step Medusa checkout with:

1. Customer clicks "Checkout" from cart page
2. `POST /api/checkout` — creates Stripe Checkout Session with:
   - Line items from cart (product names, prices, quantities)
   - Shipping options (calculated from tiered shipping)
   - Promo code support via Stripe Coupons
   - `success_url` → `/order/{session_id}/confirmed`
   - `cancel_url` → `/cart`
3. Redirect to Stripe's hosted checkout page
4. `POST /api/webhooks/stripe` — handles `checkout.session.completed`:
   - Creates Order + OrderItems from session
   - Decrements inventory
   - Sends confirmation email via SendGrid
   - Clears cart
5. `/order/{id}/confirmed` — shows order confirmation

### 4. API Routes to Create

| Route | Replaces | Purpose |
|-------|----------|---------|
| `GET /api/products` | Medusa `/store/products` | List/filter/search products |
| `GET /api/products/[handle]` | Medusa `/store/products` | Product detail |
| `POST /api/cart` | Medusa cart create | Create cart (set cookie) |
| `POST /api/cart/items` | Medusa line-item add | Add to cart |
| `PATCH /api/cart/items/[id]` | Medusa line-item update | Update quantity |
| `DELETE /api/cart/items/[id]` | Medusa line-item delete | Remove from cart |
| `GET /api/cart` | Medusa cart fetch | Get current cart |
| `POST /api/checkout` | Medusa payment session | Create Stripe Checkout Session |
| `POST /api/webhooks/stripe` | Medusa payment webhook | Handle checkout.session.completed |
| `GET /api/orders/[id]` | Medusa order fetch | Order confirmation page |

### 5. Files to Modify in Storefront

**Replace entirely:**
- `src/lib/config.ts` — remove Medusa SDK, add Prisma client
- `src/lib/data/products.ts` — Prisma queries
- `src/lib/data/cart.ts` — new cart API calls
- `src/lib/data/regions.ts` — remove (single-region USD)

**Modify (swap data source):**
- `src/app/[countryCode]/(main)/store/page.tsx` — use new product API
- `src/app/[countryCode]/(main)/products/[handle]/page.tsx` — use new product API
- `src/app/[countryCode]/(main)/cart/page.tsx` — use new cart API
- `src/app/[countryCode]/(checkout)/checkout/page.tsx` — redirect to Stripe Checkout
- Product listing components — adapt to new type shape
- Cart components — adapt to new cart shape

**Remove:**
- `src/lib/data/payment.ts` — Stripe Checkout handles this
- `src/lib/data/fulfillment.ts` — shipping calculated server-side
- `src/lib/data/regions.ts` — single region

### 6. Database & Deployment

- **New Neon project** or new database in existing Neon instance
- **Deploy:** Same Vercel project, just remove Medusa backend dependency
- **Env vars:** Replace `NEXT_PUBLIC_MEDUSA_BACKEND_URL` with `DATABASE_URL`
- **No more Medusa Cloud** — cancel after migration confirmed

### 7. Product Data Migration

Export products from Medusa Cloud Postgres (while it's still accessible):
- Query `product`, `product_variant`, `product_image` tables
- Transform to new Prisma schema shape
- Seed into new Neon DB

## Acceptance Criteria — Phase 1

- [ ] Prisma schema created and pushed to Neon
- [ ] Products migrated from Medusa
- [ ] Product listing page (`/store`) works with new data
- [ ] Product detail page works with variants and images
- [ ] Cart: add, update quantity, remove items
- [ ] Checkout redirects to Stripe Checkout Session
- [ ] Stripe webhook creates Order on payment success
- [ ] Order confirmation page shows order details
- [ ] Tiered shipping calculation matches Medusa module
- [ ] Promo codes work
- [ ] Inventory decremented on purchase
- [ ] SendGrid order confirmation email sends
- [ ] `npx tsc --noEmit` clean
- [ ] Deployed to Vercel, shop accepting orders

## Out of Scope (Phase 2+)

- Admin dashboard rewiring
- B2B accounts and portal
- Customer accounts and order history
- Product forge
- Partner storefronts
- Order transfer/gifting
