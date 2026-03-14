import { POSITIONS, AVAILABLE_SHIFTS, MARITAL_STATUSES } from "./types";
import type { InterviewAnswers, Position, MaritalStatus } from "./types";

interface ValidationError {
  field: string;
  message: string;
}

const CHAR_LIMITS: Record<string, number> = {
  fullName: 100,
  phone: 15,
  neighborhood: 100,
  experienceDetails: 500,
  startDate: 100,
  otherJobDetails: 300,
  whyThisJob: 500,
  whatDoYouKnowAboutUs: 300,
  whereDoYouSeeYourself: 300,
  whatMotivatesYou: 300,
  lastJobLeaveReason: 500,
  howDoYouHandlePressure: 500,
  lateArrivalFrequency: 300,
  howDoYouReactToCorrection: 500,
  describeResponsibleMoment: 500,
  angryCustomer: 500,
  teamConflict: 500,
  forgotTask: 500,
  peakHourChaos: 500,
};

const TECHNICAL_CHAR_LIMIT = 500;

function validateRequiredString(
  value: unknown,
  fieldName: string,
  errors: ValidationError[]
): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push({ field: fieldName, message: "Este campo es obligatorio" });
    return false;
  }
  const limit = CHAR_LIMITS[fieldName];
  if (limit && value.length > limit) {
    errors.push({
      field: fieldName,
      message: `Máximo ${limit} caracteres`,
    });
    return false;
  }
  return true;
}

export function validateBasic(
  data: Partial<InterviewAnswers["basic"]>
): ValidationError[] {
  const errors: ValidationError[] = [];

  validateRequiredString(data.fullName, "fullName", errors);

  if (typeof data.phone !== "string" || !/^\d{7,15}$/.test(data.phone.replace(/\D/g, ""))) {
    errors.push({ field: "phone", message: "Número de teléfono inválido" });
  }

  if (!data.positionApplied || !POSITIONS.includes(data.positionApplied as Position)) {
    errors.push({ field: "positionApplied", message: "Selecciona un cargo válido" });
  }

  if (!data.birthDate || typeof data.birthDate !== "string" || data.birthDate.trim().length === 0) {
    errors.push({ field: "birthDate", message: "Fecha de nacimiento es obligatoria" });
  } else {
    const birth = new Date(data.birthDate);
    const ageMs = Date.now() - birth.getTime();
    const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < 16) {
      errors.push({ field: "birthDate", message: "Debes tener al menos 16 años" });
    }
  }

  validateRequiredString(data.neighborhood, "neighborhood", errors);

  if (!data.maritalStatus || !MARITAL_STATUSES.includes(data.maritalStatus as MaritalStatus)) {
    errors.push({ field: "maritalStatus", message: "Selecciona tu estado civil" });
  }

  if (typeof data.hasChildren !== "boolean") {
    errors.push({ field: "hasChildren", message: "Indica si tienes hijos" });
  }

  if (typeof data.hasExperience !== "boolean") {
    errors.push({ field: "hasExperience", message: "Indica si tienes experiencia" });
  }

  if (data.hasExperience && !data.experienceDetails?.trim()) {
    errors.push({ field: "experienceDetails", message: "Describe tu experiencia" });
  }

  return errors;
}

export function validateAvailability(
  data: Partial<InterviewAnswers["availability"]>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof data.canWorkWeekends !== "boolean") {
    errors.push({ field: "canWorkWeekends", message: "Este campo es obligatorio" });
  }
  if (typeof data.canWorkHolidays !== "boolean") {
    errors.push({ field: "canWorkHolidays", message: "Este campo es obligatorio" });
  }

  if (!Array.isArray(data.availableShifts) || data.availableShifts.length === 0) {
    errors.push({ field: "availableShifts", message: "Selecciona al menos un turno" });
  } else {
    for (const shift of data.availableShifts) {
      if (!AVAILABLE_SHIFTS.includes(shift)) {
        errors.push({ field: "availableShifts", message: `Turno inválido: ${shift}` });
      }
    }
  }

  validateRequiredString(data.startDate, "startDate", errors);

  if (typeof data.hasOtherJob !== "boolean") {
    errors.push({ field: "hasOtherJob", message: "Este campo es obligatorio" });
  }

  if (data.hasOtherJob && !data.otherJobDetails?.trim()) {
    errors.push({ field: "otherJobDetails", message: "Describe tu otro trabajo" });
  }

  return errors;
}

