"use client";

import { useState, useRef, useCallback } from "react";
import { getInterviewSteps } from "@/domain/interview-questions";
import { useToast } from "@/components/ui/toast";
import { StepIndicator } from "@/components/interview/step-indicator";
import { PhotoUpload } from "@/components/interview/photo-upload";
import type { Question } from "@/domain/interview-questions";
import type { Position } from "@/domain/types";

type FormData = Record<string, Record<string, unknown>>;

const INITIAL_DATA: FormData = {
  intro: {},
  basic: {
    fullName: "",
    phone: "",
    email: "",
    positionApplied: "",
    birthDate: "",
    neighborhood: "",
    maritalStatus: "",
    hasChildren: null,
    numberOfChildren: "",
    hasExperience: null,
    experienceDetails: "",
    photoToken: null,
  },
  availability: {
    canWorkWeekends: null,
    canWorkHolidays: null,
    flexibleSchedule: null,
    availableShifts: [],
    startDate: "",
    hasOtherJob: null,
    otherJobDetails: "",
    transportMethod: "",
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
};

const STEP_SHORT_TITLES = ["Inicio", "Datos", "Disp.", "Motiv.", "Resp.", "Escen.", "Técn.", "Conf."];

export default function AplicarPage() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(Date.now());

  const position = formData.basic.positionApplied as Position | "";
  const steps = getInterviewSteps(position ? (position as Position) : undefined);
  const step = steps[currentStep];

  const stepInfos = steps.map((s, i) => ({
    id: s.id,
    title: s.title,
    shortTitle: STEP_SHORT_TITLES[i] || s.title.slice(0, 5),
  }));

  const updateField = useCallback(
    (section: string, field: string, value: unknown) => {
      setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  function isQuestionVisible(q: Question): boolean {
    if (!q.conditional) return true;
    const sectionData = formData[step.id] || {};
    return sectionData[q.conditional.field] === q.conditional.value;
  }

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};
    const sectionData = formData[step.id] || {};

    for (const q of step.questions) {
      if (!isQuestionVisible(q)) continue;
      if (!q.required) continue;

      const val = sectionData[q.id];

      if (q.type === "text" || q.type === "textarea") {
        if (!val || (typeof val === "string" && val.trim() === "")) {
          newErrors[q.id] = "Este campo es obligatorio";
        } else if (q.maxLength && typeof val === "string" && val.length > q.maxLength) {
          newErrors[q.id] = `Máximo ${q.maxLength} caracteres`;
        }
      } else if (q.type === "number") {
        const num = typeof val === "string" ? parseInt(val, 10) : val;
        if (num == null || isNaN(num as number)) {
          newErrors[q.id] = "Este campo es obligatorio";
        } else if (q.min != null && (num as number) < q.min) {
          newErrors[q.id] = `Mínimo ${q.min}`;
        } else if (q.max != null && (num as number) > q.max) {
          newErrors[q.id] = `Máximo ${q.max}`;
        }
      } else if (q.type === "select") {
        if (!val) newErrors[q.id] = "Selecciona una opción";
      } else if (q.type === "multiselect") {
        if (!Array.isArray(val) || val.length === 0) {
          newErrors[q.id] = "Selecciona al menos una opción";
        }
      } else if (q.type === "boolean") {
        if (val === null || val === undefined) {
          newErrors[q.id] = "Este campo es obligatorio";
        }
      } else if (q.type === "date") {
        if (!val || (typeof val === "string" && val.trim() === "")) {
          newErrors[q.id] = "Este campo es obligatorio";
        }
      } else if (q.type === "checkbox") {
        if (val !== true) newErrors[q.id] = "Debes aceptar para continuar";
      }
    }

    // Phone validation
    if (step.id === "basic" && !newErrors.phone) {
      const phone = (sectionData.phone as string) || "";
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) {
        newErrors.phone = "Número de teléfono inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo(0, 0);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setSubmitting(true);

    const completionTimeSeconds = Math.round(
      (Date.now() - startTimeRef.current) / 1000
    );

    const basicData = formData.basic;
    const answers = {
      schemaVersion: "2.0",
      basic: {
        ...basicData,
        numberOfChildren: basicData.hasChildren ? (typeof basicData.numberOfChildren === "string" ? parseInt(basicData.numberOfChildren as string, 10) : basicData.numberOfChildren) : 0,
        email: (basicData.email as string) || undefined,
        restaurantId: undefined,
      },
      availability: formData.availability,
      motivation: formData.motivation,
      responsibility: formData.responsibility,
      scenarios: formData.scenarios,
      technical: formData.technical,
      consent: formData.consent,
    };

    try {
      const photoToken = formData.basic.photoToken as string | null;
      const res = await fetch("/api/aplicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, completionTimeSeconds, photoToken: photoToken || undefined }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            fieldErrors[err.field] = err.message;
          }
          setErrors(fieldErrors);
        } else {
          showToast(data.error || "Error al enviar la entrevista", "error");
        }
      }
    } catch {
      showToast("Error de conexión. Verifica tu internet e intenta de nuevo. Si persiste, escríbenos a laglorietarest@gmail.com", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950" />
        <div className="relative z-10 w-full max-w-md animate-slide-up rounded-card bg-white p-8 text-center shadow-elevated">
          {/* Animated checkmark */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
            <svg className="h-10 w-10 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            ¡Gracias por aplicar!
          </h1>
          <p className="text-gray-600">
            Tu entrevista ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.
          </p>
          <p className="mt-6 text-sm text-gray-400">
            La Glorieta | Salom&eacute; Restaurante | Salom&eacute; Helader&iacute;a &mdash; Guaduas, Cundinamarca
          </p>
          <p className="mt-3 text-xs text-gray-400">
            ¿Tienes alguna pregunta? Escr&iacute;benos a{" "}
            <a href="mailto:laglorietarest@gmail.com" className="text-primary-400 underline">laglorietarest@gmail.com</a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <span className="text-xl">🍽️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">La Glorieta y Salomé</h1>
          <p className="text-sm text-gray-500">Proceso de Selección</p>
        </div>

        {/* Step indicator */}
        <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label={`Paso ${currentStep + 1} de ${steps.length}: ${step.title}`}>
          <StepIndicator steps={stepInfos} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div key={currentStep} className="animate-slide-up rounded-card border-t-4 border-primary-500 bg-white p-6 shadow-card">
          <h2 className="mb-1 text-xl font-semibold text-gray-900">
            {step.title}
          </h2>
          <p className="mb-6 text-sm text-gray-500">{step.description}</p>

          {step.questions.length === 0 && step.id === "intro" ? (
            <div className="space-y-4 text-sm text-gray-600">
              <p className="font-medium text-gray-800">Nuestro proceso funciona así:</p>
              <ol className="list-inside list-decimal space-y-2">
                <li>Completas esta entrevista virtual (~15 min)</li>
                <li>Evaluamos tus respuestas</li>
                <li>Si pasas, te citamos a entrevista personal</li>
                <li>Decisión final y contratación</li>
              </ol>
              <div className="rounded-lg bg-primary-50 p-4 text-primary-800">
                <p className="font-medium">Responde con honestidad y detalle.</p>
                <p className="mt-1 text-primary-700">No hay respuestas &quot;correctas&quot;, pero respuestas genuinas y completas nos ayudan a conocerte mejor.</p>
              </div>
              <p className="text-xs text-gray-400">Tus datos son confidenciales y se usan exclusivamente para este proceso de selección.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {step.questions.map((q) => {
                if (!isQuestionVisible(q)) return null;
                return (
                  <QuestionField
                    key={q.id}
                    question={q}
                    value={(formData[step.id] || {})[q.id]}
                    error={errors[q.id]}
                    onChange={(val) => updateField(step.id, q.id, val)}
                  />
                );
              })}
              {step.id === "basic" && (
                <>
                  <PhotoUpload
                    currentToken={formData.basic.photoToken as string | null}
                    onUploaded={(token) => updateField("basic", "photoToken", token)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Anterior
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98]"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Enviar Entrevista"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function QuestionField({
  question: q,
  value,
  error,
  onChange,
}: {
  question: Question;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
}) {
  const baseInputClass =
    "w-full rounded-lg border px-3 py-2.5 text-gray-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20";
  const errorClass = error ? "border-red-400" : "border-gray-200 ring-1 ring-gray-100";

  if (q.type === "text") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1 block text-sm font-medium text-gray-700">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          className={`${baseInputClass} ${errorClass}`}
        />
        {q.maxLength && <CharCount current={((value as string) || "").length} max={q.maxLength} />}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "textarea") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1 block text-sm font-medium text-gray-700">{q.label}</label>
        <textarea
          id={`q-${q.id}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          rows={4}
          className={`${baseInputClass} ${errorClass} resize-none`}
        />
        {q.maxLength && <CharCount current={((value as string) || "").length} max={q.maxLength} />}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "number") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1 block text-sm font-medium text-gray-700">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value)}
          min={q.min}
          max={q.max}
          className={`${baseInputClass} ${errorClass}`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "select") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1 block text-sm font-medium text-gray-700">{q.label}</label>
        <select
          id={`q-${q.id}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInputClass} ${errorClass}`}
        >
          <option value="">Seleccionar...</option>
          {q.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {q.hint && <p className="mt-1 text-xs text-gray-400">{q.hint}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "multiselect") {
    const selected = (value as string[]) || [];
    return (
      <div>
        <label id={`q-${q.id}`} className="mb-2 block text-sm font-medium text-gray-700">{q.label}</label>
        <div className="space-y-2" aria-labelledby={`q-${q.id}`}>
          {q.options?.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                selected.includes(opt.value)
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500/20"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selected, opt.value]);
                  } else {
                    onChange(selected.filter((v) => v !== opt.value));
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "boolean") {
    return (
      <div>
        <label id={`q-${q.id}`} className="mb-2 block text-sm font-medium text-gray-700">{q.label}</label>
        <div className="flex gap-3" role="group" aria-labelledby={`q-${q.id}`}>
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              value === true
                ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-500/20"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Sí
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              value === false
                ? "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-400/20"
                : "border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            No
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "date") {
    // Max date = 16 years ago (minimum working age)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 16);
    const maxDateStr = maxDate.toISOString().split("T")[0];
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1 block text-sm font-medium text-gray-700">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          max={maxDateStr}
          className={`${baseInputClass} ${errorClass}`}
        />
        {q.hint && <p className="mt-1 text-xs text-gray-400">{q.hint}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (q.type === "checkbox") {
    return (
      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">{q.label}</span>
        </label>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return null;
}

function CharCount({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max * 0.9;
  return (
    <p className={`mt-0.5 text-right text-xs ${isNearLimit ? "text-orange-500" : "text-gray-400"}`}>
      {current}/{max}
    </p>
  );
}
