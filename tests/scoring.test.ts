import {
  calculateTotalScore,
  applyHardRules,
  determineSuggestedDecision,
  validateAIResponse,
} from "@/domain/scoring";

describe("calculateTotalScore", () => {
  it("should calculate weighted score correctly", () => {
    // 80*0.45 + 70*0.40 + 60*0.15 = 36 + 28 + 9 = 73
    expect(calculateTotalScore(80, 70, 60)).toBe(73);
  });

  it("should return 100 for perfect scores", () => {
    expect(calculateTotalScore(100, 100, 100)).toBe(100);
  });

  it("should return 0 for zero scores", () => {
    expect(calculateTotalScore(0, 0, 0)).toBe(0);
  });

  it("should round the result", () => {
    // 75*0.45 + 80*0.40 + 90*0.15 = 33.75 + 32 + 13.5 = 79.25 → 79
    expect(calculateTotalScore(75, 80, 90)).toBe(79);
  });

  it("should weight attitude highest at 45%", () => {
    // Changing only attitude by +10 should have bigger impact than changing only technical by +10
    const baseScore = calculateTotalScore(70, 70, 70);
    const attitudeBoost = calculateTotalScore(80, 70, 70);
    const technicalBoost = calculateTotalScore(70, 70, 80);
    expect(attitudeBoost - baseScore).toBeGreaterThan(technicalBoost - baseScore);
  });
});

describe("applyHardRules", () => {
  it("should block when attitudeScore < 60", () => {
    const result = applyHardRules(59, 80);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("attitudeScore");
  });

  it("should block when responsibilityScore < 60", () => {
    const result = applyHardRules(80, 59);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain("responsibilityScore");
  });

  it("should NOT block when both scores >= 60", () => {
    const result = applyHardRules(60, 60);
    expect(result.blocked).toBe(false);
  });

  it("should block at exactly 59", () => {
    expect(applyHardRules(59, 100).blocked).toBe(true);
    expect(applyHardRules(100, 59).blocked).toBe(true);
  });

  it("should NOT block at exactly 60", () => {
    expect(applyHardRules(60, 100).blocked).toBe(false);
    expect(applyHardRules(100, 60).blocked).toBe(false);
  });
});

describe("determineSuggestedDecision", () => {
  it("should return NO_CONTINUAR when hard rules block", () => {
    expect(determineSuggestedDecision(90, 50, 80)).toBe("NO_CONTINUAR");
    expect(determineSuggestedDecision(90, 80, 50)).toBe("NO_CONTINUAR");
  });

  it("should return PRESELECCIONAR for totalScore >= 80", () => {
    expect(determineSuggestedDecision(80, 80, 80)).toBe("PRESELECCIONAR");
    expect(determineSuggestedDecision(95, 90, 90)).toBe("PRESELECCIONAR");
  });

  it("should return BASE_DE_DATOS for totalScore 65-79", () => {
    expect(determineSuggestedDecision(65, 70, 60)).toBe("BASE_DE_DATOS");
    expect(determineSuggestedDecision(79, 70, 60)).toBe("BASE_DE_DATOS");
  });

  it("should return NO_CONTINUAR for totalScore < 65", () => {
    expect(determineSuggestedDecision(64, 65, 65)).toBe("NO_CONTINUAR");
  });

  it("should prioritize hard rules over score", () => {
    // Even with totalScore = 90 (high), if attitude < 60, NO_CONTINUAR
    expect(determineSuggestedDecision(90, 55, 100)).toBe("NO_CONTINUAR");
  });
});

describe("validateAIResponse", () => {
  const validResponse = {
    attitudeScore: 85,
    responsibilityScore: 75,
    technicalScore: 70,
    totalScore: 999, // should be recalculated
    suggestedDecision: "PRESELECCIONAR",
    redFlags: ["Justifica tardanzas"],
    summary: "Candidato con buena actitud.",
    rationale: "Demuestra orientación al servicio.",
    confidence: 0.85,
    requiresHumanReview: false,
  };

  it("should validate and recalculate totalScore", () => {
    const result = validateAIResponse(validResponse);
    // 85*0.45 + 75*0.40 + 70*0.15 = 38.25 + 30 + 10.5 = 78.75 → 79
    expect(result.totalScore).toBe(79);
  });

  it("should override suggestedDecision based on server-side rules", () => {
    const result = validateAIResponse(validResponse);
    expect(result.suggestedDecision).toBe("BASE_DE_DATOS"); // 79 → BASE_DE_DATOS
  });

  it("should reject when scores are out of range", () => {
    expect(() =>
      validateAIResponse({ ...validResponse, attitudeScore: -1 })
    ).toThrow();
    expect(() =>
      validateAIResponse({ ...validResponse, attitudeScore: 101 })
    ).toThrow();
  });

  it("should reject when redFlags is not an array", () => {
    expect(() =>
      validateAIResponse({ ...validResponse, redFlags: "not array" })
    ).toThrow();
  });

  it("should reject when summary is empty", () => {
    expect(() =>
      validateAIResponse({ ...validResponse, summary: "" })
    ).toThrow();
  });

  it("should set requiresHumanReview when confidence < 0.6", () => {
    const result = validateAIResponse({ ...validResponse, confidence: 0.5 });
    expect(result.requiresHumanReview).toBe(true);
  });

  it("should set requiresHumanReview when 3+ redFlags", () => {
    const result = validateAIResponse({
      ...validResponse,
      redFlags: ["flag1", "flag2", "flag3"],
    });
    expect(result.requiresHumanReview).toBe(true);
  });

  it("should reject null/undefined input", () => {
    expect(() => validateAIResponse(null)).toThrow();
    expect(() => validateAIResponse(undefined)).toThrow();
  });
});
