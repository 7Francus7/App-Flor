'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import {
  ChevronLeft, ScissorsIcon, ShirtIcon, TrashIcon, PaletteIcon, EditIcon,
  CheckIcon, WhatsAppIcon, ClockIcon, NoteIcon, DollarIcon, CreditCardIcon,
  PhoneIcon, BanknoteIcon, HistoryIcon,
} from './Icons';
import { ClientRecord, SalonRecord, ClothingRecord, PaymentMethod, RecordUpdateData, ServiceCategory, Payment } from '@/types';

function PaymentStatusBadge({ status }: { status: 'pagado' | 'pendiente' | 'parcial' }) {
  if (status === 'pagado') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#34c75918', color: '#34c759',
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        letterSpacing: '0.03em', textTransform: 'uppercase',
      }}>
        <CheckIcon size={10} /> Pagado
      </span>
    );
  }
  if (status === 'parcial') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#ff950018', color: '#ff9500',
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        letterSpacing: '0.03em', textTransform: 'uppercase',
      }}>
        Parcial
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#ff3b3015', color: '#ff3b30',
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      letterSpacing: '0.03em', textTransform: 'uppercase',
    }}>
      Pendiente
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const map = {
    efectivo: { label: 'Efectivo', icon: <DollarIcon size={11} />, cls: 'cash' },
    tarjeta: { label: 'Tarjeta', icon: <CreditCardIcon size={11} />, cls: 'card' },
    transferencia: { label: 'Transferencia', icon: <PhoneIcon size={11} />, cls: 'transfer' },
  };
  const { label, icon, cls } = map[method];
  return (
    <span className={`ios-badge ${cls}`}>
      {icon} {label}
    </span>
  );
}

