'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Client, ClientRecord, SalonRecord, ClothingRecord, ServiceCategory } from '@/types';
import { 
  getDbClients, getDbRecords, addDbClient, updateDbClient, deleteDbClient, 
  addDbSalonRecord, addDbClothingRecord, deleteDbRecord 
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
  clients: 'flor_clients_v1',
  records: 'flor_records_v1',
  theme: 'flor_theme',
};

// ============================================================
// Provider
// ============================================================
export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [records, setRecords] = useState<ClientRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('peluqueria');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage and then DB
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem(STORAGE_KEYS.clients);
      const savedRecords = localStorage.getItem(STORAGE_KEYS.records);
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      
      if (savedClients) setClients(JSON.parse(savedClients));
      if (savedRecords) setRecords(JSON.parse(savedRecords));
      
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error('Error loading local data:', e);
    }
    setIsLoaded(true);

    // Sync from cloud
    const syncFromDb = async () => {
      try {
        const [dbClients, dbRecords] = await Promise.all([
          getDbClients(),
          getDbRecords()
        ]);
        if (dbClients.length > 0) setClients(dbClients as any);
        if (dbRecords.length > 0) setRecords(dbRecords as any);
      } catch (e) {
        console.warn('Could not sync with Neon DB. Running in offline/local mode.', e);
      }
    };
    syncFromDb();
  }, []);

  // Persist clients
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
    }
  }, [clients, isLoaded]);

  // Persist records
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    }
  }, [records, isLoaded]);

  // --- Client methods ---
  const addClient = useCallback((name: string, phone?: string, notes?: string): Client => {
    const now = new Date().toISOString();
    const client: Client = {
      id: generateId(), // Temp ID
      name: name.trim(),
      phone: phone?.trim() || undefined,
      notes: notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    setClients(prev => [client, ...prev]);

    // Push to DB
    addDbClient({ name: client.name, phone: client.phone, notes: client.notes })
      .then(dbClient => {
        setClients(prev => prev.map(c => c.id === client.id ? { ...dbClient, id: dbClient.id } as any : c));
      }).catch(e => console.error("DB add client error:", e));

    return client;
  }, []);

  const updateClient = useCallback((id: string, data: Partial<Pick<Client, 'name' | 'phone' | 'notes'>>) => {
    setClients(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, ...data, updatedAt: new Date().toISOString() }
          : c
      )
    );
    // Push to DB
    updateDbClient(id, data as any).catch(e => console.error("DB update client error:", e));
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    setRecords(prev => prev.filter(r => r.clientId !== id));
    // Push to DB
    deleteDbClient(id).catch(e => console.error("DB delete client error:", e));
  }, []);

  const getClient = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const searchClients = useCallback((query: string) => {
    if (!query.trim()) return clients;
    const q = query.toLowerCase().trim();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  }, [clients]);

  // --- Record methods ---
  const addSalonRecord = useCallback((clientId: string, data: Omit<SalonRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => {
    const record: SalonRecord = {
      id: generateId(),
      clientId,
      category: 'peluqueria',
      createdAt: new Date().toISOString(),
      ...data,
    };
    setRecords(prev => [record, ...prev]);
    
    // Push to DB
    addDbSalonRecord(clientId, data)
      .then(dbRecord => {
        setRecords(prev => prev.map(r => r.id === record.id ? dbRecord as any : r));
      }).catch(e => console.error("DB add record error:", e));
  }, []);

  const addClothingRecord = useCallback((clientId: string, data: Omit<ClothingRecord, 'id' | 'clientId' | 'category' | 'createdAt'>) => {
    const record: ClothingRecord = {
      id: generateId(),
      clientId,
      category: 'ropa',
      createdAt: new Date().toISOString(),
      ...data,
    };
    setRecords(prev => [record, ...prev]);

    // Push to DB
    addDbClothingRecord(clientId, data)
      .then(dbRecord => {
        setRecords(prev => prev.map(r => r.id === record.id ? dbRecord as any : r));
      }).catch(e => console.error("DB add record error:", e));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
    deleteDbRecord(id).catch(e => console.error("DB delete record error:", e));
  }, []);

  const getClientRecords = useCallback((clientId: string, category?: ServiceCategory) => {
    let filtered = records.filter(r => r.clientId === clientId);
    if (category) {
      filtered = filtered.filter(r => r.category === category);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  const getRecentRecords = useCallback((limit = 20) => {
    return [...records]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [records]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      if (newVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEYS.theme, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEYS.theme, 'light');
      }
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
