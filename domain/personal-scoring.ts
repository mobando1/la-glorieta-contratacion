import type { AdminObservations, ObservationRating, PunctualityRating } from "./types";

const OBSERVATION_SCORES: Record<ObservationRating, number> = {
  EXCELENTE: 100,
  BUENA: 75,
  REGULAR: 50,
  DEFICIENTE: 25,
};

const PUNCTUALITY_SCORES: Record<PunctualityRating, number> = {
  TEMPRANO: 100,
  A_TIEMPO: 85,
  TARDE: 40,
  NO_SE_PRESENTO: 0,
};

export function scoreObservations(observations: AdminObservations): number {
  const presentacion = OBSERVATION_SCORES[observations.presentacionPersonal];
  const puntualidad = PUNCTUALITY_SCORES[observations.puntualidad];
  const comunicacion = OBSERVATION_SCORES[observations.comunicacionVerbal];
  const actitud = OBSERVATION_SCORES[observations.actitudDisposicion];

  // Weighted average: actitud 30%, puntualidad 25%, comunicación 25%, presentación 20%
  const score =
    actitud * 0.30 +
    puntualidad * 0.25 +
    comunicacion * 0.25 +
    presentacion * 0.20;

  return Math.round(score);
}

export function calculateCombinedScore(
  onlineScore: number,
  personalScore: number
): number {
  // Personal interview weighs more (60%) because it's direct evaluation
  return Math.round(onlineScore * 0.40 + personalScore * 0.60);
}
