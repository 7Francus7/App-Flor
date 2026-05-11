import { ClientRecord, Expense } from '@/types';

function downloadCsv(data: string[][], filename: string) {
  const csv = data
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRecordsToCsv(records: ClientRecord[], getClientName: (id: string) => string) {
  const headers = [
    'Fecha', 'Clienta', 'Categoría', 'Servicio/Prenda',
    'Talle', 'Color', 'Monto', 'Método de Pago', 'Estado', 'Observaciones',
  ];
  const rows = records.map(r => [
    r.date,
    getClientName(r.clientId),
    r.category === 'peluqueria' ? 'Peluquería' : 'Ropa',
    r.category === 'peluqueria' ? r.service : r.item,
    r.category === 'ropa' ? r.size : '',
    r.category === 'ropa' ? r.color : '',
    r.amount.toString(),
    r.paymentMethod,
    r.paymentStatus === 'pagado' ? 'Pagado' : r.paymentStatus === 'parcial' ? 'Parcial' : 'Pendiente',
    r.observations || '',
  ]);
  downloadCsv([headers, ...rows], `registros-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportExpensesToCsv(expenses: Expense[]) {
  const headers = ['Fecha', 'Descripción', 'Categoría', 'Monto'];
  const rows = expenses.map(e => [e.date, e.description, e.category, e.amount.toString()]);
  downloadCsv([headers, ...rows], `gastos-${new Date().toISOString().split('T')[0]}.csv`);
}
