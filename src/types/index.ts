// ============================================================
// Tipos del Sistema Flor — Peluquería & Tienda de Ropa
// ============================================================

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export type ServiceCategory = 'peluqueria' | 'ropa';

export type PaymentStatus = 'pagado' | 'pendiente';

// Registro de un servicio de peluquería
export interface SalonRecord {
  id: string;
  clientId: string;
  category: 'peluqueria';
  date: string; // ISO string
  service: string; // Ej: "Color + Corte", "Mechas", "Brushing"
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: number;
  observations: string; // Notas de color, fórmulas, etc.
  images?: string[]; // URLs or base64
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
  paymentStatus: PaymentStatus;
  amount: number;
  observations: string;
  images?: string[];
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

// Gastos del negocio
export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: 'insumos' | 'alquiler' | 'servicios' | 'ropa' | 'publicidad' | 'otros';
  createdAt: string;
}

// Inventario de ropa
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: string;
  size?: string;
  color?: string;
  createdAt: string;
}

// Para los formularios
export interface SalonFormData {
  service: string;
  date: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: string;
  observations: string;
}

export interface ClothingFormData {
  item: string;
  size: string;
  color: string;
  date: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amount: string;
  observations: string;
}
