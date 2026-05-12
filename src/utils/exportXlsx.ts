import ExcelJS from 'exceljs';
import { ClientRecord, Expense } from '@/types';

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
  accent:      'FFD4A0A0',
  accentDark:  'FFB07878',
  accentLight: 'FFF5ECEC',
  green:       'FF34C759',
  greenBg:     'FFE6F9ED',
  greenText:   'FF1A7A3C',
  orange:      'FFFF9500',
  orangeBg:    'FFFFF3E0',
  orangeText:  'FFA05C00',
  red:         'FFFF3B30',
  redBg:       'FFFDECEA',
  redText:     'FFB71C1C',
  rowAlt:      'FFFAF6F6',
  rowWhite:    'FFFFFFFF',
  border:      'FFE0D0D0',
  headerBorder:'FFB07878',
  white:       'FFFFFFFF',
  grayText:    'FF8E8E93',
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pagado:    { bg: C.greenBg,  text: C.greenText,  label: 'Pagado'    },
  parcial:   { bg: C.orangeBg, text: C.orangeText, label: 'Parcial'   },
  pendiente: { bg: C.redBg,    text: C.redText,    label: 'Pendiente' },
};

const METHOD_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};

// ── shared helpers ────────────────────────────────────────────────────────────
function applyHeaderCell(cell: ExcelJS.Cell, bg = C.accent) {
  cell.font    = { bold: true, color: { argb: C.white }, size: 11, name: 'Calibri' };
  cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false };
  cell.border  = {
    bottom: { style: 'medium', color: { argb: C.headerBorder } },
    left:   { style: 'thin',   color: { argb: C.headerBorder } },
    right:  { style: 'thin',   color: { argb: C.headerBorder } },
  };
}

function applyDataCell(cell: ExcelJS.Cell, bg: string) {
  cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font    = { size: 10, name: 'Calibri', color: { argb: 'FF1C1C1E' } };
  cell.alignment = { vertical: 'middle', wrapText: false };
  cell.border  = {
    top:    { style: 'hair', color: { argb: C.border } },
    bottom: { style: 'hair', color: { argb: C.border } },
    left:   { style: 'hair', color: { argb: C.border } },
    right:  { style: 'hair', color: { argb: C.border } },
  };
}

function applyTotalCell(cell: ExcelJS.Cell, textColor: string, bg: string) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
  cell.font = { bold: true, size: 11, name: 'Calibri', color: { argb: textColor } };
  cell.border = {
    top:    { style: 'medium', color: { argb: textColor } },
    bottom: { style: 'medium', color: { argb: textColor } },
  };
  cell.alignment = { vertical: 'middle' };
}

