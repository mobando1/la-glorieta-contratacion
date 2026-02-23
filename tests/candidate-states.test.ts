import { canTransition, validateTransition } from "@/domain/candidate-states";

describe("canTransition", () => {
  it("should allow NUEVO → PENDIENTE_EVALUACION", () => {
    expect(canTransition("NUEVO", "PENDIENTE_EVALUACION")).toBe(true);
  });

  it("should allow PENDIENTE_EVALUACION → EVALUADO", () => {
    expect(canTransition("PENDIENTE_EVALUACION", "EVALUADO")).toBe(true);
  });

  it("should allow EVALUADO → PRESELECCIONADO", () => {
    expect(canTransition("EVALUADO", "PRESELECCIONADO")).toBe(true);
  });

  it("should allow EVALUADO → BASE_DE_DATOS", () => {
    expect(canTransition("EVALUADO", "BASE_DE_DATOS")).toBe(true);
  });

  it("should allow EVALUADO → NO_CONTINUAR", () => {
    expect(canTransition("EVALUADO", "NO_CONTINUAR")).toBe(true);
  });

  it("should NOT allow NUEVO → EVALUADO (skip)", () => {
    expect(canTransition("NUEVO", "EVALUADO")).toBe(false);
  });

  it("should NOT allow going back to NUEVO", () => {
    expect(canTransition("PENDIENTE_EVALUACION", "NUEVO")).toBe(false);
    expect(canTransition("EVALUADO", "NUEVO")).toBe(false);
  });

  it("should NOT allow transitions from NO_CONTINUAR", () => {
    expect(canTransition("NO_CONTINUAR", "EVALUADO")).toBe(false);
    expect(canTransition("NO_CONTINUAR", "PRESELECCIONADO")).toBe(false);
  });

  it("should allow PRESELECCIONADO → CITADO_ENTREVISTA", () => {
    expect(canTransition("PRESELECCIONADO", "CITADO_ENTREVISTA")).toBe(true);
  });

  it("should allow PRESELECCIONADO → BASE_DE_DATOS", () => {
    expect(canTransition("PRESELECCIONADO", "BASE_DE_DATOS")).toBe(true);
  });

  it("should NOT allow PRESELECCIONADO → CONTRATADO directly", () => {
    expect(canTransition("PRESELECCIONADO", "CONTRATADO")).toBe(false);
  });

  it("should allow full personal interview flow", () => {
    expect(canTransition("CITADO_ENTREVISTA", "ENTREVISTA_REALIZADA")).toBe(true);
    expect(canTransition("ENTREVISTA_REALIZADA", "EVALUANDO_ENTREVISTA")).toBe(true);
    expect(canTransition("EVALUANDO_ENTREVISTA", "EVALUADO_ENTREVISTA")).toBe(true);
    expect(canTransition("EVALUADO_ENTREVISTA", "CONTRATADO")).toBe(true);
  });

  it("should allow EVALUADO_ENTREVISTA → BASE_DE_DATOS", () => {
    expect(canTransition("EVALUADO_ENTREVISTA", "BASE_DE_DATOS")).toBe(true);
  });

  it("should allow BASE_DE_DATOS → PRESELECCIONADO", () => {
    expect(canTransition("BASE_DE_DATOS", "PRESELECCIONADO")).toBe(true);
  });
});

describe("validateTransition", () => {
  it("should not throw for valid transitions", () => {
    expect(() => validateTransition("NUEVO", "PENDIENTE_EVALUACION")).not.toThrow();
  });

  it("should throw for invalid transitions", () => {
    expect(() => validateTransition("NUEVO", "EVALUADO")).toThrow(
      "Transición de estado inválida"
    );
  });
});
