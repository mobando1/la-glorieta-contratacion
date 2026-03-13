"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  POSITION_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
} from "@/domain/types";
import type { Position, EmploymentStatus, ContractType } from "@/domain/types";

interface EmployeeRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  positionApplied: string;
  onboardingStatus: string;
  employmentStatus: string;
  contractType: string | null;
  priorityScore: number;
  reliabilityScore: number;
  totalWorkPeriods: number;
  terminationReason: string | null;
  documentsCount: number;
  createdAt: string;
  restaurantName: string | null;
  hasActiveWorkPeriod: boolean;
}

interface Counts {
  activos: number;
  disponibles: number;
  todos: number;
  no_recontratar: number;
}

const EMPLOYMENT_COLORS: Record<string, string> = {
  ACTIVO: "bg-green-50 text-green-700",
  DISPONIBLE: "bg-blue-50 text-blue-700",
  NO_DISPONIBLE: "bg-gray-100 text-gray-600",
  NO_RECONTRATAR: "bg-red-50 text-red-700",
};

const TABS = [
  { key: "activos", label: "Activos", dotColor: "bg-green-500" },
  { key: "disponibles", label: "Disponibles", dotColor: "bg-blue-500" },
  { key: "todos", label: "Todos", dotColor: "bg-gray-400" },
  { key: "no_recontratar", label: "Lista Negra", dotColor: "bg-red-500" },
] as const;

function StarRating({ score }: { score: number }) {
  const stars = Math.round(score / 20);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i <= stars ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function PriorityBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-50 text-green-700"
      : score >= 50
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-100 text-gray-500";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {score}
    </span>
  );
}

function PersonalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [counts, setCounts] = useState<Counts>({ activos: 0, disponibles: 0, todos: 0, no_recontratar: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "activos");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [filterContractType, setFilterContractType] = useState(searchParams.get("contractType") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "recent");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedSearch, filterContractType, sortBy]);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("tab", activeTab);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterContractType) params.set("contractType", filterContractType);
      params.set("sortBy", sortBy);

      const res = await fetch(`/api/admin/employees?${params}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setEmployees(data.employees);
      setCounts(data.counts);
    } catch {
      setError("No se pudo cargar la lista de personal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de Personal</h1>
        <p className="text-sm text-gray-500">Base de datos del pool de trabajadores</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="text-2xl font-bold text-gray-900">{counts.activos + counts.disponibles}</p>
          <p className="text-xs font-medium text-gray-500">Pool Total</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="text-2xl font-bold text-blue-600">{counts.disponibles}</p>
          <p className="text-xs font-medium text-gray-500">Disponibles</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="text-2xl font-bold text-green-600">{counts.activos}</p>
          <p className="text-xs font-medium text-gray-500">Activos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${
              activeTab === tab.key ? "bg-white/80" : tab.dotColor
            }`} />
            {tab.label}
            <span className={`ml-0.5 rounded-full px-1.5 text-[10px] ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {counts[tab.key as keyof Counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o telefono..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Contract type filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Tipo Contrato</label>
          <select
            value={filterContractType}
            onChange={(e) => setFilterContractType(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            {(Object.entries(CONTRACT_TYPE_LABELS) as [ContractType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Ordenar</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-1 ring-gray-100 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="recent">Mas Reciente</option>
            <option value="priority">Prioridad</option>
            <option value="name">Nombre</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-card bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50/80 text-xs uppercase text-gray-500">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Cargo</th>
              <th scope="col" className="px-4 py-3">Restaurante</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3">Confiabilidad</th>
              <th scope="col" className="px-4 py-3">Prioridad</th>
              <th scope="col" className="px-4 py-3">Periodos</th>
              {activeTab === "no_recontratar" && (
                <th scope="col" className="px-4 py-3">Razon</th>
              )}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {error ? (
              <tr>
                <td colSpan={activeTab === "no_recontratar" ? 9 : 8} className="px-4 py-8 text-center">
                  <p className="mb-3 text-red-600">{error}</p>
                  <button
                    onClick={fetchEmployees}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Reintentar
                  </button>
                </td>
              </tr>
            ) : loading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-10 animate-pulse rounded-full bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-gray-200" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-8 animate-pulse rounded bg-gray-200" /></td>
                  </tr>
                ))}
              </>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "no_recontratar" ? 9 : 8} className="px-4 py-8 text-center text-gray-400">
                  {debouncedSearch
                    ? "No se encontraron empleados con esa busqueda"
                    : activeTab === "disponibles"
                    ? "No hay trabajadores disponibles en el pool"
                    : activeTab === "no_recontratar"
                    ? "No hay trabajadores en lista negra"
                    : "No se encontraron empleados"}
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-primary-50/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{e.fullName}</p>
                      <p className="text-xs text-gray-500">{e.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {POSITION_LABELS[e.positionApplied as Position] || e.positionApplied}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {e.restaurantName || <span className="text-gray-400">&mdash;</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      EMPLOYMENT_COLORS[e.employmentStatus] || "bg-gray-100 text-gray-700"
                    }`}>
                      {EMPLOYMENT_STATUS_LABELS[e.employmentStatus as EmploymentStatus] || e.employmentStatus}
                    </span>
                    {e.contractType && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {CONTRACT_TYPE_LABELS[e.contractType as ContractType] || e.contractType}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StarRating score={e.reliabilityScore} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge score={e.priorityScore} />
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {e.totalWorkPeriods}
                  </td>
                  {activeTab === "no_recontratar" && (
                    <td className="px-4 py-3 text-xs text-red-600 max-w-[150px] truncate">
                      {e.terminationReason || <span className="text-gray-400">&mdash;</span>}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/personal/${e.id}`}
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
    </div>
  );
}

export default function PersonalPage() {
  return (
    <Suspense fallback={
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-card bg-white p-4 shadow-card">
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    }>
      <PersonalContent />
    </Suspense>
  );
}
