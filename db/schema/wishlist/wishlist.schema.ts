import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from '../user/users.schema';
import { products, variants } from '../products/products.schema';

export const wishlists = pgTable('wishlists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => variants.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});