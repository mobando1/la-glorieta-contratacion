"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CompanyDoc {
  id: string;
  name: string;
  slug: string;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DocumentosEmpresaPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<CompanyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Replace file state
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/company-documents");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setDocuments(data.documents);
    } catch {
      setError("Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }

  function openForm() {
    setFormName("");
    setFormSlug("");
    setFormFile(null);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (!formFile) {
      setFormError("Debes seleccionar un archivo PDF");
      return;
    }
    if (formFile.type !== "application/pdf") {
      setFormError("Solo se aceptan archivos PDF");
      return;
    }

    setSaving(true);
    const slug = formSlug.trim() || generateSlug(formName);

    const fd = new FormData();
    fd.append("name", formName.trim());
    fd.append("slug", slug);
    fd.append("file", formFile);

    try {
      const res = await fetch("/api/admin/company-documents", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Error al guardar");
        return;
      }

      closeForm();
      fetchDocuments();
    } catch {
      setFormError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleReplace(docId: string) {
    if (!replaceFile) return;
    if (replaceFile.type !== "application/pdf") {
      setFormError("Solo se aceptan archivos PDF");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.append("file", replaceFile);

    try {
      const res = await fetch(`/api/admin/company-documents/${docId}`, {
        method: "PUT",
        body: fd,
      });

      if (res.ok) {
        setReplacingId(null);
        setReplaceFile(null);
        fetchDocuments();
      } else {
        const data = await res.json();
        setError(data.error || "Error al reemplazar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/admin/company-documents/${docId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchDocuments();
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setDeletingId(null);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Documentos de Empresa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estos documentos se muestran a todos los nuevos contratados durante el onboarding
          </p>
        </div>
        <button
          onClick={openForm}
          className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          + Agregar Documento
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Cerrar</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Documento
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                Archivo
              </th>
              <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">
                Tamaño
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <tr key={doc.id} className="transition-colors hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{doc.name}</div>
                  <div className="text-xs text-gray-400">{doc.slug}</div>
                </td>
                <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                  {doc.fileName}
                </td>
                <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                  {formatFileSize(doc.fileSize)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {replacingId === doc.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={replaceInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                          className="max-w-[140px] text-xs"
                        />
                        <button
                          onClick={() => handleReplace(doc.id)}
                          disabled={!replaceFile || saving}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
                        >
                          {saving ? "..." : "Subir"}
                        </button>
                        <button
                          onClick={() => { setReplacingId(null); setReplaceFile(null); }}
                          className="text-sm text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setReplacingId(doc.id)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-800"
                        >
                          Reemplazar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar "${doc.name}"? Esta acción no se puede deshacer.`)) {
                              handleDelete(doc.id);
                            }
                          }}
                          disabled={deletingId === doc.id}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === doc.id ? "..." : "Eliminar"}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                  No hay documentos de empresa. Agrega reglamentos, manuales o checklists que se enviarán a los nuevos contratados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 shadow-elevated">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Agregar Documento</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre del documento *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormSlug(generateSlug(e.target.value));
                  }}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Ej: Reglamento de Vestimenta"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Identificador
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="reglamento-vestimenta"
                />
                <p className="mt-1 text-xs text-gray-400">Se genera automáticamente del nombre</p>
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Archivo PDF *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-700"
                />
                <p className="mt-1 text-xs text-gray-400">Máximo 10MB</p>
              </div>

              {formError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? "Subiendo..." : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
