import { useState, useMemo } from 'react';
import { FlaskConical, Plus, Trash2, FileDown, Search, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { drawHeader, drawFooter, loadClinicInfo, saveClinicInfo, formatDate, todayStr, type ClinicInfo } from './pdfUtils';

export interface LabTest {
  id: string;
  petName: string;
  ownerName: string;
  date: string;
  testType: string;
  results: string;
  observations: string;
  createdAt: string;
}

const STORAGE_KEY = 'lab_tests';

const TEST_TYPES = [
  'Hematología Completa',
  'Bioquímica Sanguínea',
  'Coprológico',
  'Urianálisis',
  'Cultivo Bacteriológico',
  'Serología',
  'PCR / Diagnóstico Molecular',
  'Examen de Piel / Ectoparásitos',
  'Otro',
];

function loadTests(): LabTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTests(tests: LabTest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
}

export default function LaboratoryModule() {
  const [tests, setTests] = useState<LabTest[]>(() => loadTests());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [clinic, setClinic] = useState<ClinicInfo>(() => loadClinicInfo());
  const [form, setForm] = useState<Omit<LabTest, 'id' | 'createdAt'>>({
    petName: '',
    ownerName: '',
    date: todayStr(),
    testType: TEST_TYPES[0],
    results: '',
    observations: '',
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tests.filter(t =>
      t.petName.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.testType.toLowerCase().includes(q),
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [tests, search]);

  function persist(next: LabTest[]) {
    setTests(next);
    saveTests(next);
  }

  function handleAdd() {
    if (!form.petName.trim() || !form.ownerName.trim()) return;
    const test: LabTest = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist([test, ...tests]);
    setForm({ petName: '', ownerName: '', date: todayStr(), testType: TEST_TYPES[0], results: '', observations: '' });
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persist(tests.filter(t => t.id !== id));
  }

  function handleExportPDF(test: LabTest) {
    const doc = new jsPDF();
    let y = drawHeader(doc, clinic, 'Reporte de Laboratorio');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('DATOS DEL PACIENTE', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const dataRows = [
      ['Mascota:', test.petName, 'Propietario:', test.ownerName],
      ['Fecha:', formatDate(test.date), 'Tipo de Examen:', test.testType],
    ];
    dataRows.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 60, y);
      doc.setFont('helvetica', 'bold');
      doc.text(row[2], 110, y);
      doc.setFont('helvetica', 'normal');
      doc.text(row[3], 145, y);
      y += 8;
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('RESULTADOS', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitResults = doc.splitTextToSize(test.results || 'Sin resultados registrados.', 170);
    doc.text(splitResults, 22, y);
    y += splitResults.length * 6 + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('OBSERVACIONES', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitObs = doc.splitTextToSize(test.observations || 'Sin observaciones.', 170);
    doc.text(splitObs, 22, y);
    y += splitObs.length * 6 + 6;

    drawFooter(doc, clinic, y);
    doc.save(`Lab_${test.petName}_${test.date}.pdf`);
  }

  function handleSaveClinic() {
    saveClinicInfo(clinic);
    setShowSettings(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <FlaskConical size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold text-lg">Laboratorio</h2>
            <p className="text-slate-400 text-xs">Reportes de laboratorio y exámenes clínicos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Settings size={15} /> Datos del Consultorio
          </button>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo Examen
          </button>
        </div>
      </div>

      {/* Clinic settings panel */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-slate-700 font-medium text-sm">Datos del Consultorio (para PDFs)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre del Consultorio</label>
              <input value={clinic.name} onChange={e => setClinic(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre del Veterinario</label>
              <input value={clinic.vetName} onChange={e => setClinic(prev => ({ ...prev, vetName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Título / Especialidad</label>
              <input value={clinic.vetTitle} onChange={e => setClinic(prev => ({ ...prev, vetTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Teléfono</label>
              <input value={clinic.phone} onChange={e => setClinic(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Dirección</label>
              <input value={clinic.address} onChange={e => setClinic(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleSaveClinic}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            Guardar
          </button>
        </div>
      )}

      {/* New test form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-slate-700 font-medium text-sm">Nuevo Reporte de Laboratorio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre de la Mascota *</label>
              <input value={form.petName} onChange={e => setForm(prev => ({ ...prev, petName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Propietario *</label>
              <input value={form.ownerName} onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Tipo de Examen</label>
              <select value={form.testType} onChange={e => setForm(prev => ({ ...prev, testType: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Resultados</label>
              <textarea value={form.results} onChange={e => setForm(prev => ({ ...prev, results: e.target.value }))}
                rows={4} placeholder="Describa los resultados del examen..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Observaciones</label>
              <textarea value={form.observations} onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
                rows={3} placeholder="Observaciones clínicas, recomendaciones..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Guardar Examen
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por mascota, dueño o examen..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <FlaskConical size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? 'Sin resultados.' : 'No hay exámenes de laboratorio registrados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(test => (
            <div key={test.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-slate-800 font-semibold text-sm">{test.petName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-sm">{test.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">{test.testType}</span>
                    <span className="text-slate-400 text-xs">{formatDate(test.date)}</span>
                  </div>
                  {test.results && (
                    <p className="text-slate-600 text-sm mt-2 line-clamp-2">{test.results}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleExportPDF(test)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                    <FileDown size={14} /> PDF
                  </button>
                  <button onClick={() => handleDelete(test.id)}
                    className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
