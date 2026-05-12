'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/store/StoreContext';
import {
  DollarIcon, CreditCardIcon, PackageIcon, ScissorsIcon, ShirtIcon, BanknoteIcon, ChartIcon,
} from './Icons';
import { exportRecordsToCsv, exportExpensesToCsv } from '@/utils/exportCsv';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('es-AR');

function abbrev(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000) return `$${(n / 1_000).toFixed(0)}k`;
  if (n >= 10_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

function fmtDate(dateStr: string) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  if (dateStr === today) return 'Hoy';
  if (dateStr === yesterday) return 'Ayer';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function debtAge(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86_400_000);
  if (days >= 90) return { label: '+90 días', color: '#ff3b30', bg: 'rgba(255,59,48,0.08)' };
  if (days >= 60) return { label: '+60 días', color: '#e05a00', bg: 'rgba(224,90,0,0.08)' };
  if (days >= 30) return { label: '+30 días', color: '#ff9500', bg: 'rgba(255,149,0,0.08)' };
  return { label: 'Reciente', color: '#34c759', bg: 'rgba(52,199,89,0.08)' };
}

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};
const METHOD_COLOR: Record<string, string> = {
  efectivo: 'var(--pay-cash)',
  tarjeta: 'var(--pay-card)',
  transferencia: 'var(--pay-transfer)',
};

