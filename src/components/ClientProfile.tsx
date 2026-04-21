'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { ChevronLeft, ScissorsIcon, ShirtIcon, TrashIcon, PaletteIcon, EditIcon, CheckIcon } from './Icons';
import { ServiceCategory } from '@/types';

export default function ClientProfile({ clientId, onBack }: {
  clientId: string;
  onBack: () => void;
}) {
  const { getClient, getClientRecords, deleteRecord, updateClient, deleteClient } = useStore();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');
  
  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  const client = getClient(clientId);
  
  if (!client) {
    return (
      <div className="ios-empty" style={{ height: '100dvh' }}>
        <h3>Clienta no encontrada</h3>
        <button className="ios-btn-text" onClick={onBack}>Volver</button>
      </div>
    );
  }

  const records = getClientRecords(clientId, filter === 'all' ? undefined : filter);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleSaveNotes = () => {
    updateClient(clientId, { notes: notesTemp });
    setIsEditingNotes(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateClient(clientId, { name: editName, phone: editPhone });
    setIsEditingProfile(false);
  };

  const handleDeleteClient = () => {
    if (confirm('¿Estás segura de que querés eliminar a esta clienta y todo su historial? Esta acción no se puede deshacer.')) {
      deleteClient(clientId);
      onBack();
    }
  };

  const handleOpenWhatsApp = () => {
    if (!client?.phone) return;
    const cleanPhone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      {/* Navigation Bar */}
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>Perfil</span>
        <button 
          className="ios-btn-text" 
          style={{ padding: 0, fontSize: 15 }} 
          onClick={() => {
            setEditName(client.name);
            setEditPhone(client.phone || '');
            setIsEditingProfile(true);
          }}
        >
          Editar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {/* Profile Header */}
        <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--separator-opaque)' }}>
          <div className="ios-avatar lg" style={{ background: 'var(--accent-bg)', color: 'var(--accent-deep)', margin: '0 auto 16px' }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {client.name}
          </h2>
          {client.phone && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                {client.phone}
              </p>
              <button 
                onClick={handleOpenWhatsApp}
                style={{ 
                  background: '#25D366', color: 'white', border: 'none', 
                  borderRadius: 12, padding: '4px 10px', fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Notes / Formulas Section */}
        <div style={{ padding: '24px 16px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p className="ios-section-header" style={{ padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PaletteIcon size={16} /> Fórmulas y Notas Generales
            </p>
            {!isEditingNotes ? (
              <button className="ios-btn-text" style={{ padding: 0, fontSize: 13 }} onClick={() => { setNotesTemp(client.notes || ''); setIsEditingNotes(true); }}>
                Editar
              </button>
            ) : (
              <button className="ios-btn-text" style={{ padding: 0, fontSize: 13 }} onClick={handleSaveNotes}>
                Guardar
              </button>
            )}
          </div>
          
          <div className="ios-card" style={{ padding: isEditingNotes ? 0 : 16 }}>
            {isEditingNotes ? (
              <textarea
                value={notesTemp}
                onChange={(e) => setNotesTemp(e.target.value)}
                placeholder="Anota aquí fórmulas de color, gustos, o cualquier detalle importante de la clienta..."
                style={{ width: '100%', border: 'none', padding: 16, fontSize: 15, fontFamily: 'inherit', outline: 'none', resize: 'none', minHeight: 100, background: 'transparent' }}
                autoFocus
              />
            ) : (
              <p style={{ fontSize: 15, color: client.notes ? 'var(--text-primary)' : 'var(--text-tertiary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {client.notes || 'No hay notas registradas para esta clienta. Presiona Editar para agregar fórmulas o detalles importantes.'}
              </p>
            )}
          </div>
        </div>

        {/* History Filters */}
        <p className="ios-section-header">Historial de Visitas</p>
        <div style={{ padding: '0 16px 16px' }}>
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

        {/* History List */}
        <div style={{ padding: '0 16px' }}>
          {records.length === 0 ? (
            <div className="ios-empty" style={{ padding: '32px 0' }}>
              <p>No hay historial registrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {records.map((record) => {
                const isSalon = record.category === 'peluqueria';
                return (
                  <div key={record.id} className="ios-card" style={{ position: 'relative' }}>
                    {/* Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator-opaque)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`ios-badge ${isSalon ? 'salon' : 'clothing'}`}>
                          {isSalon ? <ScissorsIcon size={12} style={{ marginRight: 4 }} /> : <ShirtIcon size={12} style={{ marginRight: 4 }} />}
                          {isSalon ? 'Peluquería' : 'Tienda'}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'capitalize' }}>
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <button 
                        className="ios-btn-icon" 
                        style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
                        onClick={() => {
                          if(confirm('¿Eliminar este registro del historial?')) {
                            deleteRecord(record.id);
                          }
                        }}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
                            {isSalon ? (record as any).service : (record as any).item}
                          </h4>
                          {!isSalon && (
                            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                              Talle: {(record as any).size} · Color: {(record as any).color}
                            </p>
                          )}
                        </div>
                        {record.amount && (
                          <div style={{ fontSize: 17, fontWeight: 700 }}>
                            ${record.amount.toLocaleString('es-AR')}
                          </div>
                        )}
                      </div>

                      {/* Observations */}
                      {record.observations && (
                        <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 8, marginTop: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Observaciones del día</p>
                          <p style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{record.observations}</p>
                        </div>
                      )}

                      {/* Payment Method Badge */}
                      <div style={{ display: 'flex', marginTop: 12 }}>
                        <span className={`ios-badge ${record.paymentMethod === 'efectivo' ? 'cash' : record.paymentMethod === 'tarjeta' ? 'card' : 'transfer'}`}>
                          {record.paymentMethod === 'efectivo' ? '💵 Efectivo' : record.paymentMethod === 'tarjeta' ? '💳 Tarjeta' : '📱 Transferencia'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Sheet */}
      {isEditingProfile && (
        <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsEditingProfile(false); }}>
          <div className="ios-sheet">
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0, opacity: 0, pointerEvents: 'none' }}>Cancelar</button>
              <h2>Editar Clienta</h2>
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setIsEditingProfile(false)}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="ios-input-row">
                  <label>Teléfono</label>
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 16 }}>
                Guardar Cambios
              </button>
              
              <button 
                type="button" 
                onClick={handleDeleteClient}
                style={{ 
                  width: '100%', padding: '14px', background: 'transparent', 
                  color: 'var(--danger)', border: 'none', fontSize: 17, fontWeight: 500, cursor: 'pointer' 
                }}
              >
                Eliminar Clienta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
