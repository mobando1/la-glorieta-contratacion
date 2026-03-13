"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { POSITION_LABELS, STATUS_LABELS, MARITAL_STATUS_LABELS } from "@/domain/types";
import type { MaritalStatus } from "@/domain/types";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/badges";
import { PersonalInterviewForm } from "@/components/admin/personal-interview-form";
import { calculateCombinedScore } from "@/domain/personal-scoring";
import { WhatsAppShareButton } from "@/components/admin/whatsapp-share";
import { EmailDraftModal } from "@/components/admin/email-draft-modal";
import type { Position, CandidateStatus, InterviewAnswers, AdminObservations, PersonalInterviewAnswers } from "@/domain/types";

interface CandidateDetail {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  positionApplied: string;
  status: string;
  createdAt: string;
  notesAdmin: string | null;
  photoPath: string | null;
  restaurant: { id: string; name: string } | null;
}

interface EvaluationDetail {
  attitudeScore: number;
  responsibilityScore: number;
  technicalScore: number;
  totalScore: number;
  suggestedDecision: string;
  redFlags: string[];
  summary: string;
  rationale: string;
  confidence: number | null;
  requiresHumanReview: boolean;
  modelVersion: string;
  createdAt: string;
}

interface DecisionDetail {
  decision: string;
  notes: string | null;
  overrideReason: string | null;
  createdAt: string;
}

interface DuplicateInfo {
  id: string;
  fullName: string;
  positionApplied: string;
  status: string;
  createdAt: string;
}

interface PersonalInterviewDetail {
  id: string;
  adminObservations: AdminObservations;
  answers: PersonalInterviewAnswers;
  scheduledAt: string | null;
  conductedAt: string | null;
  isComplete: boolean;
}

type Tab = "resumen" | "entrevista" | "personal" | "decision";

