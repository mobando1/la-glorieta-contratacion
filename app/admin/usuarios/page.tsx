"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  restaurants: { id: string; name: string }[];
}

interface Restaurant {
  id: string;
  name: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"SUPER_ADMIN" | "GESTOR">("GESTOR");
  const [formRestaurantIds, setFormRestaurantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Password reset
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRestaurants();
    fetchCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (data.userId) setCurrentUserId(data.userId);
    } catch {}
  }

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401) { router.push("/admin/login"); return; }
      if (res.status === 403) { router.push("/admin"); return; }
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRestaurants() {
    try {
      const res = await fetch("/api/admin/restaurants");
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants);
      }
    } catch {}
  }

  function openForm(user?: AdminUser) {
    if (user) {
      setEditingId(user.id);
      setFormEmail(user.email);
      setFormPassword("");
      setFormRole(user.role as "SUPER_ADMIN" | "GESTOR");
      setFormRestaurantIds(user.restaurants.map((r) => r.id));
    } else {
      setEditingId(null);
      setFormEmail("");
      setFormPassword("");
      setFormRole("GESTOR");
      setFormRestaurantIds([]);
    }
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (editingId) {
        const res = await fetch(`/api/admin/users/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: formRole,
            restaurantIds: formRestaurantIds,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Error al actualizar");
          return;
        }
      } else {
        if (!formPassword || formPassword.length < 8) {
          setFormError("La contraseña debe tener al menos 8 caracteres");
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formEmail,
            password: formPassword,
            role: formRole,
            restaurantIds: formRestaurantIds,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setFormError(data.error || "Error al crear");
          return;
        }
      }
      closeForm();
      fetchUsers();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (res.ok) fetchUsers();
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUserId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error || "Error al cambiar contraseña");
        return;
      }
      setResetUserId(null);
      setResetPassword("");
    } catch {
      setResetError("Error de conexión");
    } finally {
      setResetting(false);
    }
  }

  function toggleRestaurant(id: string) {
    setFormRestaurantIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Gestiona los administradores del sistema</p>
        </div>
        <button
          onClick={() => openForm()}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Restaurantes</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={`/admin/usuarios/${u.id}`} className="font-medium text-primary-600 hover:text-primary-800">
                    {u.email}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === "SUPER_ADMIN"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-blue-50 text-blue-700"
                  }`}>
                    {u.role === "SUPER_ADMIN" ? "Super Admin" : "Gestor"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.role === "SUPER_ADMIN"
                    ? "Todos"
                    : u.restaurants.length > 0
                    ? u.restaurants.map((r) => r.name).join(", ")
                    : "Ninguno"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.isActive ? "bg-primary-50 text-primary-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openForm(u)}
                    className="mr-2 text-sm font-medium text-primary-600 hover:text-primary-800"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => { setResetUserId(u.id); setResetPassword(""); setResetError(""); }}
                    className="mr-2 text-sm font-medium text-amber-600 hover:text-amber-800"
                  >
                    Clave
                  </button>
                  {u.id !== currentUserId && (
                    <button
                      onClick={() => handleToggleActive(u)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {u.isActive ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-elevated">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              {editingId ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  disabled={!!editingId}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50"
                  placeholder="admin@ejemplo.com"
                />
              </div>

              {!editingId && (
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña *</label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Rol *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "SUPER_ADMIN" | "GESTOR")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="GESTOR">Gestor</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Gestor: solo ve candidatos y personal. Super Admin: acceso completo.
                </p>
              </div>

              {formRole === "GESTOR" && restaurants.length > 0 && (
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Restaurantes asignados</label>
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                    {restaurants.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formRestaurantIds.includes(r.id)}
                          onChange={() => toggleRestaurant(r.id)}
                          className="rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm text-gray-700">{r.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{formError}</div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
                  {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-card bg-white p-6 shadow-elevated">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Cambiar Contraseña</h2>
            <p className="mb-4 text-sm text-gray-500">
              {users.find((u) => u.id === resetUserId)?.email}
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">Nueva contraseña *</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              {resetError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{resetError}</div>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setResetUserId(null)} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={resetting} className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
                  {resetting ? "Cambiando..." : "Cambiar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
