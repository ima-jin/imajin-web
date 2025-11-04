import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Products table - Core product information
export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(), // Matches Stripe Product ID
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // "material", "connector", "control", "diffuser", "kit", "interface", "unit", "accessory"
    devStatus: integer("dev_status").notNull().default(0), // 0-5 (only show if status = 5)
    basePrice: integer("base_price").notNull(), // Price in cents
    isActive: boolean("is_active").default(true),
    requiresAssembly: boolean("requires_assembly").default(false),
    hasVariants: boolean("has_variants").default(false),

    // Inventory tracking (product level)
    maxQuantity: integer("max_quantity"), // NULL = unlimited inventory
    soldQuantity: integer("sold_quantity").default(0).notNull(), // Total units sold (all variants combined)
    availableQuantity: integer("available_quantity").generatedAlwaysAs(
      sql`CASE WHEN max_quantity IS NULL THEN NULL ELSE max_quantity - sold_quantity END`
    ),
    isAvailable: boolean("is_available").generatedAlwaysAs(
      sql`max_quantity IS NULL OR sold_quantity < max_quantity`
    ),

    isLive: boolean("is_live").default(false).notNull(),
    costCents: integer("cost_cents"),
    wholesalePriceCents: integer("wholesale_price_cents"),
    sellStatus: text("sell_status").default("internal").notNull(),
    sellStatusNote: text("sell_status_note"),
    lastSyncedAt: timestamp("last_synced_at"),
    media: jsonb("media"),

    // Stripe integration
    stripeProductId: text("stripe_product_id"), // For products WITH variants (parent product)
    stripePriceId: text("stripe_price_id"), // For products WITHOUT variants (single price)

    // Portfolio & Featured Product fields (Phase 2.4.7)
    showOnPortfolioPage: boolean("show_on_portfolio_page").default(false).notNull(),
    portfolioCopy: text("portfolio_copy"), // Nullable, markdown content, max 2000 chars (validated at app level)
    isFeatured: boolean("is_featured").default(false).notNull(),
    // Note: Hero image uses media JSONB with category="hero"

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    categoryIdx: index("idx_products_category").on(table.category),
    devStatusIdx: index("idx_products_dev_status").on(table.devStatus),
    activeIdx: index("idx_products_active").on(table.isActive),
    availableIdx: index("idx_products_available").on(table.isAvailable),
    liveIdx: index("idx_products_live").on(table.isLive),
    sellStatusIdx: index("idx_products_sell_status").on(table.sellStatus),
    portfolioIdx: index("idx_products_portfolio").on(table.showOnPortfolioPage),
    featuredIdx: index("idx_products_featured").on(table.isFeatured),
  })
);

// Variants table - Product variants (colors, options)
export const variants = pgTable(
  "variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    stripeProductId: text("stripe_product_id").notNull(), // Stripe Product ID (for variants without individual pricing)
    stripePriceId: text("stripe_price_id"), // Stripe Price ID (for variants with individual pricing)
    variantType: text("variant_type").notNull(), // "color", "voltage", "size", etc.
    variantValue: text("variant_value").notNull(), // "BLACK", "WHITE", "RED", "5v", "24v", etc.
    priceModifier: integer("price_modifier").default(0), // Price difference from base (in cents)
    isLimitedEdition: boolean("is_limited_edition").default(false),
    maxQuantity: integer("max_quantity"), // NULL = unlimited
    soldQuantity: integer("sold_quantity").default(0),

    // Generated columns - calculated automatically
    availableQuantity: integer("available_quantity").generatedAlwaysAs(
      sql`CASE WHEN max_quantity IS NULL THEN NULL ELSE max_quantity - sold_quantity END`
    ),
    isAvailable: boolean("is_available").generatedAlwaysAs(
      sql`(max_quantity IS NULL OR sold_quantity < max_quantity)`
    ),
    media: jsonb("media"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    productIdIdx: index("idx_variants_product_id").on(table.productId),
    availableIdx: index("idx_variants_available").on(table.isAvailable),
    stripeIdx: uniqueIndex("idx_variants_stripe").on(table.stripeProductId),
  })
);

// Product dependencies - Compatibility rules and suggestions
export const productDependencies = pgTable(
  "product_dependencies",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    dependsOnProductId: text("depends_on_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    dependencyType: text("dependency_type").notNull(), // "requires", "suggests", "incompatible", "voltage_match"
    message: text("message"),
    metadata: jsonb("metadata"),
  },
  (table) => ({
    productIdx: index("idx_dependencies_product").on(table.productId),
    typeIdx: index("idx_dependencies_type").on(table.dependencyType),
  })
);

