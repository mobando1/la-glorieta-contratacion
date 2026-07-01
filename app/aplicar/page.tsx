"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getInterviewSteps } from "@/domain/interview-questions";
import { useToast } from "@/components/ui/toast";
import { StepIndicator } from "@/components/interview/step-indicator";
import { PhotoUpload } from "@/components/interview/photo-upload";
import { BrandBackdrop } from "@/components/brand/brand-backdrop";
import { LogoPlaque } from "@/components/brand/logo-plaque";
import type { Question } from "@/domain/interview-questions";
import type { Position } from "@/domain/types";

type FormData = Record<string, Record<string, unknown>>;

const STORAGE_KEY = "entrevista-draft";

function loadDraft(): { formData: FormData; currentStep: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.formData === "object" && typeof parsed.currentStep === "number") {
      return { formData: parsed.formData, currentStep: parsed.currentStep };
    }
  } catch {
    // Corrupt data — ignore
  }
  return null;
}

function saveDraft(formData: FormData, currentStep: number) {
  try {
    // Exclude photoToken since blob URLs may expire
    const dataToSave = {
      ...formData,
      basic: { ...formData.basic, photoToken: null },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData: dataToSave, currentStep }));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

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
  // Start from server-rendered defaults; hydrate any saved draft after mount to
  // avoid an SSR/CSR hydration mismatch.
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const startTimeRef = useRef(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstStepRender = useRef(true);

  // Restore any saved draft once, after mount.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setFormData({ ...INITIAL_DATA, ...draft.formData });
      setCurrentStep(draft.currentStep);
      setRestoredDraft(true);
    }
    setHydrated(true);
  }, []);

  // Auto-save form progress to localStorage (only after the draft has hydrated,
  // so we never clobber a saved draft with the initial defaults).
  useEffect(() => {
    if (!hydrated || submitted) return;
    const timer = setTimeout(() => {
      saveDraft(formData, currentStep);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData, currentStep, submitted, hydrated]);

  // Move focus to the new step's heading so keyboard / screen-reader users land
  // on the freshly rendered step instead of a now-unmounted button.
  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [currentStep]);

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
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const data = await res.json();
        if (data.errors) {
          const fieldErrors: Record<string, string> = {};
          for (const err of data.errors) {
            fieldErrors[err.field] = err.message;
          }
          setErrors(fieldErrors);
        } else {
          showToast((data.error || "Error al enviar la entrevista") + ". Si necesitas ayuda, escríbenos a laglorietarest@gmail.com", "error");
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
      <main className="relative flex min-h-[100dvh] items-center justify-center px-5 py-12 text-cream">
        <BrandBackdrop variant="dark" />
        <div className="relative z-10 w-full max-w-md animate-rise-in text-center">
          {/* Drawing checkmark */}
          <div className="relative mx-auto mb-7 flex h-20 w-20 items-center justify-center">
            <div
              aria-hidden="true"
              className="animate-glow-pulse absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklch, var(--color-accent-400) 45%, transparent), transparent 70%)",
                filter: "blur(12px)",
              }}
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cream shadow-elevated">
              <svg className="h-10 w-10 text-primary-700" fill="none" viewBox="0 0 24 24" strokeWidth={2.6} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                  pathLength={1}
                  strokeDasharray={1}
                  className="animate-draw"
                  style={{ ["--draw-len" as string]: 1, animationDelay: "300ms" }}
                />
              </svg>
            </div>
          </div>

          <p className="eyebrow text-accent-300">Solicitud recibida</p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl">
            ¡Gracias por aplicar!
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-pretty text-[15px] leading-relaxed text-cream-soft">
            Recibimos tu entrevista y la revisaremos con cuidado. Nos pondremos en contacto contigo
            pronto.
          </p>

          <div aria-hidden="true" className="mx-auto mt-8 h-px w-20 bg-cream-soft/25" />
          <p className="mt-6 font-serif text-sm italic text-cream-soft/85">
            La Glorieta · Salom&eacute; — Guaduas, Cundinamarca
          </p>
          <p className="mt-2 text-xs text-cream-soft/65">
            ¿Alguna pregunta? Escr&iacute;benos a{" "}
            <a href="mailto:laglorietarest@gmail.com" className="link-underline font-medium text-cream-soft">
              laglorietarest@gmail.com
            </a>
          </p>
          <a href="/" className="link-underline mt-7 inline-block text-sm font-medium text-cream-soft/80 hover:text-cream">
            Volver al inicio
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-canvas px-4 py-8 sm:py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3">
            <LogoPlaque src="/logos/la-glorieta.jpg" alt="La Glorieta Restaurante — desde 1960" className="h-12 w-20" priority />
            <span className="font-serif text-lg italic text-ink-mute" aria-hidden="true">y</span>
            <LogoPlaque src="/logos/salome.png" alt="Salomé — momentos · restó · café" className="h-12 w-20" priority />
          </div>
          <p className="eyebrow text-accent-700">Proceso de selección</p>
          <h1 className="mt-1.5 font-serif text-2xl font-semibold text-ink">La Glorieta y Salomé</h1>
        </div>

        {/* Restored draft banner */}
        {restoredDraft && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
            <p className="text-sm text-primary-800">
              Encontramos tu progreso anterior. Puedes continuar donde lo dejaste.
            </p>
            <div className="ml-3 flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setFormData(INITIAL_DATA);
                  setCurrentStep(0);
                  setRestoredDraft(false);
                  setErrors({});
                }}
                className="text-xs font-medium text-primary-600 underline hover:text-primary-800"
              >
                Empezar de nuevo
              </button>
              <button
                type="button"
                onClick={() => setRestoredDraft(false)}
                className="text-primary-400 hover:text-primary-600"
                aria-label="Cerrar"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length} aria-label={`Paso ${currentStep + 1} de ${steps.length}: ${step.title}`}>
          <StepIndicator steps={stepInfos} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div key={currentStep} className="animate-rise-in rounded-card border border-line bg-surface p-6 shadow-card sm:p-7">
          {/* tabIndex + focus() on step change repositions keyboard/SR users to the
              new step; the heading isn't an operable control, so we suppress its ring. */}
          <h2 ref={headingRef} tabIndex={-1} style={{ outline: "none" }} className="mb-1 font-serif text-xl font-semibold text-ink sm:text-2xl">
            {step.title}
          </h2>
          <p className="mb-6 text-sm text-ink-soft">{step.description}</p>

          {step.questions.length === 0 && step.id === "intro" ? (
            <div className="space-y-4 text-sm text-ink-soft">
              <p className="font-medium text-ink">Nuestro proceso funciona así:</p>
              <ol className="space-y-2.5">
                {[
                  "Completas esta entrevista virtual (~15 min)",
                  "Evaluamos tus respuestas",
                  "Si pasas, te citamos a entrevista personal",
                  "Decisión final y contratación",
                ].map((txt, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 font-serif text-xs font-bold text-primary-700">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{txt}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-field bg-primary-50 p-4 text-primary-800 ring-1 ring-primary-100">
                <p className="font-medium">Responde con honestidad y detalle.</p>
                <p className="mt-1 text-primary-700">No hay respuestas &quot;correctas&quot;, pero respuestas genuinas y completas nos ayudan a conocerte mejor.</p>
              </div>
              <p className="text-xs text-ink-mute">Tus datos son confidenciales y se usan exclusivamente para este proceso de selección.</p>
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
              className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-field border border-line bg-surface px-4 font-medium text-ink-soft transition-colors hover:border-line-strong hover:bg-canvas-deep"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              Anterior
            </button>
          )}
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="group flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-field bg-primary-700 font-semibold text-cream shadow-button transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-button-hover active:translate-y-0 active:scale-[0.99]"
            >
              Siguiente
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-field bg-primary-700 font-semibold text-cream shadow-button transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-button-hover active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enviando…
                </>
              ) : (
                <>
                  Enviar entrevista
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </>
              )}
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
    "w-full rounded-field border bg-surface px-3.5 py-3 text-[15px] text-ink placeholder-ink-mute/60 shadow-field transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25";
  const errorClass = error ? "border-accent-400 ring-1 ring-accent-400/30" : "border-line hover:border-line-strong";
  const errId = `q-${q.id}-error`;
  // aria wiring shared by native inputs
  const invalidProps = { "aria-invalid": error ? true : undefined, "aria-describedby": error ? errId : undefined };
  const ErrorText = () =>
    error ? (
      <p id={errId} role="alert" className="mt-1.5 text-sm text-accent-700">
        {error}
      </p>
    ) : null;

  if (q.type === "text") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block text-sm font-medium text-ink">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          {...invalidProps}
          className={`${baseInputClass} ${errorClass}`}
        />
        {q.maxLength && <CharCount current={((value as string) || "").length} max={q.maxLength} />}
        <ErrorText />
      </div>
    );
  }

  if (q.type === "textarea") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block text-sm font-medium text-ink">{q.label}</label>
        <textarea
          id={`q-${q.id}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          maxLength={q.maxLength}
          rows={4}
          {...invalidProps}
          className={`${baseInputClass} ${errorClass} resize-none`}
        />
        {q.maxLength && <CharCount current={((value as string) || "").length} max={q.maxLength} />}
        <ErrorText />
      </div>
    );
  }

  if (q.type === "number") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block text-sm font-medium text-ink">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value)}
          min={q.min}
          max={q.max}
          {...invalidProps}
          className={`${baseInputClass} ${errorClass}`}
        />
        <ErrorText />
      </div>
    );
  }

  if (q.type === "select") {
    return (
      <div>
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block text-sm font-medium text-ink">{q.label}</label>
        <select
          id={`q-${q.id}`}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          {...invalidProps}
          className={`${baseInputClass} ${errorClass}`}
        >
          <option value="">Seleccionar...</option>
          {q.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {q.hint && <p className="mt-1.5 text-xs text-ink-mute">{q.hint}</p>}
        <ErrorText />
      </div>
    );
  }

  if (q.type === "multiselect") {
    const selected = (value as string[]) || [];
    return (
      <div>
        <label id={`q-${q.id}`} className="mb-2 block text-sm font-medium text-ink">{q.label}</label>
        <div
          className="space-y-2"
          role="group"
          aria-labelledby={`q-${q.id}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
        >
          {q.options?.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-center gap-3 rounded-field border px-3.5 py-3 transition-all ${
                selected.includes(opt.value)
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500/20"
                  : "border-line hover:bg-canvas-deep"
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
                className="h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-ink-soft">{opt.label}</span>
            </label>
          ))}
        </div>
        <ErrorText />
      </div>
    );
  }

  if (q.type === "boolean") {
    return (
      <div>
        <label id={`q-${q.id}`} className="mb-2 block text-sm font-medium text-ink">{q.label}</label>
        <div
          className="flex gap-3"
          role="group"
          aria-labelledby={`q-${q.id}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errId : undefined}
        >
          <button
            type="button"
            onClick={() => onChange(true)}
            aria-pressed={value === true}
            className={`flex flex-1 items-center justify-center gap-2 rounded-field border px-4 py-3 text-sm font-medium transition-all ${
              value === true
                ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-500/20"
                : "border-line text-ink-soft hover:bg-canvas-deep hover:border-line-strong"
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
            aria-pressed={value === false}
            className={`flex flex-1 items-center justify-center gap-2 rounded-field border px-4 py-3 text-sm font-medium transition-all ${
              value === false
                ? "border-accent-400 bg-accent-100 text-accent-700 ring-1 ring-accent-400/25"
                : "border-line text-ink-soft hover:bg-canvas-deep hover:border-line-strong"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            No
          </button>
        </div>
        <ErrorText />
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
        <label htmlFor={`q-${q.id}`} className="mb-1.5 block text-sm font-medium text-ink">{q.label}</label>
        <input
          id={`q-${q.id}`}
          type="date"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          max={maxDateStr}
          {...invalidProps}
          className={`${baseInputClass} ${errorClass}`}
        />
        {q.hint && <p className="mt-1.5 text-xs text-ink-mute">{q.hint}</p>}
        <ErrorText />
      </div>
    );
  }

  if (q.type === "checkbox") {
    return (
      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-field border border-line px-4 py-3 transition-colors hover:bg-canvas-deep">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            {...invalidProps}
            className="mt-0.5 h-4 w-4 rounded border-line-strong text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-ink-soft">{q.label}</span>
        </label>
        <ErrorText />
      </div>
    );
  }

  return null;
}

function CharCount({ current, max }: { current: number; max: number }) {
  const isNearLimit = current > max * 0.9;
  return (
    <p className={`mt-1 text-right text-xs ${isNearLimit ? "text-accent-600" : "text-ink-mute"}`}>
      {current}/{max}
    </p>
  );
}
