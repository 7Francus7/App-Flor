'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { ChevronLeft, PlusIcon, TrashIcon, PackageIcon } from './Icons';

export default function InventoryScreen({ onBack }: { onBack: () => void }) {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Product Form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({
      name,
      price: Number(price),
      stock: Number(stock),
      category: 'ropa',
      size,
      color,
    });
    setName(''); setPrice(''); setStock(''); setSize(''); setColor('');
    setShowAddForm(false);
  };

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>Inventario</span>
        <button className="ios-btn-icon" onClick={() => setShowAddForm(true)}>
          <PlusIcon size={24} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {products.length === 0 ? (
          <div className="ios-empty">
            <PackageIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>Sin productos</h3>
            <p>Empezá cargando tus prendas para controlar el stock.</p>
          </div>
        ) : (
          <div className="ios-list-group">
            {products.map(p => (
              <div key={p.id} className="ios-list-item" style={{ padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Talle: {p.size || '-'} · Color: {p.color || '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12 }}>
                  <p style={{ fontWeight: 700, color: 'var(--accent)' }}>${p.price.toLocaleString('es-AR')}</p>
                  <p style={{ fontSize: 12, color: p.stock < 3 ? '#ff3b30' : 'var(--text-secondary)', fontWeight: 600 }}>
                    Stock: {p.stock}
                  </p>
                </div>
                <button className="ios-btn-icon" style={{ color: 'var(--text-tertiary)' }} onClick={() => deleteProduct(p.id)}>
                  <TrashIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="ios-sheet-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="ios-sheet" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <h2>Nueva Prenda</h2>
              <div style={{ width: 60 }} />
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 16 }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Remera Algodón" />
                </div>
                <div className="ios-input-row">
                  <label>Precio</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
                </div>
                <div className="ios-input-row">
                  <label>Stock Inicial</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} required placeholder="0" />
                </div>
                <div className="ios-input-row">
                  <label>Talle</label>
                  <input type="text" value={size} onChange={e => setSize(e.target.value)} placeholder="M, L, 42..." />
                </div>
                <div className="ios-input-row">
                  <label>Color</label>
                  <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Negro, Blanco..." />
                </div>
              </div>
              <button type="submit" className="ios-btn-primary">Guardar Producto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
