import type { FC } from "react";
import { Check, X as XIcon, Minus } from "lucide-react";
import type { LabReportData } from "@/types";
import { EXAM_TEMPLATES } from "@/data/exams";
import DocumentHeader from "@/components/shared/DocumentHeader";
import SignatureBlock from "@/components/shared/SignatureBlock";

interface Props {
  data: LabReportData;
  showSignature: boolean;
  customSignature?: string | null;
}

const LabReportPreview: FC<Props> = ({ data, showSignature, customSignature }) => {
  const exam = EXAM_TEMPLATES.find((e) => e.id === data.examId) ?? EXAM_TEMPLATES[0];
  const formattedDate = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("es-PA", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-PA", { day: "2-digit", month: "long", year: "numeric" });

  const resultLabel = (value: string, custom: string) => {
    if (value === "PERSONALIZADO") return custom || "—";
    return value;
  };

  return (
    <div className="document-page" id="documento-impresion">
      <DocumentHeader />

      <div className="mt-4 text-center">
        <h2 className="inline-block rounded bg-[#1a365d] px-8 py-1.5 text-base font-bold uppercase tracking-wide text-white">
          Reporte de Laboratorio
        </h2>
      </div>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/4">Paciente</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.patientName || "—"}</td>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/6">Fecha</td>
            <td className="border border-[#1a365d] px-2 py-1">{formattedDate}</td>
          </tr>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Propietario</td>
            <td className="border border-[#1a365d] px-2 py-1" colSpan={3}>{data.ownerName || "—"}</td>
          </tr>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Examen</td>
            <td className="border border-[#1a365d] px-2 py-1" colSpan={3}>{exam.name}</td>
          </tr>
        </tbody>
      </table>

      {exam.type === "standard" && (
        <table className="results-table mt-4 text-[11px]">
          <thead>
            <tr className="bg-[#1a365d] text-white">
              <th className="col-param border border-[#1a365d] px-2 py-1.5 text-left font-bold">Parámetro</th>
              <th className="col-result border border-[#1a365d] px-2 py-1.5 text-center font-bold">Resultado</th>
              <th className="col-details border border-[#1a365d] px-2 py-1.5 text-left font-bold">Detalles / Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {exam.parameters.map((param, idx) => {
              const result = data.results[param.id] ?? { value: "NEGATIVO", customValue: "", details: "" };
              const label = resultLabel(result.value, result.customValue);
              const isPositive = result.value === "POSITIVO";
              const isNegative = result.value === "NEGATIVO";
              return (
                <tr key={param.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="col-param border border-[#1a365d] px-2 py-1.5 font-semibold text-gray-800">{param.name}</td>
                  <td className="col-result border border-[#1a365d] px-2 py-1.5 text-center">
                    <span className="inline-flex items-center gap-1">
                      {isPositive && <XIcon className="h-3 w-3 flex-shrink-0 text-red-600" />}
                      {isNegative && <Check className="h-3 w-3 flex-shrink-0 text-green-600" />}
                      {result.value === "PERSONALIZADO" && <Minus className="h-3 w-3 flex-shrink-0 text-gray-500" />}
                      <span className={isPositive ? "font-bold text-red-600" : isNegative ? "font-bold text-green-600" : "font-semibold text-gray-700"}>
                        {label}
                      </span>
                    </span>
                  </td>
                  <td className="col-details border border-[#1a365d] px-2 py-1.5 text-gray-700">{result.details || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {exam.type === "copro" && (
        <div className="mt-4 space-y-3">
          <div className="border border-[#1a365d] bg-[#ebf2f8] px-3 py-1.5 text-[12px] font-bold text-[#1a365d]">
            Evaluación Microscópica / Hallazgos Coprológicos
          </div>
          <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-[11px] whitespace-pre-wrap text-gray-800 min-h-[60px]">
            {data.coproFindings || "—"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[11px] font-bold text-[#1a365d]">Muestra Analizada</p>
              <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-[11px] text-gray-800 min-h-[32px]">
                {data.coproSample || "—"}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-bold text-[#1a365d]">Tratamiento / Observaciones</p>
              <div className="border border-gray-300 bg-gray-50 px-3 py-2 text-[11px] whitespace-pre-wrap text-gray-800 min-h-[32px]">
                {data.coproTreatment || "—"}
              </div>
            </div>
          </div>
        </div>
      )}

      {data.photo && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-bold text-[#1a365d]">Evidencia Fotográfica:</p>
          <div className="evidence-container">
            <img src={data.photo} alt="Evidencia" className="evidence-img" style={{ border: "1px solid #cbd5e1" }} />
          </div>
        </div>
      )}

      {exam.type === "standard" && data.observations && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-bold text-[#1a365d]">Observaciones Clínicas:</p>
          <p className="whitespace-pre-wrap border border-gray-300 bg-gray-50 px-3 py-2 text-[11px] text-gray-800">
            {data.observations}
          </p>
        </div>
      )}

      <SignatureBlock showSignature={showSignature} customSignature={customSignature} />
    </div>
  );
};

export default LabReportPreview;
