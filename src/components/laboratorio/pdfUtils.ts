import { jsPDF } from 'jspdf';

export interface ClinicInfo {
  name: string;
  vetName: string;
  vetTitle: string;
  phone: string;
  address: string;
}

const DEFAULT_CLINIC: ClinicInfo = {
  name: 'Consultorio Veterinario Dr. Cedeño',
  vetName: 'Dr. Cedeño',
  vetTitle: 'Médico Veterinario',
  phone: '',
  address: '',
};

const CLINIC_KEY = 'lab_clinic_info';

export function loadClinicInfo(): ClinicInfo {
  try {
    const raw = localStorage.getItem(CLINIC_KEY);
    return raw ? { ...DEFAULT_CLINIC, ...JSON.parse(raw) } : DEFAULT_CLINIC;
  } catch {
    return DEFAULT_CLINIC;
  }
}

export function saveClinicInfo(info: ClinicInfo): void {
  localStorage.setItem(CLINIC_KEY, JSON.stringify(info));
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Shared PDF header with clinic info, returns the Y position after the header */
function drawHeader(doc: jsPDF, clinic: ClinicInfo, title: string): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(clinic.name, 105, 20, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let subY = 27;
  if (clinic.address) {
    doc.text(clinic.address, 105, subY, { align: 'center' });
    subY += 5;
  }
  if (clinic.phone) {
    doc.text(`Tel: ${clinic.phone}`, 105, subY, { align: 'center' });
    subY += 5;
  }

  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(1.5);
  doc.line(20, subY + 1, 190, subY + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 118, 110);
  doc.text(title, 105, subY + 10, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  return subY + 18;
}

/** Shared PDF footer with signature area */
function drawFooter(doc: jsPDF, clinic: ClinicInfo, startY: number): void {
  const sigY = Math.max(startY, 240);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(70, sigY, 140, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(clinic.vetName, 105, sigY + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(clinic.vetTitle, 105, sigY + 11, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `Generado el ${new Date().toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    105, 287, { align: 'center' },
  );
}

export { drawHeader, drawFooter };
