"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  POSITION_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPES,
  POSITIONS,
  AVAILABLE_SHIFTS,
} from "@/domain/types";
import { getValidTransitions } from "@/domain/employee-states";
import { useToast } from "@/components/ui/toast";
import type { Position, EmploymentStatus, ContractType } from "@/domain/types";

interface EmployeeDetail {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  cedulaNumber: string | null;
  onboardingStatus: string;
  onboardingToken: string;
  tokenExpiresAt: string;
  createdAt: string;
  positionApplied: string;
  candidateId: string;
  totalScore: number | null;
  employmentStatus: string;
  contractType: string | null;
  preferredShifts: string | null;
  priorityScore: number;
  reliabilityScore: number;
  totalWorkPeriods: number;
  hireDate: string | null;
  terminationDate: string | null;
  terminationReason: string | null;
  adminNotes: string | null;
  restaurantName: string | null;
  restaurantId: string | null;
  avgReviewScore: number | null;
  wouldRehirePercent: number | null;
  reviewCount: number;
}

interface WorkPeriodData {
  id: string;
  startDate: string;
  endDate: string | null;
  contractType: string;
  position: string;
  status: string;
  notes: string | null;
  restaurantName: string | null;
  review: ReviewData | null;
}

interface ReviewData {
  id: string;
  punctuality: number;
  attitude: number;
  quality: number;
  reliability: number;
  teamwork: number;
  overallScore: number;
  wouldRehire: boolean;
  notes: string | null;
  createdAt: string;
}

