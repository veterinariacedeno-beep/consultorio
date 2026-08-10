import type { ExamTemplate, ResultValue } from "@/types";

export const RESULT_TEXTS: Record<string, Record<Exclude<ResultValue, "PERSONALIZADO">, string>> = {
  dirofilaria: {
    NEGATIVO: "No hay antígeno de gusano adulto en sangre.",
    POSITIVO: "Se detectó antígeno de Dirofilaria immitis (gusano del corazón).",
  },
  ehrlichia: {
    NEGATIVO: "Sin anticuerpos contra Ehrlichia canis.",
    POSITIVO: "Se detectaron anticuerpos contra Ehrlichia canis.",
  },
  ehrlichia_ab: {
    NEGATIVO: "Sin anticuerpos contra Ehrlichia canis.",
    POSITIVO: "Se detectaron anticuerpos contra Ehrlichia canis.",
  },
  leishmaniasis: {
    NEGATIVO: "Sin anticuerpos detectados.",
    POSITIVO: "Se detectaron anticuerpos contra Leishmania.",
  },
  anaplasmosis: {
    NEGATIVO: "Sin evidencia de infección.",
    POSITIVO: "Se detectó evidencia de infección por Anaplasma.",
  },
  parvovirus: {
    NEGATIVO: "No se detectó antígenos de parvovirus canino.",
    POSITIVO: "Se detectó presencia de antígeno de parvovirus canino.",
  },
  parvovirus_ag: {
    NEGATIVO: "No se detectó antígenos de parvovirus canino.",
    POSITIVO: "Se detectó presencia de antígeno de parvovirus canino.",
  },
  distemper_ag: {
    NEGATIVO: "No se detectó antígenos de distemper canino.",
    POSITIVO: "Se detectó presencia de antígeno de distemper canino.",
  },
  fiv: {
    NEGATIVO: "Sin anticuerpos detectados.",
    POSITIVO: "Se detectaron anticuerpos contra Inmunodeficiencia Felina (FIV).",
  },
  felv: {
    NEGATIVO: "Sin anticuerpos detectados.",
    POSITIVO: "Se detectaron antígenos de Leucemia Felina (FeLV).",
  },
  coronavirus: {
    NEGATIVO: "No se detectó antígenos de coronavirus canino.",
    POSITIVO: "Se detectó presencia de antígeno de coronavirus canino.",
  },
  giardia: {
    NEGATIVO: "Sin anticuerpos detectados contra la giardia.",
    POSITIVO: "Se detectó presencia de antígeno de Giardia.",
  },
};

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: "test4dx",
    name: "Test 4DX (Multiparámetro Canino)",
    type: "standard",
    parameters: [
      { id: "dirofilaria", name: "Dirofilaria (HW Ag)" },
      { id: "ehrlichia", name: "Ehrlichia canis (E. Canis Ab)" },
      { id: "leishmaniasis", name: "Leishmaniasis (Leish Ab)" },
      { id: "anaplasmosis", name: "Anaplasmosis (Anaplas Ab)" },
    ],
  },
  {
    id: "babesia",
    name: "Babesia",
    type: "standard",
    parameters: [
      { id: "babesia_ab", name: "Babesia Ab (Test rápido / Frotis)" },
    ],
  },
  {
    id: "triple_canino",
    name: "Triple Canino (Digestivo)",
    type: "standard",
    parameters: [
      { id: "parvovirus", name: "Parvovirus Ag" },
      { id: "coronavirus", name: "Coronavirus Ag" },
      { id: "giardia", name: "Giardia Ag" },
    ],
  },
  {
    id: "parvovirus",
    name: "Parvovirus",
    type: "standard",
    parameters: [{ id: "parvovirus_ag", name: "Parvovirus Ag (Prueba rápida)" }],
  },
  {
    id: "distemper",
    name: "Distemper",
    type: "standard",
    parameters: [{ id: "distemper_ag", name: "Distemper Ag / Moquillo Canino" }],
  },
  {
    id: "ehrlichia",
    name: "Ehrlichia",
    type: "standard",
    parameters: [{ id: "ehrlichia_ab", name: "Ehrlichia Canis Ab" }],
  },
  {
    id: "felv_fiv",
    name: "Leucemia y Sida Felina",
    type: "standard",
    parameters: [
      { id: "felv", name: "Leucemia Felina (FeLV Ag)" },
      { id: "fiv", name: "Inmunodeficiencia Felina (FIV Ab)" },
    ],
  },
  {
    id: "coprologico",
    name: "Examen Coprológico",
    type: "copro",
    parameters: [],
  },
];
