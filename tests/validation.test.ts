import {
  validateBasic,
  validateConsent,
  normalizePhone,
  validateFullInterview,
} from "@/domain/validation";
import type { InterviewAnswers } from "@/domain/types";

describe("validateBasic", () => {
  it("should pass with valid data", () => {
    const errors = validateBasic({
      fullName: "Juan Pérez",
      phone: "3101234567",
      positionApplied: "MESERO",
      age: 25,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors).toHaveLength(0);
  });

  it("should require fullName", () => {
    const errors = validateBasic({
      fullName: "",
      phone: "3101234567",
      positionApplied: "MESERO",
      age: 25,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors.some((e) => e.field === "fullName")).toBe(true);
  });

  it("should validate phone format", () => {
    const errors = validateBasic({
      fullName: "Juan",
      phone: "123",
      positionApplied: "MESERO",
      age: 25,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors.some((e) => e.field === "phone")).toBe(true);
  });

  it("should validate position", () => {
    const errors = validateBasic({
      fullName: "Juan",
      phone: "3101234567",
      positionApplied: "INVALID" as never,
      age: 25,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors.some((e) => e.field === "positionApplied")).toBe(true);
  });

  it("should validate age range", () => {
    const errors1 = validateBasic({
      fullName: "Juan",
      phone: "3101234567",
      positionApplied: "MESERO",
      age: 15,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors1.some((e) => e.field === "age")).toBe(true);

    const errors2 = validateBasic({
      fullName: "Juan",
      phone: "3101234567",
      positionApplied: "MESERO",
      age: 71,
      neighborhood: "Centro",
      hasExperience: false,
      experienceDetails: "",
    });
    expect(errors2.some((e) => e.field === "age")).toBe(true);
  });

  it("should require experienceDetails when hasExperience is true", () => {
    const errors = validateBasic({
      fullName: "Juan",
      phone: "3101234567",
      positionApplied: "MESERO",
      age: 25,
      neighborhood: "Centro",
      hasExperience: true,
      experienceDetails: "",
    });
    expect(errors.some((e) => e.field === "experienceDetails")).toBe(true);
  });
});

describe("validateConsent", () => {
  it("should require both checkboxes", () => {
    const errors = validateConsent({
      dataProcessingAccepted: false,
      informationTruthful: false,
    });
    expect(errors).toHaveLength(2);
  });

  it("should pass when both accepted", () => {
    const errors = validateConsent({
      dataProcessingAccepted: true,
      informationTruthful: true,
    });
    expect(errors).toHaveLength(0);
  });
});

describe("normalizePhone", () => {
  it("should strip non-digit characters", () => {
    expect(normalizePhone("310-123-4567")).toBe("3101234567");
    expect(normalizePhone("+57 310 123 4567")).toBe("573101234567");
    expect(normalizePhone("(310) 123-4567")).toBe("3101234567");
  });
});

describe("validateFullInterview", () => {
  it("should catch errors across all sections", () => {
    const emptyAnswers = {
      schemaVersion: "1.0",
      basic: {
        fullName: "",
        phone: "",
        positionApplied: "" as never,
        age: null,
        neighborhood: "",
        hasExperience: false,
        experienceDetails: "",
      },
      availability: {
        canWorkWeekends: false,
        canWorkHolidays: false,
        availableShifts: [],
        startDate: "",
        hasOtherJob: false,
        otherJobDetails: "",
      },
      motivation: {
        whyThisJob: "",
        whatDoYouKnowAboutUs: "",
        whereDoYouSeeYourself: "",
        whatMotivatesYou: "",
      },
      responsibility: {
        lastJobLeaveReason: "",
        howDoYouHandlePressure: "",
        lateArrivalFrequency: "",
        howDoYouReactToCorrection: "",
        describeResponsibleMoment: "",
      },
      scenarios: {
        angryCustomer: "",
        teamConflict: "",
        forgotTask: "",
        peakHourChaos: "",
      },
      technical: {},
      consent: {
        dataProcessingAccepted: false,
        informationTruthful: false,
      },
    } as InterviewAnswers;

    const errors = validateFullInterview(emptyAnswers);
    expect(errors.length).toBeGreaterThan(0);
  });
});
