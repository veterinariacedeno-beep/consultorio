import { useState, useRef, useCallback, useEffect } from "react";
import { Download, Printer, Upload, X, Save } from "lucide-react";
import type { CertificateData } from "@/types";
import { MONTHS_ES } from "@/data/constants";
import CertificateForm from "./CertificateForm";
import CertificatePreview from "./CertificatePreview";
import { downloadCertPDF, printCertPDF } from "@/utils/pdf";
import { useApp } from "@/context/AppContext";

const today = new Date();

const initialCert: CertificateData = {
  certType: "viaje",
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
  destination: "",
  rabiesVaccineBrand: "",
  internalDewormer: "",
  externalDewormer: "",
  issueDay: String(today.getDate()),
  issueMonth: MONTHS_ES[today.getMonth()],
  issueYear: String(today.getFullYear()),
  motivo: "",
  observaciones: "",
  recomendacion: "",
  vetName: "",
};

export default function CertificadosModule() {
  const [certData, setCertData] = useState<CertificateData>(initialCert);
  const [customSignature, setCustomSignature] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const { addCertificateRecord, pets, owners } = useApp();

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
      downloadCertPDF(certData, customSignature);
    } finally {
      setExporting(false);
    }
  }, [certData, customSignature]);

  const handlePrint = useCallback(() => {
    printCertPDF(certData, customSignature);
  }, [certData, customSignature]);

  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      const pet = pets.find(
        (p) => p.name.toLowerCase() === certData.patientName.toLowerCase()
      );
      const owner = owners.find(
        (o) => o.name.toLowerCase() === certData.ownerName.toLowerCase()
      );
      addCertificateRecord({
        id: `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        petId: pet?.id ?? null,
        ownerId: owner?.id ?? null,
        data: certData,
        createdAt: new Date().toISOString(),
      });
      setSaveMsg("Certificado guardado en el historial del paciente.");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }, [certData, addCertificateRecord, pets, owners]);

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
          <CertificateForm data={certData} onChange={setCertData} />

          <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
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
                  <span className="text-xs text-gray-500">Sin firma digital — se dejará espacio para firma manuscrita</span>
                )}
              </div>
            </div>

            {saveMsg && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-semibold text-green-700">
                {saveMsg}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar en ficha"}
              </button>
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
                <CertificatePreview data={certData} showSignature={!!customSignature} customSignature={customSignature} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
