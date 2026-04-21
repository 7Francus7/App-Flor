'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import TabBar from '@/components/TabBar';
import HomeScreen from '@/components/HomeScreen';
import ClientsScreen from '@/components/ClientsScreen';
import HistoryScreen from '@/components/HistoryScreen';
import AddRecordScreen from '@/components/AddRecordScreen';
import ClientProfile from '@/components/ClientProfile';
import AddClientSheet from '@/components/AddClientSheet';
import DashboardScreen from '@/components/DashboardScreen';
import InventoryScreen from '@/components/InventoryScreen';
import ExpensesScreen from '@/components/ExpensesScreen';

type Tab = 'home' | 'clients' | 'add' | 'history' | 'dashboard';

import { Suspense } from 'react';

function AppContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [currentSubScreen, setCurrentSubScreen] = useState<'inventory' | 'expenses' | null>(null);

  // Handle PWA shortcuts and deep links
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new_record') {
      setIsAddingRecord(true);
    } else if (action === 'new_client') {
      setActiveTab('clients');
      setShowAddClient(true);
    }
  }, [searchParams]);

  // Router logic
  if (selectedClientId) {
    return <ClientProfile clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />;
  }

  if (currentSubScreen === 'inventory') {
    return <InventoryScreen onBack={() => setCurrentSubScreen(null)} />;
  }

  if (currentSubScreen === 'expenses') {
    return <ExpensesScreen onBack={() => setCurrentSubScreen(null)} />;
  }

  if (isAddingRecord || activeTab === 'add') {
    return (
      <AddRecordScreen 
        onBack={() => {
          setIsAddingRecord(false);
          if (activeTab === 'add') setActiveTab('home');
        }} 
      />
    );
  }

  return (
    <>
      {activeTab === 'home' && (
        <HomeScreen 
          onGoToClients={() => setActiveTab('clients')}
          onGoToAdd={() => setIsAddingRecord(true)}
          onGoToHistory={() => setActiveTab('history')}
          onClientSelect={setSelectedClientId}
        />
      )}
      
      {activeTab === 'clients' && (
        <ClientsScreen 
          onClientSelect={setSelectedClientId}
          onAddNewClient={() => setShowAddClient(true)}
        />
      )}
      
      {activeTab === 'history' && (
        <HistoryScreen onClientSelect={setSelectedClientId} />
      )}

      {activeTab === 'dashboard' && (
        <DashboardScreen 
          onGoToInventory={() => setCurrentSubScreen('inventory')}
          onGoToExpenses={() => setCurrentSubScreen('expenses')}
        />
      )}

      {showAddClient && (
        <AddClientSheet 
          onClose={() => setShowAddClient(false)}
          onClientAdded={(id) => {
            setShowAddClient(false);
            setSelectedClientId(id);
          }}
        />
      )}

      <TabBar 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab === 'add') {
            setIsAddingRecord(true);
          } else {
            setActiveTab(tab);
            setSelectedClientId(null);
            setIsAddingRecord(false);
            setCurrentSubScreen(null);
          }
        }} 
      />
    </>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Cargando...</div>}>
      <AppContent />
    </Suspense>
  );
}
