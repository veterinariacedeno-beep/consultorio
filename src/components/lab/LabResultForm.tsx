import { useState, useRef } from 'react';
import { X, FlaskConical, Plus, Trash2, Upload, FileDown, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadPdf } from '../../utils/pdf';
import type { LabResult, LabTestResult, ServiceRecord, Pet, Owner } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

const CLINIC_HEADER = 'Consultorio Veterinario DR. CEDEÑO';
const CLINIC_SUB1 = 'R.U.C. 6-67-83 D.V.63';
const CLINIC_SUB2 = 'La Locería, Calle 22A, Norte, Casa 96 A';
const CLINIC_SUB3 = 'Horario: Lun a Vie 8:00 a.m. - 12:00 m.d. / 2:00 p.m. - 5:00 p.m. · Sáb 8:00 a.m. - 12:00 m.d.';

const LAB_TESTS = [
  'HW Ag. (Dirofilaria)',
  'E. Canis Ab. (Ehrlichia canis)',
  'Leish Ab. (Leishmaniasis)',
  'Anaplas Ab. (Anaplasmosis)',
  'CPV Ag (Parvovirus)',
  'Distemper Ag (Moquillo)',
  'FIV Ag (Inmunodeficiencia Felina)',
  'FeLV Ac (Leucemia Felina)',
  'CCV Ag (Coronavirus)',
  'Giardia Ag',
];

const NEGATIVE_AUTOFILL: Record<string, string> = {
  'HW Ag. (Dirofilaria)': 'No hay antígeno de gusano adulto en sangre.',
  'E. Canis Ab. (Ehrlichia canis)': 'Sin anticuerpos contra Ehrlichia canis.',
  'Leish Ab. (Leishmaniasis)': 'Sin anticuerpos detectados.',
  'Anaplas Ab. (Anaplasmosis)': 'Sin evidencia de infección.',
  'CPV Ag (Parvovirus)': 'No se detectó antígenos de parvovirus canino.',
  'Distemper Ag (Moquillo)': 'No se detectó antígenos de distemper canino.',
  'FIV Ag (Inmunodeficiencia Felina)': 'Sin anticuerpos detectados.',
  'FeLV Ac (Leucemia Felina)': 'Sin anticuerpos detectados.',
  'CCV Ag (Coronavirus)': 'No se detecto antígenos de coronavirus canino.',
  'Giardia Ag': 'Sin anticuerpos detectados contra la giardia.',
};

const POSITIVE_AUTOFILL: Record<string, string> = {
  'HW Ag. (Dirofilaria)': 'Antígeno de gusano adulto detectado en sangre.',
  'E. Canis Ab. (Ehrlichia canis)': 'Anticuerpos contra Ehrlichia canis detectados.',
  'Leish Ab. (Leishmaniasis)': 'Anticuerpos detectados.',
  'Anaplas Ab. (Anaplasmosis)': 'Evidencia de infección detectada.',
  'CPV Ag (Parvovirus)': 'Antígenos de parvovirus canino detectados.',
  'Distemper Ag (Moquillo)': 'Antígenos de distemper canino detectados.',
  'FIV Ag (Inmunodeficiencia Felina)': 'Anticuerpos detectados.',
  'FeLV Ac (Leucemia Felina)': 'Anticuerpos detectados.',
  'CCV Ag (Coronavirus)': 'Antígenos de coronavirus canino detectados.',
  'Giardia Ag': 'Antígenos de giardia detectados.',
};

