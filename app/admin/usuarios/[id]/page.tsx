"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface AdminUserDetail {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  restaurants: { id: string; name: string }[];
}

interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  admin_decision: "Decisión administrativa",
  ai_evaluated: "Evaluación IA completada",
  scheduled_interview: "Entrevista agendada",
  personal_interview_completed: "Entrevista personal registrada",
  final_decision: "Decisión final",
  export_csv: "Exportación CSV",
  employee_created: "Empleado creado",
  employment_status_changed: "Estado de empleo cambiado",
  work_period_created: "Periodo de trabajo creado",
  performance_review_created: "Evaluación de desempeño",
  admin_user_created: "Usuario admin creado",
  admin_user_updated: "Usuario admin actualizado",
  admin_password_reset: "Contraseña reseteada",
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

export default function UsuarioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${id}`);
        if (res.status === 401) { router.push("/admin/login"); return; }
        if (res.status === 403) { router.push("/admin"); return; }
        if (res.status === 404) { setError("Usuario no encontrado"); setLoading(false); return; }
        const data = await res.json();
        setUser(data.user);
        setActivity(data.recentActivity || []);
      } catch {
        setError("Error al cargar usuario");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error || "Usuario no encontrado"}</div>
        <Link href="/admin/usuarios" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-800">
          Volver a usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <Link href="/admin/usuarios" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-800">
        &larr; Volver a usuarios
      </Link>

      {/* User info card */}
      <div className="mb-6 rounded-card bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user.email}</h1>
            <div className="mt-2 flex items-center gap-3">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.role === "SUPER_ADMIN" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
              }`}>
                {user.role === "SUPER_ADMIN" ? "Super Admin" : "Gestor"}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                user.isActive ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"
              }`}>
                {user.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Creado: {new Date(user.createdAt).toLocaleDateString("es-CO")}</p>
            <p>Actualizado: {new Date(user.updatedAt).toLocaleDateString("es-CO")}</p>
          </div>
        </div>

        {user.role === "GESTOR" && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Restaurantes asignados</h3>
            {user.restaurants.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {user.restaurants.map((r) => (
                  <span key={r.id} className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {r.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Ninguno asignado</p>
            )}
          </div>
        )}
      </div>

      {/* Activity history */}
      <div className="rounded-card bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-gray-900">Actividad reciente</h2>
        {activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start justify-between rounded-lg border border-gray-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {ACTION_LABELS[a.action] || a.action}
                  </p>
                  <p className="text-xs text-gray-400">
                    {a.entityType} &middot; {a.entityId.slice(0, 8)}...
                  </p>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay actividad registrada</p>
        )}
      </div>
    </div>
  );
}
