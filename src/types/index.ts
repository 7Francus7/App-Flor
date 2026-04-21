// ============================================================
// Tipos del Sistema Flor — Peluquería & Tienda de Ropa
// ============================================================

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type ServiceCategory = 'peluqueria' | 'ropa';

// Registro de un servicio de peluquería
export interface SalonRecord {
  id: string;
  clientId: string;
  category: 'peluqueria';
  date: string; // ISO string
  service: string; // Ej: "Color + Corte", "Mechas", "Brushing"
  paymentMethod: PaymentMethod;
  amount?: number;
  observations: string; // Notas de color, fórmulas, etc.
  createdAt: string;
}

// Registro de una venta de ropa
export interface ClothingRecord {
  id: string;
  clientId: string;
  category: 'ropa';
  date: string;
  item: string; // Ej: "Remera", "Pantalón", "Vestido"
  size: string; // Talle
  color: string;
  paymentMethod: PaymentMethod;
  amount?: number;
  observations: string;
  createdAt: string;
}

export type ClientRecord = SalonRecord | ClothingRecord;

export interface Client {
  id: string;
  name: string;
  phone?: string;
  notes?: string; // Notas generales sobre la clienta
  createdAt: string;
  updatedAt: string;
}

// Para los formularios
export interface SalonFormData {
  service: string;
  date: string;
  paymentMethod: PaymentMethod;
  amount: string;
  observations: string;
}

export interface ClothingFormData {
  item: string;
  size: string;
  color: string;
  date: string;
  paymentMethod: PaymentMethod;
  amount: string;
  observations: string;
}
