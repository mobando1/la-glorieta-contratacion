"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { POSITIONS, POSITION_LABELS } from "@/domain/types";
import type { Position } from "@/domain/types";
import { StatusBadge, ScoreBadge } from "@/components/ui/badges";
import { StatCard } from "@/components/ui/stat-card";

interface CandidateRow {
  id: string;
  fullName: string;
  phone: string;
  positionApplied: string;
  status: string;
  createdAt: string;
  totalScore: number | null;
  suggestedDecision: string | null;
  redFlags: string[];
  requiresHumanReview: boolean;
  adminDecision: string | null;
  isDuplicate: boolean;
  restaurantName: string | null;
  restaurantId: string | null;
  hasPhoto: boolean;
}

interface RestaurantOption {
  id: string;
  name: string;
}

export default function CandidatosPage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-8"><div className="h-96 animate-pulse rounded-card bg-gray-200" /></div>}>
      <CandidatosContent />
    </Suspense>
  );
}

function CandidatosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters (initialized from URL params for dashboard quick actions)
  const [filterPosition, setFilterPosition] = useState(searchParams.get("position") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterRedFlags, setFilterRedFlags] = useState(searchParams.get("hasRedFlags") === "true");
  const [filterReview, setFilterReview] = useState(searchParams.get("requiresReview") === "true");
  const [filterRestaurant, setFilterRestaurant] = useState(searchParams.get("restaurant") || "");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);

  // New candidate modal
  const [showForm, setShowForm] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formRestaurant, setFormRestaurant] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetch("/api/admin/restaurants")
      .then((res) => res.json())
      .then((data) => setRestaurants(data.restaurants || []))
      .catch(() => {});
  }, []);

  const fetchCandidates = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (filterPosition) params.set("position", filterPosition);
    if (filterStatus) params.set("status", filterStatus);
    if (filterRedFlags) params.set("hasRedFlags", "true");
    if (filterReview) params.set("requiresReview", "true");
    if (filterRestaurant) params.set("restaurant", filterRestaurant);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filterDateFrom) params.set("dateFrom", filterDateFrom);
    if (filterDateTo) params.set("dateTo", filterDateTo);

    try {
      const res = await fetch(`/api/admin/candidates?${params}`, { signal });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Error al cargar candidatos");
      const data = await res.json();
      setCandidates(data.candidates);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("No se pudieron cargar los candidatos. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [page, filterPosition, filterStatus, filterRedFlags, filterReview, filterRestaurant, debouncedSearch, filterDateFrom, filterDateTo, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCandidates(controller.signal);
    return () => controller.abort();
  }, [fetchCandidates]);

  function openNewCandidateForm() {
    setFormFullName("");
    setFormPhone("");
    setFormEmail("");
    setFormPosition("");
    setFormRestaurant("");
    setFormNotes("");
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
  }

  async function handleCreateCandidate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formFullName.trim() || !formPhone.trim() || !formPosition) {
      setFormError("Nombre, teléfono y cargo son obligatorios");
      return;
    }
    setFormSaving(true);
    try {
      const res = await fetch("/api/admin/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formFullName,
          phone: formPhone,
          email: formEmail || undefined,
          positionApplied: formPosition,
          restaurantId: formRestaurant || undefined,
          notesAdmin: formNotes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al crear candidato");
        return;
      }
      closeForm();
      fetchCandidates();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleExportCSV() {
    const params = new URLSearchParams();
    if (filterPosition) params.set("position", filterPosition);
    if (filterStatus) params.set("status", filterStatus);
    if (filterRedFlags) params.set("hasRedFlags", "true");
    if (filterReview) params.set("requiresReview", "true");
    if (filterRestaurant) params.set("restaurant", filterRestaurant);

    const res = await fetch(`/api/admin/export-csv?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidatos-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  // Stats computed from current page (best effort)
  const stats = {
    total,
    pendientes: candidates.filter((c) => c.status === "PENDIENTE_EVALUACION" || c.status === "EVALUANDO").length,
    evaluados: candidates.filter((c) => c.status === "EVALUADO").length,
    preseleccionados: candidates.filter((c) => c.status === "PRESELECCIONADO" || c.status === "CONTRATADO").length,
  };

  const STATUS_OPTIONS = [
    { value: "", label: "Todos" },
    { value: "NUEVO", label: "Nuevo" },
    { value: "PENDIENTE_EVALUACION", label: "Pendiente" },
    { value: "EVALUADO", label: "Evaluado" },
    { value: "PRESELECCIONADO", label: "Preseleccionado" },
    { value: "CITADO_ENTREVISTA", label: "Citado" },
    { value: "ENTREVISTA_REALIZADA", label: "Entrevistado" },
    { value: "EVALUADO_ENTREVISTA", label: "Evaluado (E)" },
    { value: "CONTRATADO", label: "Contratado" },
    { value: "BASE_DE_DATOS", label: "Base de Datos" },
    { value: "NO_CONTINUAR", label: "No Continuar" },
  ];

  return (
    <div className="p-4 lg:p-8">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidatos</h1>
          <p className="text-sm text-gray-500">Gestiona las aplicaciones recibidas</p>
        </div>
        <button
          onClick={openNewCandidateForm}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          + Agregar Candidato
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total"
          value={stats.total}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Pendientes"
          value={stats.pendientes}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Evaluados"
          value={stats.evaluados}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Preseleccionados"
          value={stats.preseleccionados}
          color="primary"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-card bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full lg:w-56">
            <label className="mb-1 block text-xs font-medium text-gray-500">Buscar</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nombre o teléfono..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Cargo</label>
            <select
              value={filterPosition}
              onChange={(e) => { setFilterPosition(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              {POSITIONS.map((p) => (
                <option key={p} value={p}>{POSITION_LABELS[p as Position]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Restaurante</label>
            <select
              value={filterRestaurant}
              onChange={(e) => { setFilterRestaurant(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Todos</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Desde</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Hasta</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Estado</label>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFilterStatus(opt.value); setPage(1); }}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterStatus === opt.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filterRedFlags}
              onChange={(e) => { setFilterRedFlags(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-primary-600"
            />
            Red Flags
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={filterReview}
              onChange={(e) => { setFilterReview(e.target.checked); setPage(1); }}
              className="rounded border-gray-300 text-primary-600"
            />
            Revisión
          </label>

          <div className="ml-auto">
            <button
              onClick={handleExportCSV}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="mb-3 text-sm text-gray-500">
        {total} candidato{total !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="overflow-x-auto rounded-card bg-white shadow-card">
        <table className="w-full text-left text-sm" role="table">
          <thead className="border-b bg-gray-50/80 text-xs uppercase text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Cargo</th>
              <th scope="col" className="px-4 py-3">Restaurante</th>
              <th scope="col" className="px-4 py-3">Score</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Alertas</th>
              <th scope="col" className="px-4 py-3">Fecha</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {error ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <p className="mb-3 text-red-600">{error}</p>
                  <button
                    onClick={() => fetchCandidates()}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Reintentar
                  </button>
                </td>
              </tr>
            ) : loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-10 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))}
              </>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No se encontraron candidatos
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-primary-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.hasPhoto ? (
                        <img
                          src={`/api/admin/candidates/${c.id}/photo`}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-500">
                          {c.fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {c.fullName}
                        {c.isDuplicate && (
                          <span className="ml-2 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">
                            Duplicado
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {POSITION_LABELS[c.positionApplied as Position] || c.positionApplied}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.restaurantName || <span className="text-gray-400">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.totalScore !== null ? (
                      <ScoreBadge score={c.totalScore} />
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {c.redFlags.length > 0 && (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {c.redFlags.length} flag{c.redFlags.length > 1 ? "s" : ""}
                        </span>
                      )}
                      {c.requiresHumanReview && (
                        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          Revisión
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/candidatos/${c.id}`}
                      className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* New candidate modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-elevated">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Agregar Candidato</h2>
            <form onSubmit={handleCreateCandidate}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Cargo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar...</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{POSITION_LABELS[p as Position]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Restaurante</label>
                  <select
                    value={formRestaurant}
                    onChange={(e) => setFormRestaurant(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Sin asignar</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Ej: Llegó en persona, busca trabajo inmediato..."
                    className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                >
                  {formSaving ? "Guardando..." : "Crear Candidato"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