export function validateMotivation(
  data: Partial<InterviewAnswers["motivation"]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateRequiredString(data.whyThisJob, "whyThisJob", errors);
  validateRequiredString(data.whatDoYouKnowAboutUs, "whatDoYouKnowAboutUs", errors);
  validateRequiredString(data.whereDoYouSeeYourself, "whereDoYouSeeYourself", errors);
  validateRequiredString(data.whatMotivatesYou, "whatMotivatesYou", errors);
  return errors;
}

export function validateResponsibility(
  data: Partial<InterviewAnswers["responsibility"]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateRequiredString(data.lastJobLeaveReason, "lastJobLeaveReason", errors);
  validateRequiredString(data.howDoYouHandlePressure, "howDoYouHandlePressure", errors);
  validateRequiredString(data.lateArrivalFrequency, "lateArrivalFrequency", errors);
  validateRequiredString(data.howDoYouReactToCorrection, "howDoYouReactToCorrection", errors);
  validateRequiredString(data.describeResponsibleMoment, "describeResponsibleMoment", errors);
  return errors;
}

export function validateScenarios(
  data: Partial<InterviewAnswers["scenarios"]>
): ValidationError[] {
  const errors: ValidationError[] = [];
  validateRequiredString(data.angryCustomer, "angryCustomer", errors);
  validateRequiredString(data.teamConflict, "teamConflict", errors);
  validateRequiredString(data.forgotTask, "forgotTask", errors);
  validateRequiredString(data.peakHourChaos, "peakHourChaos", errors);
  return errors;
}

const TECHNICAL_FIELDS: Record<Position, string[]> = {
  MESERO: ["mesero_orderProcess", "mesero_menuSuggestion", "mesero_paymentHandling"],
  COCINERA: ["cocinera_hygiene", "cocinera_missingIngredient", "cocinera_timeManagement"],
  AUXILIAR_COCINA: ["auxcocina_cleanProcess", "auxcocina_instructions", "auxcocina_speed"],
  AUXILIAR_MESA: ["auxmesa_priority", "auxmesa_detail", "auxmesa_initiative"],
};

export function getTechnicalFields(position: Position): string[] {
  return TECHNICAL_FIELDS[position] || [];
}

export function validateTechnical(
  data: Record<string, string>,
  position: Position
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fields = getTechnicalFields(position);

  for (const field of fields) {
    const val = data[field];
    if (typeof val !== "string" || val.trim().length === 0) {
      errors.push({ field, message: "Este campo es obligatorio" });
    } else if (val.length > TECHNICAL_CHAR_LIMIT) {
      errors.push({ field, message: `Máximo ${TECHNICAL_CHAR_LIMIT} caracteres` });
    }
  }

  return errors;
}

export function validateConsent(
  data: Partial<InterviewAnswers["consent"]>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.dataProcessingAccepted !== true) {
    errors.push({ field: "dataProcessingAccepted", message: "Debes aceptar el tratamiento de datos" });
  }
  if (data.informationTruthful !== true) {
    errors.push({ field: "informationTruthful", message: "Debes confirmar que la información es verdadera" });
  }

  return errors;
}

export function validateFullInterview(answers: InterviewAnswers): ValidationError[] {
  const allErrors: ValidationError[] = [];

  allErrors.push(...validateBasic(answers.basic));
  allErrors.push(...validateAvailability(answers.availability));
  allErrors.push(...validateMotivation(answers.motivation));
  allErrors.push(...validateResponsibility(answers.responsibility));
  allErrors.push(...validateScenarios(answers.scenarios));
  allErrors.push(
    ...validateTechnical(answers.technical, answers.basic.positionApplied)
  );
  allErrors.push(...validateConsent(answers.consent));

  return allErrors;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
