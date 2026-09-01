import type { FC } from "react";
import { Award, Calendar, Eraser } from "lucide-react";
import type { CertificateData } from "@/types";
import { MONTHS_ES, CERTIFICATE_TYPES } from "@/data/constants";
import ClientPetSearch from "@/components/shared/ClientPetSearch";
import type { SelectedMatch } from "@/components/shared/ClientPetSearch";

interface Props {
  data: CertificateData;
  onChange: (data: CertificateData) => void;
}

function getAgeFromPet(pet: { birthDate?: string; ageManual?: string }): string {
  if (pet.ageManual) return pet.ageManual;
  if (pet.birthDate) {
    const diff = Date.now() - new Date(pet.birthDate).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    if (years === 0) {
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
      return `${months} mes${months !== 1 ? "es" : ""}`;
    }
    return `${years} año${years !== 1 ? "s" : ""}`;
  }
  return "";
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

  const handleSelect = (match: SelectedMatch) => {
    const patch: Partial<CertificateData> = {};
    if (match.owner) {
      patch.ownerName = match.owner.name;
      patch.ownerPhone = match.owner.phone;
      patch.ownerAddress = match.owner.address;
      patch.idNumber = match.owner.idNumber || "";
    }
    if (match.pet) {
      patch.patientName = match.pet.name;
      patch.species = match.pet.species as CertificateData["species"];
      patch.breed = match.pet.breed;
      patch.sex = match.pet.gender;
      patch.colorMarks = match.pet.color || "";
      patch.age = getAgeFromPet(match.pet);
    }
    update(patch);
  };

  const clearFields = () => {
    onChange({
      ...data,
      patientName: "",
      species: "",
      breed: "",
      age: "",
      sex: "",
      colorMarks: "",
      ownerName: "",
      idNumber: "",
      ownerAddress: "",
      ownerPhone: "",
    });
  };

  const certTypeConfig = CERTIFICATE_TYPES.find((t) => t.value === data.certType);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[#1a365d]">
        <Award className="h-5 w-5" />
        <h2 className="text-lg font-bold">{certTypeConfig?.label ?? "Certificado de Exportación"}</h2>
      </div>

      {/* Search bar */}
      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-600">
          Buscar Cliente / Paciente
        </label>
        <ClientPetSearch onSelect={handleSelect} onClear={clearFields} />
        <button
          type="button"
          onClick={clearFields}
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
        >
          <Eraser className="h-3.5 w-3.5" />
          Limpiar campos / Ingreso manual
        </button>
      </div>

      {/* Patient data */}
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

      {/* Owner data */}
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

      {/* Dynamic certificate body fields */}
      <div>
        <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Cuerpo del Certificado</h3>
        <div className="space-y-4">
          <Field label="Motivo">
            <input type="text" value={data.motivo} onChange={(e) => update({ motivo: e.target.value })} placeholder="Motivo de la consulta o emisión" className="input-base" />
          </Field>
          <Field label="Observaciones">
            <textarea value={data.observaciones} onChange={(e) => update({ observaciones: e.target.value })} rows={3} placeholder="Observaciones clínicas, hallazgos del examen físico..." className="input-base resize-y" />
          </Field>
          <Field label="Recomendación Médica">
            <textarea value={data.recomendacion} onChange={(e) => update({ recomendacion: e.target.value })} rows={2} placeholder="Recomendaciones, tratamiento, próximos pasos..." className="input-base resize-y" />
          </Field>
          <Field label="Médico Tratante">
            <input type="text" value={data.vetName} onChange={(e) => update({ vetName: e.target.value })} placeholder="Nombre del médico veterinario" className="input-base" />
          </Field>
        </div>
      </div>

      {/* Issue date */}
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
