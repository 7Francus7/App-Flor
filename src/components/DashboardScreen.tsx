'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import { DollarIcon, CreditCardIcon, PackageIcon, ScissorsIcon, ShirtIcon } from './Icons';
import { exportRecordsToCsv, exportExpensesToCsv } from '@/utils/exportCsv';

export default function DashboardScreen({
  onGoToInventory,
  onGoToExpenses,
  onGoToDebtors,
}: {
  onGoToInventory: () => void;
  onGoToExpenses: () => void;
  onGoToDebtors: () => void;
}) {
  const { records, expenses, products, getClient } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayRecords = records.filter((r) => r.date === todayStr);
    const monthRecords = records.filter((r) => {
      const d = new Date(r.date + 'T12:00:00');
      return d >= startOfMonth;
    });

    const totalToday = todayRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalMonth = monthRecords.reduce((sum, r) => sum + r.amount, 0);
    const totalExpensesToday = expenses
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalExpensesMonth = expenses
      .filter((e) => {
        const d = new Date(e.date + 'T12:00:00');
        return d >= startOfMonth;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingAmount = records
      .filter((r) => r.paymentStatus === 'pendiente')
      .reduce((sum, r) => sum + r.amount, 0);

    const paymentMethods = records.reduce((acc, r) => {
      acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

    const weeklyData: { dateStr: string; label: string; amount: number; isToday: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const amt = records.filter(r => r.date === dStr).reduce((sum, r) => sum + r.amount, 0);
      const raw = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '').slice(0, 2);
      weeklyData.push({ dateStr: dStr, label: raw.charAt(0).toUpperCase() + raw.slice(1), amount: amt, isToday: i === 0 });
    }

    return {
      totalToday,
      totalMonth,
      totalExpensesMonth,
      pendingAmount,
      paymentMethods,
      netToday: totalToday - totalExpensesToday,
      netMonth: totalMonth - totalExpensesMonth,
      lowStockCount: products.filter((p) => p.stock <= 2).length,
      clientsWithDebt: new Set(
        records.filter((r) => r.paymentStatus === 'pendiente').map((r) => r.clientId)
      ).size,
      salonRevenue: monthRecords
        .filter((r) => r.category === 'peluqueria')
        .reduce((sum, r) => sum + r.amount, 0),
      clothingRevenue: monthRecords
        .filter((r) => r.category === 'ropa')
        .reduce((sum, r) => sum + r.amount, 0),
      weeklyData,
    };
  }, [records, expenses, products]);

  const handleExportRecords = () => {
    exportRecordsToCsv(records, (id) => getClient(id)?.name ?? 'Clienta eliminada');
  };

  const handleExportExpenses = () => {
    exportExpensesToCsv(expenses);
  };

  return (
    <div className="animate-fade-in screen-content" style={{ paddingBottom: '100px' }}>
      <div className="ios-nav" style={{ padding: '12px 0 20px', borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 className="ios-nav-title" style={{ fontSize: 32 }}>Balance</h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={handleExportRecords} className="ios-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            CSV Registros
          </button>
          <button onClick={handleExportExpenses} className="ios-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
            CSV Gastos
          </button>
        </div>
      </div>

      {/* Main hero card */}
      <div
        className="ios-card"
        style={{
          background: 'linear-gradient(135deg, var(--accent) 0%, #ff85a2 100%)',
          color: 'white',
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 10px 30px rgba(255, 107, 145, 0.3)',
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Ingreso del Mes
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

      {/* Weekly bar chart */}
      {(() => {
        const maxAmt = Math.max(...stats.weeklyData.map(d => d.amount), 1);
        return (
          <div className="ios-card" style={{ padding: '20px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 20 }}>
              Últimos 7 días
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
              {stats.weeklyData.map(d => (
                <div key={d.dateStr} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: Math.max((d.amount / maxAmt) * 72, 4),
                    background: d.isToday ? 'var(--accent)' : 'var(--accent-soft)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: d.amount === 0 ? 0.35 : 1,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {stats.weeklyData.map(d => (
                <p key={d.dateStr} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: d.isToday ? 700 : 500, color: d.isToday ? 'var(--accent)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {d.label}
                </p>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Net stats */}
      <div className="stats-grid" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        <div className="ios-card" style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Neto de Hoy</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: stats.netToday >= 0 ? 'var(--text-primary)' : '#ff3b30' }}>
            ${stats.netToday.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="ios-card" style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Neto del Mes</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: stats.netMonth >= 0 ? 'var(--text-primary)' : '#ff3b30' }}>
            ${stats.netMonth.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
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

      {/* Clickable alert stats */}
      <div className="stats-grid" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        <button
          className="ios-card"
          style={{ padding: 16, textAlign: 'left', cursor: stats.clientsWithDebt > 0 ? 'pointer' : 'default', border: 'none', background: 'var(--bg-secondary)' }}
          onClick={stats.clientsWithDebt > 0 ? onGoToDebtors : undefined}
        >
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Clientas con deuda {stats.clientsWithDebt > 0 ? '→' : ''}
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: stats.clientsWithDebt > 0 ? '#ff3b30' : 'var(--text-primary)' }}>
            {stats.clientsWithDebt}
          </p>
        </button>
        <button
          className="ios-card"
          style={{ padding: 16, textAlign: 'left', cursor: stats.lowStockCount > 0 ? 'pointer' : 'default', border: 'none', background: 'var(--bg-secondary)' }}
          onClick={stats.lowStockCount > 0 ? onGoToInventory : undefined}
        >
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Stock bajo {stats.lowStockCount > 0 ? '→' : ''}
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: stats.lowStockCount > 0 ? '#ff3b30' : 'var(--text-primary)' }}>
            {stats.lowStockCount}
          </p>
        </button>
      </div>

      {/* Expenses */}
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
        {Object.entries(stats.paymentMethods).length === 0 ? (
          <div className="ios-list-item">
            <p style={{ color: 'var(--text-secondary)' }}>Todavía no hay movimientos registrados.</p>
          </div>
        ) : Object.entries(stats.paymentMethods).map(([method, amount]) => (
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
