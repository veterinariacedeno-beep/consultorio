import type { FC, ChangeEvent } from "react";
import { FileText, Upload, X } from "lucide-react";
import type { LabReportData, ParameterResult, ResultValue } from "@/types";
import { EXAM_TEMPLATES, RESULT_TEXTS, buildDefaultResults } from "@/data/exams";

interface Props {
  data: LabReportData;
  onChange: (data: LabReportData) => void;
}

const LabReportForm: FC<Props> = ({ data, onChange }) => {
  const exam = EXAM_TEMPLATES.find((e) => e.id === data.examId) ?? EXAM_TEMPLATES[0];

  const update = (patch: Partial<LabReportData>) => onChange({ ...data, ...patch });

  const handleExamChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const examId = e.target.value;
    onChange({ ...data, examId, results: buildDefaultResults(examId) });
  };

  const updateResult = (paramId: string, patch: Partial<ParameterResult>) => {
    const current = data.results[paramId] ?? { value: "NEGATIVO" as ResultValue, customValue: "", details: "" };
    onChange({
      ...data,
      results: { ...data.results, [paramId]: { ...current, ...patch } },
    });
  };

  const handleResultValueChange = (paramId: string, value: ResultValue) => {
    const current = data.results[paramId] ?? { value: "NEGATIVO" as ResultValue, customValue: "", details: "" };
    let newDetails = current.details;
    if (value !== "PERSONALIZADO" && RESULT_TEXTS[paramId]) {
      newDetails = RESULT_TEXTS[paramId][value];
    }
    updateResult(paramId, { value, details: newDetails });
  };

  const handlePhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ photo: reader.result as string, photoName: file.name });
    reader.readAsDataURL(file);
  };

  const removePhoto = () => update({ photo: null, photoName: null });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[#1a365d]">
        <FileText className="h-5 w-5" />
        <h2 className="text-lg font-bold">Reporte de Laboratorio</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre del Paciente">
          <input
            type="text"
            value={data.patientName}
            onChange={(e) => update({ patientName: e.target.value })}
            placeholder="Nombre del animal"
            className="input-base"
          />
        </Field>
        <Field label="Nombre del Propietario">
          <input
            type="text"
            value={data.ownerName}
            onChange={(e) => update({ ownerName: e.target.value })}
            placeholder="Nombre completo"
            className="input-base"
          />
        </Field>
        <Field label="Fecha">
          <input
            type="date"
            value={data.date || today}
            onChange={(e) => update({ date: e.target.value })}
            className="input-base"
          />
        </Field>
        <Field label="Tipo de Examen">
          <select value={data.examId} onChange={handleExamChange} className="input-base">
            {EXAM_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      </div>

      {exam.type === "standard" && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Parámetros y Resultados</h3>
          <div className="space-y-3">
            {exam.parameters.map((param) => {
              const result = data.results[param.id] ?? { value: "NEGATIVO" as ResultValue, customValue: "", details: "" };
              return (
                <div key={param.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-gray-800">{param.name}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Resultado">
                      <select
                        value={result.value}
                        onChange={(e) => handleResultValueChange(param.id, e.target.value as ResultValue)}
                        className="input-base"
                      >
                        <option value="POSITIVO">POSITIVO</option>
                        <option value="NEGATIVO">NEGATIVO</option>
                        <option value="PERSONALIZADO">Personalizado</option>
                      </select>
                    </Field>
                    {result.value === "PERSONALIZADO" && (
                      <Field label="Valor personalizado">
                        <input
                          type="text"
                          value={result.customValue}
                          onChange={(e) => updateResult(param.id, { customValue: e.target.value })}
                          placeholder="Ej: 1:64"
                          className="input-base"
                        />
                      </Field>
                    )}
                    <Field label="Detalles / Observaciones" className={result.value === "PERSONALIZADO" ? "" : "sm:col-span-2"}>
                      <input
                        type="text"
                        value={result.details}
                        onChange={(e) => updateResult(param.id, { details: e.target.value })}
                        placeholder="Texto automático (editable)"
                        className="input-base"
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {exam.type === "copro" && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Examen Coprológico</h3>
          </div>
          <Field label="Muestra Analizada">
            <input
              type="text"
              value={data.coproSample}
              onChange={(e) => update({ coproSample: e.target.value })}
              placeholder="Ej: Heces frescas, frotis rectal..."
              className="input-base"
            />
          </Field>
          <Field label="Evaluación Microscópica / Hallazgos Coprológicos">
            <textarea
              value={data.coproFindings}
              onChange={(e) => update({ coproFindings: e.target.value })}
              rows={4}
              placeholder="Huevos, quistes, ooquistes, larvas, parásitos observados..."
              className="input-base resize-y"
            />
          </Field>
          <Field label="Tratamiento / Observaciones Clínicas">
            <textarea
              value={data.coproTreatment}
              onChange={(e) => update({ coproTreatment: e.target.value })}
              rows={3}
              placeholder="Tratamiento indicado, observaciones..."
              className="input-base resize-y"
            />
          </Field>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-bold text-[#1a365d]">Evidencia Fotográfica</h3>
        {data.photo ? (
          <div className="relative inline-block">
            <img src={data.photo} alt="Evidencia" className="h-32 w-auto rounded-lg border border-gray-300 object-cover" />
            <button
              onClick={removePhoto}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600"
              title="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-[#2b6cb0] hover:bg-blue-50">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-600">Click para adjuntar foto del test o cassette</span>
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
        )}
      </div>

      {exam.type === "standard" && (
        <Field label="Observaciones Clínicas">
          <textarea
            value={data.observations}
            onChange={(e) => update({ observations: e.target.value })}
            rows={4}
            placeholder="Observaciones clínicas, recomendaciones, tratamiento..."
            className="input-base resize-y"
          />
        </Field>
      )}
    </div>
  );
};

const Field: FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div className={className}>
    <label className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
    {children}
  </div>
);

export default LabReportForm;
