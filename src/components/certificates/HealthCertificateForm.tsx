import { useState, useRef } from 'react';
import { X, Award, Upload, FileDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadPdf } from '../../utils/pdf';
import type { HealthCertificate, ServiceRecord, Pet, Owner } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

const CLINIC_HEADER = 'CONSULTORIO VETERINARIO DR. CEDEÑO';
const CLINIC_SUB1 = 'Doctor Ricardo Cedeño | Idoneidad # 454';
const CLINIC_SUB2 = 'Dir. La Locería, Calle 22A Norte, Casa 96 A';
const CLINIC_SUB3 = 'Tel. 236-9453 / 6719-9283';

const DECLARATION_TEXT =
  'El médico veterinario que suscribe este documento, certifica que el animal descrito anteriormente fue examinado físicamente y se encuentra libre de evidencia de enfermedades infectocontagiosas, incluyendo lesiones de piel, diarrea, emaciación y síntomas que involucren el sistema nervioso. Certifico además que el paciente cumple con los siguientes requisitos sanitarios: Cuenta con la vacuna Antirrábica vigente. Se encuentra debidamente desparasitado (interna y externamente). Está libre de miasis o presencia del Gusano Barrenador (Cochliomyia hominivorax).';

export default function HealthCertificateForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addHealthCertificate, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [healthStatus, setHealthStatus] = useState('Saludable');
  const [observations, setObservations] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError('La imagen de la firma es demasiado grande. Máximo 2 MB.');
      return;
    }
    setSignatureName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureData(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate() {
    if (!passport.trim()) {
      setError('El número de pasaporte es obligatorio.');
      return;
    }
    setError('');
    const cert: HealthCertificate = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      passport,
      address,
      exportTo,
      healthStatus,
      observations,
      signatureData,
      createdAt: new Date().toISOString(),
    };
    addHealthCertificate(cert);

    const service: ServiceRecord = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      type: 'Exportación',
      types: ['Exportación'],
      vaccines: [],
      description: 'Certificado de Salud',
      observations: `Certificado de Salud - Pasaporte: ${passport}`,
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
      <HealthCertPreview
        pet={pet}
        owner={owner}
        date={date}
        passport={passport}
        address={address}
        exportTo={exportTo}
        healthStatus={healthStatus}
        observations={observations}
        signatureData={signatureData}
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
            <Award size={20} className="text-amber-600" />
            <h2 className="text-slate-800 font-semibold">Certificado de Salud</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Award size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">{pet.name} <span className="text-slate-400 font-normal">· {pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</span></p>
              <p className="text-slate-400 text-xs">Propietario: {owner.name}</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del certificado</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Número de Pasaporte / Cédula <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={passport}
              onChange={e => setPassport(e.target.value)}
              placeholder="Ej. 12345-ABC"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Dirección del Propietario</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Dirección completa..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Destino de Exportación</label>
            <input
              type="text"
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              placeholder="País o región de destino..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Estado de Salud</label>
            <select
              value={healthStatus}
              onChange={e => setHealthStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Saludable">Saludable</option>
              <option value="En tratamiento">En tratamiento</option>
              <option value="Recuperado">Recuperado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Observaciones</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={3}
              placeholder="Observaciones del certificado..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Firma / Sello del veterinario <span className="text-slate-400 font-normal text-xs">(opcional)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                <Upload size={15} /> Subir imagen
              </button>
              <input
                ref={fileInputRef}
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Generar Documento
          </button>
        </div>
      </div>
    </div>
  );
}

function HealthCertPreview({
  pet,
  owner,
  date,
  passport,
  address,
  exportTo,
  healthStatus,
  observations,
  signatureData,
  onClose,
  downloading,
  setDownloading,
}: {
  pet: Pet;
  owner: Owner;
  date: string;
  passport: string;
  address: string;
  exportTo: string;
  healthStatus: string;
  observations: string;
  signatureData: string;
  onClose: () => void;
  downloading: boolean;
  setDownloading: (v: boolean) => void;
}) {
  const docRef = useRef<HTMLDivElement>(null);

  async function handleDownloadPdf() {
    if (!docRef.current) return;
    setDownloading(true);
    try {
      await downloadPdf(docRef.current, `Certificado_Salud_${pet.name}_${date}.pdf`);
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
        <span className="text-sm font-medium">Vista Previa - Certificado de Salud</span>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-60"
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
            <div className="doc-sub" style={{ fontSize: '12px', color: '#475569' }}>{CLINIC_SUB3}</div>
            <div className="doc-title" style={{ fontSize: '14px', fontWeight: 700, color: '#0f766e', marginTop: '8px', letterSpacing: '0.5px' }}>
              CERTIFICADO DE SALUD ANIMAL
            </div>
          </div>

          {/* I. Datos del Paciente */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            I. Datos del Paciente
          </div>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, width: '20%', background: '#f8fafc' }}>Nombre</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, width: '20%', background: '#f8fafc' }}>Raza</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.breed || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Especie</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.species}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Peso</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.weight ? `${pet.weight} kg` : '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Color</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.color || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Sexo</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{pet.gender || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Fecha Nacimiento</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }} colSpan={3}>
                  {pet.birthDate ? new Date(pet.birthDate + 'T12:00:00').toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* II. Declaración Médica Veterinaria */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            II. Declaración Médica Veterinaria
          </div>
          <p style={{ fontSize: '12px', textAlign: 'justify', lineHeight: 1.8, margin: '0 0 10px' }}>
            {DECLARATION_TEXT}
          </p>
          {observations && (
            <p style={{ fontSize: '12px', textAlign: 'justify', lineHeight: 1.8, margin: '0 0 10px' }}>
              <strong>Observaciones: </strong>{observations}
            </p>
          )}
          <p style={{ fontSize: '12px', textAlign: 'left', margin: '6px 0 10px' }}>
            Estado de Salud: <strong>{healthStatus}</strong>
          </p>

          {/* III. Datos del Propietario y Exportación */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            III. Datos del Propietario y Exportación
          </div>
          <table className="doc-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', marginBottom: '12px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, width: '25%', background: '#f8fafc' }}>Propietario</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{owner.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, width: '25%', background: '#f8fafc' }}>Pasaporte / Cédula</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{passport}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Teléfono</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{owner.phone || '—'}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Exportación hacia</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }}>{exportTo || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #ccc', padding: '6px 8px', fontSize: '12px', fontWeight: 700, background: '#f8fafc' }}>Dirección</td>
                <td style={{ border: '1px solid #ccc', padding: '8px 12px', fontSize: '12px' }} colSpan={3}>{address || '—'}</td>
              </tr>
            </tbody>
          </table>

          {/* IV. Expedición */}
          <div className="doc-section-title" style={{ background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '8px 12px', fontSize: '13px', fontWeight: 700, color: '#0c4a6e', margin: '14px 0 10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            IV. Expedición
          </div>
          <p style={{ fontSize: '12px', textAlign: 'justify', lineHeight: 1.8, margin: '0 0 20px' }}>
            La presente certificación se expide a solicitud de la parte interesada. Dado en la Ciudad de Panamá, a los ______ días del mes de ______________ del año ______.
          </p>

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
