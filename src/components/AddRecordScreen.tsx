'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { ChevronLeft, ScissorsIcon, ShirtIcon } from './Icons';
import { PaymentMethod, ServiceCategory } from '@/types';
import AddClientSheet from './AddClientSheet';

export default function AddRecordScreen({ onBack, defaultCategory = 'peluqueria' }: {
  onBack: () => void;
  defaultCategory?: ServiceCategory;
}) {
  const { clients, activeCategory, setActiveCategory, addSalonRecord, addClothingRecord } = useStore();
  const [category, setCategory] = useState<ServiceCategory>(activeCategory || defaultCategory);
  const [showAddClient, setShowAddClient] = useState(false);
  
  // Form State
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceOrItem, setServiceOrItem] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentStatus, setPaymentStatus] = useState<'pagado' | 'pendiente'>('pagado');
  const [amount, setAmount] = useState('');
  const [observations, setObservations] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !serviceOrItem) return;

    const common = {
      date,
      paymentMethod,
      paymentStatus,
      amount: amount ? Number(amount) : 0,
      observations,
      images
    };

    if (category === 'peluqueria') {
      addSalonRecord(clientId, { ...common, service: serviceOrItem });
    } else {
      addClothingRecord(clientId, { ...common, item: serviceOrItem, size, color });
    }

    onBack();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em' }}>Nuevo Registro</span>
        <div style={{ width: 68 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {/* Category Toggle */}
        <div className="ios-segment" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`ios-segment-btn ${category === 'peluqueria' ? 'active' : ''}`}
            onClick={() => setCategory('peluqueria')}
          >
            ✂️ Peluquería
          </button>
          <button
            type="button"
            className={`ios-segment-btn ${category === 'ropa' ? 'active' : ''}`}
            onClick={() => setCategory('ropa')}
          >
            👗 Tienda
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Client Selection */}
          <p className="ios-section-header">Clienta</p>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Nombre</label>
              <select 
                value={clientId} 
                onChange={(e) => {
                  if (e.target.value === 'NEW') {
                    setShowAddClient(true);
                  } else {
                    setClientId(e.target.value);
                  }
                }}
                required
                style={{ color: clientId ? 'var(--text-primary)' : 'var(--text-placeholder)' }}
              >
                <option value="" disabled>Seleccionar...</option>
                <option value="NEW" style={{ fontWeight: 'bold', color: 'var(--accent-deep)' }}>+ Nueva Clienta</option>
                <optgroup label="Clientas Guardadas">
                  {clients.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="ios-input-row">
              <label>Fecha</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Service / Item Details */}
          <p className="ios-section-header">
            {category === 'peluqueria' ? 'Detalle del Servicio' : 'Detalle de la Prenda'}
          </p>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>{category === 'peluqueria' ? 'Servicio' : 'Prenda'}</label>
              <input 
                type="text" 
                placeholder={category === 'peluqueria' ? "Ej: Color + Mechas" : "Ej: Remera"}
                value={serviceOrItem}
                onChange={(e) => setServiceOrItem(e.target.value)}
                required
              />
            </div>
            
            {category === 'ropa' && (
              <>
                <div className="ios-input-row">
                  <label>Talle</label>
                  <input 
                    type="text" 
                    placeholder="Ej: M"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                </div>
                <div className="ios-input-row">
                  <label>Color</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Negro"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>
              </>
            )}
            
            <div className="ios-input-row" style={{ alignItems: 'flex-start' }}>
              <label style={{ paddingTop: 8 }}>Notas</label>
              <textarea 
                placeholder={category === 'peluqueria' ? "Ej: Fórmula del color usado..." : "Ej: Cambio pendiente..."}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Details */}
          <p className="ios-section-header">Pago y Estado</p>
          <div className="ios-input-group" style={{ marginBottom: 24 }}>
            <div className="ios-input-row">
              <label>Método</label>
              <select 
                value={paymentMethod} 
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">📱 Transferencia</option>
              </select>
            </div>
            <div className="ios-input-row">
              <label>Estado</label>
              <div className="ios-segment sm" style={{ maxWidth: 200 }}>
                <button 
                  type="button"
                  className={`ios-segment-btn ${paymentStatus === 'pagado' ? 'active' : ''}`}
                  onClick={() => setPaymentStatus('pagado')}
                >
                  Pagado
                </button>
                <button 
                  type="button"
                  className={`ios-segment-btn ${paymentStatus === 'pendiente' ? 'active' : ''}`}
                  onClick={() => setPaymentStatus('pendiente')}
                  style={{ color: paymentStatus === 'pendiente' ? '#ff3b30' : '' }}
                >
                  Debe
                </button>
              </div>
            </div>
            <div className="ios-input-row">
              <label>Monto</label>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>$</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ flex: 'none', width: '100px' }}
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <p className="ios-section-header">Fotos</p>
          <div className="ios-input-group" style={{ marginBottom: 32, padding: '12px 16px' }}>
             <button 
               type="button" 
               className="ios-btn-secondary" 
               onClick={() => alert('Función de cámara en desarrollo. Las fotos se guardarán localmente en el dispositivo.')}
               style={{ width: '100%', height: '80px', border: '1px dashed var(--separator)', background: 'transparent' }}
             >
               📸 Añadir Fotos (Antes/Después)
             </button>
          </div>

          <button 
            type="submit" 
            className="ios-btn-primary"
            style={{ marginBottom: 32 }}
          >
            Guardar {category === 'peluqueria' ? 'Servicio' : 'Venta'}
          </button>
        </form>
      </div>

      {showAddClient && (
        <AddClientSheet 
          onClose={() => setShowAddClient(false)} 
          onClientAdded={(id) => {
            setClientId(id);
            setShowAddClient(false);
          }}
        />
      )}
    </div>
  );
}
