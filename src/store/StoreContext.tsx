'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import {
  Client, ClientRecord, SalonRecord, ClothingRecord,
  ServiceCategory, Expense, Product, RecordUpdateData
} from '@/types';
import {
  getDbClients, getDbRecords, addDbClient, updateDbClient, deleteDbClient,
  addDbSalonRecord, addDbClothingRecord, updateDbRecord, deleteDbRecord,
  getDbExpenses, addDbExpense, deleteDbExpense,
  getDbProducts, addDbProduct, updateDbProduct, deleteDbProduct
} from '@/actions/dbActions';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function loadStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : fallback;
  } catch {
    return fallback;
  }
}

function filterOrphanRecords(clients: Client[], records: ClientRecord[]): ClientRecord[] {
  const clientIds = new Set(clients.map((client) => client.id));
  return records.filter((record) => clientIds.has(record.clientId));
}

function replaceOptimisticItem<T extends { id: string }>(items: T[], optimisticId: string, nextItem: T): T[] {
  return items.map((item) => item.id === optimisticId ? nextItem : item);
}

interface StoreContextType {
  // Clients
  clients: Client[];
  addClient: (name: string, phone?: string, notes?: string) => Promise<Client>;
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'phone' | 'notes'>>) => void;
  deleteClient: (id: string) => () => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];

  // Records
  records: ClientRecord[];
  addSalonRecord: (clientId: string, data: Omit<SalonRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => void;
  addClothingRecord: (clientId: string, data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>, productId?: string) => void;
  updateRecord: (id: string, data: RecordUpdateData) => void;
  deleteRecord: (id: string) => () => void;
  getClientRecords: (clientId: string, category?: ServiceCategory) => ClientRecord[];
  getRecentRecords: (limit?: number) => ClientRecord[];

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => () => void;

  // Inventory (Products)
  products: Product[];
  addProduct: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => void;
  deleteProduct: (id: string) => () => void;

  // Active category toggle
  activeCategory: ServiceCategory;
  setActiveCategory: (cat: ServiceCategory) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // State
  isLoaded: boolean;
  syncError: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  clients: 'flor_clients_v2',
  records: 'flor_records_v2',
  expenses: 'flor_expenses_v2',
  products: 'flor_products_v2',
  theme: 'flor_theme',
};

