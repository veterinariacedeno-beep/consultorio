import { useMemo, useState } from 'react';
import {
  DollarSign,
  Banknote,
  Smartphone,
  Activity,
  TrendingUp,
  Calendar,
  PawPrint,
  Users,
  ArrowLeftRight,
  BellRing,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Phone,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { localDateString } from '../context/AppContext';
import type { ServiceType, Reminder } from '../types';
import type { ActiveView } from './Layout';

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function getWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const sat = new Date(mon);
  sat.setDate(mon.getDate() + 5);
  const fmt = (d: Date) =>
    d.toLocaleDateString('es-PA', { day: '2-digit', month: 'short' });
  return `${fmt(mon)} – ${fmt(sat)}`;
}

function isOverdue(r: Reminder): boolean {
  return r.status === 'Pendiente' && r.dueDate < localDateString();
}

function isToday(r: Reminder): boolean {
  return r.status === 'Pendiente' && r.dueDate === localDateString();
}

function isWithinWeek(r: Reminder): boolean {
  if (r.status !== 'Pendiente') return false;
  const today = localDateString();
  if (r.dueDate < today) return false;
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  return r.dueDate <= localDateString(in7);
}

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

const SERVICE_COLORS: Record<ServiceType, string> = {
  Consulta: 'bg-blue-500',
  Vacunación: 'bg-teal-500',
  Desparasitación: 'bg-green-500',
  Cirugía: 'bg-red-500',
  'Baño y Corte': 'bg-amber-500',
  'Baño Medicado': 'bg-orange-500',
  'Baño Garrapaticida': 'bg-lime-500',
  'Baño Normal': 'bg-yellow-500',
  Tratamiento: 'bg-cyan-500',
  'Clínica': 'bg-indigo-500',
  'Exámenes': 'bg-fuchsia-500',
  'Exportación': 'bg-sky-500',
  'Corte de Uña': 'bg-rose-500',
  Otro: 'bg-slate-400',
};

interface Props {
  onNavigate: (v: ActiveView) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { owners, pets, getCurrentWeekServices, getWeeklyTotals, services, reminders, updateReminder } = useApp();

  const weekServices = getCurrentWeekServices();
  const totals = useMemo(() => getWeeklyTotals(), [getWeeklyTotals]);

  const cashPct = totals.total > 0 ? (totals.cash / totals.total) * 100 : 0;
  const yappyPct = totals.total > 0 ? (totals.yappy / totals.total) * 100 : 0;
  const transferPct = totals.total > 0 ? (totals.transfer / totals.total) * 100 : 0;

  const reminderStats = useMemo(() => {
    const overdue = reminders.filter(isOverdue);
    const today = reminders.filter(isToday);
    const week = reminders.filter(isWithinWeek);
    return { overdueCount: overdue.length, todayCount: today.length, weekCount: week.length };
  }, [reminders]);

  const urgentReminders = useMemo(() => {
    return reminders
      .filter(r => isOverdue(r) || isToday(r))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reminders]);

  const servicesByType = useMemo(() => {
    const map: Partial<Record<ServiceType, number>> = {};
    weekServices.forEach(s => {
      const types = s.types?.length ? s.types : s.type ? [s.type] : ['Consulta'];
      types.forEach((t) => {
        const key = t as ServiceType;
        if (key) map[key] = (map[key] || 0) + 1;
      });
    });
    return Object.entries(map).sort((a, b) => (b[1] as number) - (a[1] as number)) as [ServiceType, number][];
  }, [weekServices]);

