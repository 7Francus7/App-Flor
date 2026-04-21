'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { ChevronLeft, PlusIcon, TrashIcon, DollarIcon } from './Icons';
import { Expense } from '@/types';

export default function ExpensesScreen({ onBack }: { onBack: () => void }) {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Expense Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Expense['category']>('insumos');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      description,
      amount: Number(amount),
      date,
      category,
    });
    setDescription(''); setAmount(''); setCategory('insumos');
    setShowAddForm(false);
  };

  const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="ios-nav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="ios-btn-text" style={{ padding: 0 }} onClick={onBack}>
          <ChevronLeft size={24} /> Volver
        </button>
        <span style={{ fontWeight: 600, fontSize: 17 }}>Gastos</span>
        <button className="ios-btn-icon" onClick={() => setShowAddForm(true)}>
          <PlusIcon size={24} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {expenses.length === 0 ? (
          <div className="ios-empty">
            <DollarIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h3>Sin gastos registrados</h3>
            <p>Registra tus costos para tener un balance real.</p>
          </div>
        ) : (
          <div className="ios-list-group">
            {sortedExpenses.map(e => (
              <div key={e.id} className="ios-list-item" style={{ padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{e.description}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {e.date} · <span style={{ textTransform: 'capitalize' }}>{e.category}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right', marginRight: 12 }}>
                  <p style={{ fontWeight: 700, color: '#ff3b30' }}>-${e.amount.toLocaleString('es-AR')}</p>
                </div>
                <button className="ios-btn-icon" style={{ color: 'var(--text-tertiary)' }} onClick={() => deleteExpense(e.id)}>
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
              <h2>Registrar Gasto</h2>
              <div style={{ width: 60 }} />
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 16 }}>
              <div className="ios-input-group" style={{ marginBottom: 24 }}>
                <div className="ios-input-row">
                  <label>Descripción</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ej: Tinturas Loreal" />
                </div>
                <div className="ios-input-row">
                  <label>Monto</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
                </div>
                <div className="ios-input-row">
                  <label>Fecha</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="ios-input-row">
                  <label>Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value as Expense['category'])}>
                    <option value="insumos">Insumos</option>
                    <option value="alquiler">Alquiler / Servicios</option>
                    <option value="ropa">Compra de Ropa</option>
                    <option value="publicidad">Publicidad</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="ios-btn-primary" style={{ background: '#ff3b30' }}>Guardar Gasto</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
