import { integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { artworksTable } from "./artworks";
import { artistProfilesTable } from "./artists";
import { usersTable } from "./users";

export const cartItemsTable = pgTable(
  "marketplace_cart_items",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artworkId: integer("artwork_id").notNull().references(() => artworksTable.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("cart_items_user_artwork_idx").on(table.userId, table.artworkId)],
);

export const wishlistItemsTable = pgTable(
  "marketplace_wishlist_items",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artworkId: integer("artwork_id").notNull().references(() => artworksTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("wishlist_user_artwork_idx").on(table.userId, table.artworkId)],
);

export const artistFollowsTable = pgTable(
  "marketplace_artist_follows",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    artistId: integer("artist_id").notNull().references(() => artistProfilesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("artist_follows_user_artist_idx").on(table.userId, table.artistId)],
);

export const ordersTable = pgTable(
  "marketplace_orders",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id),
    stripeSessionId: text("stripe_session_id").unique(),
    status: text("status").notNull().default("pending"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2, mode: "number" }).notNull(),
    shipping: numeric("shipping", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    tax: numeric("tax", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
    total: numeric("total", { precision: 12, scale: 2, mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    region: text("region").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("marketplace_order_session_idx").on(table.stripeSessionId)],
);

export const orderItemsTable = pgTable("marketplace_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  artworkId: integer("artwork_id").notNull().references(() => artworksTable.id),
  artistId: integer("artist_id").notNull().references(() => artistProfilesTable.id),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2, mode: "number" }).notNull(),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  artistAmount: numeric("artist_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
});

export type CartItemRecord = typeof cartItemsTable.$inferSelect;
export type OrderRecord = typeof ordersTable.$inferSelect;
