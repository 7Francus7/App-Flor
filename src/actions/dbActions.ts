'use server';

import { db } from '@/db';
import { clients, records, expenses, products, payments } from '@/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import {
  ClothingRecord,
  Expense,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Product,
  SalonRecord,
} from '@/types';

// =======================
// Clients Actions
// =======================
export async function getDbClients() {
  const result = await db.select().from(clients).orderBy(desc(clients.createdAt));
  return result.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || undefined,
    notes: c.notes || undefined,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function addDbClient(data: { name: string; phone?: string; notes?: string }) {
  const [newClient] = await db.insert(clients).values(data).returning();
  return {
    ...newClient,
    phone: newClient.phone || undefined,
    notes: newClient.notes || undefined,
    createdAt: newClient.createdAt.toISOString(),
    updatedAt: newClient.updatedAt.toISOString(),
  };
}

export async function updateDbClient(id: string, data: Partial<{ name: string; phone: string; notes: string }>) {
  await db.update(clients).set({ ...data, updatedAt: new Date() }).where(eq(clients.id, id));
}

export async function deleteDbClient(id: string) {
  await db.delete(clients).where(eq(clients.id, id));
}

// =======================
// Records Actions
// =======================
export async function getDbRecords() {
  const result = await db.select().from(records).orderBy(desc(records.date));
  return result.map(r => {
    const baseRecord = {
      id: r.id,
      clientId: r.clientId,
      date: r.date,
      paymentMethod: r.paymentMethod as PaymentMethod,
      paymentStatus: r.paymentStatus as PaymentStatus,
      amount: r.amount ? Number(r.amount) : 0,
      observations: r.observations || '',
      images: r.images ? JSON.parse(r.images) : [],
      createdAt: r.createdAt.toISOString(),
    };

    if (r.category === 'peluqueria') {
      return {
        ...baseRecord,
        category: 'peluqueria',
        service: r.serviceOrItem,
      } as SalonRecord;
    } else {
      return {
        ...baseRecord,
        category: 'ropa',
        item: r.serviceOrItem,
        size: r.size || '',
        color: r.color || '',
      } as ClothingRecord;
    }
  });
}

export async function addDbSalonRecord(clientId: string, data: Omit<SalonRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) {
  const [newRecord] = await db.insert(records).values({
    clientId,
    category: 'peluqueria',
    date: data.date,
    serviceOrItem: data.service,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    amount: data.amount ? data.amount.toString() : '0',
    observations: data.observations,
    images: data.images ? JSON.stringify(data.images) : null,
  }).returning();

  return {
    ...data,
    id: newRecord.id,
    clientId,
    category: 'peluqueria',
    createdAt: newRecord.createdAt.toISOString(),
  } as SalonRecord;
}

export async function addDbClothingRecord(clientId: string, data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) {
  const [newRecord] = await db.insert(records).values({
    clientId,
    category: 'ropa',
    date: data.date,
    serviceOrItem: data.item,
    size: data.size,
    color: data.color,
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    amount: data.amount ? data.amount.toString() : '0',
    observations: data.observations,
    images: data.images ? JSON.stringify(data.images) : null,
  }).returning();

  return {
    ...data,
    id: newRecord.id,
    clientId,
    category: 'ropa',
    createdAt: newRecord.createdAt.toISOString(),
  } as ClothingRecord;
}

export async function updateDbRecord(id: string, data: {
  date?: string;
  serviceOrItem?: string;
  size?: string;
  color?: string;
  paymentMethod?: PaymentMethod;
  amount?: number;
  observations?: string;
}) {
  await db.update(records).set({
    ...data,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
  }).where(eq(records.id, id));
}

export async function deleteDbRecord(id: string) {
  await db.delete(records).where(eq(records.id, id));
}

// =======================
// Payments Actions
// =======================
async function recalculateRecordStatus(recordId: string): Promise<PaymentStatus> {
  const [record] = await db
    .select({ amount: records.amount })
    .from(records)
    .where(eq(records.id, recordId));
  if (!record) return 'pendiente';

  const recordAmount = Number(record.amount) || 0;

  // Free service (amount = 0) — always paid, no payments needed
  if (recordAmount === 0) {
    await db.update(records).set({ paymentStatus: 'pagado' }).where(eq(records.id, recordId));
    return 'pagado';
  }

  const paymentsResult = await db
    .select({ amount: payments.amount })
    .from(payments)
    .where(eq(payments.recordId, recordId));
  const totalPaid = paymentsResult.reduce((sum, p) => sum + Number(p.amount), 0);

  let status: PaymentStatus;
  if (totalPaid <= 0) status = 'pendiente';
  else if (totalPaid >= recordAmount) status = 'pagado';
  else status = 'parcial';

  await db.update(records).set({ paymentStatus: status }).where(eq(records.id, recordId));
  return status;
}

export async function getDbAllPayments(): Promise<Payment[]> {
  const result = await db.select().from(payments).orderBy(desc(payments.date));
  return result.map(p => ({
    id: p.id,
    recordId: p.recordId,
    date: p.date,
    amount: Number(p.amount),
    paymentMethod: p.paymentMethod as PaymentMethod,
    observations: p.observations || undefined,
    createdAt: p.createdAt.toISOString(),
  }));
}

export async function addDbPayment(data: {
  recordId: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  observations?: string;
}): Promise<{ payment: Payment; newStatus: PaymentStatus }> {
  const [newPayment] = await db.insert(payments).values({
    recordId: data.recordId,
    date: data.date,
    amount: data.amount.toString(),
    paymentMethod: data.paymentMethod,
    observations: data.observations || null,
  }).returning();

  const newStatus = await recalculateRecordStatus(data.recordId);

  return {
    payment: {
      id: newPayment.id,
      recordId: newPayment.recordId,
      date: newPayment.date,
      amount: Number(newPayment.amount),
      paymentMethod: newPayment.paymentMethod as PaymentMethod,
      observations: newPayment.observations || undefined,
      createdAt: newPayment.createdAt.toISOString(),
    },
    newStatus,
  };
}

export async function deleteDbPayment(paymentId: string, recordId: string): Promise<{ newStatus: PaymentStatus }> {
  await db.delete(payments).where(eq(payments.id, paymentId));
  const newStatus = await recalculateRecordStatus(recordId);
  return { newStatus };
}

export async function updateDbPayment(
  paymentId: string,
  data: { date?: string; amount?: number; paymentMethod?: PaymentMethod; observations?: string },
  recordId: string,
): Promise<{ newStatus: PaymentStatus }> {
  await db.update(payments).set({
    date: data.date,
    amount: data.amount !== undefined ? data.amount.toString() : undefined,
    paymentMethod: data.paymentMethod,
    observations: data.observations,
  }).where(eq(payments.id, paymentId));
  const newStatus = await recalculateRecordStatus(recordId);
  return { newStatus };
}

// One-time migration: create payment entries for all legacy 'pagado' records that have none
export async function runPaymentsMigration(): Promise<{ migrated: number }> {
  const pagadoRecords = await db
    .select()
    .from(records)
    .where(eq(records.paymentStatus, 'pagado'));

  if (pagadoRecords.length === 0) return { migrated: 0 };

  const pagadoIds = pagadoRecords.map(r => r.id);
  const existingPayments = await db
    .select({ recordId: payments.recordId })
    .from(payments)
    .where(inArray(payments.recordId, pagadoIds));

  const paidRecordIds = new Set(existingPayments.map(p => p.recordId));
  // Skip records with amount = 0 (free services) — no payment entry needed
  const needsMigration = pagadoRecords.filter(r =>
    !paidRecordIds.has(r.id) && Number(r.amount) > 0
  );

  if (needsMigration.length === 0) return { migrated: 0 };

  await db.insert(payments).values(
    needsMigration.map(r => ({
      recordId: r.id,
      date: r.date,
      amount: r.amount!,
      paymentMethod: r.paymentMethod,
      observations: null,
    }))
  );

  return { migrated: needsMigration.length };
}

// =======================
// Expenses Actions
// =======================
export async function getDbExpenses() {
  const result = await db.select().from(expenses).orderBy(desc(expenses.date));
  return result.map(e => ({
    ...e,
    amount: Number(e.amount),
    createdAt: e.createdAt.toISOString(),
  })) as Expense[];
}

export async function addDbExpense(data: Omit<Expense, 'id' | 'createdAt'>) {
  const [newExpense] = await db.insert(expenses).values({
    ...data,
    amount: data.amount.toString(),
  }).returning();
  return {
    ...newExpense,
    amount: Number(newExpense.amount),
    createdAt: newExpense.createdAt.toISOString(),
  } as Expense;
}

export async function deleteDbExpense(id: string) {
  await db.delete(expenses).where(eq(expenses.id, id));
}

// =======================
// Products (Inventory) Actions
// =======================
export async function getDbProducts() {
  const result = await db.select().from(products).orderBy(desc(products.createdAt));
  return result.map(p => ({
    ...p,
    price: Number(p.price),
    createdAt: p.createdAt.toISOString(),
  })) as Product[];
}

export async function addDbProduct(data: Omit<Product, 'id' | 'createdAt'>) {
  const [newProduct] = await db.insert(products).values({
    ...data,
    price: data.price.toString(),
  }).returning();
  return {
    ...newProduct,
    price: Number(newProduct.price),
    createdAt: newProduct.createdAt.toISOString(),
  } as Product;
}

export async function updateDbProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) {
  const updateData: {
    name?: string;
    description?: string;
    price?: string;
    stock?: number;
    category?: string;
    size?: string;
    color?: string;
  } = { ...data, price: data.price?.toString() };

  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteDbProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
