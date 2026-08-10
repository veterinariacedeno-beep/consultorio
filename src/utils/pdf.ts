import { jsPDF } from "jspdf";
import type { LabReportData, CertificateData } from "@/types";
import { EXAM_TEMPLATES, RESULT_TEXTS } from "@/data/exams";
import { CLINIC, DOCTOR, DECLARATION_TEXT, DECLARATION_REQUISITES } from "@/data/constants";
import signatureStamp from "@/assets/signature-stamp.svg?raw";

const AZUL_MARINO = "#1a365d";
const GRIS_TEXTO = "#334155";
const GRIS_BORDE = "#cbd5e1";
const AZUL_TAB = "#2b6cb0";
const PAGE_W = 215.9;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const CENTER = PAGE_W / 2;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function setDrawColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}
function setFillColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}
function setTextColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function drawHeader(doc: jsPDF): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setTextColor(doc, AZUL_MARINO);
  doc.text(CLINIC.title, CENTER, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, GRIS_TEXTO);
  doc.text(`R.U.C. ${CLINIC.ruc}`, CENTER, 26, { align: "center" });
  doc.text(`${CLINIC.address} | Teléfono: ${CLINIC.phone} | Celular: ${CLINIC.cell}`, CENTER, 31, { align: "center" });
  doc.text(`Horario: ${CLINIC.hours}`, CENTER, 36, { align: "center" });

  setDrawColor(doc, AZUL_MARINO);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, 40, PAGE_W - MARGIN, 40);

  return 48;
}