// ── component ─────────────────────────────────────────────────────────────────
export default function DashboardScreen({
  onGoToInventory,
  onGoToExpenses,
  onGoToDebtors,
  onClientSelect,
}: {
  onGoToInventory: () => void;
  onGoToExpenses: () => void;
  onGoToDebtors: () => void;
  onClientSelect?: (id: string) => void;
}) {
  const { records, payments, expenses, products, getClient } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const som = new Date(now.getFullYear(), now.getMonth(), 1);
    const solm = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── income from payments (real cash-in dates) ─────────────────
    const monthPayments = payments.filter(p => new Date(p.date + 'T12:00:00') >= som);
    const lastMonthPayments = payments.filter(p => {
      const d = new Date(p.date + 'T12:00:00');
      return d >= solm && d < som;
    });

    const totalToday = payments.filter(p => p.date === todayStr).reduce((s, p) => s + p.amount, 0);
    const totalMonth = monthPayments.reduce((s, p) => s + p.amount, 0);
    const totalLastMonth = lastMonthPayments.reduce((s, p) => s + p.amount, 0);
    const monthVsLastMonth = totalLastMonth > 0 ? ((totalMonth - totalLastMonth) / totalLastMonth) * 100 : null;

    // ── expenses ──────────────────────────────────────────────────
    const totalExpensesMonth = expenses
      .filter(e => new Date(e.date + 'T12:00:00') >= som)
      .reduce((s, e) => s + e.amount, 0);

    // ── pending (unpaid balance — never counts as income) ─────────
    const pendingAmount = records
      .filter(r => r.paymentStatus !== 'pagado')
      .reduce((sum, r) => {
        const paid = payments.filter(p => p.recordId === r.id).reduce((s, p) => s + p.amount, 0);
        return sum + Math.max(0, r.amount - paid);
      }, 0);

    // ── payment methods cumulative breakdown ──────────────────────
    const methodTotals = payments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);
    const totalAllPayments = Object.values(methodTotals).reduce((s, v) => s + v, 0);

    // ── weekly chart: last 7 days vs prev 7 days ──────────────────
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dStr = d.toISOString().split('T')[0];
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 7);
      const prevStr = prev.toISOString().split('T')[0];
      const amount = payments.filter(p => p.date === dStr).reduce((s, p) => s + p.amount, 0);
      const prevAmount = payments.filter(p => p.date === prevStr).reduce((s, p) => s + p.amount, 0);
      const raw = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
      return {
        dateStr: dStr,
        label: raw.charAt(0).toUpperCase() + raw.charAt(1),
        amount,
        prevAmount,
        isToday: i === 6,
      };
    });
    const weeklyTotal = weeklyData.reduce((s, d) => s + d.amount, 0);
    const prevWeekTotal = weeklyData.reduce((s, d) => s + d.prevAmount, 0);
    const weekVsLastWeek = prevWeekTotal > 0 ? ((weeklyTotal - prevWeekTotal) / prevWeekTotal) * 100 : null;

    // ── category breakdown this month ─────────────────────────────
    const recordCategoryMap = new Map(records.map(r => [r.id, r.category]));
    const salonRevenue = monthPayments
      .filter(p => recordCategoryMap.get(p.recordId) === 'peluqueria')
      .reduce((s, p) => s + p.amount, 0);
    const clothingRevenue = monthPayments
      .filter(p => recordCategoryMap.get(p.recordId) === 'ropa')
      .reduce((s, p) => s + p.amount, 0);

    // ── counts ────────────────────────────────────────────────────
    const monthPaymentCount = monthPayments.length;
    const monthRecordCount = records.filter(r => new Date(r.date + 'T12:00:00') >= som).length;
    const clientsWithDebt = new Set(
      records.filter(r => r.paymentStatus !== 'pagado').map(r => r.clientId)
    ).size;

    // ── recent payments enriched with clientId ────────────────────
    const recordClientMap = new Map(records.map(r => [r.id, r.clientId]));
    const recentPayments = [...payments]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5)
      .map(p => ({ ...p, clientId: recordClientMap.get(p.recordId) }));

    // ── top debtors sorted by debt amount ─────────────────────────
    const debtMap = new Map<string, { clientId: string; debt: number; oldestDate: string }>();
    for (const r of records) {
      if (r.paymentStatus === 'pagado') continue;
      const paid = payments.filter(p => p.recordId === r.id).reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, r.amount - paid);
      if (remaining <= 0) continue;
      const ex = debtMap.get(r.clientId);
      if (ex) {
        ex.debt += remaining;
        if (r.date < ex.oldestDate) ex.oldestDate = r.date;
      } else {
        debtMap.set(r.clientId, { clientId: r.clientId, debt: remaining, oldestDate: r.date });
      }
    }
    const topDebtors = Array.from(debtMap.values()).sort((a, b) => b.debt - a.debt).slice(0, 5);

    return {
      totalToday,
      totalMonth,
      monthVsLastMonth,
      totalExpensesMonth,
      netMonth: totalMonth - totalExpensesMonth,
      pendingAmount,
      methodTotals,
      totalAllPayments,
      weeklyData,
      weeklyTotal,
      prevWeekTotal,
      weekVsLastWeek,
      salonRevenue,
      clothingRevenue,
      monthPaymentCount,
      monthRecordCount,
      clientsWithDebt,
      lowStockCount: products.filter(p => p.stock <= 2).length,
      recentPayments,
      topDebtors,
    };
  }, [records, payments, expenses, products]);

  return (
    <div className="animate-fade-in screen-content" style={{ paddingBottom: '100px' }}>

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="ios-nav" style={{ padding: '12px 0 16px', borderBottom: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="ios-nav-title" style={{ fontSize: 32 }}>Balance</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportRecordsToCsv(records, id => getClient(id)?.name ?? 'Eliminada')}
              className="ios-btn-secondary"
              style={{ padding: '5px 10px', fontSize: 11 }}
            >
              Exportar ventas
            </button>
            <button
              onClick={() => exportExpensesToCsv(expenses)}
              className="ios-btn-secondary"
              style={{ padding: '5px 10px', fontSize: 11 }}
            >
              Exportar gastos
            </button>
          </div>
        </div>
      </div>

      {/* ── HERO: Ingresos vs Por cobrar ──────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>

        {/* Ingresos del mes */}
        <div style={{
          background: 'rgba(52,199,89,0.07)',
          border: '1px solid rgba(52,199,89,0.16)',
          borderRadius: 16,
          padding: '16px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34c759', flexShrink: 0 }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ingresado
            </p>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>Este mes</p>
          {stats.totalMonth > 0 ? (
            <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              ${fmt(stats.totalMonth)}
            </p>
          ) : (
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
              Sin ingresos aún
            </p>
          )}
          {stats.monthVsLastMonth !== null ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
              padding: '2px 7px', borderRadius: 20,
              background: stats.monthVsLastMonth >= 0 ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.1)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: stats.monthVsLastMonth >= 0 ? '#34c759' : '#ff3b30' }}>
                {stats.monthVsLastMonth >= 0 ? '↑' : '↓'} {Math.abs(stats.monthVsLastMonth).toFixed(0)}%
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>vs mes ant.</span>
            </div>
          ) : (
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 8 }}>Primer mes</p>
          )}
        </div>

        {/* Por cobrar */}
        <div style={{
          background: 'rgba(255,149,0,0.07)',
          border: '1px solid rgba(255,149,0,0.16)',
          borderRadius: 16,
          padding: '16px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff9500', flexShrink: 0 }} />
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Por cobrar
            </p>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>Pendiente</p>
          {stats.pendingAmount > 0 ? (
            <p style={{ fontSize: 24, fontWeight: 800, color: '#ff9500', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              ${fmt(stats.pendingAmount)}
            </p>
          ) : (
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
              Todo al día
            </p>
          )}
          {stats.clientsWithDebt > 0 ? (
            <button
              onClick={onGoToDebtors}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8,
                padding: '2px 7px', borderRadius: 20,
                background: 'rgba(255,149,0,0.12)', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ff9500' }}>
                {stats.clientsWithDebt} clienta{stats.clientsWithDebt !== 1 ? 's' : ''} →
              </span>
            </button>
          ) : (
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 8 }}>Sin deudas</p>
          )}
        </div>

      </div>

      {/* ── QUICK STATS ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="ios-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Hoy
          </p>
          {stats.totalToday > 0 ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: '#34c759', letterSpacing: '-0.02em' }}>
              ${fmt(stats.totalToday)}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>Sin ingresos hoy</p>
          )}
        </div>
        <div className="ios-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Gastos del mes
          </p>
          {stats.totalExpensesMonth > 0 ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: '#ff3b30', letterSpacing: '-0.02em' }}>
              -${fmt(stats.totalExpensesMonth)}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>Sin gastos</p>
          )}
        </div>
      </div>

      {/* Ganancia neta */}
      <div className="ios-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Ganancia neta del mes
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: stats.netMonth >= 0 ? '#007aff' : '#ff3b30' }}>
              {stats.netMonth >= 0 ? '$' : '-$'}{fmt(Math.abs(stats.netMonth))}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              ${fmt(stats.totalMonth)} ingresado — ${fmt(stats.totalExpensesMonth)} en gastos
            </p>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: stats.netMonth >= 0 ? 'rgba(0,122,255,0.08)' : 'rgba(255,59,48,0.08)',
            color: stats.netMonth >= 0 ? '#007aff' : '#ff3b30',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChartIcon size={22} />
          </div>
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="ios-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Pagos recibidos
          </p>
          {stats.monthPaymentCount > 0 ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {stats.monthPaymentCount}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Ninguno aún</p>
          )}
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>este mes</p>
        </div>
        <div className="ios-card" style={{ padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Servicios / Ventas
          </p>
          {stats.monthRecordCount > 0 ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {stats.monthRecordCount}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sin registros</p>
          )}
          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>este mes</p>
        </div>
      </div>

      {/* ── WEEKLY CHART ─────────────────────────────────────────── */}
      <div className="ios-card" style={{ padding: '20px 20px 16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Últimos 7 días
            </p>
            {stats.weeklyTotal > 0 && (
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 3, letterSpacing: '-0.02em' }}>
                ${fmt(stats.weeklyTotal)}
              </p>
            )}
          </div>
          {stats.weekVsLastWeek !== null && (
            <div style={{
              padding: '3px 9px', borderRadius: 20,
              background: stats.weekVsLastWeek >= 0 ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: stats.weekVsLastWeek >= 0 ? '#34c759' : '#ff3b30' }}>
                {stats.weekVsLastWeek >= 0 ? '↑' : '↓'} {Math.abs(stats.weekVsLastWeek).toFixed(0)}% vs sem. ant.
              </span>
            </div>
          )}
        </div>

        {(() => {
          const maxAmt = Math.max(...stats.weeklyData.map(d => Math.max(d.amount, d.prevAmount)), 1);
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 90 }}>
                {stats.weeklyData.map(d => (
                  <div key={d.dateStr} style={{ flex: 1, height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Semana anterior (ghost) */}
                    {d.prevAmount > 0 && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${Math.max((d.prevAmount / maxAmt) * 100, 2)}%`,
                        background: 'var(--separator-opaque)',
                        borderRadius: '4px 4px 0 0',
                      }} />
                    )}
                    {/* Barra actual */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: '10%', right: '10%',
                      height: `${Math.max((d.amount / maxAmt) * 100, d.amount > 0 ? 5 : 2)}%`,
                      background: d.isToday ? 'var(--accent)' : d.amount > 0 ? 'var(--accent-soft)' : 'var(--separator)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                      opacity: d.amount === 0 ? 0.35 : 1,
                    }} />
                    {/* Valor encima */}
                    {d.amount > 0 && (
                      <p style={{
                        position: 'absolute',
                        bottom: `calc(${Math.max((d.amount / maxAmt) * 100, 5)}% + 4px)`,
                        width: '100%', textAlign: 'center',
                        fontSize: 8, fontWeight: 700, lineHeight: 1, letterSpacing: 0,
                        color: d.isToday ? 'var(--accent)' : 'var(--text-secondary)',
                      }}>
                        {abbrev(d.amount)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                {stats.weeklyData.map(d => (
                  <p key={d.dateStr} style={{
                    flex: 1, textAlign: 'center', fontSize: 10,
                    fontWeight: d.isToday ? 700 : 500,
                    color: d.isToday ? 'var(--accent)' : 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.03em',
                  }}>
                    {d.label}
                  </p>
                ))}
              </div>
              {stats.prevWeekTotal > 0 && (
                <p style={{ marginTop: 10, fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                  ◻ Semana anterior: ${fmt(stats.prevWeekTotal)}
                </p>
              )}
            </>
          );
        })()}
      </div>

      {/* ── CATEGORIES ───────────────────────────────────────────── */}
      <p className="ios-section-header">Por categoría — este mes</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div className="ios-card" style={{ padding: 16 }}>
          <div style={{ color: 'var(--cat-salon)', marginBottom: 10 }}><ScissorsIcon size={20} /></div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Peluquería</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {stats.salonRevenue > 0 ? `$${fmt(stats.salonRevenue)}` : '—'}
          </p>
          {stats.totalMonth > 0 && stats.salonRevenue > 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {((stats.salonRevenue / stats.totalMonth) * 100).toFixed(0)}% del total
            </p>
          )}
        </div>
        <div className="ios-card" style={{ padding: 16 }}>
          <div style={{ color: 'var(--cat-clothing)', marginBottom: 10 }}><ShirtIcon size={20} /></div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Tienda de ropa</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {stats.clothingRevenue > 0 ? `$${fmt(stats.clothingRevenue)}` : '—'}
          </p>
          {stats.totalMonth > 0 && stats.clothingRevenue > 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {((stats.clothingRevenue / stats.totalMonth) * 100).toFixed(0)}% del total
            </p>
          )}
        </div>
      </div>

      {/* ── PAYMENT METHODS ──────────────────────────────────────── */}
      <p className="ios-section-header">Métodos de pago</p>
      <div className="ios-card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        {Object.keys(stats.methodTotals).length === 0 ? (
          <div style={{ padding: '20px 16px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Todavía no hay pagos registrados.
            </p>
          </div>
        ) : (
          Object.entries(stats.methodTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([method, amount], idx, arr) => {
              const pct = stats.totalAllPayments > 0 ? (amount / stats.totalAllPayments) * 100 : 0;
              return (
                <div key={method} style={{
                  padding: '14px 16px',
                  borderBottom: idx < arr.length - 1 ? '0.5px solid var(--separator-opaque)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: METHOD_COLOR[method] || 'var(--text-tertiary)' }} />
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {METHOD_LABEL[method] || method}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {pct.toFixed(0)}%
                      </p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        ${fmt(amount)}
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 4, background: 'var(--separator)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: METHOD_COLOR[method] || 'var(--accent)',
                      borderRadius: 2, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* ── ÚLTIMOS PAGOS ────────────────────────────────────────── */}
      {stats.recentPayments.length > 0 && (
        <>
          <p className="ios-section-header">Últimos pagos</p>
          <div className="ios-list-group" style={{ marginBottom: 24 }}>
            {stats.recentPayments.map(p => {
              const clientName = p.clientId
                ? (getClient(p.clientId)?.name ?? 'Clienta eliminada')
                : 'Registro eliminado';
              return (
                <div
                  key={p.id}
                  className="ios-list-item"
                  style={{ cursor: p.clientId && onClientSelect ? 'pointer' : 'default' }}
                  onClick={() => p.clientId && onClientSelect?.(p.clientId)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(52,199,89,0.1)', color: '#34c759',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BanknoteIcon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {clientName}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {METHOD_LABEL[p.paymentMethod] || p.paymentMethod} · {fmtDate(p.date)}
                    </p>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#34c759', flexShrink: 0 }}>
                    +${fmt(p.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TOP DEUDORAS ─────────────────────────────────────────── */}
      {stats.topDebtors.length > 0 && (
        <>
          <p className="ios-section-header">Clientas con saldo pendiente</p>
          <div className="ios-list-group" style={{ marginBottom: 24 }}>
            {stats.topDebtors.map(d => {
              const client = getClient(d.clientId);
              const age = debtAge(d.oldestDate);
              const initials = (client?.name ?? '?')
                .split(' ')
                .filter(w => w.length > 0)
                .map(w => w[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?';
              return (
                <div
                  key={d.clientId}
                  className="ios-list-item"
                  style={{ cursor: onClientSelect ? 'pointer' : 'default' }}
                  onClick={() => onClientSelect?.(d.clientId)}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,149,0,0.1)', color: '#ff9500',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {client?.name ?? 'Clienta eliminada'}
                    </p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 4,
                      background: age.bg, color: age.color, display: 'inline-block', marginTop: 2,
                    }}>
                      {age.label}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#ff9500' }}>
                      ${fmt(d.debt)}
                    </p>
                    {onClientSelect && (
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>Ver perfil →</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── ALERTA STOCK ─────────────────────────────────────────── */}
      {stats.lowStockCount > 0 && (
        <div style={{ marginBottom: 24 }}>
          <button
            className="ios-card"
            style={{ padding: 16, textAlign: 'left', border: 'none', cursor: 'pointer', width: '100%' }}
            onClick={onGoToInventory}
          >
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Stock bajo</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#ff9500' }}>
              {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''}
            </p>
            <p style={{ fontSize: 12, color: '#ff9500', marginTop: 2 }}>Revisar inventario →</p>
          </button>
        </div>
      )}

      {/* ── ACCIONES ─────────────────────────────────────────────── */}
      <div className="action-buttons-grid">
        <button
          className="ios-card"
          style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', gap: 14, transition: 'opacity 0.15s' }}
          onClick={onGoToInventory}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--cat-clothing-bg)', color: 'var(--cat-clothing)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PackageIcon size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Inventario</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>Gestionar stock de ropa</p>
          </div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 18, fontWeight: 300 }}>›</span>
        </button>
        <button
          className="ios-card"
          style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left', gap: 14, transition: 'opacity 0.15s' }}
          onClick={onGoToExpenses}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,59,48,0.08)', color: '#ff3b30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DollarIcon size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Gastos</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>Registrar gasto del negocio</p>
          </div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: 18, fontWeight: 300 }}>›</span>
        </button>
      </div>

    </div>
  );
}
