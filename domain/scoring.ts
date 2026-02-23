import type { AIEvaluationResult, SuggestedDecision } from "./types";

const WEIGHTS = {
  attitude: 0.45,
  responsibility: 0.40,
  technical: 0.15,
} as const;

export function calculateTotalScore(
  attitudeScore: number,
  responsibilityScore: number,
  technicalScore: number
): number {
  const raw =
    attitudeScore * WEIGHTS.attitude +
    responsibilityScore * WEIGHTS.responsibility +
    technicalScore * WEIGHTS.technical;
  return Math.round(raw);
}

export function applyHardRules(
  attitudeScore: number,
  responsibilityScore: number
): { blocked: boolean; reason?: string } {
  if (attitudeScore < 60) {
    return { blocked: true, reason: "attitudeScore < 60" };
  }
  if (responsibilityScore < 60) {
    return { blocked: true, reason: "responsibilityScore < 60" };
  }
  return { blocked: false };
}

export function determineSuggestedDecision(
  totalScore: number,
  attitudeScore: number,
  responsibilityScore: number
): SuggestedDecision {
  const hardRules = applyHardRules(attitudeScore, responsibilityScore);
  if (hardRules.blocked) {
    return "NO_CONTINUAR";
  }

  if (totalScore >= 80) return "PRESELECCIONAR";
  if (totalScore >= 65) return "BASE_DE_DATOS";
  return "NO_CONTINUAR";
}

export function validateAIResponse(data: unknown): AIEvaluationResult {
  if (!data || typeof data !== "object") {
    throw new Error("La respuesta de la IA no es un objeto válido");
  }

  const obj = data as Record<string, unknown>;

  const requiredScores = [
    "attitudeScore",
    "responsibilityScore",
    "technicalScore",
  ] as const;

  for (const key of requiredScores) {
    const val = obj[key];
    if (typeof val !== "number" || val < 0 || val > 100) {
      throw new Error(`${key} debe ser un número entre 0 y 100, recibido: ${val}`);
    }
  }

  if (!Array.isArray(obj.redFlags)) {
    throw new Error("redFlags debe ser un array");
  }

  for (const flag of obj.redFlags) {
    if (typeof flag !== "string") {
      throw new Error("Cada red flag debe ser un string");
    }
  }

  if (typeof obj.summary !== "string" || obj.summary.length === 0) {
    throw new Error("summary debe ser un string no vacío");
  }

  if (typeof obj.rationale !== "string" || obj.rationale.length === 0) {
    throw new Error("rationale debe ser un string no vacío");
  }

  const confidence =
    typeof obj.confidence === "number" ? obj.confidence : 0.5;

  const attitudeScore = obj.attitudeScore as number;
  const responsibilityScore = obj.responsibilityScore as number;
  const technicalScore = obj.technicalScore as number;

  // Calculate totalScore server-side — never trust the LLM
  const totalScore = calculateTotalScore(
    attitudeScore,
    responsibilityScore,
    technicalScore
  );

  const suggestedDecision = determineSuggestedDecision(
    totalScore,
    attitudeScore,
    responsibilityScore
  );

  const redFlags = obj.redFlags as string[];

  let requiresHumanReview = false;
  if (confidence < 0.6) requiresHumanReview = true;
  if (redFlags.length >= 3) requiresHumanReview = true;
  if (obj.requiresHumanReview === true) requiresHumanReview = true;

  return {
    attitudeScore,
    responsibilityScore,
    technicalScore,
    totalScore,
    suggestedDecision,
    redFlags,
    summary: obj.summary as string,
    rationale: obj.rationale as string,
    confidence,
    requiresHumanReview,
  };
}
