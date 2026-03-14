import type { Position } from "./types";

export interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "multiselect" | "boolean" | "checkbox" | "date";
  required: boolean;
  conditional?: { field: string; value: unknown };
  maxLength?: number;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}

export interface InterviewStep {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

const BASIC_QUESTIONS: Question[] = [
  {
    id: "fullName",
    label: "¿Cuál es tu nombre completo?",
    type: "text",
    required: true,
    maxLength: 100,
    placeholder: "Nombre y apellido",
  },
  {
    id: "phone",
    label: "¿Cuál es tu número de celular?",
    type: "text",
    required: true,
    maxLength: 15,
    placeholder: "Ej: 3101234567",
  },
  {
    id: "email",
    label: "¿Cuál es tu correo electrónico? (opcional)",
    type: "text",
    required: false,
    maxLength: 100,
    placeholder: "ejemplo@correo.com",
  },
  {
    id: "positionApplied",
    label: "¿A qué cargo te gustaría aplicar?",
    type: "select",
    required: true,
    options: [
      { value: "MESERO", label: "Mesero(a)" },
      { value: "COCINERA", label: "Cocinero(a)" },
      { value: "AUXILIAR_COCINA", label: "Auxiliar de Cocina" },
      { value: "AUXILIAR_MESA", label: "Auxiliar de Mesa / Servicio" },
    ],
  },
  {
    id: "birthDate",
    label: "¿Cuál es tu fecha de nacimiento?",
    type: "date",
    required: true,
  },
  {
    id: "neighborhood",
    label: "¿En qué barrio o vereda vives?",
    type: "text",
    required: true,
    maxLength: 100,
    placeholder: "Barrio o vereda",
  },
  {
    id: "maritalStatus",
    label: "¿Cuál es tu estado civil?",
    type: "select",
    required: true,
    options: [
      { value: "SOLTERO", label: "Soltero(a)" },
      { value: "CASADO", label: "Casado(a)" },
      { value: "UNION_LIBRE", label: "Unión Libre" },
      { value: "SEPARADO", label: "Separado(a)" },
      { value: "VIUDO", label: "Viudo(a)" },
    ],
  },
  {
    id: "hasChildren",
    label: "¿Tienes hijos?",
    type: "boolean",
    required: true,
  },
  {
    id: "numberOfChildren",
    label: "¿Cuántos hijos tienes?",
    type: "number",
    required: true,
    conditional: { field: "hasChildren", value: true },
    min: 1,
    max: 15,
  },
  {
    id: "hasExperience",
    label: "¿Tienes experiencia previa en restaurantes o servicio?",
    type: "boolean",
    required: true,
  },
  {
    id: "experienceDetails",
    label: "Cuéntanos brevemente tu experiencia",
    type: "textarea",
    required: true,
    conditional: { field: "hasExperience", value: true },
    maxLength: 500,
    placeholder: "Describe tu experiencia anterior...",
  },
];

const AVAILABILITY_QUESTIONS: Question[] = [
  {
    id: "canWorkWeekends",
    label: "¿Puedes trabajar sábados, domingos y festivos?",
    type: "boolean",
    required: true,
  },
  {
    id: "canWorkHolidays",
    label: "¿Puedes trabajar en fechas especiales (Navidad, Año Nuevo)?",
    type: "boolean",
    required: true,
  },
  {
    id: "availableShifts",
    label: "¿En qué turnos puedes trabajar?",
    type: "multiselect",
    required: true,
    options: [
      { value: "MAÑANA", label: "Mañana" },
      { value: "TARDE", label: "Tarde" },
      { value: "COMPLETO", label: "Jornada Completa" },
    ],
  },
  {
    id: "flexibleSchedule",
    label: "A veces es necesario cubrir turnos de compañeros o trabajar en horarios diferentes al habitual. ¿Estás dispuesto(a) a tener flexibilidad de horario?",
    type: "boolean",
    required: true,
    hint: "Siempre buscamos un acuerdo que funcione para ambas partes.",
  },
  {
    id: "startDate",
    label: "¿Desde cuándo podrías empezar a trabajar?",
    type: "text",
    required: true,
    maxLength: 100,
    placeholder: "Ej: Inmediatamente, en una semana...",
  },
  {
    id: "hasOtherJob",
    label: "¿Actualmente tienes otro trabajo?",
    type: "boolean",
    required: true,
  },
  {
    id: "otherJobDetails",
    label: "Cuéntanos los horarios de tu otro trabajo",
    type: "textarea",
    required: true,
    conditional: { field: "hasOtherJob", value: true },
    maxLength: 300,
  },
];

const MOTIVATION_QUESTIONS: Question[] = [
  {
    id: "whyThisJob",
    label: "¿Por qué quieres trabajar con nosotros?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "whatDoYouKnowAboutUs",
    label: "¿Qué sabes sobre nuestro restaurante?",
    type: "textarea",
    required: true,
    maxLength: 300,
  },
  {
    id: "whereDoYouSeeYourself",
    label: "¿Buscas un trabajo estable o algo temporal?",
    type: "textarea",
    required: true,
    maxLength: 300,
  },
  {
    id: "whatMotivatesYou",
    label: "¿Qué es lo que más te motiva de un trabajo?",
    type: "textarea",
    required: true,
    maxLength: 300,
  },
];

const RESPONSIBILITY_QUESTIONS: Question[] = [
  {
    id: "lastJobLeaveReason",
    label: "¿Por qué saliste de tu último trabajo? (o por qué buscas trabajo ahora)",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "howDoYouHandlePressure",
    label: "Cuando hay mucho trabajo y presión, ¿cómo reaccionas?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "lateArrivalFrequency",
    label: "En tus trabajos anteriores, ¿qué tan seguido llegabas tarde?",
    type: "textarea",
    required: true,
    maxLength: 300,
  },
  {
    id: "howDoYouReactToCorrection",
    label: "Si tu jefe te corrige frente a los demás, ¿cómo reaccionas?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "describeResponsibleMoment",
    label: "Cuéntanos un momento donde demostraste ser responsable en un trabajo",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
];

const SCENARIOS_QUESTIONS: Question[] = [
  {
    id: "angryCustomer",
    label: "Un cliente se enoja porque su pedido está mal. Te grita frente a otros clientes. ¿Qué haces?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "teamConflict",
    label: "Un compañero no hace su parte del trabajo y tú tienes que cubrir. ¿Qué haces?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "forgotTask",
    label: "Olvidaste hacer algo importante que tu jefe te pidió. ¿Cómo manejas la situación?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
  {
    id: "peakHourChaos",
    label: "Es hora pico, hay 10 mesas llenas, y se cae un plato. ¿Qué haces primero?",
    type: "textarea",
    required: true,
    maxLength: 500,
  },
];

const TECHNICAL_QUESTIONS: Record<Position, Question[]> = {
  MESERO: [
    {
      id: "mesero_orderProcess",
      label: "Describe paso a paso cómo tomarías un pedido en una mesa de 6 personas",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "mesero_menuSuggestion",
      label: "Un cliente no sabe qué pedir. ¿Cómo lo ayudarías?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "mesero_paymentHandling",
      label: "¿Has manejado caja registradora o datáfono? Cuéntanos tu experiencia",
      type: "textarea",
      required: true,
      maxLength: 300,
    },
  ],
  COCINERA: [
    {
      id: "cocinera_hygiene",
      label: "¿Cuáles son las reglas de higiene más importantes que sigues al cocinar?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "cocinera_missingIngredient",
      label: "Te falta un ingrediente clave para un plato que ya pidieron. ¿Qué haces?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "cocinera_timeManagement",
      label: "Tienes 5 pedidos al tiempo. ¿Cómo organizas los tiempos?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
  ],
  AUXILIAR_COCINA: [
    {
      id: "auxcocina_cleanProcess",
      label: "¿Cómo organizas la limpieza de tu estación durante el servicio?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "auxcocina_instructions",
      label: "Si el chef te da una instrucción que no entiendes bien, ¿qué haces?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "auxcocina_speed",
      label: "¿Cómo mantienes la velocidad sin descuidar la limpieza?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
  ],
  AUXILIAR_MESA: [
    {
      id: "auxmesa_priority",
      label: "Hay 3 mesas sucias y llegan clientes nuevos. ¿Qué haces primero?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "auxmesa_detail",
      label: "¿Qué cosas revisas antes de decir que una mesa está lista?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
    {
      id: "auxmesa_initiative",
      label: "¿Cómo sabes cuándo ayudar sin que te lo pidan?",
      type: "textarea",
      required: true,
      maxLength: 500,
    },
  ],
};

export function getInterviewSteps(position?: Position): InterviewStep[] {
  const steps: InterviewStep[] = [
    {
      id: "intro",
      title: "Bienvenido(a)",
      description: "Proceso de Selección",
      questions: [], // Paso informativo sin preguntas
    },
    {
      id: "basic",
      title: "Datos Básicos",
      description: "Cuéntanos sobre ti",
      questions: BASIC_QUESTIONS,
    },
    {
      id: "availability",
      title: "Disponibilidad",
      description: "¿Cuándo puedes trabajar?",
      questions: AVAILABILITY_QUESTIONS,
    },
    {
      id: "motivation",
      title: "Motivación",
      description: "¿Por qué quieres trabajar con nosotros?",
      questions: MOTIVATION_QUESTIONS,
    },
    {
      id: "responsibility",
      title: "Responsabilidad",
      description: "Háblanos de tus hábitos laborales",
      questions: RESPONSIBILITY_QUESTIONS,
    },
    {
      id: "scenarios",
      title: "Escenarios Reales",
      description: "¿Cómo reaccionas en estas situaciones?",
      questions: SCENARIOS_QUESTIONS,
    },
    {
      id: "technical",
      title: "Técnica Específica",
      description: "Preguntas sobre el cargo",
      questions: position ? TECHNICAL_QUESTIONS[position] : [],
    },
    {
      id: "consent",
      title: "Confirmación",
      description: "Revisa y confirma tu información",
      questions: [
        {
          id: "dataProcessingAccepted",
          label: "Autorizo el uso de mis datos personales para este proceso de selección",
          type: "checkbox",
          required: true,
        },
        {
          id: "informationTruthful",
          label: "Confirmo que toda la información proporcionada es verdadera",
          type: "checkbox",
          required: true,
        },
      ],
    },
  ];

  return steps;
}
