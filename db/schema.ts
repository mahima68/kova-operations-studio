import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const workspaces = sqliteTable("workspaces", {
  ownerId: text("owner_id").primaryKey(),
  payload: text("payload").notNull(),
  revision: integer("revision").notNull(),
  updatedAt: text("updated_at").notNull(),
});
