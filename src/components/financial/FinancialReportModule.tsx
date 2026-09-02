import { useState, useMemo, useRef } from 'react';
import { BarChart3, Printer, DollarSign, Wallet, TrendingDown, Scale, Plus, Trash2, Banknote, Smartphone, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';
import type { Expense, PaymentMethod } from '../../types';

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export default function FinancialReportModule() {
  const { services, debts, addExpense, deleteExpense, getHelperWeeklyPay, getWeeklyTotals, getExpensesForWeek, owners, pets } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [helperPayOverride, setHelperPayOverride] = useState<number | ''>('');
  const [quickExpense, setQuickExpense] = useState({ description: '', cost: '' });
  const printRef = useRef<HTMLDivElement>(null);

  const refDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekBounds = useMemo(() => getWeekBounds(refDate), [refDate]);
  const weekStartStr = localDateString(weekBounds.start);
  const weekEndStr = localDateString(weekBounds.end);

  const totals = useMemo(() => getWeeklyTotals(refDate), [getWeeklyTotals, refDate]);
  const helperPay = useMemo(() => getHelperWeeklyPay(), [getHelperWeeklyPay]);
  const weekExpenses = useMemo(() => getExpensesForWeek(refDate), [getExpensesForWeek, refDate]);

  const weekServices = useMemo(() => {
    return services.filter(s => {
      const d = new Date(s.date + 'T12:00:00');
      return d >= weekBounds.start && d <= weekBounds.end;
    });
  }, [services, weekBounds]);

  const weekAbonos = useMemo(() => {
    const result: { ownerName: string; petName: string; amount: number; method: PaymentMethod; date: string }[] = [];
    for (const d of debts) {
      for (const p of d.payments) {
        if (p.date >= weekStartStr && p.date <= weekEndStr) {
          const owner = owners.find(o => o.id === d.ownerId);
          const pet = pets.find(pet => pet.id === d.petId);
          result.push({
            ownerName: owner?.name ?? '—',
            petName: pet?.name ?? '—',
            amount: p.amount,
            method: p.method,
            date: p.date,
          });
        }
      }
    }
    return result;
  }, [debts, weekStartStr, weekEndStr, owners, pets]);

  const helperPayAmount = helperPayOverride === '' ? helperPay.total : helperPayOverride;
  const totalExpenses = weekExpenses.reduce((s, e) => s + e.cost, 0);
  const netBalance = totals.total - helperPayAmount - totalExpenses;

  const weekLabel = `${weekBounds.start.toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })} — ${weekBounds.end.toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  const weekLabelLong = `${weekBounds.start.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} al ${weekBounds.end.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`;

  function handleAddExpense() {
    const cost = parseFloat(quickExpense.cost);
    if (!quickExpense.description.trim() || isNaN(cost) || cost <= 0) return;
    const expense: Expense = {
      id: crypto.randomUUID(),
      description: quickExpense.description.trim(),
      cost,
      date: localDateString(refDate),
      createdAt: new Date().toISOString(),
    };
    addExpense(expense);
    setQuickExpense({ description: '', cost: '' });
  }

  function handlePrint() {
    window.print();
  }

  const methodLabel = (m: PaymentMethod) => m;
  const methodIcon = (m: PaymentMethod) =>
    m === 'Efectivo' ? <Banknote size={12} /> : m === 'Yappy' ? <Smartphone size={12} /> : <ArrowLeftRight size={12} />;

  return (
    <>
      {/* On-screen view */}
      <div className="space-y-6 print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BarChart3 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-slate-800 font-semibold text-lg">Reporte Financiero Semanal</h2>
              <p className="text-slate-400 text-xs">{weekLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
            >
              ← Semana anterior
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Esta semana
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              disabled={weekOffset >= 0}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Semana siguiente →
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer size={16} /> Imprimir Reporte
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Income */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Ingresos</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">${totals.total.toFixed(2)}</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-slate-400 text-xs flex items-center gap-1"><Banknote size={11} /> Efectivo: ${totals.cash.toFixed(2)}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1"><Smartphone size={11} /> Yappy: ${totals.yappy.toFixed(2)}</p>
              <p className="text-slate-400 text-xs flex items-center gap-1"><ArrowLeftRight size={11} /> Transferencia: ${totals.transfer.toFixed(2)}</p>
            </div>
          </div>

          {/* Helper pay */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <Wallet size={16} className="text-teal-600" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Pago Ayudante</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">${helperPayAmount.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-2">
              Sugerido: ${helperPay.total.toFixed(2)} (base ${helperPay.base.toFixed(2)} + comisiones ${helperPay.commissions.toFixed(2)})
            </p>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <TrendingDown size={16} className="text-amber-600" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Gastos</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">${totalExpenses.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-2">{weekExpenses.length} concepto(s) registrados</p>
          </div>

          {/* Net balance — highlighted card */}
          <div className={`rounded-xl p-5 border-2 shadow-sm ${netBalance >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netBalance >= 0 ? 'bg-green-200' : 'bg-red-200'}`}>
                <Scale size={16} className={netBalance >= 0 ? 'text-green-700' : 'text-red-700'} />
              </div>
              <span className={`text-sm font-semibold ${netBalance >= 0 ? 'text-green-800' : 'text-red-800'}`}>Balance Neto</span>
            </div>
            <p className={`text-4xl font-extrabold ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${netBalance.toFixed(2)}
            </p>
            <p className={`text-xs mt-2 font-medium ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? 'Ganancia de la semana' : 'Pérdida de la semana'}
            </p>
          </div>
        </div>

        {/* Editable section: helper pay + quick expense */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-slate-700 font-medium text-sm mb-3 flex items-center gap-2">
              <Wallet size={16} className="text-teal-500" /> Ajustar Pago al Ayudante
            </h3>
            <p className="text-slate-400 text-xs mb-3">
              El sistema sugiere ${helperPay.total.toFixed(2)} (salario base + comisiones). Puedes sobrescribir el valor antes de cerrar la semana.
            </p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-500 text-xs mb-1">Monto a pagar (USD)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={helperPayOverride}
                    onChange={e => setHelperPayOverride(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    placeholder={helperPay.total.toFixed(2)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <button
                onClick={() => setHelperPayOverride('')}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors"
              >
                Usar sugerido
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-slate-700 font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-amber-500" /> Registrar Gasto Rápido
            </h3>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-slate-500 text-xs mb-1">Descripción</label>
                <input
                  value={quickExpense.description}
                  onChange={e => setQuickExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej. Compra de insumos"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="w-32">
                <label className="block text-slate-500 text-xs mb-1">Monto (USD)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quickExpense.cost}
                    onChange={e => setQuickExpense(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                    className="w-full pl-9 pr-2 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <button
                onClick={handleAddExpense}
                className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors flex items-center gap-1"
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
          </div>
        </div>

        {/* Expenses list */}
        {weekExpenses.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100">
              <h3 className="text-slate-700 font-medium text-sm">Gastos de la Semana</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {weekExpenses.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm truncate">{e.description}</p>
                    <p className="text-slate-400 text-xs">{e.date}</p>
                  </div>
                  <span className="text-amber-600 text-sm font-semibold">${e.cost.toFixed(2)}</span>
                  <button
                    onClick={() => deleteExpense(e.id)}
                    className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Gastos</span>
              <span className="text-amber-600 text-base font-bold">${totalExpenses.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Income detail table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-slate-700 font-medium text-sm">Detalle de Ingresos de la Semana</h3>
          </div>
          {weekServices.length === 0 && weekAbonos.length === 0 ? (
            <div className="p-10 text-center">
              <BarChart3 size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No hay ingresos registrados esta semana.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="text-left px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Mascota</th>
                    <th className="text-left px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Concepto</th>
                    <th className="text-left px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                    <th className="text-left px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Método</th>
                    <th className="text-right px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {weekServices.map((s, i) => {
                    const owner = owners.find(o => o.id === s.ownerId);
                    const pet = pets.find(p => p.id === s.petId);
                    const types = s.types?.length ? s.types : ['Consulta'];
                    const method = s.payments?.length ? s.payments[0].method : s.paymentMethod;
                    return (
                      <tr key={s.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50/50 ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                        <td className="px-5 py-3 text-slate-700 text-sm">{owner?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-600 text-sm">{pet?.name ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-600 text-sm">{types.join(', ')}</td>
                        <td className="px-5 py-3 text-slate-500 text-sm">{s.date}</td>
                        <td className="px-5 py-3 text-slate-500 text-sm whitespace-nowrap">{methodLabel(method)}</td>
                        <td className="px-5 py-3 text-right text-slate-800 text-sm font-semibold tabular-nums">${s.price.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {weekAbonos.map((a, i) => (
                    <tr key={`abono-${i}`} className={`border-b border-slate-50 last:border-0 hover:bg-amber-50/40 bg-amber-50/20`}>
                      <td className="px-5 py-3 text-slate-700 text-sm">{a.ownerName}</td>
                      <td className="px-5 py-3 text-slate-600 text-sm">{a.petName}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">Abono</span></td>
                      <td className="px-5 py-3 text-slate-500 text-sm">{a.date}</td>
                      <td className="px-5 py-3 text-slate-500 text-sm whitespace-nowrap">{methodLabel(a.method)}</td>
                      <td className="px-5 py-3 text-right text-amber-700 text-sm font-semibold tabular-nums">${a.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-200">
                    <td colSpan={5} className="px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide text-right">Total Ingresos</td>
                    <td className="px-5 py-3 text-right text-slate-800 text-base font-bold tabular-nums">${totals.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Print-only document */}
      <div ref={printRef} className="print-document hidden print:block">
        <div className="doc-page" style={{ color: '#000', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {/* Professional header */}
          <div className="doc-header" style={{ textAlign: 'center', borderBottom: '3px solid #1a365d', paddingBottom: '14px', marginBottom: '24px' }}>
            <p style={{ fontSize: '20px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '1px', color: '#1a365d' }}>Consultorio Veterinario Dr. Cedeño</p>
            <p style={{ fontSize: '13px', fontWeight: 700, margin: '6px 0 0', color: '#333' }}>Reporte Financiero Semanal</p>
            <p style={{ fontSize: '11px', margin: '4px 0 0', color: '#555' }}>{weekLabelLong}</p>
          </div>

          {/* Summary cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
            {/* Income */}
            <div style={{ border: '1.5px solid #1a365d', borderRadius: '8px', padding: '14px 16px', background: '#f0f7ff' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#1a365d', margin: '0 0 6px' }}>Ingresos Totales</p>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#000' }}>${totals.total.toFixed(2)}</p>
              <div style={{ fontSize: '10px', color: '#333', lineHeight: 1.6 }}>
                <span>Efectivo: ${totals.cash.toFixed(2)}</span><br />
                <span>Yappy: ${totals.yappy.toFixed(2)}</span><br />
                <span>Transferencia: ${totals.transfer.toFixed(2)}</span>
              </div>
            </div>

            {/* Helper pay */}
            <div style={{ border: '1.5px solid #ccc', borderRadius: '8px', padding: '14px 16px', background: '#f9fafb' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#555', margin: '0 0 6px' }}>Pago al Ayudante</p>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#000' }}>${helperPayAmount.toFixed(2)}</p>
              <p style={{ fontSize: '10px', color: '#555' }}>
                Sugerido: ${helperPay.total.toFixed(2)} (base ${helperPay.base.toFixed(2)} + com. ${helperPay.commissions.toFixed(2)})
              </p>
            </div>

            {/* Expenses */}
            <div style={{ border: '1.5px solid #ccc', borderRadius: '8px', padding: '14px 16px', background: '#fffbeb' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#92400e', margin: '0 0 6px' }}>Gastos del Consultorio</p>
              <p style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#000' }}>${totalExpenses.toFixed(2)}</p>
              <p style={{ fontSize: '10px', color: '#555' }}>{weekExpenses.length} concepto(s) registrados</p>
            </div>

            {/* Net balance — highlighted */}
            <div style={{ border: `2.5px solid ${netBalance >= 0 ? '#15803d' : '#dc2626'}`, borderRadius: '8px', padding: '14px 16px', background: netBalance >= 0 ? '#f0fdf4' : '#fef2f2' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: netBalance >= 0 ? '#15803d' : '#dc2626', margin: '0 0 6px' }}>Balance Neto</p>
              <p style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px', color: netBalance >= 0 ? '#15803d' : '#dc2626' }}>${netBalance.toFixed(2)}</p>
              <p style={{ fontSize: '10px', fontWeight: 600, color: netBalance >= 0 ? '#15803d' : '#dc2626' }}>
                {netBalance >= 0 ? 'Ganancia de la semana' : 'Pérdida de la semana'}
              </p>
            </div>
          </div>

          {/* Expenses detail */}
          {weekExpenses.length > 0 && (
            <>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', color: '#1a365d' }}>Gastos Detallados</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #1a365d' }}>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Descripción</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Fecha</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'right', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {weekExpenses.map((e, i) => (
                    <tr key={e.id} style={{ background: i % 2 === 1 ? '#f8fafc' : 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#000' }}>{e.description}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{e.date}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'right', fontWeight: 600, color: '#000' }}>${e.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e2e8f0', borderTop: '2px solid #1a365d' }}>
                    <td colSpan={2} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#1a365d' }}>Total Gastos</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, textAlign: 'right', color: '#000' }}>${totalExpenses.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {/* Income detail */}
          {(weekServices.length > 0 || weekAbonos.length > 0) && (
            <>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase', color: '#1a365d' }}>Detalle de Ingresos</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', borderBottom: '2px solid #1a365d' }}>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Cliente</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Mascota</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Concepto</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'left', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Fecha</th>
                    <th style={{ padding: '10px 12px', fontSize: '11px', textAlign: 'right', fontWeight: 700, color: '#1a365d', borderBottom: '1.5px solid #94a3b8' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {weekServices.map((s, i) => {
                    const owner = owners.find(o => o.id === s.ownerId);
                    const pet = pets.find(p => p.id === s.petId);
                    const types = s.types?.length ? s.types : ['Consulta'];
                    return (
                      <tr key={s.id} style={{ background: i % 2 === 1 ? '#f8fafc' : 'transparent', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#000' }}>{owner?.name ?? '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{pet?.name ?? '—'}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{types.join(', ')}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{s.date}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'right', fontWeight: 600, color: '#000' }}>${s.price.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {weekAbonos.map((a, i) => (
                    <tr key={`p-abono-${i}`} style={{ background: '#fffbeb', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#000' }}>{a.ownerName}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{a.petName}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#92400e', fontWeight: 600 }}>Abono</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#333' }}>{a.date}</td>
                      <td style={{ padding: '8px 12px', fontSize: '11px', textAlign: 'right', fontWeight: 600, color: '#000' }}>${a.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#e2e8f0', borderTop: '2px solid #1a365d' }}>
                    <td colSpan={4} style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#1a365d' }}>Total Ingresos</td>
                    <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, textAlign: 'right', color: '#000' }}>${totals.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #999', textAlign: 'center' }}>
            <p style={{ fontSize: '9px', color: '#666' }}>Generado el {new Date().toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </>
  );
}
