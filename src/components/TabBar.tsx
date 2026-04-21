'use client';

import React from 'react';
import { HomeIcon, UsersIcon, PlusIcon, ClockIcon, ChartIcon } from './Icons';
import { hapticFeedback } from '@/utils/haptics';

type TabType = 'home' | 'clients' | 'add' | 'history' | 'dashboard';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    { id: 'home' as const, label: 'Inicio', icon: HomeIcon },
    { id: 'clients' as const, label: 'Clientas', icon: UsersIcon },
    { id: 'add' as const, label: 'Registrar', icon: PlusIcon },
    { id: 'history' as const, label: 'Historial', icon: ClockIcon },
    { id: 'dashboard' as const, label: 'Balance', icon: ChartIcon },
  ];

  const handleTabClick = (tabId: 'home' | 'clients' | 'add' | 'history' | 'dashboard') => {
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
