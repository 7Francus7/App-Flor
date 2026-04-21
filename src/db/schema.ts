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
  paymentStatus: text('payment_status').default('pagado').notNull(), // 'pagado' | 'pendiente'
  amount: decimal('amount', { precision: 10, scale: 2 }),
  observations: text('observations'),
  images: text('images'), // Stored as JSON array string for simplicity
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').default(0).notNull(),
  category: text('category').notNull(),
  size: text('size'),
  color: text('color'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
