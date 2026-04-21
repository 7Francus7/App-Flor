'use client';

import React from 'react';
import { HomeIcon, UsersIcon, PlusIcon, ClockIcon } from './Icons';
import { hapticFeedback } from '@/utils/haptics';

interface TabBarProps {
  activeTab: 'home' | 'clients' | 'add' | 'history';
  onTabChange: (tab: 'home' | 'clients' | 'add' | 'history') => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: HomeIcon },
    { id: 'clients' as const, label: 'Clientas', icon: UsersIcon },
    { id: 'add' as const, label: 'Registrar', icon: PlusIcon },
    { id: 'history' as const, label: 'Historial', icon: ClockIcon },
  ];

  const handleTabClick = (tabId: 'home' | 'clients' | 'add' | 'history') => {
    hapticFeedback('light');
    onTabChange(tabId);
  };

  return (
    <nav className="ios-tab-bar" id="main-tab-bar">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`ios-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
          id={`tab-${tab.id}`}
        >
          <tab.icon size={24} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
