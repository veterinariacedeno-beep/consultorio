import type { FC } from "react";
import { Award, Calendar } from "lucide-react";
import type { CertificateData } from "@/types";
import { MONTHS_ES } from "@/data/constants";

interface Props {
  data: CertificateData;
  onChange: (data: CertificateData) => void;
}

const CertificateForm: FC<Props> = ({ data, onChange }) => {
  const update = (patch: Partial<CertificateData>) => onChange({ ...data, ...patch });

  const today = new Date();
  const setToday = () => {
    update({
      issueDay: String(today.getDate()),
      issueMonth: MONTHS_ES[today.getMonth()],
      issueYear: String(today.getFullYear()),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[#1a365d]">
        <Award className="h-5 w-5" />
        <h2 className="text-lg font-bold">Certificado de Exportación</h2>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Datos del Paciente</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre del Paciente">
            <input type="text" value={data.patientName} onChange={(e) => update({ patientName: e.target.value })} placeholder="Nombre del animal" className="input-base" />
          </Field>
          <Field label="Especie">
            <select value={data.species} onChange={(e) => update({ species: e.target.value as CertificateData["species"] })} className="input-base">
              <option value="">Seleccione...</option>
              <option value="Canino">Canino</option>
              <option value="Felino">Felino</option>
              <option value="Conejo">Conejo</option>
              <option value="Ave">Ave</option>
              <option value="Roedor">Roedor</option>
              <option value="Reptil">Reptil</option>
              <option value="Otro">Otro</option>
            </select>
          </Field>
          <Field label="Raza">
            <input type="text" value={data.breed} onChange={(e) => update({ breed: e.target.value })} className="input-base" />
          </Field>
          <Field label="Edad">
            <input type="text" value={data.age} onChange={(e) => update({ age: e.target.value })} placeholder="Ej: 3 años" className="input-base" />
          </Field>
          <Field label="Sexo">
            <select value={data.sex} onChange={(e) => update({ sex: e.target.value })} className="input-base">
              <option value="">Seleccione...</option>
              <option value="Macho">Macho</option>
              <option value="Hembra">Hembra</option>
            </select>
          </Field>
          <Field label="Color / Marcas">
            <input type="text" value={data.colorMarks} onChange={(e) => update({ colorMarks: e.target.value })} className="input-base" />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Datos del Propietario</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre Completo">
            <input type="text" value={data.ownerName} onChange={(e) => update({ ownerName: e.target.value })} className="input-base" />
          </Field>
          <Field label="Cédula / Pasaporte">
            <input type="text" value={data.idNumber} onChange={(e) => update({ idNumber: e.target.value })} className="input-base" />
          </Field>
          <Field label="Dirección Completa de Residencia" className="sm:col-span-2">
            <input type="text" value={data.ownerAddress} onChange={(e) => update({ ownerAddress: e.target.value })} className="input-base" />
          </Field>
          <Field label="Teléfono de Contacto">
            <input type="text" value={data.ownerPhone} onChange={(e) => update({ ownerPhone: e.target.value })} className="input-base" />
          </Field>
          <Field label="Destino de Exportación">
            <input type="text" value={data.destination} onChange={(e) => update({ destination: e.target.value })} placeholder="País o ciudad de destino" className="input-base" />
          </Field>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1a365d]">Fecha de Expedición</h3>
          <button onClick={setToday} className="flex items-center gap-1 text-xs font-semibold text-[#2b6cb0] hover:underline">
            <Calendar className="h-3.5 w-3.5" /> Usar fecha actual
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Día">
            <input type="number" min={1} max={31} value={data.issueDay} onChange={(e) => update({ issueDay: e.target.value })} placeholder="Día" className="input-base" />
          </Field>
          <Field label="Mes">
            <select value={data.issueMonth} onChange={(e) => update({ issueMonth: e.target.value })} className="input-base">
              <option value="">Mes...</option>
              {MONTHS_ES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </Field>
          <Field label="Año">
            <input type="number" min={2000} max={2100} value={data.issueYear} onChange={(e) => update({ issueYear: e.target.value })} placeholder="Año" className="input-base" />
          </Field>
        </div>
      </div>
    </div>
  );
};

const Field: FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div className={className}>
    <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
    {children}
  </div>
);

export default CertificateForm;