export default function CandidatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [interview, setInterview] = useState<{ answers: InterviewAnswers } | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [personalInterview, setPersonalInterview] = useState<PersonalInterviewDetail | null>(null);
  const [personalEvaluation, setPersonalEvaluation] = useState<EvaluationDetail | null>(null);
  const [decisions, setDecisions] = useState<DecisionDetail[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("resumen");

  // Decision form
  const [selectedDecision, setSelectedDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Schedule / Personal interview
  const [scheduling, setScheduling] = useState(false);
  const [submittingInterview, setSubmittingInterview] = useState(false);
  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [finalDecision, setFinalDecision] = useState("");
  const [finalNotes, setFinalNotes] = useState("");

  // Email draft flow
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [emailDecision, setEmailDecision] = useState("");
  const [showFinalEmailDraft, setShowFinalEmailDraft] = useState(false);
  const [finalEmailDecision, setFinalEmailDecision] = useState("");

  // Hire action
  const [generatingLink, setGeneratingLink] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/candidates/${id}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (res.status === 404) { router.push("/admin/candidatos"); return; }
      if (!res.ok) throw new Error("Error al cargar candidato");
      const data = await res.json();
      setCandidate(data.candidate);
      setInterview(data.interview);
      setEvaluation(data.evaluation);
      setPersonalInterview(data.personalInterview);
      setPersonalEvaluation(data.personalEvaluation);
      setDecisions(data.decisions);
      setDuplicates(data.duplicates);
    } catch {
      setError("No se pudo cargar el candidato. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision() {
    if (!selectedDecision) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/candidates/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: selectedDecision, notes, overrideReason }),
      });
      if (res.ok) {
        showToast("Decisión guardada correctamente", "success");
        setEmailDecision(selectedDecision);
        setShowEmailDraft(true);
        await fetchData();
        setSelectedDecision("");
        setNotes("");
        setOverrideReason("");
      } else {
        const data = await res.json();
        showToast(data.error || "Error al guardar decisión", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetryEvaluation() {
    if (!interview) return;
    setRetrying(true);
    try {
      await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: id,
          interviewId: (interview as Record<string, unknown>).id || id,
        }),
      });
      setTimeout(() => { fetchData(); setRetrying(false); }, 3000);
    } catch {
      setRetrying(false);
    }
  }

  async function handleGenerateLink() {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/admin/employees/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setOnboardingLink(data.onboardingUrl);
        showToast("Enlace de onboarding generado", "success");
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al generar enlace", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setGeneratingLink(false);
    }
  }

  function copyLink() {
    if (onboardingLink) {
      navigator.clipboard.writeText(onboardingLink);
      showToast("Enlace copiado al portapapeles", "success");
    }
  }

  async function handleScheduleInterview() {
    setScheduling(true);
    try {
      const res = await fetch(`/api/admin/candidates/${id}/schedule-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        showToast("Candidato citado a entrevista personal", "success");
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al citar a entrevista", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setScheduling(false);
    }
  }

  async function handleSubmitPersonalInterview(formData: { observations: Record<string, string>; answers: Record<string, string> }) {
    setSubmittingInterview(true);
    try {
      const res = await fetch(`/api/admin/candidates/${id}/personal-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        showToast("Entrevista personal guardada. Evaluación IA en progreso...", "success");
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || "Error al guardar entrevista", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSubmittingInterview(false);
    }
  }

  async function handleFinalDecision() {
    if (!finalDecision) return;
    setSubmittingFinal(true);
    try {
      const res = await fetch(`/api/admin/candidates/${id}/final-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: finalDecision, notes: finalNotes }),
      });
      if (res.ok) {
        showToast("Decisión final guardada", "success");
        setFinalEmailDecision(finalDecision);
        setShowFinalEmailDraft(true);
        await fetchData();
        setFinalDecision("");
        setFinalNotes("");
      } else {
        const data = await res.json();
        showToast(data.error || "Error al guardar decisión", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setSubmittingFinal(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-6 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-card bg-white p-5 shadow-card">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="space-y-3 rounded-card bg-white p-5 shadow-card">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  const isOverride =
    evaluation &&
    selectedDecision &&
    selectedDecision !== evaluation.suggestedDecision &&
    !(evaluation.suggestedDecision === "PRESELECCIONAR" && selectedDecision === "PRESELECCIONADO");

  const canDecide = ["EVALUADO", "PRESELECCIONADO", "BASE_DE_DATOS"].includes(candidate.status);

  const TABS: { key: Tab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "entrevista", label: "Entrevista Online" },
    { key: "personal", label: "Entrevista Personal" },
    { key: "decision", label: "Decisión" },
  ];

  const combinedScore = evaluation && personalEvaluation
    ? calculateCombinedScore(evaluation.totalScore, personalEvaluation.totalScore)
    : null;

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/candidatos"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          &larr; Candidatos
        </Link>
        <div className="mt-1 flex items-center gap-3">
          {candidate.photoPath ? (
            <img
              src={`/api/admin/candidates/${candidate.id}/photo`}
              alt={`Foto de ${candidate.fullName}`}
              className="h-20 w-20 rounded-full object-cover border-2 border-primary-200"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-200 bg-gray-200 text-xl font-semibold text-gray-500">
              {candidate.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={candidate.status} />
          <span className="text-sm text-gray-500">
            {POSITION_LABELS[candidate.positionApplied as Position]} &middot;{" "}
            {new Date(candidate.createdAt).toLocaleDateString("es-CO")}
          </span>
        </div>
      </div>

      {/* Action banners based on status */}
      {candidate.status === "PRESELECCIONADO" && (
        <div className="mb-6 rounded-card border border-primary-200 bg-primary-50 p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-primary-800">Candidato preseleccionado</h3>
              <p className="text-sm text-primary-600">Cita al candidato a una entrevista personal</p>
            </div>
            <button
              onClick={handleScheduleInterview}
              disabled={scheduling}
              className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50"
            >
              {scheduling ? "Citando..." : "Citar a Entrevista Personal"}
            </button>
          </div>
        </div>
      )}

      {/* CONTRATADO — generate onboarding or view */}
      {candidate.status === "CONTRATADO" && (
        <div className="mb-6 rounded-card border border-teal-200 bg-teal-50 p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-teal-800">Empleado contratado</h3>
              <p className="text-sm text-teal-600">Genera un enlace de onboarding para que suba sus documentos</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
              >
                {generatingLink ? "Generando..." : "Generar Enlace Onboarding"}
              </button>
              <Link
                href="/admin/personal"
                className="rounded-lg border border-teal-300 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                Ver Personal
              </Link>
            </div>
          </div>
          {onboardingLink && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-white p-3">
              <input
                type="text"
                readOnly
                value={onboardingLink}
                className="flex-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
              <button
                onClick={copyLink}
                className="rounded-lg bg-teal-100 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-200"
              >
                Copiar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === "resumen" && (
          <div className="space-y-6">
            {/* Info + Score overview */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-card bg-white p-5 shadow-card">
                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Información</h2>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Cargo</dt>
                    <dd className="font-medium">{POSITION_LABELS[candidate.positionApplied as Position]}</dd>
                  </div>
                  {candidate.restaurant && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Restaurante</dt>
                      <dd className="font-medium">{candidate.restaurant.name}</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-500">Teléfono</dt>
                    <dd className="flex items-center gap-2 font-medium">
                      {candidate.phone}
                      <WhatsAppShareButton
                        phone={candidate.phone}
                        candidateName={candidate.fullName}
                        status={candidate.status as CandidateStatus}
                        position={candidate.positionApplied as Position}
                        restaurantName={candidate.restaurant?.name}
                      />
                    </dd>
                  </div>
                  {candidate.email && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium">{candidate.email}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Fecha</dt>
                    <dd>{new Date(candidate.createdAt).toLocaleDateString("es-CO")}</dd>
                  </div>
                </dl>

                {duplicates.length > 0 && (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-500">
                      Otras aplicaciones con el mismo teléfono:
                    </p>
                    {duplicates.map((d) => (
                      <Link
                        key={d.id}
                        href={`/admin/candidatos/${d.id}`}
                        className="block text-sm text-primary-600 hover:underline"
                      >
                        {d.fullName} &mdash; {POSITION_LABELS[d.positionApplied as Position]} (
                        {new Date(d.createdAt).toLocaleDateString("es-CO")})
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {evaluation ? (
                <div className="rounded-card bg-white p-5 shadow-card">
                  <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Evaluación IA</h2>
                  {/* Score circle with conic-gradient */}
                  <div className="mb-4 flex justify-center">
                    <div
                      className="relative flex h-24 w-24 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${
                          evaluation.totalScore >= 80 ? "#16a34a" : evaluation.totalScore >= 65 ? "#eab308" : "#ef4444"
                        } ${evaluation.totalScore * 3.6}deg, #e5e7eb ${evaluation.totalScore * 3.6}deg)`,
                      }}
                    >
                      <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-white">
                        <span className="text-2xl font-bold text-gray-900">{evaluation.totalScore}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <ScoreBar label="Actitud" score={evaluation.attitudeScore} />
                    <ScoreBar label="Responsabilidad" score={evaluation.responsibilityScore} />
                    <ScoreBar label="Técnica" score={evaluation.technicalScore} />
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Sugerencia: {evaluation.suggestedDecision}
                    {evaluation.confidence !== null && ` (${Math.round(evaluation.confidence * 100)}% confianza)`}
                  </p>
                  {evaluation.requiresHumanReview && (
                    <div className="mt-3 rounded-lg bg-orange-50 p-3 text-sm text-orange-700">
                      Requiere revisión humana
                    </div>
                  )}
                </div>
              ) : candidate.status === "PENDIENTE_EVALUACION" ? (
                <div className="flex flex-col items-center justify-center rounded-card bg-white p-5 shadow-card">
                  <p className="mb-3 text-gray-500">Evaluación pendiente</p>
                  <button
                    onClick={handleRetryEvaluation}
                    disabled={retrying}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {retrying ? "Evaluando..." : "Reintentar evaluación"}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Red Flags */}
            {evaluation && evaluation.redFlags.length > 0 && (
              <div className="rounded-card bg-red-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-red-700">Red Flags</h3>
                <ul className="space-y-1">
                  {evaluation.redFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-600">&bull; {flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI Summary */}
            {evaluation && (
              <div className="rounded-card bg-white p-5 shadow-card">
                <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Resumen IA</h2>
                <p className="mb-4 text-sm text-gray-700">{evaluation.summary}</p>
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Ver razonamiento completo
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-gray-600">{evaluation.rationale}</p>
                </details>
              </div>
            )}
          </div>
        )}

        {activeTab === "entrevista" && interview && (
          <div className="rounded-card bg-white p-5 shadow-card">
            <InterviewAnswersView answers={interview.answers} />
          </div>
        )}

        {activeTab === "entrevista" && !interview && (
          <div className="rounded-card bg-white p-8 text-center shadow-card">
            <p className="text-gray-400">No hay entrevista registrada</p>
          </div>
        )}

        {activeTab === "personal" && (
          <div className="space-y-6">
            {/* Form for CITADO_ENTREVISTA */}
            {candidate.status === "CITADO_ENTREVISTA" && (
              <div className="rounded-card bg-white p-5 shadow-card">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Registrar Entrevista Personal</h2>
                <PersonalInterviewForm
                  position={candidate.positionApplied as Position}
                  onSubmit={handleSubmitPersonalInterview}
                  submitting={submittingInterview}
                />
              </div>
            )}

            {/* Processing states */}
            {(candidate.status === "ENTREVISTA_REALIZADA" || candidate.status === "EVALUANDO_ENTREVISTA") && (
              <div className="rounded-card bg-white p-8 text-center shadow-card">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                <p className="text-gray-600">Evaluando entrevista personal...</p>
                <button
                  onClick={fetchData}
                  className="mt-3 text-sm text-primary-600 hover:underline"
                >
                  Actualizar
                </button>
              </div>
            )}

            {/* Results: show personal eval + combined score */}
            {personalEvaluation && personalInterview?.isComplete && (
              <div className="space-y-6">
                {/* Combined score banner */}
                {combinedScore !== null && (
                  <div className="rounded-card bg-gradient-to-r from-primary-50 to-violet-50 p-5 shadow-card">
                    <h2 className="mb-3 text-center text-sm font-semibold uppercase text-gray-500">Score Combinado</h2>
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Online (40%)</p>
                        <p className="text-2xl font-bold text-primary-700">{evaluation?.totalScore ?? "—"}</p>
                      </div>
                      <div className="text-3xl text-gray-300">+</div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Personal (60%)</p>
                        <p className="text-2xl font-bold text-violet-700">{personalEvaluation.totalScore}</p>
                      </div>
                      <div className="text-3xl text-gray-300">=</div>
                      <div className="text-center">
                        <div
                          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                          style={{
                            background: `conic-gradient(${
                              combinedScore >= 80 ? "#16a34a" : combinedScore >= 65 ? "#eab308" : "#ef4444"
                            } ${combinedScore * 3.6}deg, #e5e7eb ${combinedScore * 3.6}deg)`,
                          }}
                        >
                          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white">
                            <span className="text-xl font-bold text-gray-900">{combinedScore}</span>
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Combinado</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal evaluation scores */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-card bg-white p-5 shadow-card">
                    <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Evaluación IA (Entrevista Personal)</h2>
                    <div className="mb-4 flex justify-center">
                      <div
                        className="relative flex h-24 w-24 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(${
                            personalEvaluation.totalScore >= 80 ? "#16a34a" : personalEvaluation.totalScore >= 65 ? "#eab308" : "#ef4444"
                          } ${personalEvaluation.totalScore * 3.6}deg, #e5e7eb ${personalEvaluation.totalScore * 3.6}deg)`,
                        }}
                      >
                        <div className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-white">
                          <span className="text-2xl font-bold text-gray-900">{personalEvaluation.totalScore}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <ScoreBar label="Actitud" score={personalEvaluation.attitudeScore} />
                      <ScoreBar label="Responsabilidad" score={personalEvaluation.responsibilityScore} />
                      <ScoreBar label="Técnica" score={personalEvaluation.technicalScore} />
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                      Sugerencia: {personalEvaluation.suggestedDecision}
                    </p>
                  </div>

                  <div className="rounded-card bg-white p-5 shadow-card">
                    <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">Observaciones del Entrevistador</h2>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Presentación personal</dt>
                        <dd className="font-medium">{personalInterview.adminObservations.presentacionPersonal}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Puntualidad</dt>
                        <dd className="font-medium">{personalInterview.adminObservations.puntualidad}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Comunicación verbal</dt>
                        <dd className="font-medium">{personalInterview.adminObservations.comunicacionVerbal}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Actitud y disposición</dt>
                        <dd className="font-medium">{personalInterview.adminObservations.actitudDisposicion}</dd>
                      </div>
                      {personalInterview.adminObservations.notasGenerales && (
                        <div className="mt-2 rounded-lg bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Notas:</p>
                          <p className="text-gray-700">{personalInterview.adminObservations.notasGenerales}</p>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* Personal eval red flags */}
                {personalEvaluation.redFlags.length > 0 && (
                  <div className="rounded-card bg-red-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-red-700">Red Flags (Entrevista Personal)</h3>
                    <ul className="space-y-1">
                      {personalEvaluation.redFlags.map((flag, i) => (
                        <li key={i} className="text-sm text-red-600">&bull; {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Personal eval summary */}
                <div className="rounded-card bg-white p-5 shadow-card">
                  <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Resumen IA (Entrevista Personal)</h2>
                  <p className="mb-4 text-sm text-gray-700">{personalEvaluation.summary}</p>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      Ver razonamiento completo
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-gray-600">{personalEvaluation.rationale}</p>
                  </details>
                </div>

                {/* Final decision for EVALUADO_ENTREVISTA */}
                {candidate.status === "EVALUADO_ENTREVISTA" && (
                  <div className="rounded-card bg-white p-5 shadow-card">
                    <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Decisión Final</h2>
                    <div className="mb-4 flex gap-2">
                      {["CONTRATADO", "BASE_DE_DATOS", "NO_CONTINUAR"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setFinalDecision(d)}
                          className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            finalDecision === d
                              ? d === "CONTRATADO"
                                ? "border-teal-600 bg-teal-50 text-teal-700"
                                : d === "BASE_DE_DATOS"
                                  ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                                  : "border-red-500 bg-red-50 text-red-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {STATUS_LABELS[d as CandidateStatus]}
                        </button>
                      ))}
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium text-gray-600">Notas (opcional)</label>
                      <textarea
                        value={finalNotes}
                        onChange={(e) => setFinalNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="Observaciones finales..."
                      />
                    </div>
                    <button
                      onClick={handleFinalDecision}
                      disabled={!finalDecision || submittingFinal}
                      className="w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {submittingFinal ? "Guardando..." : "Confirmar Decisión Final"}
                    </button>

                    {/* Email draft panel after final decision */}
                    {showFinalEmailDraft && candidate && (
                      <div className="mt-4">
                        <EmailDraftModal
                          candidateId={id}
                          candidateEmail={candidate.email}
                          decision={finalEmailDecision}
                          onSent={() => {
                            setShowFinalEmailDraft(false);
                            setFinalEmailDecision("");
                            showToast("Email enviado al candidato", "success");
                          }}
                          onClose={() => {
                            setShowFinalEmailDraft(false);
                            setFinalEmailDecision("");
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Not yet at personal interview stage */}
            {!["CITADO_ENTREVISTA", "ENTREVISTA_REALIZADA", "EVALUANDO_ENTREVISTA", "EVALUADO_ENTREVISTA", "CONTRATADO"].includes(candidate.status) && !personalInterview && (
              <div className="rounded-card bg-white p-8 text-center shadow-card">
                <p className="text-gray-400">La entrevista personal se habilita después de preseleccionar al candidato</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "decision" && (
          <div className="space-y-6">
            {/* Admin Decision */}
            {canDecide && (
              <div className="rounded-card bg-white p-5 shadow-card">
                <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">
                  Tomar Decisión
                </h2>
                <div className="mb-4 flex gap-2">
                  {["PRESELECCIONADO", "BASE_DE_DATOS", "NO_CONTINUAR"].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDecision(d)}
                      className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        selectedDecision === d
                          ? d === "PRESELECCIONADO"
                            ? "border-primary-600 bg-primary-50 text-primary-700"
                            : d === "BASE_DE_DATOS"
                              ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                              : "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {STATUS_LABELS[d as CandidateStatus]}
                    </button>
                  ))}
                </div>

                {isOverride && (
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-orange-600">
                      Razón del cambio (obligatorio)
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-orange-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      placeholder="Explica por qué cambias la sugerencia de la IA..."
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-600">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <button
                  onClick={handleDecision}
                  disabled={!selectedDecision || submitting || (!!isOverride && !overrideReason.trim())}
                  className="w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Confirmar Decisión"}
                </button>
              </div>
            )}

            {/* Email draft panel after initial decision */}
            {showEmailDraft && candidate && (
              <EmailDraftModal
                candidateId={id}
                candidateEmail={candidate.email}
                decision={emailDecision}
                onSent={() => {
                  setShowEmailDraft(false);
                  setEmailDecision("");
                  showToast("Email enviado al candidato", "success");
                }}
                onClose={() => {
                  setShowEmailDraft(false);
                  setEmailDecision("");
                }}
              />
            )}

            {!canDecide && !showEmailDraft && (
              <div className="rounded-card bg-gray-50 p-5 text-center">
                <p className="text-sm text-gray-500">
                  Estado actual: <StatusBadge status={candidate.status} /> &mdash; no se puede tomar decisión en este estado
                </p>
              </div>
            )}

            {/* Decision history */}
            {decisions.length > 0 && (
              <div className="rounded-card bg-white p-5 shadow-card">
                <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
                  Historial de Decisiones
                </h2>
                <div className="space-y-3">
                  {decisions.map((d, i) => (
                    <div key={i} className="rounded-lg border border-gray-100 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={d.decision} />
                        <span className="text-xs text-gray-400">
                          {new Date(d.createdAt).toLocaleString("es-CO")}
                        </span>
                      </div>
                      {d.overrideReason && (
                        <p className="mt-1 text-orange-600">Razón del cambio: {d.overrideReason}</p>
                      )}
                      {d.notes && <p className="mt-1 text-gray-500">Notas: {d.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  let color: string;
  if (score >= 80) color = "bg-primary-500";
  else if (score >= 65) color = "bg-yellow-500";
  else if (score >= 60) color = "bg-orange-500";
  else color = "bg-red-500";

  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function InterviewAnswersView({ answers }: { answers: InterviewAnswers }) {
  const calcAge = answers.basic.birthDate
    ? Math.floor((Date.now() - new Date(answers.basic.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : answers.basic.age;

  const sections = [
    {
      title: "Datos Básicos",
      items: [
        answers.basic.birthDate
          ? { label: "Fecha de nacimiento", value: `${new Date(answers.basic.birthDate).toLocaleDateString("es-CO")} (${calcAge} años)` }
          : { label: "Edad", value: answers.basic.age },
        { label: "Barrio", value: answers.basic.neighborhood },
        answers.basic.maritalStatus
          ? { label: "Estado civil", value: MARITAL_STATUS_LABELS[answers.basic.maritalStatus as MaritalStatus] || answers.basic.maritalStatus }
          : null,
        answers.basic.hasChildren != null
          ? { label: "Hijos", value: answers.basic.hasChildren ? `Sí (${answers.basic.numberOfChildren || 0})` : "No" }
          : null,
        { label: "Experiencia", value: answers.basic.hasExperience ? "Sí" : "No" },
        answers.basic.hasExperience ? { label: "Detalle", value: answers.basic.experienceDetails } : null,
      ],
    },
    {
      title: "Disponibilidad",
      items: [
        { label: "Fines de semana", value: answers.availability.canWorkWeekends ? "Sí" : "No" },
        { label: "Festivos", value: answers.availability.canWorkHolidays ? "Sí" : "No" },
        { label: "Turnos", value: answers.availability.availableShifts.join(", ") },
        { label: "Inicio", value: answers.availability.startDate },
        { label: "Otro trabajo", value: answers.availability.hasOtherJob ? "Sí" : "No" },
        { label: "Transporte", value: answers.availability.transportMethod },
      ],
    },
    {
      title: "Motivación",
      items: [
        { label: "¿Por qué trabajar con nosotros?", value: answers.motivation.whyThisJob },
        { label: "¿Qué sabe del restaurante?", value: answers.motivation.whatDoYouKnowAboutUs },
        { label: "En 6 meses", value: answers.motivation.whereDoYouSeeYourself },
        { label: "Motivación", value: answers.motivation.whatMotivatesYou },
      ],
    },
    {
      title: "Responsabilidad",
      items: [
        { label: "Salida último trabajo", value: answers.responsibility.lastJobLeaveReason },
        { label: "Manejo de presión", value: answers.responsibility.howDoYouHandlePressure },
        { label: "Tardanzas", value: answers.responsibility.lateArrivalFrequency },
        { label: "Reacción a corrección", value: answers.responsibility.howDoYouReactToCorrection },
        { label: "Momento responsable", value: answers.responsibility.describeResponsibleMoment },
      ],
    },
    {
      title: "Escenarios",
      items: [
        { label: "Cliente enojado", value: answers.scenarios.angryCustomer },
        { label: "Conflicto equipo", value: answers.scenarios.teamConflict },
        { label: "Olvidó tarea", value: answers.scenarios.forgotTask },
        { label: "Hora pico", value: answers.scenarios.peakHourChaos },
      ],
    },
    {
      title: "Técnica",
      items: Object.entries(answers.technical || {}).map(([key, val]) => ({ label: key, value: val })),
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {section.title}
          </h3>
          <div className="space-y-2">
            {section.items
              .filter((item) => item !== null)
              .map((item) => (
                <div key={item.label} className="text-sm">
                  <span className="text-gray-500">{item.label}:</span>{" "}
                  <span className="text-gray-800">{String(item.value || "—")}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
