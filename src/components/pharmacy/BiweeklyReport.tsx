import { useState, useMemo } from 'react';
import {
  CalendarRange,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Download,
  BarChart3,
} from 'lucide-react';
import type { PharmacySale, InventoryPurchase } from '../../types';

interface Props {
  sales: PharmacySale[];
  purchases: InventoryPurchase[];
}

type ViewMode = 'rentabilidad' | 'flujo';

type PeriodType = 'full' | 'first' | 'second';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getPeriodRange(year: number, month: number, period: PeriodType): { start: Date; end: Date } {
  if (period === 'full') {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'first') {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 15, 23, 59, 59, 999);
    return { start, end };
  }
  // second
  const start = new Date(year, month, 16, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getPreviousPeriod(year: number, month: number, period: PeriodType): { start: Date; end: Date; year: number; month: number; period: PeriodType } {
  if (period === 'full') {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return { ...getPeriodRange(prevYear, prevMonth, 'full'), year: prevYear, month: prevMonth, period: 'full' };
  }
  if (period === 'first') {
    // Previous is 2nd quincena of same month
    return { ...getPeriodRange(year, month, 'second'), year, month, period: 'second' };
  }
  // period === 'second' → previous is 1st quincena of same month
  return { ...getPeriodRange(year, month, 'first'), year, month, period: 'first' };
}

function saleCost(s: PharmacySale): number {
  return s.totalCost ?? (s.unitCost ?? 0) * s.quantity;
}

function saleVenta(s: PharmacySale): number {
  return s.totalVenta ?? s.total;
}

function saleGanancia(s: PharmacySale): number {
  return saleVenta(s) - saleCost(s);
}

export default function BiweeklyReport({ sales, purchases }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [period, setPeriod] = useState<PeriodType>('full');
  const [viewMode, setViewMode] = useState<ViewMode>('rentabilidad');

  const range = useMemo(() => getPeriodRange(year, month, period), [year, month, period]);
  const prevRange = useMemo(() => getPreviousPeriod(year, month, period), [year, month, period]);

  const periodSales = useMemo(() => {
    return sales
      .filter(s => {
        const d = new Date(s.date + 'T12:00:00');
        return d >= range.start && d <= range.end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [sales, range]);

  const prevSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.date + 'T12:00:00');
      return d >= prevRange.start && d <= prevRange.end;
    });
  }, [sales, prevRange]);

  const metrics = useMemo(() => {
    const totalCost = periodSales.reduce((sum, s) => sum + saleCost(s), 0);
    const totalVenta = periodSales.reduce((sum, s) => sum + saleVenta(s), 0);
    const ganancia = totalVenta - totalCost;
    const margin = totalVenta > 0 ? (ganancia / totalVenta) * 100 : 0;
    return { totalCost, totalVenta, ganancia, margin, count: periodSales.length };
  }, [periodSales]);

  const prevMetrics = useMemo(() => {
    const totalCost = prevSales.reduce((sum, s) => sum + saleCost(s), 0);
    const totalVenta = prevSales.reduce((sum, s) => sum + saleVenta(s), 0);
    const ganancia = totalVenta - totalCost;
    return { totalCost, totalVenta, ganancia };
  }, [prevSales]);

  const periodPurchases = useMemo(() => {
    return purchases
      .filter(p => {
        const d = new Date(p.date + 'T12:00:00');
        return d >= range.start && d <= range.end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [purchases, range]);

  const flowMetrics = useMemo(() => {
    const totalInvertido = periodPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalFacturado = periodSales.reduce((sum, s) => sum + saleVenta(s), 0);
    const balanceNeto = totalFacturado - totalInvertido;
    return { totalInvertido, totalFacturado, balanceNeto };
  }, [periodPurchases, periodSales]);

  const periodLabel = period === 'full' ? 'Mes Completo' : period === 'first' ? '1ra Quincena (Días 1-15)' : '2da Quincena (Día 16-fin)';
  const prevPeriodLabel = prevRange.period === 'full' ? 'Mes anterior' : prevRange.period === 'first' ? '1ra Quincena anterior' : '2da Quincena anterior';

  function handleExportCSV() {
    const headers = ['Fecha', 'Producto', 'Cantidad', 'Costo Total', 'Venta Total', 'Ganancia', 'Metodo Pago', 'Notas'];
    const rows = periodSales.map(s => [
      s.date,
      s.itemName,
      String(s.quantity),
      saleCost(s).toFixed(2),
      saleVenta(s).toFixed(2),
      saleGanancia(s).toFixed(2),
      s.paymentMethod,
      s.notes.replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_farmacia_${year}_${String(month + 1).padStart(2, '0')}_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxBarValue = Math.max(metrics.totalCost, metrics.totalVenta, prevMetrics.totalCost, prevMetrics.totalVenta, 1);
  const costPct = (metrics.totalCost / maxBarValue) * 100;
  const ventaPct = (metrics.totalVenta / maxBarValue) * 100;
  const prevCostPct = (prevMetrics.totalCost / maxBarValue) * 100;
  const prevVentaPct = (prevMetrics.totalVenta / maxBarValue) * 100;

  const gananciaChange = prevMetrics.ganancia !== 0
    ? ((metrics.ganancia - prevMetrics.ganancia) / Math.abs(prevMetrics.ganancia)) * 100
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <CalendarRange size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold text-sm">Reporte Quincenal de Rentabilidad</h3>
            <p className="text-slate-400 text-xs">Costos, ingresos y ganancias por período</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={periodSales.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* View mode toggle */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setViewMode('rentabilidad')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            viewMode === 'rentabilidad' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Rentabilidad
        </button>
        <button
          onClick={() => setViewMode('flujo')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
            viewMode === 'flujo' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Flujo de Mercadería
        </button>
      </div>

      {/* Period selectors */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-slate-500 text-xs mb-1">Mes</label>
          <select
            value={month}
            onChange={e => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1">Año</label>
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1">Quincena</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as PeriodType)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="full">Mes Completo</option>
            <option value="first">1ra Quincena (Días 1-15)</option>
            <option value="second">2da Quincena (Día 16 al fin)</option>
          </select>
        </div>
      </div>

      {/* Period label */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-center">
        <p className="text-slate-600 text-sm font-medium">
          {periodLabel} — {MONTHS[month]} {year}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Comprado / Invertido"
          value={`$${metrics.totalCost.toFixed(2)}`}
          icon={<DollarSign size={18} />}
          color="bg-amber-500"
        />
        <MetricCard
          label="Total Vendido / Ingresado"
          value={`$${metrics.totalVenta.toFixed(2)}`}
          icon={<ShoppingCart size={18} />}
          color="bg-blue-500"
        />
        <MetricCard
          label="Ganancia Bruta"
          value={`$${metrics.ganancia.toFixed(2)}`}
          icon={<TrendingUp size={18} />}
          color="bg-green-500"
          highlight
        />
        <MetricCard
          label="% Margen Promedio"
          value={`${metrics.margin.toFixed(1)}%`}
          icon={<BarChart3 size={18} />}
          color="bg-teal-500"
        />
      </div>

      {/* Comparison chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-slate-700 font-semibold text-sm">Comparativa: Costo vs Venta</h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" /> Costo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" /> Venta
            </span>
          </div>
        </div>

        <div className="flex items-end justify-around gap-8 h-40 mb-2">
          {/* Previous period */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-end gap-2 w-full justify-center h-full">
              <div className="flex flex-col items-center justify-end w-12 h-full">
                <span className="text-amber-600 text-xs font-medium mb-1">${prevMetrics.totalCost.toFixed(0)}</span>
                <div className="w-full bg-amber-400 rounded-t transition-all duration-500" style={{ height: `${prevCostPct}%` }} />
              </div>
              <div className="flex flex-col items-center justify-end w-12 h-full">
                <span className="text-blue-600 text-xs font-medium mb-1">${prevMetrics.totalVenta.toFixed(0)}</span>
                <div className="w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${prevVentaPct}%` }} />
              </div>
            </div>
            <span className="text-slate-500 text-xs font-medium">{prevPeriodLabel}</span>
          </div>

          {/* Current period */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-end gap-2 w-full justify-center h-full">
              <div className="flex flex-col items-center justify-end w-12 h-full">
                <span className="text-amber-600 text-xs font-medium mb-1">${metrics.totalCost.toFixed(0)}</span>
                <div className="w-full bg-amber-400 rounded-t transition-all duration-500" style={{ height: `${costPct}%` }} />
              </div>
              <div className="flex flex-col items-center justify-end w-12 h-full">
                <span className="text-blue-600 text-xs font-medium mb-1">${metrics.totalVenta.toFixed(0)}</span>
                <div className="w-full bg-blue-500 rounded-t transition-all duration-500" style={{ height: `${ventaPct}%` }} />
              </div>
            </div>
            <span className="text-slate-700 text-xs font-bold">Período Actual</span>
          </div>
        </div>

        {/* Ganancia comparison */}
        <div className="flex justify-center pt-3 border-t border-slate-100">
          {prevMetrics.ganancia > 0 && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${gananciaChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {gananciaChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              Ganancia {gananciaChange >= 0 ? 'aumentó' : 'disminuyó'} {Math.abs(gananciaChange).toFixed(1)}% vs período anterior
            </div>
          )}
        </div>
      </div>

      {/* Sales detail table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" />
          <h4 className="text-slate-700 font-medium text-sm">Desglose de Ventas del Período</h4>
        </div>
        {periodSales.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No hay ventas registradas en este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Fecha</th>
                  <th className="text-left text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Producto</th>
                  <th className="text-center text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Cant.</th>
                  <th className="text-right text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Costo Total</th>
                  <th className="text-right text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Venta Total</th>
                  <th className="text-right text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Ganancia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodSales.map(s => {
                  const cost = saleCost(s);
                  const venta = saleVenta(s);
                  const gan = venta - cost;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(s.date + 'T12:00:00').toLocaleDateString('es-PA')}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-slate-700 font-medium text-sm">{s.itemName}</p>
                        {s.notes && <p className="text-slate-400 text-xs">{s.notes}</p>}
                      </td>
                      <td className="px-5 py-3 text-center text-slate-600 hidden sm:table-cell">{s.quantity}</td>
                      <td className="px-5 py-3 text-right text-slate-500 tabular-nums hidden md:table-cell">${cost.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right text-slate-800 font-semibold tabular-nums">${venta.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        <span className={gan >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          ${gan.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide text-right">
                    Totales ({metrics.count} ventas)
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell" />
                  <td className="px-5 py-3 text-right text-slate-700 font-bold hidden md:table-cell">${metrics.totalCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-slate-800 font-bold">${metrics.totalVenta.toFixed(2)}</td>
                  <td className="px-5 py-3 text-right text-green-700 font-bold">${metrics.ganancia.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, highlight, sub }: { label: string; value: string; icon: React.ReactNode; color: string; highlight?: boolean; sub?: string }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-2 ${highlight ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <p className={`font-bold text-xl leading-none ${highlight ? 'text-green-700' : 'text-slate-800'}`}>{value}</p>
      {sub && <p className="text-slate-400 text-xs">{sub}</p>}
    </div>
  );
}
