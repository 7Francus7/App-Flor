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
  initialStatusFilter?: 'all' | 'pendiente' | 'pagado';
}) {
  const { records, getClient } = useStore();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'pagado'>(initialStatusFilter ?? 'all');

  const displayRecords = useMemo(() => {
    let result = [...records]
      .filter((record) => getClient(record.clientId) !== undefined)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filter !== 'all') result = result.filter(r => r.category === filter);
    if (statusFilter !== 'all') result = result.filter(r => r.paymentStatus === statusFilter);
    return result;
  }, [records, getClient, filter, statusFilter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

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
            className={`ios-segment-btn ${statusFilter === 'pendiente' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pendiente')}
            style={{ color: statusFilter === 'pendiente' ? '#ff3b30' : '' }}
          >
            Deben
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
            <p>No hay servicios ni ventas en esta categoría.</p>
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
                      {client?.name ?? 'Clienta eliminada'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isSalon ? record.service : `${record.item} · ${record.color}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {formatDate(record.date)}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      {record.amount > 0 && (
                        <p style={{ fontSize: 13, fontWeight: 600, color: record.paymentStatus === 'pendiente' ? '#ff3b30' : 'var(--text-primary)' }}>
                          ${record.amount.toLocaleString('es-AR')}
                        </p>
                      )}
                      {record.paymentStatus === 'pendiente' && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#ff3b30', background: '#ff3b3015', padding: '1px 6px', borderRadius: 4 }}>
                          DEBE
                        </span>
                      )}
                    </div>
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
