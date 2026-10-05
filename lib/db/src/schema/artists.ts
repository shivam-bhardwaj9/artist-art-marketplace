import { integer, pgTable, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export type ArtistProfile = typeof artistProfilesTable.$inferSelect;