// Product specs - Technical specifications
export const productSpecs = pgTable(
  "product_specs",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    specKey: text("spec_key").notNull(), // e.g., "voltage", "max_panels", "dimensions", "led_count"
    specValue: text("spec_value").notNull(), // e.g., "5v", "8-10", "240mm x 240mm", "64"
    specUnit: text("spec_unit"), // e.g., "v", "mm", "panels", null
    displayOrder: integer("display_order").default(0),
  },
  (table) => ({
    productIdx: index("idx_specs_product").on(table.productId),
    keyIdx: uniqueIndex("idx_specs_key").on(table.productId, table.specKey),
  })
);

// Orders table - Track orders for fulfillment and NFT assignment
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(), // Stripe Checkout Session ID
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    status: text("status").notNull().default("pending"), // "pending", "paid", "fulfilled", "shipped", "delivered", "cancelled"
    subtotal: integer("subtotal").notNull(), // Amount in cents (before tax/shipping)
    tax: integer("tax").default(0),
    shipping: integer("shipping").default(0),
    total: integer("total").notNull(), // Total amount charged
    currency: text("currency").default("usd"),

    // Shipping info
    shippingName: text("shipping_name"),
    shippingAddressLine1: text("shipping_address_line1"),
    shippingAddressLine2: text("shipping_address_line2"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingPostalCode: text("shipping_postal_code"),
    shippingCountry: text("shipping_country"),

    // Tracking
    trackingNumber: text("tracking_number"),
    shippedAt: timestamp("shipped_at"),

    // Metadata
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_orders_email").on(table.customerEmail),
    statusIdx: index("idx_orders_status").on(table.status),
    createdIdx: index("idx_orders_created").on(table.createdAt),
    paymentIntentIdx: uniqueIndex("idx_orders_payment_intent").on(table.stripePaymentIntentId),
  })
);

// Order items - Line items for each order
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: text("variant_id").references(() => variants.id, { onDelete: "set null" }),
    stripePriceId: text("stripe_price_id").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // Price per unit in cents
    totalPrice: integer("total_price").notNull(), // quantity * unitPrice

    // Snapshot product info (in case product changes later)
    productName: text("product_name").notNull(),
    variantName: text("variant_name"),

    metadata: jsonb("metadata"),
  },
  (table) => ({
    orderIdx: index("idx_order_items_order").on(table.orderId),
    productIdx: index("idx_order_items_product").on(table.productId),
    variantIdx: index("idx_order_items_variant").on(table.variantId),
  })
);

// NFT tokens - Track MJN NFT tokens for Founder Edition units
export const nftTokens = pgTable(
  "nft_tokens",
  {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: integer("order_item_id")
      .notNull()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    variantId: text("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "set null" }),
    unitNumber: integer("unit_number").notNull(), // Sequential number within color (1-500 for BLACK, etc.)

    // Blockchain info (when minted)
    blockchain: text("blockchain").default("solana"),
    contractAddress: text("contract_address"),
    tokenId: text("token_id"),
    mintTransactionHash: text("mint_transaction_hash"),
    mintedAt: timestamp("minted_at"),

    // Physical unit info
    serialNumber: text("serial_number").unique(),
    warrantyExpiresAt: timestamp("warranty_expires_at"),

    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    orderIdx: index("idx_nft_order").on(table.orderId),
    variantIdx: index("idx_nft_variant").on(table.variantId),
    serialIdx: uniqueIndex("idx_nft_serial").on(table.serialNumber),
    mintedIdx: index("idx_nft_minted").on(table.mintedAt),
  })
);

// Portfolio items - Installation work and case studies
export const portfolioItems = pgTable(
  "portfolio_items",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    content: text("content"),
    category: text("category"), // "installation", "case_study", "event", etc.
    location: text("location"),
    year: integer("year"),
    featuredImageUrl: text("featured_image_url"),
    isPublished: boolean("is_published").default(false),
    isFeatured: boolean("is_featured").default(false),
    displayOrder: integer("display_order").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    slugIdx: index("idx_portfolio_slug").on(table.slug),
    publishedIdx: index("idx_portfolio_published").on(table.isPublished),
    featuredIdx: index("idx_portfolio_featured").on(table.isFeatured),
    categoryIdx: index("idx_portfolio_category").on(table.category),
  })
);

// Portfolio images - Gallery images for portfolio items
export const portfolioImages = pgTable(
  "portfolio_images",
  {
    id: serial("id").primaryKey(),
    portfolioItemId: integer("portfolio_item_id")
      .notNull()
      .references(() => portfolioItems.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    altText: text("alt_text"),
    caption: text("caption"),
    displayOrder: integer("display_order").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    itemIdx: index("idx_portfolio_images_item").on(table.portfolioItemId),
  })
);
