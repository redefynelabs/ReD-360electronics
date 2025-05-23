import { pgTable, varchar, timestamp, boolean, uuid, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../user/users.schema";


export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 10 }).unique().notNull(),
  referrerId: uuid("referrer_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { enum: ["pending", "completed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

