import type { CandidateStatus } from "./types";

const VALID_TRANSITIONS: Record<CandidateStatus, CandidateStatus[]> = {
  NUEVO: ["PENDIENTE_EVALUACION"],
  PENDIENTE_EVALUACION: ["EVALUANDO", "EVALUADO"],
  EVALUANDO: ["EVALUADO", "PENDIENTE_EVALUACION"],
  EVALUADO: ["PRESELECCIONADO", "BASE_DE_DATOS", "NO_CONTINUAR"],
  PRESELECCIONADO: ["CITADO_ENTREVISTA", "BASE_DE_DATOS", "NO_CONTINUAR"],
  CITADO_ENTREVISTA: ["ENTREVISTA_REALIZADA", "BASE_DE_DATOS", "NO_CONTINUAR"],
  ENTREVISTA_REALIZADA: ["EVALUANDO_ENTREVISTA"],
  EVALUANDO_ENTREVISTA: ["EVALUADO_ENTREVISTA", "ENTREVISTA_REALIZADA"],
  EVALUADO_ENTREVISTA: ["CONTRATADO", "BASE_DE_DATOS", "NO_CONTINUAR"],
  CONTRATADO: [],
  BASE_DE_DATOS: ["PRESELECCIONADO", "NO_CONTINUAR"],
  NO_CONTINUAR: [],
};

export function canTransition(
  from: CandidateStatus,
  to: CandidateStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTransition(
  from: CandidateStatus,
  to: CandidateStatus
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transición de estado inválida: ${from} → ${to}`
    );
  }
}
