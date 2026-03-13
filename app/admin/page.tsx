"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { POSITION_LABELS, STATUS_LABELS } from "@/domain/types";
import type { Position, CandidateStatus } from "@/domain/types";

interface Stats {
  pipeline: Record<string, number>;
  kpis: {
    totalCandidates: number;
    conversionRate: number;
    avgScore: number;
    avgTimeToHire: number;
    pendingReviews: number;
    redFlagCount: number;
  };
  byRestaurant: { id: string; name: string; count: number }[];
  byPosition: { position: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string | null;
    createdAt: string;
    performedBy: string | null;
  }[];
  employees: {
    total: number;
    onboardingPending: number;
    onboardingComplete: number;
  };
  pool: {
    activos: number;
    disponibles: number;
    noDisponibles: number;
    noRecontratar: number;
    avgReliability: number;
    avgPriority: number;
  };
}

const PIPELINE_STAGES: { status: string; label: string; color: string }[] = [
  { status: "NUEVO", label: "Nuevo", color: "bg-blue-500" },
  { status: "PENDIENTE_EVALUACION", label: "Pendiente", color: "bg-amber-500" },
  { status: "EVALUADO", label: "Evaluado", color: "bg-purple-500" },
  { status: "PRESELECCIONADO", label: "Preseleccionado", color: "bg-primary-500" },
  { status: "CITADO_ENTREVISTA", label: "Citado", color: "bg-cyan-500" },
  { status: "ENTREVISTA_REALIZADA", label: "Entrevistado", color: "bg-sky-500" },
  { status: "EVALUADO_ENTREVISTA", label: "Evaluado (E)", color: "bg-violet-500" },
  { status: "CONTRATADO", label: "Contratado", color: "bg-teal-500" },
];

