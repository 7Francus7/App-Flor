'use client';

import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { ScissorsIcon, ShirtIcon, ClockIcon } from './Icons';
import { ServiceCategory } from '@/types';
import { exportRecordsToCsv } from '@/utils/exportCsv';

export default function HistoryScreen({
  onClientSelect,
  initialStatusFilter,
}: {
  onClientSelect: (id: string) => void;
  initialStatusFilter?: 'all' | 'pendiente' | 'pagado' | 'parcial';
}) {
  const { records, getClient } = useStore();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'pagado' | 'parcial'>(initialStatusFilter ?? 'all');

  const displayRecords = useMemo(() => {
    let result = [...records]
      .filter((record) => getClient(record.clientId) !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter !== 'all') result = result.filter(r => r.category === filter);
    if (statusFilter !== 'all') result = result.filter(r => r.paymentStatus === statusFilter);
    return result;
  }, [records, getClient, filter, statusFilter]);

  const groupedRecords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const map = new Map<string, typeof displayRecords>();
    for (const r of displayRecords) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return Array.from(map.entries()).map(([dateStr, items]) => {
      let label: string;
      if (dateStr === today) label = 'Hoy';
      else if (dateStr === yesterday) label = 'Ayer';
      else {
        const d = new Date(dateStr + 'T12:00:00');
        label = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
      }
      const total = items.filter(r => r.paymentStatus === 'pagado').reduce((sum, r) => sum + r.amount, 0);
      return { label, dateStr, total, items };
    });
  }, [displayRecords]);

  const handleExport = () => {
    exportRecordsToCsv(displayRecords, (id) => getClient(id)?.name ?? 'Clienta eliminada');
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div className="ios-nav" style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 className="ios-nav-title" style={{ margin: 0 }}>Historial</h1>
          <button
            onClick={handleExport}
            className="ios-btn-text"
            style={{ fontSize: 13, padding: 0, color: 'var(--accent)' }}
            title="Exportar CSV"
          >
            Exportar CSV
          </button>
        </div>

        {/* Category filter */}
        <div className="ios-segment" style={{ marginBottom: 10 }}>
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

        {/* Status filter */}
        <div className="ios-segment">
          <button className={`ios-segment-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
            Todos
          </button>
          <button className={`ios-segment-btn ${statusFilter === 'pagado' ? 'active' : ''}`} onClick={() => setStatusFilter('pagado')}>
            Pagados
          </button>
          <button
            className={`ios-segment-btn ${statusFilter === 'parcial' ? 'active' : ''}`}
            onClick={() => setStatusFilter('parcial')}
            style={{ color: statusFilter === 'parcial' ? '#ff9500' : '' }}
          >
            Parcial
          </button>
          <button
            className={`ios-segment-btn ${statusFilter === 'pendiente' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pendiente')}
            style={{ color: statusFilter === 'pendiente' ? '#ff3b30' : '' }}
          >
            Deben
          </button>
        </div>
      </div>

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {groupedRecords.length === 0 ? (
          <div className="ios-empty">
            <div className="ios-empty-icon">
              <ClockIcon size={24} />
            </div>
            <h3>Sin registros</h3>
            <p>No hay servicios ni ventas en esta categoría.</p>
          </div>
        ) : (
          groupedRecords.map(group => (
            <div key={group.dateStr} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, padding: '0 2px' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {group.label}
                </p>
                {group.total > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    ${group.total.toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div className="ios-list-group">
                {group.items.map((record) => {
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
                          {client?.name ?? 'Clienta eliminada'}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {isSalon ? record.service : `${record.item} · ${record.color}`}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {record.amount > 0 && (
                          <p style={{ fontSize: 14, fontWeight: 600, color: record.paymentStatus === 'pendiente' ? '#ff3b30' : record.paymentStatus === 'parcial' ? '#ff9500' : 'var(--text-primary)' }}>
                            ${record.amount.toLocaleString('es-AR')}
                          </p>
                        )}
                        {record.paymentStatus === 'pendiente' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', background: '#ff3b3015', padding: '1px 6px', borderRadius: 4, display: 'block', marginTop: 2 }}>
                            DEBE
                          </span>
                        )}
                        {record.paymentStatus === 'parcial' && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#ff9500', background: '#ff950015', padding: '1px 6px', borderRadius: 4, display: 'block', marginTop: 2 }}>
                            PARCIAL
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