export default function LabResultForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addLabResult, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tests, setTests] = useState<LabTestResult[]>([
    { name: '', result: '', details: '' },
  ]);
  const [observations, setObservations] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  function handleTestChange(idx: number, field: keyof LabTestResult, value: string) {
    setTests(prev => prev.map((t, i) => {
      if (i !== idx) return t;
      const updated = { ...t, [field]: value };
      if (field === 'result' && updated.name) {
        if (value === 'Negativo') {
          const auto = NEGATIVE_AUTOFILL[updated.name];
          if (auto) updated.details = auto;
        } else if (value === 'Positivo') {
          const auto = POSITIVE_AUTOFILL[updated.name];
          if (auto) updated.details = auto;
        }
      }
      return updated;
    }));
  }

  function addTestRow() {
    setTests(prev => [...prev, { name: '', result: '', details: '' }]);
  }

  function removeTestRow(idx: number) {
    setTests(prev => prev.filter((_, i) => i !== idx));
  }

  function readFileAsDataUrl(file: File, cb: (data: string) => void) {
    const reader = new FileReader();
    reader.onload = () => cb(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError('La imagen de la firma es demasiado grande. Máximo 2 MB.');
      return;
    }
    setSignatureName(file.name);
    readFileAsDataUrl(file, data => {
      setSignatureData(data);
      setError('');
    });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5_000_000) {
      setError('La foto de evidencia es demasiado grande. Máximo 5 MB.');
      return;
    }
    setPhotoName(file.name);
    readFileAsDataUrl(file, data => {
      setPhotoData(data);
      setError('');
    });
  }

  function handleGenerate() {
    const validTests = tests.filter(t => t.name.trim());
    if (validTests.length === 0) {
      setError('Agrega al menos un examen.');
      return;
    }
    setError('');
    const labResult: LabResult = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      tests: validTests,
      observations,
      signatureData,
      photoData,
      createdAt: new Date().toISOString(),
    };
    addLabResult(labResult);

    const service: ServiceRecord = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      type: 'Exámenes',
      types: ['Exámenes'],
      vaccines: [],
      description: 'Examen de Laboratorio',
      observations: `Laboratorio: ${validTests.map(t => t.name).join(', ')}`,
      diagnosis: '',
      treatment: '',
      price: 0,
      paymentMethod: 'Efectivo',
      payments: [],
      vet: '',
      createdAt: new Date().toISOString(),
    };
    addService(service);

    setShowPreview(true);
  }

  if (!pet || !owner) return null;

  if (showPreview) {
    return (
      <LabResultPreview
        pet={pet}
        owner={owner}
        date={date}
        tests={tests.filter(t => t.name.trim())}
        observations={observations}
        signatureData={signatureData}
        photoData={photoData}
        onClose={onClose}
        downloading={downloading}
        setDownloading={setDownloading}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-fuchsia-600" />
            <h2 className="text-slate-800 font-semibold">Resultados de Laboratorio</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-lg bg-fuchsia-100 flex items-center justify-center">
              <FlaskConical size={16} className="text-fuchsia-600" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">{pet.name} <span className="text-slate-400 font-normal">· {pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</span></p>
              <p className="text-slate-400 text-xs">Propietario: {owner.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del examen</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-2">Exámenes realizados</label>
            <div className="space-y-2">
              {tests.map((test, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={test.name}
                      onChange={e => handleTestChange(idx, 'name', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                      <option value="">Seleccionar examen...</option>
                      {LAB_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={test.result}
                      onChange={e => handleTestChange(idx, 'result', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                      <option value="">Resultado...</option>
                      <option value="Negativo">Negativo</option>
                      <option value="Positivo">Positivo</option>
                    </select>
                    {tests.length > 1 && (
                      <button
                        onClick={() => removeTestRow(idx)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={test.details}
                    onChange={e => handleTestChange(idx, 'details', e.target.value)}
                    placeholder="Detalle / observación del examen (se autocompleta según el resultado)..."
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addTestRow}
              className="mt-2 flex items-center gap-1.5 text-fuchsia-600 text-sm font-medium hover:underline"
            >
              <Plus size={14} /> Agregar examen
            </button>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Observaciones clínicas</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={3}
              placeholder="Observaciones clínicas adicionales..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
            />
          </div>

          {/* Photo evidence */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Evidencia Fotográfica del examen <span className="text-slate-400 font-normal text-xs">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                <Camera size={15} /> Subir foto
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {photoName && (
                <span className="text-slate-500 text-sm">{photoName}</span>
              )}
              {photoData && (
                <img src={photoData} alt="Evidencia" className="h-12 object-contain rounded border border-slate-200" />
              )}
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Firma / Sello del veterinario <span className="text-slate-400 font-normal text-xs">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => signatureInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                <Upload size={15} /> Subir imagen
              </button>
              <input
                ref={signatureInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              {signatureName && (
                <span className="text-slate-500 text-sm">{signatureName}</span>
              )}
              {signatureData && (
                <img src={signatureData} alt="Firma" className="h-12 object-contain rounded border border-slate-200" />
              )}
            </div>
            <p className="text-slate-400 text-xs mt-1.5">Si no subes una firma, se generará una línea en blanco para firmar a mano.</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-4 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 transition-colors"
          >
            Generar Documento
          </button>
        </div>
      </div>
    </div>
  );
}

function LabResultPreview({
  pet,
  owner,
  date,
  tests,
  observations,
  signatureData,
  photoData,
  onClose,
  downloading,
  setDownloading,
}: {
  pet: Pet;
  owner: Owner;
  date: string;
  tests: LabTestResult[];
  observations: string;
  signatureData: string;
  photoData: string;
  onClose: () => void;
  downloading: boolean;
  setDownloading: (v: boolean) => void;
}) {
  const docRef = useRef<HTMLDivElement>(null);

  async function handleDownloadPdf() {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      await downloadPdf(docRef.current, `Laboratorio_${pet.name}_${date}.pdf`);
    } catch {
      setDownloading(false);
    }
  }

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-PA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Vista Previa - Resultados de Laboratorio</span>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-1.5 bg-fuchsia-600 rounded-lg text-sm font-medium hover:bg-fuchsia-700 transition-colors disabled:opacity-60"
          >
            <FileDown size={15} /> {downloading ? 'Generando...' : 'Guardar como PDF'}
          </button>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="bg-slate-100 min-h-screen pt-16 pb-8 flex justify-center">
        <div
          ref={docRef}
          className="doc-page shadow-lg"
          style={{ width: '210mm', minHeight: '297mm', padding: '18mm', boxSizing: 'border-box' }}
        >
          {/* Header */}
          <div className="doc-header" style={{ borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '14px', textAlign: 'center' }}>
            <div className="doc-clinic-name" style={{ fontSize: '18px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {CLINIC_HEADER}
            </div>
            <div className="doc-sub" style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{CLINIC_SUB1}</div>
            <div className="doc-sub" style={{ fontSize: '12px', color: '#475569' }}>{CLINIC_SUB2}</div>
            <div className="doc-sub" style={{ fontSize: '11px', color: '#475569' }}>{CLINIC_SUB3}</div>
            <div className="doc-title" style={{ fontSize: '14px', fontWeight: 700, color: '#0f766e', marginTop: '8px', letterSpacing: '0.5px' }}>
              RESULTADOS DE EXÁMENES DE LABORATORIO
            </div>
          </div>

          {/* Patient info */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Datos del Paciente
          </div>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, width: '20%', background: '#f8fafc' }}>Paciente</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, width: '20%', background: '#f8fafc' }}>Especie / Raza</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Sexo</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.gender}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Propietario</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{owner.name}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Fecha</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{formattedDate}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Teléfono</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{owner.phone || '—'}</td>
              </tr>
            </tbody>
          </table>

          {/* Tests results */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Resultados de Exámenes
          </div>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '12px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'left' }}>Prueba / Parámetro</th>
                <th style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'left' }}>Detalles / Observaciones</th>
                <th style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px', fontWeight: 700, textAlign: 'left', width: '100px' }}>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px', fontWeight: 700 }}>{t.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px', lineHeight: 1.6 }}>{t.details || '—'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '10px 12px', fontSize: '12px' }}>
                    {t.result ? (
                      <span
                        className="doc-badge"
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: '1px solid',
                          background: t.result === 'Negativo' ? '#f0fdf4' : '#fef2f2',
                          color: t.result === 'Negativo' ? '#15803d' : '#b91c1c',
                          borderColor: t.result === 'Negativo' ? '#86efac' : '#fca5a5',
                        }}
                      >
                        {t.result}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Photo evidence */}
          {photoData && (
            <>
              <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Evidencia Fotográfica
              </div>
              <div className="doc-photo" style={{ textAlign: 'center', margin: '8px 0' }}>
                <img
                  src={photoData}
                  alt="Evidencia del examen"
                  style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid #e2e8f0', objectFit: 'contain' }}
                />
              </div>
            </>
          )}

          {/* Clinical observations */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Observaciones Clínicas
          </div>
          <div className="doc-obs" style={{ background: '#f8fafc', border: '1px solid #ccc', borderRadius: '6px', padding: '12px', fontSize: '12px', color: '#334155', minHeight: '50px', whiteSpace: 'pre-wrap', lineHeight: 1.8, textAlign: 'left' }}>
            {observations || 'Sin observaciones clínicas adicionales.'}
          </div>

          {/* Signature */}
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            {signatureData ? (
              <img
                src={signatureData}
                alt="Firma del veterinario"
                style={{ height: '70px', maxWidth: '200px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ fontSize: '14px', color: '#475569', marginBottom: '6px', letterSpacing: '1px' }}>
                _________________________
              </div>
            )}
            <div style={{ borderTop: '1px solid #0f172a', width: '220px', margin: '4px auto 4px' }} />
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Dr. Ricardo Cedeño</div>
            <div style={{ fontSize: '11px', color: '#475569' }}>Médico Veterinario - Idoneidad # 454</div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '28px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            Documento generado el {formattedDate}
          </div>
        </div>
      </div>
    </>
  );
}
