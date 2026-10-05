import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("marketplace_users", {
  id: text("id").primaryKey(),
  role: text("role").notNull().default("unset"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof usersTable.$inferSelect;