export default function ClientProfile({ clientId, onBack }: {
  clientId: string;
  onBack: () => void;
}) {
  const {
    getClient, getClientRecords, deleteRecord, updateRecord,
    updateClient, deleteClient, getRecordPayments, addPayment, deletePayment, updatePayment,
  } = useStore();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesTemp, setNotesTemp] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Edit record state
  const [editingRecord, setEditingRecord] = useState<ClientRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editServiceOrItem, setEditServiceOrItem] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [editAmount, setEditAmount] = useState('');
  const [editObservations, setEditObservations] = useState('');

  // Register payment state
  const [payingRecord, setPayingRecord] = useState<ClientRecord | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');
  const [payObs, setPayObs] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Edit payment state
  const [editingPayment, setEditingPayment] = useState<{ payment: Payment; recordId: string } | null>(null);
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayAmount, setEditPayAmount] = useState('');
  const [editPayMethod, setEditPayMethod] = useState<PaymentMethod>('efectivo');
  const [editPayObs, setEditPayObs] = useState('');
  const [editPayError, setEditPayError] = useState<string | null>(null);

  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="ios-empty" style={{ height: '100dvh' }}>
        <h3>Clienta no encontrada</h3>
        <button className="ios-btn-text" onClick={onBack}>Volver</button>
      </div>
    );
  }

  const allRecords = getClientRecords(clientId);
  const totalVisits = allRecords.length;
  const records = getClientRecords(clientId, filter === 'all' ? undefined : filter);

  // Calculate total pending debt across all records
  const pendingDebt = allRecords.reduce((sum, r) => {
    if (r.paymentStatus === 'pagado') return sum;
    const paid = getRecordPayments(r.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, r.amount - paid);
  }, 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
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
    setEditAmount(record.amount > 0 ? record.amount.toString() : '');
    setEditObservations(record.observations || '');
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editServiceOrItem) return;
    const base: RecordUpdateData = {
      date: editDate,
      paymentMethod: editPaymentMethod,
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

  // --- Payment handlers ---
  const openRegisterPayment = (record: ClientRecord) => {
    const paid = getRecordPayments(record.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, record.amount - paid);
    setPayingRecord(record);
    setPayAmount(remaining > 0 ? remaining.toString() : '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayMethod('efectivo');
    setPayObs('');
    setPayError(null);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRecord || !payAmount || isSubmittingPayment) return;
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError('Ingresá un monto válido mayor a $0.');
      return;
    }
    // Validate against remaining balance
    const existingPaid = getRecordPayments(payingRecord.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, payingRecord.amount - existingPaid);
    if (amount > remaining) {
      setPayError(`El monto supera el saldo restante de $${remaining.toLocaleString('es-AR')}.`);
      return;
    }
    setPayError(null);
    setIsSubmittingPayment(true);
    try {
      await addPayment(payingRecord.id, { date: payDate, amount, paymentMethod: payMethod, observations: payObs || undefined });
      showToast('Pago registrado', undefined, 'success');
      setPayingRecord(null);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDeletePayment = (payment: Payment, recordId: string) => {
    if (!confirm('¿Eliminar este pago? Se puede deshacer por 5 segundos.')) return;
    const undo = deletePayment(payment.id, recordId);
    showToast('Pago eliminado', undo);
  };

  const openEditPayment = (payment: Payment, recordId: string) => {
    setEditingPayment({ payment, recordId });
    setEditPayDate(payment.date);
    setEditPayAmount(payment.amount.toString());
    setEditPayMethod(payment.paymentMethod);
    setEditPayObs(payment.observations || '');
    setEditPayError(null);
  };

  const handleSaveEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amount = Number(editPayAmount);
    if (isNaN(amount) || amount <= 0) {
      setEditPayError('Ingresá un monto válido mayor a $0.');
      return;
    }
    // Validate: sum of all OTHER payments for this record + new amount <= record.amount
    const record = allRecords.find(r => r.id === editingPayment.recordId);
    if (record) {
      const otherPaid = getRecordPayments(editingPayment.recordId)
        .filter(p => p.id !== editingPayment.payment.id)
        .reduce((s, p) => s + p.amount, 0);
      const maxAllowed = Math.max(0, record.amount - otherPaid);
      if (amount > maxAllowed) {
        setEditPayError(`El monto supera el saldo disponible de $${maxAllowed.toLocaleString('es-AR')}.`);
        return;
      }
    }
    setEditPayError(null);
    updatePayment(editingPayment.payment.id, {
      date: editPayDate,
      amount,
      paymentMethod: editPayMethod,
      observations: editPayObs || undefined,
    }, editingPayment.recordId);
    setEditingPayment(null);
    showToast('Pago actualizado', undefined, 'success');
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
                const recordPayments = getRecordPayments(record.id);
                const totalPaid = recordPayments.reduce((s, p) => s + p.amount, 0);
                const remaining = Math.max(0, record.amount - totalPaid);
                const isFullyPaid = record.paymentStatus === 'pagado';
                const isPartial = record.paymentStatus === 'parcial';
                const isPending = record.paymentStatus === 'pendiente';

                const cardBorder = isPending
                  ? '1px solid #ff3b3040'
                  : isPartial
                  ? '1px solid #ff950040'
                  : 'none';

                return (
                  <div key={record.id} className="ios-card" style={{ position: 'relative', border: cardBorder, overflow: 'hidden' }}>
                    {/* Card Header */}
                    <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--separator-opaque)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 5 }}>
                          {formatDate(record.date)}
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <div className={`ios-badge ${isSalon ? 'salon' : 'clothing'}`}>
                            {isSalon ? <ScissorsIcon size={12} /> : <ShirtIcon size={12} />}
                            {isSalon ? 'Peluquería' : 'Tienda'}
                          </div>
                          <PaymentStatusBadge status={record.paymentStatus} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          className="ios-btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--accent)' }}
                          onClick={() => openEditRecord(record)}
                          title="Editar"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          className="ios-btn-icon"
                          style={{ width: 28, height: 28, color: 'var(--text-tertiary)' }}
                          onClick={() => handleDeleteRecord(record)}
                          title="Eliminar"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
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
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 17, fontWeight: 700 }}>
                              ${record.amount.toLocaleString('es-AR')}
                            </div>
                            {!isFullyPaid && totalPaid > 0 && (
                              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                total
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {record.observations && (
                        <div style={{ background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 8, marginBottom: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>Observaciones</p>
                          <p style={{ fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{record.observations}</p>
                        </div>
                      )}

                      {record.images && record.images.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto' }}>
                          {record.images.map((img, i) => (
                            <div key={i} style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)' }}>
                              <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Payment Summary */}
                      {record.amount > 0 && (
                        <div style={{
                          background: 'var(--bg-tertiary)',
                          borderRadius: 10,
                          padding: '12px 14px',
                          marginBottom: 12,
                        }}>
                          {/* Summary row */}
                          <div style={{ display: 'flex', gap: 16, marginBottom: recordPayments.length > 0 ? 12 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Total</p>
                              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                                ${record.amount.toLocaleString('es-AR')}
                              </p>
                            </div>
                            {totalPaid > 0 && (
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Pagado</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#34c759' }}>
                                  ${totalPaid.toLocaleString('es-AR')}
                                </p>
                              </div>
                            )}
                            {remaining > 0 && (
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Restante</p>
                                <p style={{ fontSize: 15, fontWeight: 700, color: '#ff3b30' }}>
                                  ${remaining.toLocaleString('es-AR')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Payment history */}
                          {recordPayments.length > 0 && (
                            <div>
                              <div style={{ height: '0.5px', background: 'var(--separator-opaque)', marginBottom: 10 }} />
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <HistoryIcon size={11} /> Pagos realizados
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {recordPayments.map((payment) => (
                                  <div key={payment.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        ${payment.amount.toLocaleString('es-AR')}
                                      </span>
                                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}>
                                        {formatDateShort(payment.date)}
                                      </span>
                                      {payment.observations && (
                                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6 }}>
                                          · {payment.observations}
                                        </span>
                                      )}
                                    </div>
                                    <PaymentMethodBadge method={payment.paymentMethod} />
                                    <button
                                      onClick={() => openEditPayment(payment, record.id)}
                                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex' }}
                                      title="Editar pago"
                                    >
                                      <EditIcon size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePayment(payment, record.id)}
                                      style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: '#ff3b3080', display: 'flex' }}
                                      title="Eliminar pago"
                                    >
                                      <TrashIcon size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer row: method badge + register payment button */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <PaymentMethodBadge method={record.paymentMethod} />
                        {!isFullyPaid && (
                          <button
                            onClick={() => openRegisterPayment(record)}
                            className="ios-btn-secondary"
                            style={{ padding: '7px 14px', fontSize: 13, gap: 5, flexShrink: 0 }}
                          >
                            <BanknoteIcon size={14} /> Registrar pago
                          </button>
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

      {/* ── Register Payment Sheet ── */}
      {payingRecord && (() => {
        const paidSoFar = getRecordPayments(payingRecord.id).reduce((s, p) => s + p.amount, 0);
        const remainingBalance = Math.max(0, payingRecord.amount - paidSoFar);
        const serviceName = payingRecord.category === 'peluqueria'
          ? (payingRecord as SalonRecord).service
          : (payingRecord as ClothingRecord).item;
        return (
          <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setPayingRecord(null); }}>
            <div className="ios-sheet" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
              <div className="ios-sheet-handle" />
              <div className="ios-sheet-header">
                <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setPayingRecord(null)}>Cancelar</button>
                <h2>Registrar Pago</h2>
                <div style={{ width: 68 }} />
              </div>
              <div style={{ padding: '4px 16px 12px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{serviceName}</p>
                <div style={{ display: 'inline-flex', gap: 16, background: 'var(--bg-tertiary)', borderRadius: 10, padding: '8px 16px' }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Total</p>
                    <p style={{ fontSize: 14, fontWeight: 700 }}>${payingRecord.amount.toLocaleString('es-AR')}</p>
                  </div>
                  {paidSoFar > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Pagado</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#34c759' }}>${paidSoFar.toLocaleString('es-AR')}</p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Restante</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#ff3b30' }}>${remainingBalance.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmitPayment} style={{ padding: '8px 16px 16px' }}>
                <div className="ios-input-group" style={{ marginBottom: payError ? 8 : 24 }}>
                  <div className="ios-input-row">
                    <label>Fecha del pago</label>
                    <input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div className="ios-input-row">
                    <label>Monto</label>
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={payAmount}
                        onChange={e => { setPayAmount(e.target.value); setPayError(null); }}
                        min="1"
                        required
                        autoFocus
                        style={{ flex: 'none', width: '110px', borderColor: payError ? '#ff3b30' : undefined }}
                      />
                    </div>
                  </div>
                  <div className="ios-input-row">
                    <label>Método</label>
                    <select value={payMethod} onChange={e => setPayMethod(e.target.value as PaymentMethod)}>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                    <label style={{ paddingTop: 8 }}>Nota</label>
                    <textarea value={payObs} onChange={e => setPayObs(e.target.value)} placeholder="Opcional..." style={{ resize: 'none', minHeight: 60 }} />
                  </div>
                </div>
                {payError && (
                  <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 16, padding: '8px 12px', background: '#ff3b3010', borderRadius: 8 }}>
                    {payError}
                  </p>
                )}
                <button type="submit" className="ios-btn-primary" style={{ marginBottom: 8 }} disabled={isSubmittingPayment}>
                  {isSubmittingPayment ? 'Guardando...' : 'Confirmar Pago'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ── Edit Payment Sheet ── */}
      {editingPayment && (
        <div className="ios-sheet-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setEditingPayment(null); }}>
          <div className="ios-sheet" style={{ maxHeight: '80dvh', overflowY: 'auto' }}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" style={{ padding: 0 }} onClick={() => setEditingPayment(null)}>Cancelar</button>
              <h2>Editar Pago</h2>
              <div style={{ width: 68 }} />
            </div>
            <form onSubmit={handleSaveEditPayment} style={{ padding: '16px' }}>
              <div className="ios-input-group" style={{ marginBottom: editPayError ? 8 : 24 }}>
                <div className="ios-input-row">
                  <label>Fecha del pago</label>
                  <input type="date" value={editPayDate} onChange={e => setEditPayDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="ios-input-row">
                  <label>Monto</label>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={editPayAmount}
                      onChange={e => { setEditPayAmount(e.target.value); setEditPayError(null); }}
                      min="1"
                      required
                      style={{ flex: 'none', width: '110px', borderColor: editPayError ? '#ff3b30' : undefined }}
                    />
                  </div>
                </div>
                <div className="ios-input-row">
                  <label>Método</label>
                  <select value={editPayMethod} onChange={e => setEditPayMethod(e.target.value as PaymentMethod)}>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
                <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
                  <label style={{ paddingTop: 8 }}>Nota</label>
                  <textarea value={editPayObs} onChange={e => setEditPayObs(e.target.value)} placeholder="Opcional..." style={{ resize: 'none', minHeight: 60 }} />
                </div>
              </div>
              {editPayError && (
                <p style={{ fontSize: 13, color: '#ff3b30', marginBottom: 16, padding: '8px 12px', background: '#ff3b3010', borderRadius: 8 }}>
                  {editPayError}
                </p>
              )}
              <button type="submit" className="ios-btn-primary" style={{ marginBottom: 8 }}>
                Guardar Cambios
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Record Sheet ── */}
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
                  <label>Monto Total</label>
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

      {/* ── Edit Profile Sheet ── */}
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
