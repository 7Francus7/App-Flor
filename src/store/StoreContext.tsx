'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  Client, ClientRecord, SalonRecord, ClothingRecord, 
  ServiceCategory, Expense, Product 
} from '@/types';
import { 
  getDbClients, getDbRecords, addDbClient, updateDbClient, deleteDbClient, 
  addDbSalonRecord, addDbClothingRecord, deleteDbRecord,
  getDbExpenses, addDbExpense, deleteDbExpense,
  getDbProducts, addDbProduct, updateDbProduct, deleteDbProduct
} from '@/actions/dbActions';

// ============================================================
// Utilidades
// ============================================================
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================
// Store Interface
// ============================================================
interface StoreContextType {
  // Clients
  clients: Client[];
  addClient: (name: string, phone?: string, notes?: string) => Client;
  updateClient: (id: string, data: Partial<Pick<Client, 'name' | 'phone' | 'notes'>>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];

  // Records
  records: ClientRecord[];
  addSalonRecord: (clientId: string, data: Omit<SalonRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => void;
  addClothingRecord: (clientId: string, data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  getClientRecords: (clientId: string, category?: ServiceCategory) => ClientRecord[];
  getRecentRecords: (limit?: number) => ClientRecord[];

  // Expenses
  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Inventory (Products)
  products: Product[];
  addProduct: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => void;
  deleteProduct: (id: string) => void;

  // Active category toggle
  activeCategory: ServiceCategory;
  setActiveCategory: (cat: ServiceCategory) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // State
  isLoaded: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEYS = {
  clients: 'flor_clients_v2',
  records: 'flor_records_v2',
  expenses: 'flor_expenses_v2',
  products: 'flor_products_v2',
  theme: 'flor_theme',
};

// ============================================================
// Provider
// ============================================================
export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('peluqueria');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load and sync
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem(STORAGE_KEYS.clients);
      const savedRecords = localStorage.getItem(STORAGE_KEYS.records);
      const savedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
      const savedProducts = localStorage.getItem(STORAGE_KEYS.products);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      
      if (savedClients) setClients(JSON.parse(savedClients));
      if (savedRecords) setRecords(JSON.parse(savedRecords));
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) { console.error('Error loading local data:', e); }
    setIsLoaded(true);

    const sync = async () => {
      try {
        const [dbC, dbR, dbE, dbP] = await Promise.all([
          getDbClients(), getDbRecords(), getDbExpenses(), getDbProducts()
        ]);
        if (dbC.length > 0) setClients(dbC as any);
        if (dbR.length > 0) setRecords(dbR as any);
        if (dbE.length > 0) setExpenses(dbE as any);
        if (dbP.length > 0) setProducts(dbP as any);
      } catch (e) { console.warn('Offline mode', e); }
    };
    sync();
  }, []);

  // Persistence
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients)); }, [clients, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records)); }, [records, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses)); }, [expenses, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products)); }, [products, isLoaded]);

  // --- Client methods ---
  const addClient = useCallback((name: string, phone?: string, notes?: string): Client => {
    const now = new Date().toISOString();
    const client: Client = { id: generateId(), name: name.trim(), phone: phone?.trim(), notes: notes?.trim(), createdAt: now, updatedAt: now };
    setClients(prev => [client, ...prev]);
    addDbClient({ name: client.name, phone: client.phone, notes: client.notes })
      .then(dbC => setClients(prev => prev.map(c => c.id === client.id ? { ...dbC, id: dbC.id } as any : c)));
    return client;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Pick<Client, 'name' | 'phone' | 'notes'>>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
    updateDbClient(id, data as any);
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    deleteDbClient(id);
  }, []);

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
    addDbSalonRecord(clientId, data).then(dbR => setRecords(prev => prev.map(r => r.id === record.id ? dbR as any : r)));
  }, []);

  const addClothingRecord = useCallback((clientId: string, data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => {
    const record: ClothingRecord = { id: generateId(), clientId, category: 'ropa', createdAt: new Date().toISOString(), ...data };
    setRecords(prev => [record, ...prev]);
    addDbClothingRecord(clientId, data).then(dbR => setRecords(prev => prev.map(r => r.id === record.id ? dbR as any : r)));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    deleteDbRecord(id);
  }, []);

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
    addDbExpense(data).then(dbE => setExpenses(prev => prev.map(e => e.id === expense.id ? dbE as any : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    deleteDbExpense(id);
  }, []);

  // --- Product methods ---
  const addProduct = useCallback((data: Omit<Product, 'id' | 'createdAt'>) => {
    const product: Product = { id: generateId(), createdAt: new Date().toISOString(), ...data };
    setProducts(prev => [product, ...prev]);
    addDbProduct(data).then(dbP => setProducts(prev => prev.map(p => p.id === product.id ? dbP as any : p)));
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    updateDbProduct(id, data);
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    deleteDbProduct(id);
  }, []);

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
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClient,
        searchClients,
        records,
        addSalonRecord,
        addClothingRecord,
        deleteRecord,
        getClientRecords,
        getRecentRecords,
        expenses,
        addExpense,
        deleteExpense,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        activeCategory,
        setActiveCategory,
        isDarkMode,
        toggleDarkMode,
        isLoaded,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
