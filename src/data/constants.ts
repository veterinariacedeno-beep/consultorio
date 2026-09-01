import type { CertificateType } from "@/types";

export const CLINIC = {
  title: "CONSULTORIO VETERINARIO DR. CEDEÑO",
  ruc: "6-67-83 D.V. 63",
  address: "La Locería, Calle 22A, Norte",
  phone: "236-9453",
  cell: "6719-9283",
  hours: "Lunes a Viernes: 8:00 a.m. - 7:00 p.m. | Sábado: 8:00 a.m. - 3:30 p.m.",
};

export const DOCTOR = {
  name: "Dr. Ricardo Cedeño",
  title: "Médico Veterinario Zootecnista",
  license: "Idoneidad 454",
};

export const DECLARATION_TEXT = [
  "El médico veterinario que suscribe este documento, certifica que el animal descrito anteriormente fue examinado físicamente y se encuentra libre de evidencia de enfermedades infectocontagiosas, incluyendo lesiones de piel, diarrea, emaciación y síntomas que involucren el sistema nervioso.",
  "Certifico además que el paciente cumple con los siguientes requisitos sanitarios:",
];

export const DECLARATION_REQUISITES = [
  "Cuenta con la vacuna Antirrábica vigente.",
  "Se encuentra debidamente desparasitado (interna y externamente).",
  "Está libre de miasis o presencia del Gusano Barrenador (Cochliomyia hominivorax).",
];

export const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const CERTIFICATE_TYPES: { value: CertificateType; label: string; title: string }[] = [
  { value: "salud", label: "Certificado de Salud", title: "Certificado de Salud Veterinario" },
  { value: "vacunacion", label: "Certificado de Vacunación", title: "Certificado de Vacunación" },
  { value: "viaje", label: "Certificado de Viaje / Exportación", title: "Certificado de Exportación" },
  { value: "diagnostico", label: "Constancia Médica / Diagnóstico", title: "Constancia Médica Veterinaria" },
];
