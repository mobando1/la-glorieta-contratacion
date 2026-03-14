export const CANDIDATE_STATUSES = [
  "NUEVO",
  "PENDIENTE_EVALUACION",
  "EVALUANDO",
  "EVALUADO",
  "PRESELECCIONADO",
  "CITADO_ENTREVISTA",
  "ENTREVISTA_REALIZADA",
  "EVALUANDO_ENTREVISTA",
  "EVALUADO_ENTREVISTA",
  "CONTRATADO",
  "BASE_DE_DATOS",
  "NO_CONTINUAR",
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const POSITIONS = [
  "MESERO",
  "COCINERA",
  "AUXILIAR_COCINA",
  "AUXILIAR_MESA",
] as const;

export type Position = (typeof POSITIONS)[number];

export const POSITION_LABELS: Record<Position, string> = {
  MESERO: "Mesero(a)",
  COCINERA: "Cocinero(a)",
  AUXILIAR_COCINA: "Auxiliar de Cocina",
  AUXILIAR_MESA: "Auxiliar de Mesa / Servicio",
};

export const STATUS_LABELS: Record<CandidateStatus, string> = {
  NUEVO: "Nuevo",
  PENDIENTE_EVALUACION: "Pendiente Evaluación",
  EVALUANDO: "Evaluando...",
  EVALUADO: "Evaluado",
  PRESELECCIONADO: "Preseleccionado",
  CITADO_ENTREVISTA: "Citado a Entrevista",
  ENTREVISTA_REALIZADA: "Entrevista Realizada",
  EVALUANDO_ENTREVISTA: "Evaluando Entrevista...",
  EVALUADO_ENTREVISTA: "Evaluado (Entrevista)",
  CONTRATADO: "Contratado",
  BASE_DE_DATOS: "Base de Datos",
  NO_CONTINUAR: "No Continuar",
};

export const SUGGESTED_DECISIONS = [
  "PRESELECCIONAR",
  "BASE_DE_DATOS",
  "NO_CONTINUAR",
] as const;

export type SuggestedDecision = (typeof SUGGESTED_DECISIONS)[number];

export const ADMIN_DECISIONS = [
  "PRESELECCIONADO",
  "BASE_DE_DATOS",
  "NO_CONTINUAR",
] as const;

export type AdminDecisionType = (typeof ADMIN_DECISIONS)[number];

export const AVAILABLE_SHIFTS = ["MAÑANA", "TARDE", "COMPLETO"] as const;

export type AvailableShift = (typeof AVAILABLE_SHIFTS)[number];

export interface InterviewAnswers {
  schemaVersion: string;
  basic: {
    fullName: string;
    phone: string;
    email?: string;
    positionApplied: Position;
    restaurantId?: string;
    age?: number | null;
    birthDate?: string;
    maritalStatus?: string;
    hasChildren?: boolean;
    numberOfChildren?: number;
    neighborhood: string;
    hasExperience: boolean;
    experienceDetails: string;
  };
  availability: {
    canWorkWeekends: boolean;
    canWorkHolidays: boolean;
    availableShifts: AvailableShift[];
    startDate: string;
    hasOtherJob: boolean;
    otherJobDetails: string;
  };
  motivation: {
    whyThisJob: string;
    whatDoYouKnowAboutUs: string;
    whereDoYouSeeYourself: string;
    whatMotivatesYou: string;
  };
  responsibility: {
    lastJobLeaveReason: string;
    howDoYouHandlePressure: string;
    lateArrivalFrequency: string;
    howDoYouReactToCorrection: string;
    describeResponsibleMoment: string;
  };
  scenarios: {
    angryCustomer: string;
    teamConflict: string;
    forgotTask: string;
    peakHourChaos: string;
  };
  technical: Record<string, string>;
  consent: {
    dataProcessingAccepted: boolean;
    informationTruthful: boolean;
  };
}

export const ONBOARDING_STATUSES = ["PENDIENTE", "EN_PROGRESO", "COMPLETADO"] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const DOCUMENT_TYPES = ["CEDULA_FRENTE", "CEDULA_REVERSO", "OTRO"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface AIEvaluationResult {
  attitudeScore: number;
  responsibilityScore: number;
  technicalScore: number;
  totalScore: number;
  suggestedDecision: SuggestedDecision;
  redFlags: string[];
  summary: string;
  rationale: string;
  confidence: number;
  requiresHumanReview: boolean;
}

// Personal Interview types
export const OBSERVATION_RATINGS = ["EXCELENTE", "BUENA", "REGULAR", "DEFICIENTE"] as const;
export type ObservationRating = (typeof OBSERVATION_RATINGS)[number];

export const PUNCTUALITY_RATINGS = ["TEMPRANO", "A_TIEMPO", "TARDE", "NO_SE_PRESENTO"] as const;
export type PunctualityRating = (typeof PUNCTUALITY_RATINGS)[number];

export interface AdminObservations {
  presentacionPersonal: ObservationRating;
  puntualidad: PunctualityRating;
  comunicacionVerbal: ObservationRating;
  actitudDisposicion: ObservationRating;
  notasGenerales?: string;
}

export const ADMIN_ROLES = ["SUPER_ADMIN", "ENCARGADO"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// Marital Status
export const MARITAL_STATUSES = ["SOLTERO", "CASADO", "UNION_LIBRE", "SEPARADO", "VIUDO"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  SOLTERO: "Soltero(a)",
  CASADO: "Casado(a)",
  UNION_LIBRE: "Unión Libre",
  SEPARADO: "Separado(a)",
  VIUDO: "Viudo(a)",
};

// Employment Status (Talent Pool)
export const EMPLOYMENT_STATUSES = ["ACTIVO", "DISPONIBLE", "NO_DISPONIBLE", "NO_RECONTRATAR"] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  ACTIVO: "Activo",
  DISPONIBLE: "Disponible",
  NO_DISPONIBLE: "No Disponible",
  NO_RECONTRATAR: "No Recontratar",
};

// Contract Types
export const CONTRACT_TYPES = [
  "TIEMPO_COMPLETO", "MEDIO_TIEMPO", "FINES_DE_SEMANA",
  "POR_TURNOS", "TEMPORAL", "VACACIONES",
] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  TIEMPO_COMPLETO: "Tiempo Completo",
  MEDIO_TIEMPO: "Medio Tiempo",
  FINES_DE_SEMANA: "Fines de Semana",
  POR_TURNOS: "Por Turnos",
  TEMPORAL: "Temporal",
  VACACIONES: "Vacaciones",
};

// Work Period Status
export const WORK_PERIOD_STATUSES = ["ACTIVO", "COMPLETADO", "ABANDONADO"] as const;
export type WorkPeriodStatus = (typeof WORK_PERIOD_STATUSES)[number];

export interface PersonalInterviewAnswers {
  experienciaReciente: string;
  trabajoEnEquipo: string;
  companeroNoCumple: string;
  disponibilidadCapacitacion: string;
  preguntaTecnica?: string;
}
