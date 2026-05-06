'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, ScissorsIcon, ShirtIcon, TrashIcon, PaletteIcon, EditIcon, CheckIcon, WhatsAppIcon, ClockIcon, SendIcon, NoteIcon, DollarIcon, CreditCardIcon, PhoneIcon } from './Icons';
import { ClientRecord, PaymentMethod, RecordUpdateData, ServiceCategory } from '@/types';

export default function ClientProfile({ clientId, onBack }: {
  clientId: string;
  onBack: () => void;
}) {
  const { getClient, getClientRecords, deleteRecord, updateRecord, updateClient, deleteClient } = useStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editServiceOrItem, setEditServiceOrItem] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [editAmount, setEditAmount] = useState('');
  const [editObservations, setEditObservations] = useState('');

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
  const totalVisits = getClientRecords(clientId).length;
  const pendingDebt = getClientRecords(clientId).reduce((sum, r) => r.paymentStatus === 'pendiente' ? sum + r.amount : sum, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleWhatsAppAction = (type: 'recordar' | 'agradecer' | 'ficha' | 'directo') => {
    if (!client?.phone) return;
    const cleanPhone = client.phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    let message = '';
    if (type === 'recordar') {
      message = `Hola ${client.name}! Te escribo para recordarte tu turno en Flor Peluquería/Tienda. Te esperamos!`;
    } else if (type === 'agradecer') {
      message = `Hola ${client.name}! Muchas gracias por tu visita de hoy. Espero que te haya gustado todo. Nos vemos pronto!`;
    } else if (type === 'ficha') {
      message = `Hola ${client.name}! Aquí tienes los detalles de tu última visita: ${client.notes || 'Sin notas'}`;
    }
    window.open(`https://wa.me/${cleanPhone}${message ? `?text=${encodeURIComponent(message)}` : ''}`, '_blank');
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

  const openEditRecord = (record: ClientRecord) => {
    setEditingRecord(record);
    setEditDate(record.date);
    setEditServiceOrItem(record.category === 'peluqueria' ? record.service : record.item);
    setEditSize(record.category === 'ropa' ? record.size : '');
    setEditColor(record.category === 'ropa' ? record.color : '');
    setEditPaymentMethod(record.paymentMethod);
    setEditPaymentStatus(record.paymentStatus);
    setEditAmount(record.amount > 0 ? record.amount.toString() : '');
    setEditObservations(record.observations || '');
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editServiceOrItem) return;
    const base: RecordUpdateData = {
      date: editDate,
      paymentMethod: editPaymentMethod,
      paymentStatus: editPaymentStatus,
      amount: editAmount ? Number(editAmount) : 0,
      observations: editObservations,
    };
    if (editingRecord.category === 'peluqueria') {
      updateRecord(editingRecord.id, { ...base, service: editServiceOrItem });
    } else {
      updateRecord(editingRecord.id, { ...base, item: editServiceOrItem, size: editSize, color: editColor });
    }
    setEditingRecord(null);
  };

  const handleMarkAsPaid = (record: ClientRecord) => {
    updateRecord(record.id, { paymentStatus: 'pagado' });
    showToast('Pago registrado', undefined, 'success');
  };

  const handleDeleteRecord = (record: ClientRecord) => {
    if (!confirm('¿Eliminar este registro del historial?')) return;
    const undo = deleteRecord(record.id);
    showToast('Registro eliminado', undo);
  };

  const handleDeleteClient = () => {
    if (!confirm('¿Estás segura de que querés eliminar a esta clienta y todo su historial? Esta acción se puede deshacer por 5 segundos.')) return;
    const undo = deleteClient(clientId);
    showToast(`Clienta "${client.name}" eliminada`, undo);
    onBack();
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
        <div style={{ padding: '28px 16px 24px', textAlign: 'center', background: 'var(--bg-secondary)', borderBottom: '0.5px solid var(--separator-opaque)' }}>
          <div className="ios-avatar lg" style={{
            background: 'linear-gradient(135deg, var(--accent-bg) 0%, rgba(212,160,160,0.2) 100%)',
            color: 'var(--accent-deep)',
            margin: '0 auto 16px',
            fontSize: 36,
            boxShadow: '0 4px 16px rgba(212,160,160,0.25)',
          }}>
            {client.name.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>
            {client.name}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <div style={{ background: 'var(--accent-bg)', borderRadius: 14, padding: '12px 24px', minWidth: 84 }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{totalVisits}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Visitas</p>
            </div>
            {pendingDebt > 0 && (
              <div style={{ background: 'rgba(255,59,48,0.07)', borderRadius: 14, padding: '12px 24px', minWidth: 84 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#ff3b30', lineHeight: 1 }}>${pendingDebt.toLocaleString('es-AR')}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Debe</p>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp Actions */}
        {client.phone && (
          <div style={{ padding: '16px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => handleWhatsAppAction('directo')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, background: '#25D36615', color: '#25D366', borderColor: '#25D36630', gap: 5 }}>
              <WhatsAppIcon size={14} /> Chatear
            </button>
            <button onClick={() => handleWhatsAppAction('recordar')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, gap: 5 }}>
              <ClockIcon size={14} /> Recordar
            </button>
            <button onClick={() => handleWhatsAppAction('agradecer')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, gap: 5 }}>
              <CheckIcon size={14} /> Agradecer
            </button>
            <button onClick={() => handleWhatsAppAction('ficha')} className="ios-btn-secondary" style={{ flexShrink: 0, padding: '8px 14px', fontSize: 13, gap: 5 }}>
              <NoteIcon size={14} /> Ficha
            </button>
          </div>
        )}

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
                {client.notes || 'No hay notas registradas para esta clienta.'}
              </p>
            )}
          </div>
        </div>

        {/* History Filters */}
        <p className="ios-section-header">Historial de Visitas</p>
        <div style={{ padding: '0 16px 16px' }}>
          <div className="ios-segment">
            <button className={`ios-segment-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todo</button>
            <button className={`ios-segment-btn ${filter === 'peluqueria' ? 'active' : ''}`} onClick={() => setFilter('peluqueria')}>Peluquería</button>
            <button className={`ios-segment-btn ${filter === 'ropa' ? 'active' : ''}`} onClick={() => setFilter('ropa')}>Ropa</button>
          </div>
        </div>

        {/* History List */}
        <div style={{ padding: '0 16px' }}>
          {records.length === 0 ? (
            <div className="ios-empty" style={{ padding: '32px 0' }}>
              <p>No hay historial registrado.</p>
            </div>
          ) : (
            <div className="history-cards">
              {records.map((record) => {
                const isSalon = record.category === 'peluqueria';
                return (
                  <div key={record.id} className="ios-card" style={{ position: 'relative', border: record.paymentStatus === 'pendiente' ? '1px solid #ff3b3050' : 'none' }}>
                    {/* Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator-opaque)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 5 }}>
                          {formatDate(record.date)}
                        </p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <div className={`ios-badge ${isSalon ? 'salon' : 'clothing'}`}>
                            {isSalon ? <ScissorsIcon size={12} /> : <ShirtIcon size={12} />}
                            {isSalon ? 'Peluquería' : 'Tienda'}
                          </div>
                          {record.paymentStatus === 'pendiente' && (
                            <div className="ios-badge" style={{ background: '#ff3b3015', color: '#ff3b30', fontWeight: 700 }}>DEBE</div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {record.paymentStatus === 'pendiente' && (
                          <button
                            className="ios-btn-icon"
                            style={{ width: 28, height: 28, color: '#34c759' }}
                            title="Marcar como pagado"
                            onClick={() => handleMarkAsPaid(record)}
                          >
                            <CheckIcon size={16} />
                          </button>
                        )}
                        <button
                          className="ios-btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--accent)' }}
                          onClick={() => openEditRecord(record)}
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="ios-btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
                          onClick={() => handleDeleteRecord(record)}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h4 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>
                            {isSalon ? record.service : record.item}
                          </h4>
                          {!isSalon && (
                            <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                              Talle: {record.size} · Color: {record.color}
                            </p>
                          )}
                        </div>
                        {record.amount > 0 && (
                          <div style={{ fontSize: 17, fontWeight: 700, color: record.paymentStatus === 'pendiente' ? '#ff3b30' : 'inherit' }}>
                            ${record.amount.toLocaleString('es-AR')}
                          </div>
                        )}
                      </div>

                      {record.observations && (
                        <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 8, marginTop: 8 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Observaciones</p>
                          <p style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{record.observations}</p>
                        </div>
                      )}

                      {record.images && record.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
                          {record.images.map((img, i) => (
                            <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', marginTop: 12, gap: 8 }}>
                        <span className={`ios-badge ${record.paymentMethod === 'efectivo' ? 'cash' : record.paymentMethod === 'tarjeta' ? 'card' : 'transfer'}`}>
                          {record.paymentMethod === 'efectivo'
                            ? <><DollarIcon size={11} /> Efectivo</>
                            : record.paymentMethod === 'tarjeta'
                            ? <><CreditCardIcon size={11} /> Tarjeta</>
                            : <><PhoneIcon size={11} /> Transferencia</>}
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

      {/* Edit Record Sheet */}
      {editingRecord && (
        <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditingRecord(null); }}>
          <div className="ios-sheet" style={{ maxHeight: '90dvh', overflowY: 'auto' }}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setEditingRecord(null)}>Cancelar</button>
              <h2>Editar Registro</h2>
              <div style={{ width: 68 }} />
            </div>

            <form onSubmit={handleSaveRecord} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: 20 }}>
                <div className="ios-input-row">
                  <label>Fecha</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="ios-input-row">
                  <label>{editingRecord.category === 'peluqueria' ? 'Servicio' : 'Prenda'}</label>
                  <input type="text" value={editServiceOrItem} onChange={(e) => setEditServiceOrItem(e.target.value)} required />
                </div>
                {editingRecord.category === 'ropa' && (
                  <>
                    <div className="ios-input-row">
                      <label>Talle</label>
                      <input type="text" value={editSize} onChange={(e) => setEditSize(e.target.value)} />
                    </div>
                    <div className="ios-input-row">
                      <label>Color</label>
                      <input type="text" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                  <label style={{ paddingTop: 8 }}>Notas</label>
                  <textarea value={editObservations} onChange={(e) => setEditObservations(e.target.value)} placeholder="Fórmulas, observaciones..." />
                </div>
              </div>

              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Método</label>
                  <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="ios-input-row">
                  <label>Estado</label>
                  <div className="ios-segment sm" style={{ maxWidth: 200 }}>
                    <button type="button" className={`ios-segment-btn ${editPaymentStatus === 'pagado' ? 'active' : ''}`} onClick={() => setEditPaymentStatus('pagado')}>Pagado</button>
                    <button type="button" className={`ios-segment-btn ${editPaymentStatus === 'pendiente' ? 'active' : ''}`} onClick={() => setEditPaymentStatus('pendiente')} style={{ color: editPaymentStatus === 'pendiente' ? '#ff3b30' : '' }}>Debe</button>
                  </div>
                </div>
                <div className="ios-input-row">
                  <label>Monto</label>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                    <input type="number" placeholder="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} min="0" style={{ flex: 'none', width: '100px' }} />
                  </div>
                </div>
              </div>

              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 16 }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Sheet */}
      {isEditingProfile && (
        <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsEditingProfile(false); }}>
          <div className="ios-sheet">
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0, opacity: 0, pointerEvents: 'none' }}>_</button>
              <h2>Editar Clienta</h2>
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setIsEditingProfile(false)}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required autoFocus />
                </div>
                <div className="ios-input-row">
                  <label>Teléfono</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Ej: 11 1234-5678" />
                </div>
              </div>

              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 16 }}>
                Guardar Cambios
              </button>

              <button
                type="button"
                onClick={handleDeleteClient}
                style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--danger)', border: 'none', fontSize: 17, fontWeight: 500, cursor: 'pointer' }}
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