const UNDO_DELAY = 5000;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadStoredValue<Client[]>(STORAGE_KEYS.clients, []));
  const [records, setRecords] = useState<ClientRecord[]>(() => {
    const storedClients = loadStoredValue<Client[]>(STORAGE_KEYS.clients, []);
    const storedRecords = loadStoredValue<ClientRecord[]>(STORAGE_KEYS.records, []);
    return filterOrphanRecords(storedClients, storedRecords);
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStoredValue<Expense[]>(STORAGE_KEYS.expenses, []));
  const [products, setProducts] = useState<Product[]>(() => loadStoredValue<Product[]>(STORAGE_KEYS.products, []));
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('peluqueria');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const isLoaded = true;

  // Undo timers — id → setTimeout handle
  const undoTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function scheduleDbDelete(id: string, dbDeleteFn: () => void) {
    const timer = setTimeout(() => {
      dbDeleteFn();
      undoTimers.current.delete(id);
    }, UNDO_DELAY);
    undoTimers.current.set(id, timer);
  }

  function cancelDbDelete(id: string) {
    const timer = undoTimers.current.get(id);
    if (timer) { clearTimeout(timer); undoTimers.current.delete(id); }
  }

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    queueMicrotask(() => {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      const shouldUseDarkMode = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(shouldUseDarkMode);
      document.documentElement.classList.toggle('dark', shouldUseDarkMode);
    });
  }, []);

  // DB sync on mount
  useEffect(() => {
    const sync = async () => {
      try {
        const [dbC, dbR, dbE, dbP] = await Promise.all([
          getDbClients(), getDbRecords(), getDbExpenses(), getDbProducts()
        ]);
        setClients(dbC);
        setRecords(filterOrphanRecords(dbC, dbR));
        setExpenses(dbE);
        setProducts(dbP);
        setSyncError(false);
      } catch (e) {
        console.warn('Offline mode', e);
        setSyncError(true);
      }
    };
    sync();
  }, []);

  // Persistence
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients)); }, [clients, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)); }, [records, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses)); }, [expenses, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products, isLoaded]);

  // --- Client methods ---
  const addClient = useCallback(async (name: string, phone?: string, notes?: string): Promise<Client> => {
    const now = new Date().toISOString();
    const client: Client = { id: generateId(), name: name.trim(), phone: phone?.trim(), notes: notes?.trim(), createdAt: now, updatedAt: now };
    setClients(prev => [client, ...prev]);
    try {
      const dbClient = await addDbClient({ name: client.name, phone: client.phone, notes: client.notes });
      setClients(prev => replaceOptimisticItem(prev, client.id, dbClient));
      setRecords(prev => prev.map(record => record.clientId === client.id ? { ...record, clientId: dbClient.id } : record));
      return dbClient;
    } catch (error) {
      console.warn('Client saved only locally', error);
      return client;
    }
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Pick<Client, 'name' | 'phone' | 'notes'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
    updateDbClient(id, data);
  }, []);

  const deleteClient = useCallback((id: string): (() => void) => {
    // Capture before setState so the undo closure always has the data
    const deletedClient = clients.find(c => c.id === id);
    const deletedClientRecords = records.filter(r => r.clientId === id);

    setClients(prev => prev.filter(c => c.id !== id));
    setRecords(prev => prev.filter(r => r.clientId !== id));

    scheduleDbDelete(id, () => deleteDbClient(id));

    return () => {
      cancelDbDelete(id);
      if (deletedClient) setClients(prev => [deletedClient, ...prev]);
      if (deletedClientRecords.length) setRecords(prev => [...prev, ...deletedClientRecords]);
    };
  }, [clients, records]);

  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const searchClients = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  }, [clients]);

  // --- Record methods ---
  const addSalonRecord = useCallback((clientId: string, data: Omit<SalonRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => {
    const record: SalonRecord = { id: generateId(), clientId, category: 'peluqueria', createdAt: new Date().toISOString(), ...data };
    setRecords(prev => [record, ...prev]);
    addDbSalonRecord(clientId, data).then(dbRecord => setRecords(prev => replaceOptimisticItem(prev, record.id, dbRecord)));
  }, []);

  const addClothingRecord = useCallback((
    clientId: string,
    data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>,
    productId?: string
  ) => {
    const record: ClothingRecord = { id: generateId(), clientId, category: 'ropa', createdAt: new Date().toISOString(), ...data };
    setRecords(prev => [record, ...prev]);
    addDbClothingRecord(clientId, data).then(dbRecord => setRecords(prev => replaceOptimisticItem(prev, record.id, dbRecord)));

    // Decrement stock of linked product
    if (productId) {
      setProducts(prev => {
        const product = prev.find(p => p.id === productId);
        if (product && product.stock > 0) {
          const newStock = product.stock - 1;
          updateDbProduct(productId, { stock: newStock });
          return prev.map(p => p.id === productId ? { ...p, stock: newStock } : p);
        }
        return prev;
      });
    }
  }, []);

  const updateRecord = useCallback((id: string, data: RecordUpdateData) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (r.category === 'peluqueria') {
        return { ...r, ...data, service: data.service ?? r.service } as SalonRecord;
      } else {
        return { ...r, ...data, item: data.item ?? r.item } as ClothingRecord;
      }
    }));
    const record = records.find(r => r.id === id);
    if (!record) return;
    updateDbRecord(id, {
      date: data.date ?? record.date,
      serviceOrItem: record.category === 'peluqueria'
        ? (data.service ?? (record as SalonRecord).service)
        : (data.item ?? (record as ClothingRecord).item),
      size: record.category === 'ropa' ? (data.size ?? (record as ClothingRecord).size) : undefined,
      color: record.category === 'ropa' ? (data.color ?? (record as ClothingRecord).color) : undefined,
      paymentMethod: data.paymentMethod ?? record.paymentMethod,
      paymentStatus: data.paymentStatus ?? record.paymentStatus,
      amount: data.amount ?? record.amount,
      observations: data.observations ?? record.observations,
    });
  }, [records]);

  const deleteRecord = useCallback((id: string): (() => void) => {
    const record = records.find(r => r.id === id);
    if (!record) return () => {};

    setRecords(prev => prev.filter(r => r.id !== id));
    scheduleDbDelete(id, () => deleteDbRecord(id));

    return () => {
      cancelDbDelete(id);
      setRecords(prev => [...prev, record].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
  }, [records]);

  const getClientRecords = useCallback((clientId: string, category?: ServiceCategory) => {
    let filtered = records.filter(r => r.clientId === clientId);
    if (category) filtered = filtered.filter(r => r.category === category);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const getRecentRecords = useCallback((limit = 20) => {
    return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  }, [records]);

  // --- Expense methods ---
  const addExpense = useCallback((data: Omit<Expense, 'id' | 'createdAt'>) => {
    const expense: Expense = { id: generateId(), createdAt: new Date().toISOString(), ...data };
    setExpenses(prev => [expense, ...prev]);
    addDbExpense(data).then(dbExpense => setExpenses(prev => replaceOptimisticItem(prev, expense.id, dbExpense)));
  }, []);

  const deleteExpense = useCallback((id: string): (() => void) => {
    const expense = expenses.find(e => e.id === id);
    if (!expense) return () => {};

    setExpenses(prev => prev.filter(e => e.id !== id));
    scheduleDbDelete(id, () => deleteDbExpense(id));

    return () => {
      cancelDbDelete(id);
      setExpenses(prev => [...prev, expense].sort((a, b) => b.date.localeCompare(a.date)));
    };
  }, [expenses]);

  // --- Product methods ---
  const addProduct = useCallback((data: Omit<Product, 'id' | 'createdAt'>) => {
    const product: Product = { id: generateId(), createdAt: new Date().toISOString(), ...data };
    setProducts(prev => [product, ...prev]);
    addDbProduct(data).then(dbProduct => setProducts(prev => replaceOptimisticItem(prev, product.id, dbProduct)));
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    updateDbProduct(id, data);
  }, []);

  const deleteProduct = useCallback((id: string): (() => void) => {
    const product = products.find(p => p.id === id);
    if (!product) return () => {};

    setProducts(prev => prev.filter(p => p.id !== id));
    scheduleDbDelete(id, () => deleteDbProduct(id));

    return () => {
      cancelDbDelete(id);
      setProducts(prev => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
    };
  }, [products]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      document.documentElement.classList.toggle('dark', newVal);
      localStorage.setItem(STORAGE_KEYS.theme, newVal ? 'dark' : 'light');
      return newVal;
    });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        clients, addClient, updateClient, deleteClient, getClient, searchClients,
        records, addSalonRecord, addClothingRecord, updateRecord, deleteRecord, getClientRecords, getRecentRecords,
        expenses, addExpense, deleteExpense,
        products, addProduct, updateProduct, deleteProduct,
        activeCategory, setActiveCategory,
        isDarkMode, toggleDarkMode,
        isLoaded, syncError,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