interface DocumentInfo {
  id: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface RestaurantOption {
  id: string;
  name: string;
}

const EMPLOYMENT_COLORS: Record<string, string> = {
  ACTIVO: "bg-green-50 text-green-700 border-green-200",
  DISPONIBLE: "bg-blue-50 text-blue-700 border-blue-200",
  NO_DISPONIBLE: "bg-gray-100 text-gray-600 border-gray-200",
  NO_RECONTRATAR: "bg-red-50 text-red-700 border-red-200",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  CEDULA_FRENTE: "Cedula - Frente",
  CEDULA_REVERSO: "Cedula - Reverso",
  OTRO: "Otro",
};

const PERIOD_STATUS_COLORS: Record<string, string> = {
  ACTIVO: "bg-green-100 text-green-700",
  COMPLETADO: "bg-gray-100 text-gray-600",
  ABANDONADO: "bg-red-100 text-red-700",
};

const REVIEW_LABELS: Record<string, string> = {
  punctuality: "Puntualidad",
  attitude: "Actitud",
  quality: "Calidad",
  reliability: "Confiabilidad",
  teamwork: "Trabajo en Equipo",
};

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <svg
            className={`h-6 w-6 transition-colors ${i <= value ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = "sm" }: { value: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`${cls} ${i <= value ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function daysText(start: string, end: string | null): string {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} dias`;
  const months = Math.round(days / 30);
  return `${months} mes${months > 1 ? "es" : ""}`;
}

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { showToast } = useToast();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [workPeriods, setWorkPeriods] = useState<WorkPeriodData[]>([]);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status change
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  // Rehire fields
  const [rehireContractType, setRehireContractType] = useState("TEMPORAL");
  const [rehirePosition, setRehirePosition] = useState("");
  const [rehireRestaurantId, setRehireRestaurantId] = useState("");
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);

  // Review form
  const [reviewPeriodId, setReviewPeriodId] = useState<string | null>(null);
  const [reviewScores, setReviewScores] = useState({ punctuality: 3, attitude: 3, quality: 3, reliability: 3, teamwork: 3 });
  const [reviewWouldRehire, setReviewWouldRehire] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);

  // Admin notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [editContractType, setEditContractType] = useState("");
  const [editShifts, setEditShifts] = useState<string[]>([]);
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    fetchData();
    fetch("/api/admin/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/employees/${id}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (res.status === 404) { router.push("/admin/personal"); return; }
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setEmployee(data.employee);
      setDocuments(data.documents);
      setWorkPeriods(data.workPeriods);
      // Sync edit fields
      setAdminNotes(data.employee.adminNotes || "");
      setEditContractType(data.employee.contractType || "");
      setEditShifts(data.employee.preferredShifts ? data.employee.preferredShifts.split(",") : []);
      setRehirePosition(data.employee.positionApplied || "");
      setRehireRestaurantId(data.employee.restaurantId || "");
    } catch {
      setError("No se pudo cargar el empleado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      const body: Record<string, unknown> = {
        status: statusTarget,
        terminationReason: statusReason || undefined,
      };
      if (statusTarget === "ACTIVO") {
        body.contractType = rehireContractType;
        body.position = rehirePosition;
        body.restaurantId = rehireRestaurantId || undefined;
      }

      const res = await fetch(`/api/admin/employees/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Error al cambiar estado", "error");
        return;
      }

      showToast("Estado actualizado", "success");
      setShowStatusModal(false);
      setStatusTarget("");
      setStatusReason("");
      fetchData();
    } catch {
      showToast("Error al cambiar estado", "error");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewPeriodId) return;
    setReviewSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workPeriodId: reviewPeriodId,
          ...reviewScores,
          wouldRehire: reviewWouldRehire,
          notes: reviewNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Error al crear evaluacion", "error");
        return;
      }

      showToast("Evaluacion creada", "success");
      setReviewPeriodId(null);
      setReviewScores({ punctuality: 3, attitude: 3, quality: 3, reliability: 3, teamwork: 3 });
      setReviewWouldRehire(true);
      setReviewNotes("");
      fetchData();
    } catch {
      showToast("Error al crear evaluacion", "error");
    } finally {
      setReviewSaving(false);
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes: adminNotes || undefined,
          contractType: editContractType || undefined,
          preferredShifts: editShifts.length > 0 ? editShifts.join(",") : undefined,
        }),
      });

      if (!res.ok) {
        showToast("Error al guardar", "error");
        return;
      }

      showToast("Guardado", "success");
      setEditingNotes(false);
      fetchData();
    } catch {
      showToast("Error al guardar", "error");
    } finally {
      setNotesSaving(false);
    }
  }

  function copyOnboardingLink() {
    if (!employee) return;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/onboarding/${employee.onboardingToken}`;
    navigator.clipboard.writeText(link);
    showToast("Enlace copiado al portapapeles", "success");
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <div className="mb-6">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-6 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 rounded-card bg-white p-5 shadow-card">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded bg-gray-200" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button onClick={fetchData} className="rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  const validTransitions = getValidTransitions(employee.employmentStatus as EmploymentStatus);
  const tokenExpired = new Date(employee.tokenExpiresAt) < new Date();

  return (
    <div className="p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/admin/personal" className="text-sm text-primary-600 hover:text-primary-700">
          &larr; Gestion de Personal
        </Link>

        {/* Header */}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{employee.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                EMPLOYMENT_COLORS[employee.employmentStatus] || "bg-gray-100 text-gray-700"
              }`}>
                {EMPLOYMENT_STATUS_LABELS[employee.employmentStatus as EmploymentStatus] || employee.employmentStatus}
              </span>
              <span className="text-sm text-gray-500">
                {POSITION_LABELS[employee.positionApplied as Position]}
                {employee.restaurantName && ` · ${employee.restaurantName}`}
              </span>
            </div>
          </div>

          {/* Priority + reliability badges */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Prioridad</p>
              <p className={`text-lg font-bold ${
                employee.priorityScore >= 80 ? "text-green-600" : employee.priorityScore >= 50 ? "text-amber-600" : "text-gray-400"
              }`}>{employee.priorityScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Confiabilidad</p>
              <p className="text-lg font-bold text-amber-500">{employee.reliabilityScore}</p>
            </div>
            {employee.reviewCount > 0 && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Evaluaciones</p>
                <p className="text-lg font-bold text-purple-600">{employee.reviewCount}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {validTransitions.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {validTransitions.map((target) => {
            const isRehire = target === "ACTIVO";
            const isDanger = target === "NO_RECONTRATAR";
            const cls = isDanger
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : isRehire
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200";

            return (
              <button
                key={target}
                onClick={() => {
                  setStatusTarget(target);
                  setShowStatusModal(true);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${cls}`}
              >
                {isRehire ? "Recontratar" : `Mover a ${EMPLOYMENT_STATUS_LABELS[target]}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-elevated">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              {statusTarget === "ACTIVO" ? "Recontratar Empleado" : `Cambiar a ${EMPLOYMENT_STATUS_LABELS[statusTarget as EmploymentStatus]}`}
            </h3>

            {statusTarget === "ACTIVO" && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Contrato</label>
                  <select
                    value={rehireContractType}
                    onChange={(e) => setRehireContractType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{CONTRACT_TYPE_LABELS[ct]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Cargo</label>
                  <select
                    value={rehirePosition}
                    onChange={(e) => setRehirePosition(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{POSITION_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                {restaurants.length > 0 && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Restaurante</label>
                    <select
                      value={rehireRestaurantId}
                      onChange={(e) => setRehireRestaurantId(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Sin asignar</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {statusTarget !== "ACTIVO" && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {statusTarget === "NO_RECONTRATAR" ? "Razon (requerida)" : "Razon (opcional)"}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Motivo del cambio..."
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowStatusModal(false); setStatusTarget(""); setStatusReason(""); }}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                disabled={statusSaving}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  statusTarget === "NO_RECONTRATAR"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary-600 hover:bg-primary-700"
                } disabled:opacity-50`}
              >
                {statusSaving ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal info */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Informacion Personal</h2>
          <dl className="space-y-3 text-sm">
            <InfoRow label="Nombre" value={employee.fullName} />
            <InfoRow label="Telefono" value={employee.phone} />
            <InfoRow label="Email" value={employee.email || "—"} />
            <InfoRow label="Direccion" value={employee.address || "—"} />
            <InfoRow label="Cedula" value={employee.cedulaNumber || "—"} />
            {employee.totalScore !== null && (
              <InfoRow label="Score Evaluacion" value={String(employee.totalScore)} />
            )}
            {employee.contractType && (
              <InfoRow label="Tipo Contrato" value={CONTRACT_TYPE_LABELS[employee.contractType as ContractType] || employee.contractType} />
            )}
            {employee.hireDate && (
              <InfoRow label="Fecha Inicio" value={new Date(employee.hireDate).toLocaleDateString("es-CO")} />
            )}
            {employee.terminationDate && (
              <InfoRow label="Fecha Salida" value={new Date(employee.terminationDate).toLocaleDateString("es-CO")} />
            )}
          </dl>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href={`/admin/candidatos/${employee.candidateId}`}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Ver perfil de candidato original &rarr;
            </Link>
          </div>
        </div>

        {/* Admin Notes & Preferences */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase text-gray-500">Notas y Preferencias</h2>
            {!editingNotes ? (
              <button
                onClick={() => setEditingNotes(true)}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingNotes(false); setAdminNotes(employee.adminNotes || ""); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  {notesSaving ? "..." : "Guardar"}
                </button>
              </div>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Notas del Admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Notas sobre el trabajador..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Tipo de Contrato Preferido</label>
                <select
                  value={editContractType}
                  onChange={(e) => setEditContractType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Sin preferencia</option>
                  {CONTRACT_TYPES.map((ct) => (
                    <option key={ct} value={ct}>{CONTRACT_TYPE_LABELS[ct]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500">Turnos Preferidos</label>
                <div className="flex gap-2">
                  {AVAILABLE_SHIFTS.map((shift) => (
                    <label key={shift} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={editShifts.includes(shift)}
                        onChange={(e) => {
                          if (e.target.checked) setEditShifts([...editShifts, shift]);
                          else setEditShifts(editShifts.filter((s) => s !== shift));
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{shift === "MAÑANA" ? "Manana" : shift === "TARDE" ? "Tarde" : "Completo"}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notas</p>
                <p className="text-gray-700">{employee.adminNotes || <span className="text-gray-400">Sin notas</span>}</p>
              </div>
              {employee.contractType && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Contrato Preferido</p>
                  <p className="text-gray-700">{CONTRACT_TYPE_LABELS[employee.contractType as ContractType]}</p>
                </div>
              )}
              {employee.preferredShifts && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Turnos Preferidos</p>
                  <p className="text-gray-700">{employee.preferredShifts.split(",").join(", ")}</p>
                </div>
              )}
              {employee.avgReviewScore !== null && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Promedio Evaluaciones</p>
                  <div className="flex items-center gap-2">
                    <StarDisplay value={Math.round(employee.avgReviewScore)} />
                    <span className="text-gray-600">{employee.avgReviewScore}/5</span>
                  </div>
                </div>
              )}
              {employee.wouldRehirePercent !== null && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Recontratarian</p>
                  <p className={`font-medium ${employee.wouldRehirePercent >= 50 ? "text-green-600" : "text-red-600"}`}>
                    {employee.wouldRehirePercent}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Work Periods Timeline */}
        <div className="rounded-card bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">
            Historial de Periodos ({workPeriods.length})
          </h2>

          {workPeriods.length === 0 ? (
            <p className="text-sm text-gray-400">No hay periodos de trabajo registrados</p>
          ) : (
            <div className="space-y-4">
              {workPeriods.map((wp) => (
                <div
                  key={wp.id}
                  className={`rounded-lg border p-4 ${wp.status === "ACTIVO" ? "border-green-200 bg-green-50/30" : "border-gray-100"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          PERIOD_STATUS_COLORS[wp.status] || "bg-gray-100 text-gray-600"
                        }`}>
                          {wp.status === "ACTIVO" ? "En curso" : wp.status === "COMPLETADO" ? "Completado" : "Abandonado"}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {POSITION_LABELS[wp.position as Position] || wp.position}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(wp.startDate).toLocaleDateString("es-CO")}
                        {wp.endDate ? ` — ${new Date(wp.endDate).toLocaleDateString("es-CO")}` : " — Presente"}
                        {" · "}{daysText(wp.startDate, wp.endDate)}
                        {wp.restaurantName && ` · ${wp.restaurantName}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {CONTRACT_TYPE_LABELS[wp.contractType as ContractType] || wp.contractType}
                      </p>
                      {wp.notes && <p className="mt-1 text-xs text-gray-500 italic">{wp.notes}</p>}
                    </div>

                    {/* Review or Review button */}
                    <div>
                      {wp.review ? (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <StarDisplay value={wp.review.overallScore} size="xs" />
                            <span className="text-xs text-gray-500">{wp.review.overallScore}/5</span>
                          </div>
                          <p className={`text-[10px] font-medium ${wp.review.wouldRehire ? "text-green-600" : "text-red-600"}`}>
                            {wp.review.wouldRehire ? "Si recontrataria" : "No recontrataria"}
                          </p>
                        </div>
                      ) : wp.status !== "ACTIVO" ? (
                        <button
                          onClick={() => setReviewPeriodId(wp.id)}
                          className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          Evaluar
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Review details expanded */}
                  {wp.review && (
                    <div className="mt-3 grid grid-cols-5 gap-2 border-t border-gray-100 pt-3">
                      {(Object.entries(REVIEW_LABELS) as [string, string][]).map(([key, label]) => (
                        <div key={key} className="text-center">
                          <p className="text-[10px] text-gray-500">{label}</p>
                          <StarDisplay value={(wp.review as ReviewData)[key as keyof ReviewData] as number} size="xs" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline review form */}
                  {reviewPeriodId === wp.id && !wp.review && (
                    <div className="mt-4 space-y-4 border-t border-amber-100 pt-4">
                      <h4 className="text-sm font-semibold text-gray-900">Evaluacion de Desempeno</h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                        {(Object.entries(REVIEW_LABELS) as [string, string][]).map(([key, label]) => (
                          <div key={key}>
                            <p className="mb-1 text-xs font-medium text-gray-500">{label}</p>
                            <StarSelector
                              value={reviewScores[key as keyof typeof reviewScores]}
                              onChange={(v) => setReviewScores({ ...reviewScores, [key]: v })}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={reviewWouldRehire}
                            onChange={(e) => setReviewWouldRehire(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Lo recontrataria</span>
                        </label>
                      </div>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        placeholder="Notas sobre el desempeno..."
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReviewPeriodId(null)}
                          className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSubmitReview}
                          disabled={reviewSaving}
                          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {reviewSaving ? "Guardando..." : "Enviar Evaluacion"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Documentos</h2>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400">No se han subido documentos aun</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{DOC_TYPE_LABELS[doc.type] || doc.type}</p>
                      <p className="text-xs text-gray-500">{doc.fileName} · {formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/admin/documents/${doc.id}`}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Onboarding link */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Enlace de Onboarding</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyOnboardingLink}
              className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100"
            >
              Copiar enlace
            </button>
            {tokenExpired ? (
              <span className="text-sm text-red-600">
                Enlace expirado ({new Date(employee.tokenExpiresAt).toLocaleDateString("es-CO")})
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                Expira: {new Date(employee.tokenExpiresAt).toLocaleDateString("es-CO")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
