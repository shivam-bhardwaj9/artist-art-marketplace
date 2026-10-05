import { boolean, index, integer, numeric, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { artistProfilesTable } from "./artists";
import { usersTable } from "./users";

export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

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
    status: text("status").notNull().default("published"), // draft, pending_review, published, sold, archived
    imageUrls: text("image_urls").array().notNull().default([]),
    artworkType: text("artwork_type").notNull().default("original"), // original, print, digital, sculpture
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

export const artworkImagesTable = pgTable(
  "artwork_images",
  {
    id: serial("id").primaryKey(),
    artworkId: integer("artwork_id").notNull().references(() => artworksTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    caption: text("caption"),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("artwork_images_artwork_id_idx").on(table.artworkId)],
);

export const reviewsTable = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    artworkId: integer("artwork_id").references(() => artworksTable.id, { onDelete: "cascade" }),
    artistId: integer("artist_id").notNull().references(() => artistProfilesTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1 to 5
    title: text("title"),
    comment: text("comment").notNull(),
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("reviews_artwork_id_idx").on(table.artworkId),
    index("reviews_artist_id_idx").on(table.artistId),
    index("reviews_user_id_idx").on(table.userId),
  ],
);

export type Category = typeof categoriesTable.$inferSelect;
export type ArtworkRecord = typeof artworksTable.$inferSelect;
export type ArtworkImage = typeof artworkImagesTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