function drawSignature(doc: jsPDF, y: number, showSignature: boolean, customSignature?: string | null) {
  const firmaY = Math.max(y + 10, 235);
  const sigX = 15;
  const sigW = 60;
  const sigCenter = sigX + sigW / 2;
  const imgW = 45;
  const imgH = 20;

  if (showSignature) {
    const imagePlaced = (() => {
      if (customSignature) {
        for (const fmt of ["PNG", "JPEG", "JPG"] as const) {
          try {
            doc.addImage(customSignature, fmt, sigX, firmaY - imgH, imgW, imgH);
            return true;
          } catch {
            // try next format
          }
        }
        return false;
      }
      try {
        doc.addSvgAsImage(signatureStamp, sigX, firmaY - imgH, sigW, imgH, undefined, true);
        return true;
      } catch {
        return false;
      }
    })();

    if (!imagePlaced) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(18);
      setTextColor(doc, AZUL_MARINO);
      doc.text(DOCTOR.name, sigCenter, firmaY - 4, { align: "center" });
    }
  }

  setDrawColor(doc, "#000000");
  doc.setLineWidth(0.5);
  doc.line(sigX, firmaY, sigX + sigW, firmaY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTextColor(doc, "#000000");
  doc.text(DOCTOR.name, sigCenter, firmaY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setTextColor(doc, GRIS_TEXTO);
  doc.text(DOCTOR.title, sigCenter, firmaY + 8, { align: "center" });
  doc.text(DOCTOR.license, sigCenter, firmaY + 12, { align: "center" });
}

function generateLabPDF(data: LabReportData, customSignature?: string | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  let y = drawHeader(doc);

  const exam = EXAM_TEMPLATES.find((e) => e.id === data.examId) ?? EXAM_TEMPLATES[0];
  const formattedDate = data.date
    ? new Date(data.date + "T00:00:00").toLocaleDateString("es-PA", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("es-PA", { day: "2-digit", month: "long", year: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTextColor(doc, AZUL_MARINO);
  doc.text("REPORTE DE LABORATORIO", CENTER, y, { align: "center" });
  y += 8;

  setDrawColor(doc, GRIS_BORDE);
  setFillColor(doc, "#f8fafc");
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, CONTENT_W, 22, "FD");

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  setTextColor(doc, "#000000");
  doc.text("Paciente:", MARGIN + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientName || "---", MARGIN + 25, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Fecha:", MARGIN + 105, y + 7);
  doc.setFont("helvetica", "normal");
  doc.text(formattedDate, MARGIN + 120, y + 7);

  doc.setFont("helvetica", "bold");
  doc.text("Propietario:", MARGIN + 5, y + 15);
  doc.setFont("helvetica", "normal");
  doc.text(data.ownerName || "---", MARGIN + 25, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Examen:", MARGIN + 105, y + 15);
  doc.setFont("helvetica", "normal");
  const examName = doc.splitTextToSize(exam.name, 65);
  doc.text(examName[0] || "---", MARGIN + 120, y + 15);

  y += 29;

  if (exam.type === "standard") {
    setFillColor(doc, AZUL_TAB);
    doc.rect(MARGIN, y, CONTENT_W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTextColor(doc, "#ffffff");
    doc.text("Parámetro", MARGIN + 5, y + 5.5);
    doc.text("Resultado", MARGIN + 70, y + 5.5);
    doc.text("Detalles / Observaciones", MARGIN + 110, y + 5.5);
    y += 8;

    exam.parameters.forEach((param) => {
      const result = data.results[param.id] ?? { value: "NEGATIVO", customValue: "", details: "" };
      const label = result.value === "PERSONALIZADO" ? (result.customValue || "—") : result.value;
      const detailText = result.details || (RESULT_TEXTS[param.id]?.[result.value as "POSITIVO" | "NEGATIVO"] ?? "");

      setDrawColor(doc, GRIS_BORDE);
      setFillColor(doc, "#ffffff");
      doc.setLineWidth(0.3);
      const rowH = 12;
      doc.rect(MARGIN, y, CONTENT_W, rowH, "D");

      doc.line(MARGIN + 65, y, MARGIN + 65, y + rowH);
      doc.line(MARGIN + 105, y, MARGIN + 105, y + rowH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTextColor(doc, "#000000");
      const paramLines = doc.splitTextToSize(param.name, 58);
      doc.text(paramLines, MARGIN + 5, y + 5);

      doc.setFont("helvetica", "bold");
      if (result.value === "POSITIVO") {
        setTextColor(doc, "#c53030");
      } else if (result.value === "NEGATIVO") {
        setTextColor(doc, "#276749");
      } else {
        setTextColor(doc, "#334155");
      }
      doc.text(label, MARGIN + 70, y + 5);

      doc.setFont("helvetica", "normal");
      setTextColor(doc, GRIS_TEXTO);
      const detailLines = doc.splitTextToSize(detailText, 75);
      doc.text(detailLines, MARGIN + 110, y + 5);

      y += Math.max(rowH, detailLines.length * 4 + 4, paramLines.length * 4 + 2);
    });
    y += 4;

    if (data.photo) {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setTextColor(doc, AZUL_MARINO);
      doc.text("EVIDENCIA FOTOGRÁFICA / IMAGEN DEL EXAMEN", MARGIN, y);
      y += 4;
      try {
        doc.addImage(data.photo, "JPEG", MARGIN + 65, y, 75, 48);
      } catch {
        try {
          doc.addImage(data.photo, "PNG", MARGIN + 65, y, 75, 48);
        } catch {
          // skip image if format unsupported
        }
      }
      y += 52;
    }

    if (data.observations) {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setTextColor(doc, AZUL_MARINO);
      doc.text("OBSERVACIONES CLÍNICAS", MARGIN, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTextColor(doc, "#000000");
      const obsLines = doc.splitTextToSize(data.observations, CONTENT_W);
      doc.text(obsLines, MARGIN, y);
      y += obsLines.length * 4 + 8;
    }
  } else if (exam.type === "copro") {
    y += 4;
    setFillColor(doc, "#ebf2f8");
    setDrawColor(doc, AZUL_MARINO);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT_W, 7, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, AZUL_MARINO);
    doc.text("Evaluación Microscópica / Hallazgos Coprológicos", MARGIN + 3, y + 5);
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, "#000000");
    setDrawColor(doc, GRIS_BORDE);
    setFillColor(doc, "#f8fafc");
    const findingsLines = doc.splitTextToSize(data.coproFindings || "—", CONTENT_W - 6);
    const findingsH = Math.max(findingsLines.length * 4 + 6, 20);
    doc.rect(MARGIN, y, CONTENT_W, findingsH, "FD");
    doc.text(findingsLines, MARGIN + 3, y + 5);
    y += findingsH + 4;

    const colW = (CONTENT_W - 4) / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(doc, AZUL_MARINO);
    doc.text("Muestra Analizada", MARGIN, y);
    doc.text("Tratamiento / Observaciones", MARGIN + colW + 4, y);
    y += 3;

    doc.setFont("helvetica", "normal");
    setTextColor(doc, "#000000");
    setDrawColor(doc, GRIS_BORDE);
    setFillColor(doc, "#f8fafc");
    const sampleLines = doc.splitTextToSize(data.coproSample || "—", colW - 6);
    const treatLines = doc.splitTextToSize(data.coproTreatment || "—", colW - 6);
    const colH = Math.max(sampleLines.length, treatLines.length) * 4 + 6;
    doc.rect(MARGIN, y, colW, colH, "FD");
    doc.rect(MARGIN + colW + 4, y, colW, colH, "FD");
    doc.text(sampleLines, MARGIN + 3, y + 5);
    doc.text(treatLines, MARGIN + colW + 7, y + 5);
    y += colH + 8;
  }

  drawSignature(doc, y, true, customSignature);
  return doc;
}

function generateCertPDF(data: CertificateData, customSignature?: string | null): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  let y = drawHeader(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setTextColor(doc, AZUL_MARINO);
  doc.text("CERTIFICADO DE EXPORTACIÓN", CENTER, y, { align: "center" });
  y += 5;
  doc.setFontSize(10);
  setTextColor(doc, AZUL_TAB);
  doc.text("Declaración Médica Veterinaria", CENTER, y, { align: "center" });
  y += 8;

  setDrawColor(doc, GRIS_BORDE);
  doc.setLineWidth(0.3);
  const cellH = 7;
  const colW1 = 30;
  const colW2 = (CONTENT_W - colW1 * 2) / 2;

  function drawDataRow(label1: string, val1: string, label2: string, val2: string) {
    setFillColor(doc, "#ebf2f8");
    doc.rect(MARGIN, y, colW1, cellH, "FD");
    doc.rect(MARGIN + colW1 + colW2, y, colW1, cellH, "FD");
    setFillColor(doc, "#ffffff");
    doc.rect(MARGIN + colW1, y, colW2, cellH, "FD");
    doc.rect(MARGIN + colW1 + colW2 + colW1, y, colW2, cellH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(doc, AZUL_MARINO);
    doc.text(label1, MARGIN + 2, y + 5);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, "#000000");
    const v1Lines = doc.splitTextToSize(val1 || "—", colW2 - 4);
    doc.text(v1Lines[0] || "—", MARGIN + colW1 + 2, y + 5);

    doc.setFont("helvetica", "bold");
    setTextColor(doc, AZUL_MARINO);
    doc.text(label2, MARGIN + colW1 + colW2 + 2, y + 5);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, "#000000");
    const v2Lines = doc.splitTextToSize(val2 || "—", colW2 - 4);
    doc.text(v2Lines[0] || "—", MARGIN + colW1 + colW2 + colW1 + 2, y + 5);

    y += cellH;
  }

  drawDataRow("Paciente", data.patientName, "Especie", data.species);
  drawDataRow("Raza", data.breed, "Edad", data.age);
  drawDataRow("Sexo", data.sex, "Color/Marcas", data.colorMarks);
  y += 3;

  setFillColor(doc, AZUL_TAB);
  doc.rect(MARGIN, y, CONTENT_W, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setTextColor(doc, "#ffffff");
  doc.text("Datos del Propietario", MARGIN + 2, y + 5);
  y += 7;

  function drawOwnerRow(label: string, val: string) {
    const labelW = 45;
    const valW = CONTENT_W - labelW;
    setFillColor(doc, "#ebf2f8");
    doc.rect(MARGIN, y, labelW, cellH, "FD");
    setFillColor(doc, "#ffffff");
    doc.rect(MARGIN + labelW, y, valW, cellH, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(doc, AZUL_MARINO);
    doc.text(label, MARGIN + 2, y + 5);
    doc.setFont("helvetica", "normal");
    setTextColor(doc, "#000000");
    const vLines = doc.splitTextToSize(val || "—", valW - 4);
    doc.text(vLines[0] || "—", MARGIN + labelW + 2, y + 5);
    y += cellH;
  }

  drawOwnerRow("Nombre Completo", data.ownerName);
  drawOwnerRow("Cédula/Pasaporte", data.idNumber);
  drawOwnerRow("Dirección", data.ownerAddress);
  drawOwnerRow("Teléfono", data.ownerPhone);
  drawOwnerRow("Destino de Exportación", data.destination);
  y += 5;

  setFillColor(doc, "#f7fafc");
  setDrawColor(doc, AZUL_MARINO);
  doc.setLineWidth(0.5);
  const declBoxH = 60;
  doc.rect(MARGIN, y, CONTENT_W, declBoxH, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setTextColor(doc, AZUL_MARINO);
  doc.text("DECLARACIÓN MÉDICA VETERINARIA", MARGIN + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setTextColor(doc, "#000000");
  let textY = y + 12;
  DECLARATION_TEXT.forEach((p) => {
    const lines = doc.splitTextToSize(p, CONTENT_W - 10);
    doc.text(lines, MARGIN + 4, textY);
    textY += lines.length * 4;
  });
  doc.setFont("helvetica", "normal");
  const reqLines = DECLARATION_REQUISITES.map((r) => `• ${r}`);
  reqLines.forEach((r) => {
    const lines = doc.splitTextToSize(r, CONTENT_W - 14);
    doc.text(lines, MARGIN + 7, textY);
    textY += lines.length * 4;
  });

  y += declBoxH + 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setTextColor(doc, "#000000");
  const issueText = `EXPEDICIÓN: La presente certificación se expide a solicitud de la parte interesada. Dado en la Ciudad de Panamá, a los ${data.issueDay || "___"} días del mes de ${data.issueMonth || "___"} del año ${data.issueYear || "___"}.`;
  const issueLines = doc.splitTextToSize(issueText, CONTENT_W);
  doc.text(issueLines, MARGIN, y);
  y += issueLines.length * 4 + 8;

  drawSignature(doc, y, true, customSignature);
  return doc;
}

export function downloadLabPDF(data: LabReportData, customSignature?: string | null) {
  const doc = generateLabPDF(data, customSignature);
  doc.save(`Reporte_Laboratorio_${data.patientName || "paciente"}.pdf`);
}

export function downloadCertPDF(data: CertificateData, customSignature?: string | null) {
  const doc = generateCertPDF(data, customSignature);
  doc.save(`Certificado_Exportacion_${data.patientName || "paciente"}.pdf`);
}

export function printLabPDF(data: LabReportData, customSignature?: string | null) {
  const doc = generateLabPDF(data, customSignature);
  const blobUrl = doc.output("bloburl");
  const printWindow = window.open(blobUrl, "_blank");
  if (printWindow) printWindow.focus();
}

export function printCertPDF(data: CertificateData, customSignature?: string | null) {
  const doc = generateCertPDF(data, customSignature);
  const blobUrl = doc.output("bloburl");
  const printWindow = window.open(blobUrl, "_blank");
  if (printWindow) printWindow.focus();
}
