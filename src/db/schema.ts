import { pgTable, text, timestamp, integer, uuid, decimal } from 'drizzle-orm/pg-core';

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const records = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  category: text('category').notNull(), // 'peluqueria' | 'ropa'
  date: text('date').notNull(), // YYYY-MM-DD
  serviceOrItem: text('service_or_item').notNull(),
  size: text('size'),
  color: text('color'),
  paymentMethod: text('payment_method').notNull(), // 'efectivo' | 'tarjeta' | 'transferencia'
  amount: decimal('amount', { precision: 10, scale: 2 }),
  observations: text('observations'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
