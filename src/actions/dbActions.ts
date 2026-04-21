'use server';

import { db } from '@/db';
import { clients, records } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Client, ClientRecord, SalonRecord, ClothingRecord } from '@/types';

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
      amount: r.amount ? Number(r.amount) : undefined,
      observations: r.observations || '',
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
    amount: data.amount ? data.amount.toString() : null,
    observations: data.observations,
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
    amount: data.amount ? data.amount.toString() : null,
    observations: data.observations,
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
