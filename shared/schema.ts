import { pgTable, text, bigint, jsonb } from "drizzle-orm/pg-core";

// Optional persistence layer. The app runs fully in-memory by default;
// this schema only exists so `drizzle-kit` (npm run db:push) has a target
// when a DATABASE_URL is configured.
export const bots = pgTable("bots", {
  id: text("id").primaryKey(),
  template: text("template").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  config: jsonb("config").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

export type BotRow = typeof bots.$inferSelect;
export type NewBotRow = typeof bots.$inferInsert;
