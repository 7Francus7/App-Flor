'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { SearchIcon, ChevronRight, UserIcon, PlusIcon } from './Icons';

export default function ClientsScreen({ onClientSelect, onAddNewClient }: {
  onClientSelect: (id: string) => void;
  onAddNewClient: () => void;
}) {
  const { searchClients } = useStore();
  const [query, setQuery] = useState('');

  const filteredClients = searchClients(query);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Sticky Header with Search */}
      <div className="ios-nav" style={{ padding: '16px 16px 12px' }}>
        <h1 className="ios-nav-title" style={{ marginBottom: 16 }}>Clientas</h1>
        <div className="ios-search">
          <SearchIcon size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {filteredClients.length === 0 ? (
          <div className="ios-empty">
            <div className="ios-empty-icon">
              <UserIcon size={24} />
            </div>
            <h3>No se encontraron clientas</h3>
            <p>Intentá con otro nombre o agregá una nueva clienta.</p>
            <button 
              className="ios-btn-text" 
              style={{ marginTop: 12, fontWeight: 600 }}
              onClick={onAddNewClient}
            >
              <PlusIcon size={18} /> Agregar Clienta
            </button>
          </div>
        ) : (
          <div className="ios-list-group">
            {filteredClients.map((client) => (
              <div key={client.id} className="ios-list-item" onClick={() => onClientSelect(client.id)}>
                <div className="ios-avatar" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {client.name}
                  </p>
                  {client.phone && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {client.phone}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
