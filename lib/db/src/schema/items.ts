import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { charactersTable } from "./characters";

export const itemCategoryEnum = ["weapons", "armor", "magic_items", "scrolls", "potions", "misc"] as const;
export type ItemCategory = typeof itemCategoryEnum[number];

export const rechargeOnEnum = ["short_rest", "long_rest", "dawn", "never"] as const;
export type RechargeOn = typeof rechargeOnEnum[number];

export const rarityEnum = ["common", "uncommon", "rare", "very_rare", "legendary"] as const;
export type Rarity = typeof rarityEnum[number];

export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  characterId: integer("character_id").notNull().references(() => charactersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull().$type<ItemCategory>(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  isEquipped: boolean("is_equipped").notNull().default(false),
  maxCharges: integer("max_charges"),
  currentCharges: integer("current_charges"),
  rechargeOn: text("recharge_on").$type<RechargeOn>(),
  rarity: text("rarity").$type<Rarity>(),
  isConsumable: boolean("is_consumable").notNull().default(false),
  isConsumed: boolean("is_consumed").notNull().default(false),
  isTrashed: boolean("is_trashed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertItemSchema = createInsertSchema(itemsTable).omit({ id: true, createdAt: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof itemsTable.$inferSelect;
