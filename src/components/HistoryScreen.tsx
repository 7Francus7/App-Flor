'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { ScissorsIcon, ShirtIcon, ClockIcon } from './Icons';
import { ServiceCategory } from '@/types';

export default function HistoryScreen({ onClientSelect }: { onClientSelect: (id: string) => void }) {
  const { records, getClient } = useStore();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');

  // Sort by date descending
  let displayRecords = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (filter !== 'all') {
    displayRecords = displayRecords.filter(r => r.category === filter);
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div className="ios-nav" style={{ padding: '16px 16px 12px' }}>
        <h1 className="ios-nav-title" style={{ marginBottom: 16 }}>Historial General</h1>
        <div className="ios-segment">
          <button className={`ios-segment-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            Todo
          </button>
          <button className={`ios-segment-btn ${filter === 'peluqueria' ? 'active' : ''}`} onClick={() => setFilter('peluqueria')}>
            Peluquería
          </button>
          <button className={`ios-segment-btn ${filter === 'ropa' ? 'active' : ''}`} onClick={() => setFilter('ropa')}>
            Ropa
          </button>
        </div>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {displayRecords.length === 0 ? (
          <div className="ios-empty">
            <div className="ios-empty-icon">
              <ClockIcon size={24} />
            </div>
            <h3>Sin registros</h3>
            <p>No hay servicios ni ventas registrados en esta categoría.</p>
          </div>
        ) : (
          <div className="ios-list-group">
            {displayRecords.map((record) => {
              const client = getClient(record.clientId);
              const isSalon = record.category === 'peluqueria';
              
              return (
                <div 
                  key={record.id} 
                  className="ios-list-item" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onClientSelect(record.clientId)}
                >
                  <div className="ios-avatar sm" style={{
                    background: isSalon ? 'var(--cat-salon-bg)' : 'var(--cat-clothing-bg)',
                    color: isSalon ? 'var(--cat-salon)' : 'var(--cat-clothing)',
                  }}>
                    {isSalon ? <ScissorsIcon size={16} /> : <ShirtIcon size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
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
    </div>
  );
}
