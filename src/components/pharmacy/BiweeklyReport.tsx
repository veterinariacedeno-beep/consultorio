import { useState, useMemo } from 'react';
import {
  CalendarRange,
  DollarSign,
  ShoppingCart,
  Receipt,
  Banknote,
  Smartphone,
  ArrowLeftRight,
  Download,
  TrendingUp,
} from 'lucide-react';
import type { PharmacySale } from '../../types';

interface Props {
  sales: PharmacySale[];
}

interface BiweeklyPeriod {
  label: string;
  start: Date;
  end: Date;
  isCurrent: boolean;
}

function getBiweeklyPeriods(): BiweeklyPeriod[] {
  const periods: BiweeklyPeriod[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const currentSat = new Date(today);
  const dayOfWeek = currentSat.getDay();
  const daysToSat = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
  currentSat.setDate(currentSat.getDate() + daysToSat);
  currentSat.setHours(23, 59, 59, 999);

  const currentStart = new Date(currentSat);
  currentStart.setDate(currentSat.getDate() - 13);
  currentStart.setHours(0, 0, 0, 0);

  periods.push({
    label: `Ciclo actual (hasta Sáb ${fmtShort(currentSat)})`,
    start: currentStart,
    end: currentSat,
    isCurrent: true,
  });

  let lastEnd = new Date(currentStart);
  lastEnd.setDate(lastEnd.getDate() - 1);
  lastEnd.setHours(23, 59, 59, 999);

  for (let i = 0; i < 12; i++) {
    const periodEnd = new Date(lastEnd);
    const periodStart = new Date(lastEnd);
    periodStart.setDate(periodEnd.getDate() - 13);
    periodStart.setHours(0, 0, 0, 0);

    periods.push({
      label: `Período: ${fmtShort(periodStart)} – ${fmtShort(periodEnd)}`,
      start: periodStart,
      end: periodEnd,
      isCurrent: false,
    });

    lastEnd = new Date(periodStart);
    lastEnd.setDate(lastEnd.getDate() - 1);
    lastEnd.setHours(23, 59, 59, 999);
  }

  return periods;
}

function fmtShort(d: Date): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${months[d.getMonth()]}`;
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BiweeklyReport({ sales }: Props) {
  const periods = useMemo(() => getBiweeklyPeriods(), []);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const period = periods[selectedIdx];

  const periodSales = useMemo(() => {
    return sales
      .filter(s => {
        const d = new Date(s.date + 'T12:00:00');
        return d >= period.start && d <= period.end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }, [sales, period]);

  const metrics = useMemo(() => {
    const totalRevenue = periodSales.reduce((sum, s) => sum + s.total, 0);
    const salesCount = periodSales.length;
    const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;
    const cash = periodSales.filter(s => s.paymentMethod === 'Efectivo').reduce((a, s) => a + s.total, 0);
    const yappy = periodSales.filter(s => s.paymentMethod === 'Yappy').reduce((a, s) => a + s.total, 0);
    const transfer = periodSales.filter(s => s.paymentMethod === 'Transferencia').reduce((a, s) => a + s.total, 0);
    const totalUnits = periodSales.reduce((sum, s) => sum + s.quantity, 0);
    return { totalRevenue, salesCount, avgTicket, cash, yappy, transfer, totalUnits };
  }, [periodSales]);

  function handleExportCSV() {
    const headers = ['Fecha', 'Ticket/ID', 'Producto', 'Cantidad', 'Precio Unit.', 'Total', 'Metodo Pago', 'Notas'];
    const rows = periodSales.map(s => [
      s.date,
      s.id.slice(0, 8).toUpperCase(),
      s.itemName,
      String(s.quantity),
      s.unitPrice.toFixed(2),
      s.total.toFixed(2),
      s.paymentMethod,
      s.notes.replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_quincenal_${period.start.toISOString().slice(0, 10)}_${period.end.toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <CalendarRange size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-slate-800 font-semibold text-sm">Reporte Quincenal de Farmacia</h3>
            <p className="text-slate-400 text-xs">Corte cada 2 sábados</p>
          </div>
        </div>
        <div className="flex gap-2 flex-1 max-w-sm sm:ml-auto">
          <select
            value={selectedIdx}
            onChange={e => setSelectedIdx(parseInt(e.target.value))}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={periodSales.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Period label */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-center">
        <p className="text-slate-600 text-sm font-medium">
          {fmtLong(period.start)} al {fmtLong(period.end)}
          {period.isCurrent && <span className="text-blue-600 text-xs ml-2">(en curso, acumulado hasta hoy)</span>}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Ingresos Totales"
          value={`$${metrics.totalRevenue.toFixed(2)}`}
          icon={<DollarSign size={18} />}
          color="bg-green-500"
        />
        <MetricCard
          label="Ventas Realizadas"
          value={String(metrics.salesCount)}
          sub={`${metrics.totalUnits} unidades vendidas`}
          icon={<ShoppingCart size={18} />}
          color="bg-blue-500"
        />
        <MetricCard
          label="Ticket Promedio"
          value={`$${metrics.avgTicket.toFixed(2)}`}
          icon={<Receipt size={18} />}
          color="bg-teal-500"
        />
        <MetricCard
          label="Efectivo / Yappy / Trans."
          value={`$${metrics.cash.toFixed(0)} / $${metrics.yappy.toFixed(0)} / $${metrics.transfer.toFixed(0)}`}
          icon={<Banknote size={18} />}
          color="bg-slate-500"
        />
      </div>

      {/* Sales detail table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-500" />
          <h4 className="text-slate-700 font-medium text-sm">Detalle de Ventas del Período</h4>
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
                  <th className="text-left text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Ticket</th>
                  <th className="text-left text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Producto</th>
                  <th className="text-center text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Cant.</th>
                  <th className="text-left text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Pago</th>
                  <th className="text-right text-slate-600 font-semibold px-5 py-3 text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodSales.map((s, i) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(s.date + 'T12:00:00').toLocaleDateString('es-PA')}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono">
                      #{s.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-slate-700 font-medium text-sm">{s.itemName}</p>
                      {s.notes && <p className="text-slate-400 text-xs">{s.notes}</p>}
                    </td>
                    <td className="px-5 py-3 text-center text-slate-600 hidden sm:table-cell">{s.quantity}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <PaymentBadge method={s.paymentMethod} />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-800 font-semibold tabular-nums">${s.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide text-right hidden sm:table-cell">
                    Total Ingresos ({metrics.salesCount} ventas)
                  </td>
                  <td colSpan={3} className="px-5 py-3 text-slate-600 text-xs font-semibold uppercase tracking-wide text-right sm:hidden">
                    Total: {metrics.salesCount} ventas
                  </td>
                  <td colSpan={2} className="px-5 py-3 text-right hidden sm:table-cell" />
                  <td className="px-5 py-3 text-right text-slate-800 text-base font-bold tabular-nums">
                    ${metrics.totalRevenue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, sub }: { label: string; value: string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <p className="text-slate-800 font-bold text-xl leading-none">{value}</p>
      {sub && <p className="text-slate-400 text-xs">{sub}</p>}
    </div>
  );
}

function PaymentBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    Efectivo: 'bg-green-100 text-green-700',
    Yappy: 'bg-blue-100 text-blue-700',
    Transferencia: 'bg-violet-100 text-violet-700',
  };
  const icons: Record<string, React.ReactNode> = {
    Efectivo: <Banknote size={10} />,
    Yappy: <Smartphone size={10} />,
    Transferencia: <ArrowLeftRight size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${styles[method] ?? 'bg-slate-100 text-slate-600'}`}>
      {icons[method]} {method}
    </span>
  );
}
