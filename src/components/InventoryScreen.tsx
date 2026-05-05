'use client';

import React, { useMemo, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { useToast } from '@/context/ToastContext';
import { ChevronLeft, PlusIcon, TrashIcon, PackageIcon, EditIcon } from './Icons';
import { Product } from '@/types';

export default function InventoryScreen({ onBack }: { onBack: () => void }) {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );
  const lowStockProducts = useMemo(
    () => sortedProducts.filter((p) => p.stock <= 2),
    [sortedProducts]
  );
  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + p.price * p.stock, 0),
    [products]
  );

  // Add form
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');

  // Edit form (reuses same fields)
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editColor, setEditColor] = useState('');

  const resetAddForm = () => { setName(''); setPrice(''); setStock(''); setSize(''); setColor(''); };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct({ name, price: Number(price), stock: Number(stock), category: 'ropa', size, color });
    resetAddForm();
    setShowAddForm(false);
    showToast('Producto agregado', undefined, 'success');
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditPrice(p.price.toString());
    setEditStock(p.stock.toString());
    setEditSize(p.size || '');
    setEditColor(p.color || '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, {
      name: editName,
      price: Number(editPrice),
      stock: Number(editStock),
      size: editSize,
      color: editColor,
    });
    setEditingProduct(null);
    showToast('Producto actualizado', undefined, 'success');
  };

  const handleDelete = (p: Product) => {
    if (!confirm(`¿Eliminar "${p.name}" del inventario?`)) return;
    const undo = deleteProduct(p.id);
    showToast(`"${p.name}" eliminado`, undo);
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

      <div className="screen-content" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        {products.length > 0 && (
          <div className="stats-grid" style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
            <div className="ios-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Productos</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{products.length}</p>
            </div>
            <div className="ios-card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock Bajo</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: lowStockProducts.length > 0 ? '#ff3b30' : 'var(--text-primary)' }}>
                {lowStockProducts.length}
              </p>
            </div>
            <div className="ios-card" style={{ padding: 16, gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>Valor Total en Stock</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
                ${totalValue.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="ios-empty">
            <PackageIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>Sin productos</h3>
            <p>Empezá cargando tus prendas para controlar el stock.</p>
          </div>
        ) : (
          <div className="ios-list-group">
            {sortedProducts.map(p => (
              <div key={p.id} className="ios-list-item" style={{ padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Talle: {p.size || '-'} · Color: {p.color || '-'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <p style={{ fontWeight: 700, color: 'var(--accent)' }}>${p.price.toLocaleString('es-AR')}</p>
                  <p style={{ fontSize: 12, color: p.stock <= 2 ? '#ff3b30' : 'var(--text-secondary)', fontWeight: 600 }}>
                    Stock: {p.stock}
                  </p>
                </div>
                <button className="ios-btn-icon" style={{ color: 'var(--accent)', marginRight: 4 }} onClick={() => openEdit(p)}>
                  <EditIcon size={18} />
                </button>
                <button className="ios-btn-icon" style={{ color: 'var(--text-tertiary)' }} onClick={() => handleDelete(p)}>
                  <TrashIcon size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Sheet */}
      {showAddForm && (
        <div className="ios-sheet-backdrop" onClick={() => setShowAddForm(false)}>
          <div className="ios-sheet" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <h2>Nueva Prenda</h2>
              <div style={{ width: 60 }} />
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: 16 }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: Remera Algodón" autoFocus />
                </div>
                <div className="ios-input-row">
                  <label>Precio</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" min="0" />
                </div>
                <div className="ios-input-row">
                  <label>Stock</label>
                  <input type="number" value={stock} onChange={e => setStock(e.target.value)} required placeholder="0" min="0" />
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

      {/* Edit Product Sheet */}
      {editingProduct && (
        <div className="ios-sheet-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="ios-sheet" onClick={e => e.stopPropagation()}>
            <div className="ios-sheet-handle" />
            <div className="ios-sheet-header">
              <button className="ios-btn-text" onClick={() => setEditingProduct(null)}>Cancelar</button>
              <h2>Editar Prenda</h2>
              <div style={{ width: 60 }} />
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 16 }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Nombre</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required autoFocus />
                </div>
                <div className="ios-input-row">
                  <label>Precio</label>
                  <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} required min="0" />
                </div>
                <div className="ios-input-row">
                  <label>Stock</label>
                  <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} required min="0" />
                </div>
                <div className="ios-input-row">
                  <label>Talle</label>
                  <input type="text" value={editSize} onChange={e => setEditSize(e.target.value)} placeholder="M, L, 42..." />
                </div>
                <div className="ios-input-row">
                  <label>Color</label>
                  <input type="text" value={editColor} onChange={e => setEditColor(e.target.value)} placeholder="Negro, Blanco..." />
                </div>
              </div>
              <button type="submit" className="ios-btn-primary">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
