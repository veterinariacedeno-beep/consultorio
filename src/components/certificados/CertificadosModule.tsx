import { useState, useMemo } from 'react';
import { Award, Plus, Trash2, FileDown, Search, Settings } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { drawHeader, drawFooter, loadClinicInfo, saveClinicInfo, formatDate, todayStr, type ClinicInfo } from '../laboratorio/pdfUtils';

export interface Certificate {
  id: string;
  petName: string;
  ownerName: string;
  species: string;
  breed: string;
  gender: string;
  destination: string;
  date: string;
  healthStatus: string;
  vaccinations: string;
  observations: string;
  createdAt: string;
}

const STORAGE_KEY = 'cert_export';

function loadCerts(): Certificate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCerts(certs: Certificate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(certs));
}

const emptyForm: Omit<Certificate, 'id' | 'createdAt'> = {
  petName: '',
  ownerName: '',
  species: '',
  breed: '',
  gender: 'Macho',
  destination: '',
  date: todayStr(),
  healthStatus: '',
  vaccinations: '',
  observations: '',
};

export default function CertificadosModule() {
  const [certs, setCerts] = useState<Certificate[]>(() => loadCerts());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [clinic, setClinic] = useState<ClinicInfo>(() => loadClinicInfo());
  const [form, setForm] = useState(emptyForm);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return certs.filter(c =>
      c.petName.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.destination.toLowerCase().includes(q),
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [certs, search]);

  function persist(next: Certificate[]) {
    setCerts(next);
    saveCerts(next);
  }

  function handleAdd() {
    if (!form.petName.trim() || !form.ownerName.trim()) return;
    const cert: Certificate = {
      ...form,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    persist([cert, ...certs]);
    setForm(emptyForm);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    persist(certs.filter(c => c.id !== id));
  }

  function handleExportPDF(cert: Certificate) {
    const doc = new jsPDF();
    let y = drawHeader(doc, clinic, 'Certificado de Exportación');

    // Patient data section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('DATOS DEL ANIMAL', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const rows: [string, string, string, string][] = [
      ['Nombre:', cert.petName, 'Especie:', cert.species || '—'],
      ['Propietario:', cert.ownerName, 'Raza:', cert.breed || '—'],
      ['Sexo:', cert.gender, 'Destino:', cert.destination || '—'],
      ['Fecha:', formatDate(cert.date), '', ''],
    ];
    rows.forEach(row => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], 22, y);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], 55, y);
      if (row[2]) {
        doc.setFont('helvetica', 'bold');
        doc.text(row[2], 110, y);
        doc.setFont('helvetica', 'normal');
        doc.text(row[3], 140, y);
      }
      y += 8;
    });

    // Health status
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('ESTADO DE SALUD', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitHealth = doc.splitTextToSize(
      cert.healthStatus || 'El animal se encuentra en buen estado de salud, libre de enfermedades infectocontagiosas aparentes.',
      170,
    );
    doc.text(splitHealth, 22, y);
    y += splitHealth.length * 6 + 6;

    // Vaccinations
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setFillColor(226, 240, 254);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setTextColor(12, 74, 110);
    doc.text('VACUNACIONES Y TRATAMIENTOS', 22, y - 0.5);
    doc.setTextColor(0, 0, 0);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const splitVax = doc.splitTextToSize(cert.vaccinations || 'Al día con el esquema de vacunación correspondiente.', 170);
    doc.text(splitVax, 22, y);
    y += splitVax.length * 6 + 6;

    // Observations
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
    const splitObs = doc.splitTextToSize(cert.observations || 'Sin observaciones adicionales.', 170);
    doc.text(splitObs, 22, y);
    y += splitObs.length * 6 + 6;

    // Declaration
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const declaration = doc.splitTextToSize(
      'Se expide el presente certificado para fines de exportación y traslado del animal descrito, ' +
      'sujeto a verificación por la autoridad competente.',
      170,
    );
    doc.text(declaration, 22, y);
    y += declaration.length * 5 + 6;

    drawFooter(doc, clinic, y);
    doc.save(`Certificado_${cert.petName}_${cert.date}.pdf`);
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
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Award size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold text-lg">Certificados de Exportación</h2>
            <p className="text-slate-400 text-xs">Certificados veterinarios para exportación y traslado</p>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> Nuevo Certificado
          </button>
        </div>
      </div>

      {/* Clinic settings */}
      {showSettings && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-slate-700 font-medium text-sm">Datos del Consultorio (para PDFs)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre del Consultorio</label>
              <input value={clinic.name} onChange={e => setClinic(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre del Veterinario</label>
              <input value={clinic.vetName} onChange={e => setClinic(prev => ({ ...prev, vetName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Título / Especialidad</label>
              <input value={clinic.vetTitle} onChange={e => setClinic(prev => ({ ...prev, vetTitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Teléfono</label>
              <input value={clinic.phone} onChange={e => setClinic(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Dirección</label>
              <input value={clinic.address} onChange={e => setClinic(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <button onClick={handleSaveClinic}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors">
            Guardar
          </button>
        </div>
      )}

      {/* New cert form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-slate-700 font-medium text-sm">Nuevo Certificado de Exportación</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 text-xs mb-1">Nombre de la Mascota *</label>
              <input value={form.petName} onChange={e => setForm(prev => ({ ...prev, petName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Propietario *</label>
              <input value={form.ownerName} onChange={e => setForm(prev => ({ ...prev, ownerName: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Especie</label>
              <input value={form.species} onChange={e => setForm(prev => ({ ...prev, species: e.target.value }))}
                placeholder="Canino, Felino, etc."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Raza</label>
              <input value={form.breed} onChange={e => setForm(prev => ({ ...prev, breed: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Sexo</label>
              <select value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Destino / País</label>
              <input value={form.destination} onChange={e => setForm(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="País de destino"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Fecha</label>
              <input type="date" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Estado de Salud</label>
              <textarea value={form.healthStatus} onChange={e => setForm(prev => ({ ...prev, healthStatus: e.target.value }))}
                rows={3} placeholder="Describa el estado de salud del animal..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Vacunaciones y Tratamientos</label>
              <textarea value={form.vaccinations} onChange={e => setForm(prev => ({ ...prev, vaccinations: e.target.value }))}
                rows={3} placeholder="Listado de vacunas aplicadas, tratamientos, desparasitación..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-500 text-xs mb-1">Observaciones</label>
              <textarea value={form.observations} onChange={e => setForm(prev => ({ ...prev, observations: e.target.value }))}
                rows={2} placeholder="Observaciones adicionales..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors">
              Guardar Certificado
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
          placeholder="Buscar por mascota, dueño o destino..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Award size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? 'Sin resultados.' : 'No hay certificados de exportación registrados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(cert => (
            <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-slate-800 font-semibold text-sm">{cert.petName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 text-sm">{cert.ownerName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                      {cert.species || 'Especie'} · {cert.breed || 'Raza'}
                    </span>
                    {cert.destination && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">Destino: {cert.destination}</span>
                    )}
                    <span className="text-slate-400 text-xs">{formatDate(cert.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleExportPDF(cert)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors">
                    <FileDown size={14} /> PDF
                  </button>
                  <button onClick={() => handleDelete(cert.id)}
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
