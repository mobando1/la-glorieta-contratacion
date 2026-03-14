import { z } from "zod";

// Login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña es obligatoria"),
});

// Admin decision
export const decisionSchema = z.object({
  decision: z.enum(["PRESELECCIONADO", "BASE_DE_DATOS", "NO_CONTINUAR"]),
  notes: z.string().max(1000).optional().default(""),
  overrideReason: z.string().max(500).optional().default(""),
});

// Interview submission
export const interviewSubmissionSchema = z.object({
  answers: z.object({
    schemaVersion: z.string(),
    basic: z.object({
      fullName: z.string().min(1).max(100),
      phone: z.string().min(1).max(15),
      email: z.string().email().max(100).optional().or(z.literal("")),
      positionApplied: z.enum(["MESERO", "COCINERA", "AUXILIAR_COCINA", "AUXILIAR_MESA"]),
      restaurantId: z.string().optional().or(z.literal("")),
      birthDate: z.string().min(1),
      neighborhood: z.string().min(1).max(100),
      maritalStatus: z.enum(["SOLTERO", "CASADO", "UNION_LIBRE", "SEPARADO", "VIUDO"]),
      hasChildren: z.boolean(),
      numberOfChildren: z.number().int().min(0).max(15).default(0),
      hasExperience: z.boolean(),
      experienceDetails: z.string().max(500).default(""),
    }),
    availability: z.object({
      canWorkWeekends: z.boolean(),
      canWorkHolidays: z.boolean(),
      availableShifts: z.array(z.enum(["MAÑANA", "TARDE", "COMPLETO"])).min(1),
      startDate: z.string().min(1).max(100),
      hasOtherJob: z.boolean(),
      otherJobDetails: z.string().max(300).default(""),
    }),
    motivation: z.object({
      whyThisJob: z.string().min(1).max(500),
      whatDoYouKnowAboutUs: z.string().min(1).max(300),
      whereDoYouSeeYourself: z.string().min(1).max(300),
      whatMotivatesYou: z.string().min(1).max(300),
    }),
    responsibility: z.object({
      lastJobLeaveReason: z.string().min(1).max(500),
      howDoYouHandlePressure: z.string().min(1).max(500),
      lateArrivalFrequency: z.string().min(1).max(300),
      howDoYouReactToCorrection: z.string().min(1).max(500),
      describeResponsibleMoment: z.string().min(1).max(500),
    }),
    scenarios: z.object({
      angryCustomer: z.string().min(1).max(500),
      teamConflict: z.string().min(1).max(500),
      forgotTask: z.string().min(1).max(500),
      peakHourChaos: z.string().min(1).max(500),
    }),
    technical: z.record(z.string(), z.string().max(500)),
    consent: z.object({
      dataProcessingAccepted: z.literal(true),
      informationTruthful: z.literal(true),
    }),
  }),
  completionTimeSeconds: z.number().int().positive().optional(),
  photoToken: z.string().uuid().optional(),
});

// Onboarding update
export const onboardingUpdateSchema = z.object({
  fullName: z.string().min(1, "Nombre es obligatorio").max(100),
  phone: z.string().min(7, "Teléfono inválido").max(15),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().min(1, "Dirección es obligatoria").max(300),
  cedulaNumber: z.string().min(5, "Número de cédula inválido").max(20),
});

// Evaluate endpoint
export const evaluateSchema = z.object({
  candidateId: z.string().optional(),
  interviewId: z.string().optional(),
});

// Personal Interview
export const personalInterviewSchema = z.object({
  observations: z.object({
    presentacionPersonal: z.enum(["EXCELENTE", "BUENA", "REGULAR", "DEFICIENTE"]),
    puntualidad: z.enum(["TEMPRANO", "A_TIEMPO", "TARDE", "NO_SE_PRESENTO"]),
    comunicacionVerbal: z.enum(["EXCELENTE", "BUENA", "REGULAR", "DEFICIENTE"]),
    actitudDisposicion: z.enum(["EXCELENTE", "BUENA", "REGULAR", "DEFICIENTE"]),
    notasGenerales: z.string().max(1000).optional().default(""),
  }),
  answers: z.object({
    experienciaReciente: z.string().min(1, "Campo obligatorio").max(500),
    trabajoEnEquipo: z.string().min(1, "Campo obligatorio").max(500),
    companeroNoCumple: z.string().min(1, "Campo obligatorio").max(500),
    disponibilidadCapacitacion: z.string().min(1, "Campo obligatorio").max(500),
    preguntaTecnica: z.string().max(500).optional().default(""),
  }),
});

// Employment status change
export const employmentStatusSchema = z.object({
  status: z.enum(["ACTIVO", "DISPONIBLE", "NO_DISPONIBLE", "NO_RECONTRATAR"]),
  terminationReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  contractType: z.enum(["TIEMPO_COMPLETO", "MEDIO_TIEMPO", "FINES_DE_SEMANA", "POR_TURNOS", "TEMPORAL", "VACACIONES"]).optional(),
  position: z.enum(["MESERO", "COCINERA", "AUXILIAR_COCINA", "AUXILIAR_MESA"]).optional(),
  restaurantId: z.string().optional(),
});

// Work period
export const workPeriodSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  contractType: z.enum(["TIEMPO_COMPLETO", "MEDIO_TIEMPO", "FINES_DE_SEMANA", "POR_TURNOS", "TEMPORAL", "VACACIONES"]),
  position: z.enum(["MESERO", "COCINERA", "AUXILIAR_COCINA", "AUXILIAR_MESA"]),
  restaurantId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Work period update
export const workPeriodUpdateSchema = z.object({
  endDate: z.string().optional(),
  status: z.enum(["ACTIVO", "COMPLETADO", "ABANDONADO"]).optional(),
  notes: z.string().max(500).optional(),
});

// Performance review
export const performanceReviewSchema = z.object({
  workPeriodId: z.string().min(1),
  punctuality: z.number().int().min(1).max(5),
  attitude: z.number().int().min(1).max(5),
  quality: z.number().int().min(1).max(5),
  reliability: z.number().int().min(1).max(5),
  teamwork: z.number().int().min(1).max(5),
  wouldRehire: z.boolean(),
  notes: z.string().max(1000).optional(),
});

// Employee update (admin notes, preferences)
export const employeeUpdateSchema = z.object({
  contractType: z.enum(["TIEMPO_COMPLETO", "MEDIO_TIEMPO", "FINES_DE_SEMANA", "POR_TURNOS", "TEMPORAL", "VACACIONES"]).optional(),
  preferredShifts: z.string().max(100).optional(),
  adminNotes: z.string().max(2000).optional(),
});

// Restaurant CRUD
export const restaurantSchema = z.object({
  name: z.string().min(1, "Nombre es obligatorio").max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  address: z.string().max(300).optional().default(""),
  isActive: z.boolean().optional().default(true),
});

// Admin user CRUD
export const adminUserCreateSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.enum(["SUPER_ADMIN", "GESTOR"]),
  restaurantIds: z.array(z.string()).default([]),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "GESTOR"]).optional(),
  isActive: z.boolean().optional(),
  restaurantIds: z.array(z.string()).optional(),
});

export const adminPasswordResetSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
