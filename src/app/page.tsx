'use client';

import React, { useState } from 'react';
import TabBar from '@/components/TabBar';
import HomeScreen from '@/components/HomeScreen';
import ClientsScreen from '@/components/ClientsScreen';
import HistoryScreen from '@/components/HistoryScreen';
import AddRecordScreen from '@/components/AddRecordScreen';
import ClientProfile from '@/components/ClientProfile';
import AddClientSheet from '@/components/AddClientSheet';

type Tab = 'home' | 'clients' | 'add' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  // Router logic
  if (selectedClientId) {
    return <ClientProfile clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />;
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
        />
      )}
      
      {activeTab === 'clients' && (
        <ClientsScreen 
          onClientSelect={setSelectedClientId}
          onAddNewClient={() => setShowAddClient(true)}
        />
      )}
      
      {activeTab === 'history' && (
        <HistoryScreen />
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
        activeTab={activeTab === 'add' ? 'home' : activeTab} 
        onTabChange={(tab) => {
          if (tab === 'add') {
            setIsAddingRecord(true);
          } else {
            setActiveTab(tab);
            setSelectedClientId(null);
            setIsAddingRecord(false);
          }
        }} 
      />
    </>
  );
}
