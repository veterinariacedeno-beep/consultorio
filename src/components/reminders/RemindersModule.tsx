import { useState, useMemo } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Archive,
  Trash2,
  Phone,
  PawPrint,
  AlertTriangle,
  Search,
  CalendarPlus,
  X,
  Pencil,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';
import type { Reminder, ReminderStatus } from '../../types';

type FilterType = 'today' | 'week' | 'overdue' | 'completed';

const FILTERS: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Para hoy', icon: <CalendarClock size={14} /> },
  { id: 'week', label: 'Próximos 7 días', icon: <BellRing size={14} /> },
  { id: 'overdue', label: 'Vencidos', icon: <AlertTriangle size={14} /> },
  { id: 'completed', label: 'Completados / Archivados', icon: <CheckCircle2 size={14} /> },
];

function isOverdue(r: Reminder): boolean {
  if (r.status !== 'Pendiente') return false;
  return r.dueDate < localDateString();
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

export default function RemindersModule() {
  const { reminders, owners, pets, pharmacyItems, updateReminder, deleteReminder, addReminder } = useApp();
  const [filter, setFilter] = useState<FilterType>('today');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  function showError(msg: string) {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 5000);
  }

  function showSuccess(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  }

  const counts = useMemo(() => {
    return {
      today: reminders.filter(isToday).length,
      week: reminders.filter(isWithinWeek).length,
      overdue: reminders.filter(isOverdue).length,
      completed: reminders.filter(r => r.status !== 'Pendiente').length,
    };
  }, [reminders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let list = reminders.filter(r => {
      if (filter === 'today') return isToday(r);
      if (filter === 'week') return isWithinWeek(r);
      if (filter === 'overdue') return isOverdue(r);
      if (filter === 'completed') return r.status !== 'Pendiente';
      return true;
    });
    if (q) {
      list = list.filter(r => {
        const ownerName = (r.ownerName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const petName = (r.petName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const phone = (r.ownerPhone || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const itemName = (r.itemName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return ownerName.includes(q) || petName.includes(q) || phone.includes(q) || itemName.includes(q);
      });
    }
    return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reminders, filter, search]);

  function handleComplete(r: Reminder) {
    updateReminder({ ...r, status: 'Completado' });
  }

  function handleArchive(r: Reminder) {
    updateReminder({ ...r, status: 'Archivado' });
  }

  function handleRestore(r: Reminder) {
    updateReminder({ ...r, status: 'Pendiente' });
  }

  function handleSaveReminder(r: Reminder) {
    try {
      const missing: string[] = [];
      if (!r.ownerName) missing.push('Cliente');
      if (!r.ownerPhone) missing.push('Teléfono');
      if (!r.petName) missing.push('Mascota');
      if (!r.itemName) missing.push('Producto');
      if (!r.dueDate) missing.push('Fecha de recordatorio');
      if (missing.length > 0) {
        showError(`No se pudo guardar el recordatorio. Faltan campos: ${missing.join(', ')}.`);
        return;
      }
      if (editing) {
        updateReminder(r);
      } else {
        addReminder(r);
      }
      setCreateOpen(false);
      setEditing(null);
      showSuccess(editing ? 'Recordatorio actualizado correctamente.' : 'Recordatorio creado correctamente.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(`Error al guardar el recordatorio: ${msg}`);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <BellRing size={20} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-slate-800 font-semibold">Recordatorios y Seguimiento</h2>
          <p className="text-slate-400 text-xs">Panel interno de alertas para el personal de la clínica</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? f.id === 'overdue'
                  ? 'bg-red-600 text-white'
                  : f.id === 'completed'
                  ? 'bg-slate-600 text-white'
                  : 'bg-teal-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.icon} {f.label}
            <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
              filter === f.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
            }`}>
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Search + create */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, mascota, teléfono o producto..."
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setCreateOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <CalendarPlus size={16} /> Nuevo Recordatorio
        </button>
      </div>

      {/* Toast notifications */}
      {errorToast && (
        <div className="fixed top-6 right-6 z-[70] bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium max-w-md">
          <AlertTriangle size={16} className="flex-shrink-0" /> {errorToast}
        </div>
      )}
      {successToast && (
        <div className="fixed top-6 right-6 z-[70] bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium max-w-md">
          <CheckCircle2 size={16} className="flex-shrink-0" /> {successToast}
        </div>
      )}

      {/* Reminders table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <BellRing size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? `No se encontraron recordatorios para '${search}'.` : 'No hay recordatorios en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Fecha</th>
                  <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Cliente / Mascota</th>
                  <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Producto</th>
                  <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden lg:table-cell">Teléfono</th>
                  <th className="text-center text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const overdue = isOverdue(r);
                  const today = isToday(r);
                  return (
                    <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${overdue ? 'bg-red-50/40' : today ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className={`font-medium text-sm ${overdue ? 'text-red-600' : today ? 'text-amber-600' : 'text-slate-700'}`}>
                          {new Date(r.dueDate + 'T12:00:00').toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {overdue && <p className="text-red-500 text-xs font-medium">Vencido</p>}
                        {today && <p className="text-amber-500 text-xs font-medium">Hoy</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800 font-medium">{r.ownerName || 'Sin cliente'}</p>
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <PawPrint size={10} /> {r.petName || 'Sin mascota'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{r.itemName}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {r.ownerPhone ? (
                          <span className="text-slate-500 text-xs flex items-center gap-1">
                            <Phone size={10} /> {r.ownerPhone}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={r.status} overdue={overdue} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {r.status === 'Pendiente' && (
                            <>
                              <button
                                onClick={() => handleComplete(r)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                title="Marcar completado"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                              <button
                                onClick={() => handleArchive(r)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                title="Archivar"
                              >
                                <Archive size={15} />
                              </button>
                            </>
                          )}
                          {r.status !== 'Pendiente' && (
                            <button
                              onClick={() => handleRestore(r)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="Restaurar a pendiente"
                            >
                              <CalendarClock size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditing(r); setCreateOpen(true); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { if (confirm('¿Eliminar este recordatorio?')) deleteReminder(r.id); }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <ReminderForm
          initial={editing ?? undefined}
          owners={owners}
          pets={pets}
          pharmacyItems={pharmacyItems}
          onSave={handleSaveReminder}
          onClose={() => { setCreateOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status, overdue }: { status: ReminderStatus; overdue: boolean }) {
  if (status === 'Completado') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Completado</span>;
  if (status === 'Archivado') return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Archivado</span>;
  if (overdue) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencido</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pendiente</span>;
}

function ReminderForm({
  initial,
  owners,
  pets,
  pharmacyItems,
  onSave,
  onClose,
}: {
  initial?: Reminder;
  owners: ReturnType<typeof useApp>['owners'];
  pets: ReturnType<typeof useApp>['pets'];
  pharmacyItems: ReturnType<typeof useApp>['pharmacyItems'];
  onSave: (r: Reminder) => void;
  onClose: () => void;
}) {
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? '');
  const [petId, setPetId] = useState(initial?.petId ?? '');
  const [itemId, setItemId] = useState(initial?.itemId ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? localDateString(new Date(Date.now() + 30 * 86400000)));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [formError, setFormError] = useState<string | null>(null);

  const ownerPets = pets.filter(p => p.ownerId === ownerId);
  const selectedOwner = owners.find(o => o.id === ownerId);
  const selectedPet = pets.find(p => p.id === petId);
  const selectedItem = pharmacyItems.find(i => i.id === itemId);

  function normalizeDate(d: string): string {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return d;
    const dt = new Date(d + 'T12:00:00');
    if (isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const missing: string[] = [];
      if (!ownerId && !selectedOwner) missing.push('Cliente');
      if (!itemId && !selectedItem) missing.push('Producto');
      if (!dueDate) missing.push('Fecha de recordatorio');
      if (missing.length > 0) {
        setFormError(`Faltan campos obligatorios: ${missing.join(', ')}.`);
        return;
      }

      const normalizedDueDate = normalizeDate(dueDate);
      if (!normalizedDueDate) {
        setFormError('La fecha del recordatorio no tiene un formato válido (YYYY-MM-DD).');
        return;
      }

      const reminder: Reminder = {
        id: initial?.id ?? crypto.randomUUID(),
        ownerId: ownerId || '',
        ownerName: selectedOwner?.name ?? (initial?.ownerName ?? 'Cliente no especificado'),
        ownerPhone: selectedOwner?.phone ?? (initial?.ownerPhone ?? ''),
        petId: petId || '',
        petName: selectedPet?.name ?? (initial?.petName ?? 'Mascota no especificada'),
        itemId: itemId || '',
        itemName: selectedItem?.name ?? (initial?.itemName ?? 'Producto no especificado'),
        saleDate: initial?.saleDate ?? localDateString(),
        dueDate: normalizedDueDate,
        status: initial?.status ?? 'Pendiente',
        notes,
        createdAt: initial?.createdAt ?? new Date().toISOString(),
      };

      onSave(reminder);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(`Error al guardar el recordatorio: ${msg}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-slate-800 font-semibold flex items-center gap-2">
            <CalendarPlus size={20} className="text-teal-600" />
            {initial ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-sm">{formError}</p>
            </div>
          )}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Cliente *</label>
            <select
              value={ownerId}
              onChange={e => { setOwnerId(e.target.value); setPetId(''); }}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Seleccionar cliente</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Mascota</label>
            <select
              value={petId}
              onChange={e => setPetId(e.target.value)}
              disabled={!ownerId}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            >
              <option value="">Sin mascota</option>
              {ownerPets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Producto / Vacuna *</label>
            <select
              value={itemId}
              onChange={e => setItemId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Seleccionar producto</option>
              {pharmacyItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del recordatorio *</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Notas</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              {initial ? 'Guardar' : 'Crear recordatorio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