  const recentServices = useMemo(() => {
    return [...services]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [services]);

  const dailyRevenue = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    return days.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = localDateString(d);
      const total = weekServices
        .filter(s => s.date === dateStr)
        .reduce((a, s) => a + s.price, 0);
      return { label, total };
    });
  }, [weekServices]);

  const maxDaily = Math.max(...dailyRevenue.map(d => d.total), 1);
  const hasUrgent = urgentReminders.length > 0;

  return (
    <div className="space-y-6">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-800 font-bold text-xl">Dashboard Financiero</h2>
          <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
            <Calendar size={14} />
            Semana actual: {getWeekLabel()}
          </p>
        </div>
      </div>

      {/* Reminder stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <ReminderStatCard
          label="Vencidos"
          value={reminderStats.overdueCount}
          icon={<AlertTriangle size={20} />}
          color={reminderStats.overdueCount > 0 ? 'bg-red-500' : 'bg-slate-400'}
          alert={reminderStats.overdueCount > 0}
        />
        <ReminderStatCard
          label="Para Hoy"
          value={reminderStats.todayCount}
          icon={<CalendarClock size={20} />}
          color={reminderStats.todayCount > 0 ? 'bg-amber-500' : 'bg-slate-400'}
          alert={reminderStats.todayCount > 0}
        />
        <ReminderStatCard
          label="Próximos 7 días"
          value={reminderStats.weekCount}
          icon={<BellRing size={20} />}
          color="bg-blue-500"
        />
      </div>

      {/* Acción Requerida Hoy */}
      {hasUrgent ? (
        <div className="bg-white rounded-xl border-2 border-amber-200 overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600" />
            <h3 className="text-amber-800 font-semibold text-sm">Acción Requerida Hoy</h3>
            <span className="ml-auto text-amber-600 text-xs font-medium">
              {urgentReminders.length} recordatorio{urgentReminders.length !== 1 ? 's' : ''} prioritario{urgentReminders.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left text-slate-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wide">Mascota / Dueño</th>
                  <th className="text-left text-slate-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                  <th className="text-left text-slate-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wide">Medicamento / Vacuna</th>
                  <th className="text-center text-slate-500 font-medium px-4 py-2.5 text-xs uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {urgentReminders.map(r => {
                  const overdue = isOverdue(r);
                  const delay = overdue ? daysOverdue(r.dueDate) : 0;
                  return (
                    <UrgentReminderRow
                      key={r.id}
                      reminder={r}
                      overdue={overdue}
                      delay={delay}
                      onComplete={() => updateReminder({ ...r, status: 'Completado' })}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('reminders')}
              className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1"
            >
              Ver todos los recordatorios <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} className="text-green-500" />
          </div>
          <p className="text-slate-600 text-sm font-medium">Todo al día: no hay dosis pendientes por contactar hoy.</p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Total Semanal"
          value={formatCurrency(totals.total)}
          icon={<DollarSign size={20} />}
          color="bg-teal-500"
          sub={`${totals.count} servicio${totals.count !== 1 ? 's' : ''}`}
        />
        <KpiCard
          label="Efectivo"
          value={formatCurrency(totals.cash)}
          icon={<Banknote size={20} />}
          color="bg-green-500"
          sub={`${cashPct.toFixed(0)}% del total`}
        />
        <KpiCard
          label="Yappy"
          value={formatCurrency(totals.yappy)}
          icon={<Smartphone size={20} />}
          color="bg-blue-500"
          sub={`${yappyPct.toFixed(0)}% del total`}
        />
        <KpiCard
          label="Transferencia"
          value={formatCurrency(totals.transfer)}
          icon={<ArrowLeftRight size={20} />}
          color="bg-violet-500"
          sub={`${transferPct.toFixed(0)}% del total`}
        />
        <KpiCard
          label="Pacientes"
          value={String(pets.length)}
          icon={<PawPrint size={20} />}
          color="bg-amber-500"
          sub={`${owners.length} cliente${owners.length !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily revenue bar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700 font-semibold text-sm">Ingresos por Día</h3>
            <TrendingUp size={16} className="text-teal-500" />
          </div>
          <div className="flex items-end gap-3 h-32">
            {dailyRevenue.map(({ label, total }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-slate-500 text-xs font-medium">
                  {total > 0 ? `$${total.toFixed(0)}` : ''}
                </span>
                <div className="w-full bg-slate-100 rounded-md overflow-hidden" style={{ height: '80px' }}>
                  <div
                    className="w-full bg-teal-500 rounded-md transition-all duration-500"
                    style={{ height: `${(total / maxDaily) * 100}%`, marginTop: 'auto' }}
                  />
                </div>
                <span className="text-slate-500 text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment split */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700 font-semibold text-sm">Métodos de Pago</h3>
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="space-y-3">
            <PaymentBar label="Efectivo" value={totals.cash} pct={cashPct} color="bg-green-500" icon={<Banknote size={13} className="text-green-500" />} />
            <PaymentBar label="Yappy" value={totals.yappy} pct={yappyPct} color="bg-blue-500" icon={<Smartphone size={13} className="text-blue-500" />} />
            <PaymentBar label="Transferencia" value={totals.transfer} pct={transferPct} color="bg-violet-500" icon={<ArrowLeftRight size={13} className="text-violet-500" />} />
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Total</span>
                <span className="text-slate-800 font-bold">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services by type + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By type */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 font-semibold text-sm mb-4">Servicios esta Semana</h3>
          {servicesByType.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Sin servicios esta semana</p>
          ) : (
            <ul className="space-y-2.5">
              {servicesByType.map(([type, count]) => (
                <li key={type} className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${SERVICE_COLORS[type] ?? 'bg-slate-400'}`} />
                  <span className="text-slate-600 text-sm flex-1">{type}</span>
                  <span className="text-slate-800 font-semibold text-sm">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent services */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-700 font-semibold text-sm">Actividad Reciente</h3>
            <Users size={16} className="text-slate-400" />
          </div>
          {recentServices.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No hay servicios registrados</p>
          ) : (
            <div className="space-y-2">
              {recentServices.map(s => (
                <RecentRow key={s.id} service={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReminderStatCard({ label, value, icon, color, alert }: { label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${alert ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white flex-shrink-0`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`font-bold text-2xl leading-none ${alert ? 'text-red-600' : 'text-slate-800'}`}>{value}</p>
        {alert && <p className="text-red-500 text-xs mt-1">¡Requiere atención!</p>}
      </div>
    </div>
  );
}

function UrgentReminderRow({ reminder, overdue, delay, onComplete }: { reminder: Reminder; overdue: boolean; delay: number; onComplete: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyPhone() {
    if (!reminder.ownerPhone) return;
    navigator.clipboard.writeText(reminder.ownerPhone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/30' : 'bg-amber-50/30'}`}>
      <td className="px-4 py-3">
        <p className="text-slate-800 font-medium text-sm flex items-center gap-1.5">
          <PawPrint size={12} className="text-slate-400" />
          {reminder.petName || '—'}
        </p>
        <p className="text-slate-400 text-xs">{reminder.ownerName || 'Sin cliente'}</p>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {reminder.ownerPhone ? (
          <button
            onClick={copyPhone}
            className="text-slate-600 text-sm flex items-center gap-1.5 hover:text-teal-600 transition-colors"
            title="Copiar al portapapeles"
          >
            <Phone size={12} className="text-slate-400" />
            {reminder.ownerPhone}
            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={11} className="text-slate-300" />}
          </button>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600 text-sm">{reminder.itemName}</td>
      <td className="px-4 py-3 text-center">
        {overdue ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
            <AlertTriangle size={10} /> {delay} día{delay !== 1 ? 's' : ''} de retraso
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            <CalendarClock size={10} /> Vence hoy
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onComplete}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors whitespace-nowrap"
        >
          <CheckCircle2 size={12} /> Completado
        </button>
      </td>
    </tr>
  );
}

function PaymentBar({ label, value, pct, color, icon }: { label: string; value: number; pct: number; color: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span className="text-slate-700 font-semibold">${value.toFixed(2)}</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-right text-slate-400 text-xs mt-0.5">{pct.toFixed(0)}%</p>
    </div>
  );
}

function KpiCard({
  label, value, icon, color, sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-800 font-bold text-2xl leading-none">{value}</p>
        <p className="text-slate-400 text-xs mt-1">{sub}</p>
      </div>
    </div>
  );
}

function RecentRow({ service }: { service: import('../types').ServiceRecord }) {
  const { pets, owners } = useApp();
  const pet = pets.find(p => p.id === service.petId);
  const owner = owners.find(o => o.id === service.ownerId);
  const typeLabel = service.types?.join(', ') || service.type || '–';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
        <PawPrint size={14} className="text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-700 text-sm font-medium truncate">
          {pet?.name ?? '–'} <span className="text-slate-400 font-normal">({owner?.name ?? '–'})</span>
        </p>
        <p className="text-slate-400 text-xs truncate">{typeLabel} · {new Date(service.date + 'T12:00:00').toLocaleDateString('es-PA')}</p>
      </div>
      <span className="text-slate-700 font-semibold text-sm flex-shrink-0">
        ${service.price.toFixed(2)}
      </span>
    </div>
  );
}
