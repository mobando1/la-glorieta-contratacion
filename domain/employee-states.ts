import type { EmploymentStatus } from "./types";

const VALID_TRANSITIONS: Record<EmploymentStatus, EmploymentStatus[]> = {
  ACTIVO: ["DISPONIBLE", "NO_DISPONIBLE", "NO_RECONTRATAR"],
  DISPONIBLE: ["ACTIVO", "NO_DISPONIBLE", "NO_RECONTRATAR"],
  NO_DISPONIBLE: ["DISPONIBLE", "NO_RECONTRATAR"],
  NO_RECONTRATAR: [], // Terminal state
};

export function canTransitionEmployee(
  from: EmploymentStatus,
  to: EmploymentStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateEmployeeTransition(
  from: EmploymentStatus,
  to: EmploymentStatus
): void {
  if (!canTransitionEmployee(from, to)) {
    throw new Error(
      `Transición de estado inválida: ${from} → ${to}`
    );
  }
}

export function getValidTransitions(status: EmploymentStatus): EmploymentStatus[] {
  return VALID_TRANSITIONS[status] || [];
}
