'use client';

import React from 'react';
import { useStore } from '@/store/StoreContext';
import { ScissorsIcon, ShirtIcon, ClockIcon, UsersIcon, SunIcon, MoonIcon } from './Icons';
import { ServiceCategory } from '@/types';

export default function HomeScreen({ onGoToClients, onGoToAdd, onGoToHistory }: {
  onGoToClients: () => void;
  onGoToAdd: () => void;
  onGoToHistory: () => void;
}) {
  const { clients, records, activeCategory, setActiveCategory, getRecentRecords, getClient, isDarkMode, toggleDarkMode } = useStore();
  const recentRecords = getRecentRecords(5);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === todayStr);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ padding: '0 16px', paddingBottom: '16px' }} className="animate-fade-in">
      {/* Header */}
      <div className="ios-nav" style={{ position: 'relative', borderBottom: 'none', background: 'transparent', backdropFilter: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--separator-opaque)', background: 'var(--bg-secondary)' }}>
            <img src="/icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {/* Text Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 2 }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="ios-nav-title" style={{ margin: 0, padding: 0, fontSize: 28, lineHeight: 1.1 }}>Hola, Flor</h1>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode} 
          className="ios-btn-icon" 
          style={{ width: 36, height: 36, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-xs)', flexShrink: 0, borderRadius: '50%' }}
        >
          {isDarkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>

      {/* Category Selector */}
      <div style={{ marginBottom: 24 }}>
        <div className="ios-segment">
          <button
            className={`ios-segment-btn ${activeCategory === 'peluqueria' ? 'active' : ''}`}
            onClick={() => setActiveCategory('peluqueria')}
          >
            ✂️ Peluquería
          </button>
          <button
            className={`ios-segment-btn ${activeCategory === 'ropa' ? 'active' : ''}`}
            onClick={() => setActiveCategory('ropa')}
          >
            👗 Tienda de Ropa
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="ios-card" style={{ padding: '16px', cursor: 'pointer' }} onClick={onGoToClients}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <UsersIcon size={18} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            {clients.length}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Clientas
          </p>
        </div>

        <div className="ios-card" style={{ padding: '16px', cursor: 'pointer' }} onClick={onGoToHistory}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: activeCategory === 'peluqueria' ? 'var(--cat-salon-bg)' : 'var(--cat-clothing-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: activeCategory === 'peluqueria' ? 'var(--cat-salon)' : 'var(--cat-clothing)'
            }}>
              <ClockIcon size={18} />
            </div>
          </div>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            {todayRecords.filter(r => r.category === activeCategory).length}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Hoy
          </p>
        </div>
      </div>

      {/* Quick Action */}
      <button className="ios-btn-primary" onClick={onGoToAdd} style={{ marginBottom: 24 }} id="btn-quick-add">
        {activeCategory === 'peluqueria' ? <ScissorsIcon size={20} /> : <ShirtIcon size={20} />}
        Registrar {activeCategory === 'peluqueria' ? 'Servicio' : 'Venta'}
      </button>

      {/* Recent Activity */}
      <p className="ios-section-header" style={{ paddingLeft: 0 }}>Actividad Reciente</p>
      {recentRecords.length === 0 ? (
        <div className="ios-empty" style={{ padding: '32px 16px' }}>
          <div className="ios-empty-icon">
            <ClockIcon size={24} />
          </div>
          <h3>Sin registros</h3>
          <p>Empezá a registrar servicios y ventas para ver la actividad acá.</p>
        </div>
      ) : (
        <div className="ios-list-group">
          {recentRecords.map((record) => {
            const client = getClient(record.clientId);
            const isSalon = record.category === 'peluqueria';
            return (
              <div key={record.id} className="ios-list-item">
                <div className="ios-avatar sm" style={{
                  background: isSalon ? 'var(--cat-salon-bg)' : 'var(--cat-clothing-bg)',
                  color: isSalon ? 'var(--cat-salon)' : 'var(--cat-clothing)',
                }}>
                  {isSalon ? <ScissorsIcon size={16} /> : <ShirtIcon size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {client?.name || 'Clienta eliminada'}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isSalon ? (record as any).service : `${(record as any).item} · ${(record as any).color}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {formatDate(record.date)}
                  </p>
                  {record.amount && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${record.amount.toLocaleString('es-AR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
