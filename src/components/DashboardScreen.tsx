'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { ChartIcon, DollarIcon, CreditCardIcon, UsersIcon, PackageIcon, ScissorsIcon, ShirtIcon } from './Icons';

export default function DashboardScreen({ onGoToInventory, onGoToExpenses }: {
  onGoToInventory: () => void;
  onGoToExpenses: () => void;
}) {
  const { records, expenses, products, clients } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRecords = records.filter(r => r.date === todayStr);
    const weekRecords = records.filter(r => new Date(r.date) >= startOfWeek);
    const monthRecords = records.filter(r => new Date(r.date) >= startOfMonth);

    const totalToday = todayRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalMonth = monthRecords.reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpensesMonth = expenses
      .filter(e => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingAmount = records
      .filter(r => r.paymentStatus === 'pendiente')
      .reduce((sum, r) => sum + r.amount, 0);

    const paymentMethods = records.reduce((acc, r) => {
      acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalToday,
      totalMonth,
      totalExpensesMonth,
      pendingAmount,
      paymentMethods,
      salonRevenue: monthRecords.filter(r => r.category === 'peluqueria').reduce((sum, r) => sum + r.amount, 0),
      clothingRevenue: monthRecords.filter(r => r.category === 'ropa').reduce((sum, r) => sum + r.amount, 0),
    };
  }, [records, expenses]);

  return (
    <div className="animate-fade-in screen-content" style={{ paddingBottom: '100px' }}>
      <div className="ios-nav" style={{ padding: '12px 0 20px', borderBottom: 'none' }}>
        <h1 className="ios-nav-title" style={{ fontSize: 32 }}>Balance</h1>
      </div>

      {/* Main Stats Card */}
      <div className="ios-card" style={{ 
        background: 'linear-gradient(135deg, var(--accent) 0%, #ff85a2 100%)', 
        color: 'white',
        padding: '24px',
        marginBottom: 24,
        boxShadow: '0 10px 30px rgba(255, 107, 145, 0.3)'
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ganancia del Mes
        </p>
        <h2 style={{ fontSize: 42, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
          ${stats.totalMonth.toLocaleString('es-AR')}
        </h2>
        <div style={{ display: 'flex', gap: 20, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>HOY</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>${stats.totalToday.toLocaleString('es-AR')}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>PENDIENTE</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>${stats.pendingAmount.toLocaleString('es-AR')}</p>
          </div>
        </div>
      </div>

      {/* Grid of Secondary Stats */}
      <div className="stats-grid" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        <div className="ios-card" style={{ padding: 16 }}>
          <div style={{ color: 'var(--cat-salon)', marginBottom: 12 }}><ScissorsIcon size={20} /></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Peluquería</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            ${stats.salonRevenue.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="ios-card" style={{ padding: 16 }}>
          <div style={{ color: 'var(--cat-clothing)', marginBottom: 12 }}><ShirtIcon size={20} /></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Tienda</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            ${stats.clothingRevenue.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Expenses Summary */}
      <p className="ios-section-header">Gastos del Mes</p>
      <div className="ios-card" style={{ padding: 20, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total Gastado</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#ff3b30' }}>
            -${stats.totalExpensesMonth.toLocaleString('es-AR')}
          </p>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ff3b3015', color: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarIcon size={20} />
        </div>
      </div>

      {/* Payment Methods */}
      <p className="ios-section-header">Métodos de Pago</p>
      <div className="ios-list-group" style={{ marginBottom: 24 }}>
        {Object.entries(stats.paymentMethods).map(([method, amount]) => (
          <div key={method} className="ios-list-item">
            <div className="ios-avatar sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              {method === 'efectivo' ? <DollarIcon size={16} /> : <CreditCardIcon size={16} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ textTransform: 'capitalize', fontWeight: 500 }}>{method}</p>
            </div>
            <p style={{ fontWeight: 600 }}>${amount.toLocaleString('es-AR')}</p>
          </div>
        ))}
      </div>

      {/* Quick Access to New Modules */}
      <div className="action-buttons-grid">
        <button 
          className="ios-btn-secondary" 
          style={{ justifyContent: 'flex-start', padding: '16px' }}
          onClick={onGoToInventory}
        >
          <PackageIcon size={20} style={{ marginRight: 12, color: 'var(--accent)' }} />
          <span>Gestionar Inventario de Ropa</span>
        </button>
        <button 
          className="ios-btn-secondary" 
          style={{ justifyContent: 'flex-start', padding: '16px' }}
          onClick={onGoToExpenses}
        >
          <DollarIcon size={20} style={{ marginRight: 12, color: '#ff3b30' }} />
          <span>Registrar Gasto del Negocio</span>
        </button>
      </div>
    </div>
  );
}