async function downloadXlsx(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Ventas / Registros ────────────────────────────────────────────────────────
export async function exportRecordsToXlsx(
  records: ClientRecord[],
  getClientName: (id: string) => string,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Flor';
  wb.created = new Date();

  const ws = wb.addWorksheet('Registros', {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = [
    { key: 'fecha',     width: 13 },
    { key: 'clienta',  width: 22 },
    { key: 'categoria',width: 14 },
    { key: 'item',     width: 40 },
    { key: 'talle',    width:  9 },
    { key: 'color',    width: 13 },
    { key: 'monto',    width: 14 },
    { key: 'metodo',   width: 16 },
    { key: 'estado',   width: 12 },
    { key: 'obs',      width: 44 },
  ];

  // Header row
  const headers = ['Fecha', 'Clienta', 'Categoría', 'Servicio / Prenda', 'Talle', 'Color', 'Monto', 'Método de Pago', 'Estado', 'Observaciones'];
  const hRow = ws.addRow(headers);
  hRow.height = 24;
  hRow.eachCell(cell => applyHeaderCell(cell));

  // Data rows
  records.forEach((r, idx) => {
    const st = STATUS_STYLE[r.paymentStatus] ?? STATUS_STYLE.pendiente;
    const bg = st.bg;

    const dataRow = ws.addRow({
      fecha:     r.date,
      clienta:   getClientName(r.clientId),
      categoria: r.category === 'peluqueria' ? 'Peluquería' : 'Ropa',
      item:      r.category === 'peluqueria' ? (r as { service: string }).service : (r as { item: string }).item,
      talle:     r.category === 'ropa' ? (r as { size: string }).size : '',
      color:     r.category === 'ropa' ? (r as { color: string }).color : '',
      monto:     r.amount,
      metodo:    METHOD_LABEL[r.paymentMethod] || r.paymentMethod,
      estado:    st.label,
      obs:       r.observations || '',
    });

    dataRow.height = 18;

    dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
      applyDataCell(cell, bg);

      // Monto: right-aligned, currency
      if (col === 7) {
        cell.numFmt = '"$"#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF1C1C1E' } };
      }

      // Estado: centered, colored bold text
      if (col === 9) {
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: st.text } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Fecha: centered
      if (col === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };

      // Categoría: centered
      if (col === 3) cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // Totals row
  if (records.length > 0) {
    const pagado   = records.filter(r => r.paymentStatus === 'pagado').length;
    const parcial  = records.filter(r => r.paymentStatus === 'parcial').length;
    const pendiente = records.filter(r => r.paymentStatus === 'pendiente').length;
    const totalAmt = records.reduce((s, r) => s + r.amount, 0);

    ws.addRow([]); // spacer

    const sumRow = ws.addRow([
      '', `${records.length} registros · ${pagado} pagados · ${parcial} parciales · ${pendiente} pendientes`,
      '', '', '', '', totalAmt, '', '', '',
    ]);
    sumRow.height = 22;
    sumRow.eachCell({ includeEmpty: true }, (cell, col) => {
      applyTotalCell(cell, C.accentDark, C.accentLight);
      if (col === 7) {
        cell.numFmt = '"$"#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  }

  const date = new Date().toISOString().split('T')[0];
  await downloadXlsx(wb, `ventas-${date}.xlsx`);
}

// ── Gastos ────────────────────────────────────────────────────────────────────
export async function exportExpensesToXlsx(expenses: Expense[]) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistema Flor';
  wb.created = new Date();

  const ws = wb.addWorksheet('Gastos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { key: 'fecha',     width: 13 },
    { key: 'desc',      width: 42 },
    { key: 'categoria', width: 18 },
    { key: 'monto',     width: 14 },
  ];

  const CAT_LABEL: Record<string, string> = {
    insumos: 'Insumos', alquiler: 'Alquiler', servicios: 'Servicios',
    ropa: 'Compra de ropa', publicidad: 'Publicidad', otros: 'Otros',
  };

  const hRow = ws.addRow(['Fecha', 'Descripción', 'Categoría', 'Monto']);
  hRow.height = 24;
  hRow.eachCell(cell => applyHeaderCell(cell, C.red));

  expenses.forEach((e, idx) => {
    const bg = idx % 2 === 0 ? C.rowWhite : C.rowAlt;
    const dataRow = ws.addRow({
      fecha:     e.date,
      desc:      e.description,
      categoria: CAT_LABEL[e.category] || e.category,
      monto:     e.amount,
    });
    dataRow.height = 18;
    dataRow.eachCell({ includeEmpty: true }, (cell, col) => {
      applyDataCell(cell, bg);
      if (col === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (col === 4) {
        cell.numFmt = '"$"#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { bold: true, size: 10, name: 'Calibri', color: { argb: C.redText } };
      }
    });
  });

  if (expenses.length > 0) {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    ws.addRow([]);

    const sumRow = ws.addRow(['', `Total: ${expenses.length} gastos`, '', total]);
    sumRow.height = 22;
    sumRow.eachCell({ includeEmpty: true }, (cell, col) => {
      applyTotalCell(cell, C.redText, C.redBg);
      if (col === 4) {
        cell.numFmt = '"$"#,##0';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  }

  const date = new Date().toISOString().split('T')[0];
  await downloadXlsx(wb, `gastos-${date}.xlsx`);
}