const ACTION_LABELS: Record<string, string> = {
  admin_decision: "Decisión administrativa",
  ai_evaluated: "Evaluación IA completada",
  ai_evaluation_failed: "Evaluación IA fallida",
  scheduled_interview: "Entrevista agendada",
  personal_interview_submitted: "Entrevista personal registrada",
  personal_interview_evaluated: "Entrevista personal evaluada",
  personal_interview_evaluation_failed: "Evaluación entrevista fallida",
  final_decision: "Decisión final",
  export_csv: "Exportación CSV",
  employee_created: "Empleado creado",
  onboarding_completed: "Onboarding completado",
  employment_status_changed: "Estado de empleo cambiado",
  work_period_created: "Periodo de trabajo creado",
  performance_review_created: "Evaluacion de desempeno creada",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Error cargando estadísticas");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) {
    return (
      <div className="p-4 pt-16 lg:p-8 lg:pt-8">
        <div className="rounded-card bg-white p-8 text-center shadow-card">
          <p className="text-gray-500">{error || "No se pudieron cargar las estadísticas"}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const maxPipeline = Math.max(...PIPELINE_STAGES.map((s) => stats.pipeline[s.status] || 0), 1);
  const baseDeDatos = stats.pipeline["BASE_DE_DATOS"] || 0;
  const noContinuar = stats.pipeline["NO_CONTINUAR"] || 0;

  return (
    <div className="space-y-6 p-4 pt-16 lg:p-8 lg:pt-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen del proceso de contratación</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Candidatos"
          value={stats.kpis.totalCandidates}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Tasa de Conversión"
          value={`${stats.kpis.conversionRate}%`}
          color="primary"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
            </svg>
          }
        />
        <StatCard
          label="Score Promedio"
          value={stats.kpis.avgScore}
          color="purple"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        />
        <StatCard
          label="Promedio Contratación"
          value={stats.kpis.avgTimeToHire > 0 ? `${stats.kpis.avgTimeToHire} días` : "—"}
          color="teal"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Pipeline Funnel */}
      <div className="rounded-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Pipeline de Candidatos</h2>
        <div className="space-y-2.5">
          {PIPELINE_STAGES.map((stage) => {
            const count = stats.pipeline[stage.status] || 0;
            const width = maxPipeline > 0 ? (count / maxPipeline) * 100 : 0;
            return (
              <div key={stage.status} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-right text-sm text-gray-600">{stage.label}</span>
                <div className="flex-1">
                  <div className="h-7 w-full rounded-md bg-gray-100">
                    <div
                      className={`h-7 rounded-md ${stage.color} transition-all duration-500`}
                      style={{ width: `${Math.max(width, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-semibold text-gray-700">{count}</span>
              </div>
            );
          })}
        </div>
        {/* Conversion funnel percentages */}
        {stats.kpis.totalCandidates > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
            {(() => {
              const total = stats.kpis.totalCandidates;
              const evaluated = (stats.pipeline["EVALUADO"] || 0) + (stats.pipeline["PRESELECCIONADO"] || 0) + (stats.pipeline["CITADO_ENTREVISTA"] || 0) + (stats.pipeline["ENTREVISTA_REALIZADA"] || 0) + (stats.pipeline["EVALUADO_ENTREVISTA"] || 0) + (stats.pipeline["CONTRATADO"] || 0) + baseDeDatos + noContinuar;
              const preselected = (stats.pipeline["PRESELECCIONADO"] || 0) + (stats.pipeline["CITADO_ENTREVISTA"] || 0) + (stats.pipeline["ENTREVISTA_REALIZADA"] || 0) + (stats.pipeline["EVALUADO_ENTREVISTA"] || 0) + (stats.pipeline["CONTRATADO"] || 0);
              const interviewed = (stats.pipeline["ENTREVISTA_REALIZADA"] || 0) + (stats.pipeline["EVALUADO_ENTREVISTA"] || 0) + (stats.pipeline["CONTRATADO"] || 0);
              const hired = stats.pipeline["CONTRATADO"] || 0;
              const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
              return (
                <>
                  <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                    Evaluados: {pct(evaluated)}%
                  </span>
                  <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                    Preseleccionados: {pct(preselected)}%
                  </span>
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">
                    Entrevistados: {pct(interviewed)}%
                  </span>
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                    Contratados: {pct(hired)}%
                  </span>
                </>
              );
            })()}
            <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-700">
              Base de Datos: {baseDeDatos}
            </span>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
              No Continuar: {noContinuar}
            </span>
          </div>
        )}
      </div>

      {/* Breakdowns + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* By Restaurant */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Por Restaurante</h3>
          {stats.byRestaurant.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {stats.byRestaurant.map((r) => {
                const maxR = Math.max(...stats.byRestaurant.map((x) => x.count), 1);
                return (
                  <div key={r.id}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{r.name}</span>
                      <span className="font-semibold text-gray-700">{r.count}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-primary-400"
                        style={{ width: `${(r.count / maxR) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* By Position */}
        <div className="rounded-card bg-white p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Por Cargo</h3>
          {stats.byPosition.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {stats.byPosition.map((p) => {
                const maxP = Math.max(...stats.byPosition.map((x) => x.count), 1);
                return (
                  <div key={p.position}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {POSITION_LABELS[p.position as Position] || p.position}
                      </span>
                      <span className="font-semibold text-gray-700">{p.count}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-purple-400"
                        style={{ width: `${(p.count / maxP) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions + Employee Stats */}
        <div className="space-y-4">
          <div className="rounded-card bg-white p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Acciones Rápidas</h3>
            <div className="space-y-2">
              {stats.kpis.pendingReviews > 0 && (
                <Link
                  href="/admin/candidatos?requiresReview=true"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <span>Pendientes de Revisión</span>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold">{stats.kpis.pendingReviews}</span>
                </Link>
              )}
              {stats.kpis.redFlagCount > 0 && (
                <Link
                  href="/admin/candidatos?hasRedFlags=true"
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <span>Con Red Flags</span>
                  <span className="rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold">{stats.kpis.redFlagCount}</span>
                </Link>
              )}
              <Link
                href="/admin/candidatos?status=EVALUADO"
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <span>Candidatos Evaluados</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold">{stats.pipeline["EVALUADO"] || 0}</span>
              </Link>
            </div>
          </div>

          <div className="rounded-card bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Pool de Trabajadores</h3>
              <Link href="/admin/personal" className="text-xs text-primary-600 hover:text-primary-700">
                Ver todo &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-lg font-bold text-green-700">{stats.pool.activos}</p>
                <p className="text-[10px] text-green-600">Activos</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-center">
                <p className="text-lg font-bold text-blue-700">{stats.pool.disponibles}</p>
                <p className="text-[10px] text-blue-600">Disponibles</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-lg font-bold text-gray-600">{stats.pool.noDisponibles}</p>
                <p className="text-[10px] text-gray-500">No Disponibles</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2 text-center">
                <p className="text-lg font-bold text-red-700">{stats.pool.noRecontratar}</p>
                <p className="text-[10px] text-red-600">Lista Negra</p>
              </div>
            </div>
            {stats.pool.avgReliability > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Confiabilidad prom.</span>
                  <span className="font-semibold text-amber-600">{stats.pool.avgReliability}/100</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                  <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${stats.pool.avgReliability}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-card bg-white p-5 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Actividad Reciente</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-gray-400">No hay actividad registrada</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">
                      {ACTION_LABELS[activity.action] || activity.action}
                    </span>
                    {activity.entityType && (
                      <span className="text-gray-400">
                        {" "}&mdash; {activity.entityType}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {activity.performedBy ? activity.performedBy : "Sistema"} &middot; {timeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 pt-16 lg:p-8 lg:pt-8">
      <div>
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-4 w-64 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card bg-gray-200" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-card bg-gray-200" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-card bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
