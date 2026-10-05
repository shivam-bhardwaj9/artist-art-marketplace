import { boolean, index, integer, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { artistProfilesTable } from "./artists";

export const artworksTable = pgTable(
  "artworks",
  {
    id: serial("id").primaryKey(),
    artistId: integer("artist_id").notNull().references(() => artistProfilesTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 12, scale: 2, mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    category: text("category").notNull(),
    medium: text("medium").notNull(),
    dimensions: text("dimensions").notNull(),
    yearCreated: integer("year_created").notNull(),
    status: text("status").notNull().default("published"),
    imageUrls: text("image_urls").array().notNull().default([]),
    artworkType: text("artwork_type").notNull().default("original"),
    featured: boolean("featured").notNull().default(false),
    quantity: integer("quantity").notNull().default(1),
    views: integer("views").notNull().default(0),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("artworks_status_idx").on(table.status),
    index("artworks_category_idx").on(table.category),
    index("artworks_artist_idx").on(table.artistId),
    index("artworks_created_at_idx").on(table.createdAt),
  ],
);

export type ArtworkRecord = typeof artworksTable.$inferSelect;
