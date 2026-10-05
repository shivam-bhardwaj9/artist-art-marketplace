import { integer, numeric, pgTable, real, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const artistProfilesTable = pgTable(
  "artist_profiles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    slug: text("slug").notNull(),
    location: text("location").notNull().default(""),
    biography: text("biography").notNull().default(""),
    imageUrl: text("image_url"),
    website: text("website"),
    rating: real("rating").notNull().default(0),
    views: integer("views").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("artist_profiles_user_id_idx").on(table.userId), uniqueIndex("artist_profiles_slug_idx").on(table.slug)],
);

export const artistPayoutsTable = pgTable(
  "artist_payouts",
  {
    id: serial("id").primaryKey(),
    artistId: integer("artist_id").notNull().references(() => artistProfilesTable.id, { onDelete: "cascade" }),
    orderId: integer("order_id"),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed
    payoutDate: timestamp("payout_date", { withTimezone: true }),
    referenceNumber: text("reference_number"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("artist_payouts_artist_id_idx").on(table.artistId),
    index("artist_payouts_status_idx").on(table.status),
  ],
);

export type ArtistProfile = typeof artistProfilesTable.$inferSelect;
export type ArtistPayout = typeof artistPayoutsTable.$inferSelect;
