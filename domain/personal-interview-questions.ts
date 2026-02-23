import type { Position } from "./types";

export interface PersonalInterviewField {
  id: string;
  label: string;
  type: "scale" | "punctuality" | "textarea";
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  maxLength?: number;
}

export interface PersonalInterviewSection {
  id: string;
  title: string;
  description: string;
  fields: PersonalInterviewField[];
}

const OBSERVATION_FIELDS: PersonalInterviewField[] = [
  {
    id: "presentacionPersonal",
    label: "Presentación personal",
    type: "scale",
    required: true,
    options: [
      { value: "EXCELENTE", label: "Excelente" },
      { value: "BUENA", label: "Buena" },
      { value: "REGULAR", label: "Regular" },
      { value: "DEFICIENTE", label: "Deficiente" },
    ],
  },
  {
    id: "puntualidad",
    label: "Puntualidad",
    type: "punctuality",
    required: true,
    options: [
      { value: "TEMPRANO", label: "Temprano" },
      { value: "A_TIEMPO", label: "A tiempo" },
      { value: "TARDE", label: "Tarde" },
      { value: "NO_SE_PRESENTO", label: "No se presentó" },
    ],
  },
  {
    id: "comunicacionVerbal",
    label: "Comunicación verbal",
    type: "scale",
    required: true,
    options: [
      { value: "EXCELENTE", label: "Excelente" },
      { value: "BUENA", label: "Buena" },
      { value: "REGULAR", label: "Regular" },
      { value: "DEFICIENTE", label: "Deficiente" },
    ],
  },
  {
    id: "actitudDisposicion",
    label: "Actitud y disposición",
    type: "scale",
    required: true,
    options: [
      { value: "EXCELENTE", label: "Excelente" },
      { value: "BUENA", label: "Buena" },
      { value: "REGULAR", label: "Regular" },
      { value: "DEFICIENTE", label: "Deficiente" },
    ],
  },
  {
    id: "notasGenerales",
    label: "Notas generales del entrevistador",
    type: "textarea",
    required: false,
    placeholder: "Observaciones adicionales sobre el candidato...",
    maxLength: 1000,
  },
];

const BASE_ANSWER_FIELDS: PersonalInterviewField[] = [
  {
    id: "experienciaReciente",
    label: "Cuéntame sobre tu experiencia laboral más reciente",
    type: "textarea",
    required: true,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  {
    id: "trabajoEnEquipo",
    label: "¿Cómo te describes trabajando en equipo?",
    type: "textarea",
    required: true,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  {
    id: "companeroNoCumple",
    label: "¿Qué harías si un compañero no cumple con su parte?",
    type: "textarea",
    required: true,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  {
    id: "disponibilidadCapacitacion",
    label: "¿Tienes disponibilidad para capacitación antes de empezar?",
    type: "textarea",
    required: true,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
];

const TECHNICAL_FIELDS: Record<Position, PersonalInterviewField> = {
  MESERO: {
    id: "preguntaTecnica",
    label: "¿Cómo manejarías una mesa con clientes exigentes que piden cambiar todo el pedido?",
    type: "textarea",
    required: false,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  COCINERA: {
    id: "preguntaTecnica",
    label: "¿Cómo organizarías la preparación de un pedido grande con tiempos limitados?",
    type: "textarea",
    required: false,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  AUXILIAR_COCINA: {
    id: "preguntaTecnica",
    label: "¿Cuáles son las prácticas de higiene más importantes que conoces para una cocina?",
    type: "textarea",
    required: false,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
  AUXILIAR_MESA: {
    id: "preguntaTecnica",
    label: "¿Cómo te asegurarías de que todas las mesas estén listas para el servicio?",
    type: "textarea",
    required: false,
    placeholder: "Respuesta del candidato...",
    maxLength: 500,
  },
};

export function getPersonalInterviewSections(position?: Position): PersonalInterviewSection[] {
  const answerFields = [...BASE_ANSWER_FIELDS];
  if (position && TECHNICAL_FIELDS[position]) {
    answerFields.push(TECHNICAL_FIELDS[position]);
  }

  return [
    {
      id: "observations",
      title: "Observaciones del Entrevistador",
      description: "Evalúa los siguientes aspectos según tu observación directa",
      fields: OBSERVATION_FIELDS,
    },
    {
      id: "answers",
      title: "Preguntas al Candidato",
      description: "Registra las respuestas verbales del candidato",
      fields: answerFields,
    },
  ];
}
