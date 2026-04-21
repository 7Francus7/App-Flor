'use server';

import { db } from '@/db';
import { clients, records, expenses, products } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Client, ClientRecord, SalonRecord, ClothingRecord, Expense, Product } from '@/types';

// =======================
// Clients Actions
// =======================
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
      paymentMethod: r.paymentMethod as any,
      paymentStatus: r.paymentStatus as any,
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

export async function deleteDbRecord(id: string) {
  await db.delete(records).where(eq(records.id, id));
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
  const updateData: any = { ...data };
  if (data.price !== undefined) updateData.price = data.price.toString();
  await db.update(products).set(updateData).where(eq(products.id, id));
}

export async function deleteDbProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}
