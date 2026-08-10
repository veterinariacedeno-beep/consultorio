import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Printer, PenLine, Upload, X } from "lucide-react";
import type { LabReportData } from "@/types";
import { EXAM_TEMPLATES } from "@/data/exams";
import LabReportForm from "./LabReportForm";
import LabReportPreview from "./LabReportPreview";
import { downloadLabPDF, printLabPDF } from "@/utils/pdf";

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

const initialLab: LabReportData = {
  patientName: "",
  ownerName: "",
  date: todayStr,
  examId: EXAM_TEMPLATES[0].id,
  results: {},
  observations: "",
  photo: null,
  photoName: null,
  coproFindings: "",
  coproSample: "",
  coproTreatment: "",
};

export default function LaboratoryModule() {
  const [labData, setLabData] = useState<LabReportData>(initialLab);
  const [showSignature, setShowSignature] = useState(true);
  const [customSignature, setCustomSignature] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const compute = () => {
      const wrap = previewWrapRef.current;
      if (!wrap) return;
      const available = wrap.clientWidth - 24;
      const s = Math.min(available / 794, 1);
      setScale(s > 0 ? s : 0.3);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const handleDownload = useCallback(() => {
    setExporting(true);
    try {
      downloadLabPDF(labData, customSignature);
    } finally {
      setExporting(false);
    }
  }, [labData, customSignature]);

  const handlePrint = useCallback(() => {
    printLabPDF(labData, customSignature);
  }, [labData, customSignature]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCustomSignature(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <LabReportForm data={labData} onChange={setLabData} />

          <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#1a365d]">
                <PenLine className="h-4 w-4" />
                Firma Digital
              </span>
              <button
                type="button"
                onClick={() => setShowSignature((s) => !s)}
                className={`relative h-6 w-11 rounded-full transition ${showSignature ? "bg-[#2b6cb0]" : "bg-gray-300"}`}
                aria-pressed={showSignature}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${showSignature ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>

            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-[#1a365d]">
                  <Upload className="h-4 w-4" />
                  Subir / Cambiar Imagen de Firma y Sello
                </span>
                {customSignature && (
                  <button
                    type="button"
                    onClick={() => setCustomSignature(null)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <X className="h-3.5 w-3.5" /> Quitar
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#2b6cb0] hover:text-[#2b6cb0]">
                  <Upload className="h-3.5 w-3.5" />
                  Elegir archivo
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                </label>
                {customSignature ? (
                  <img src={customSignature} alt="Firma personalizada" className="h-12 w-32 rounded border border-gray-300 bg-white object-contain p-1" />
                ) : (
                  <span className="text-xs text-gray-500">Usando firma predeterminada del Dr. Cedeño</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleDownload}
                disabled={exporting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1a365d] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2b6cb0] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Generando..." : "Descargar PDF"}
              </button>
              <button
                onClick={handlePrint}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-[#1a365d] px-4 py-2.5 text-sm font-bold text-[#1a365d] transition hover:bg-[#1a365d] hover:text-white"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-200 p-3 shadow-sm">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">Vista Previa — Hoja Carta (8.5 × 11 in)</p>
          <div ref={previewWrapRef} className="overflow-auto rounded-lg bg-slate-300 p-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
            <div className="preview-scale mx-auto" style={{ transform: `scale(${scale})`, width: 794, height: 1123 * scale }}>
              <div style={{ transformOrigin: "top left" }}>
                <LabReportPreview data={labData} showSignature={showSignature} customSignature={customSignature} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
