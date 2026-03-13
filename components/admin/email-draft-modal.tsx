"use client";

import { useState } from "react";
import { DECISION_REASONS } from "@/domain/decision-reasons";

interface EmailDraftModalProps {
  candidateId: string;
  candidateEmail: string | null;
  decision: string;
  onSent: () => void;
  onClose: () => void;
}

export function EmailDraftModal({
  candidateId,
  candidateEmail,
  decision,
  onSent,
  onClose,
}: EmailDraftModalProps) {
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = DECISION_REASONS[decision] || [];

  async function handleGenerate() {
    if (!reason) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/draft-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason, notes: adminNotes || undefined }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubject(data.subject);
        setBody(data.body);
        setHasDraft(true);
      } else {
        const data = await res.json();
        setError(data.error || "Error al generar borrador");
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/candidates/${candidateId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });

      if (res.ok) {
        setSent(true);
        setTimeout(onSent, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Error al enviar email");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <svg className="mx-auto mb-2 h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <p className="font-medium text-green-800">Email enviado correctamente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Notificar al candidato</h3>
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">
          Cerrar
        </button>
      </div>

      {!candidateEmail && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">
            Este candidato no tiene email registrado. No se puede enviar notificacion por correo.
          </p>
        </div>
      )}

      {/* Reason selector */}
      {!hasDraft && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Razon</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Seleccionar razon...</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.label}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              Notas adicionales para el email (opcional)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              placeholder="Contexto extra que quieras incluir..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!reason || generating || !candidateEmail}
            className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generando borrador...
              </span>
            ) : (
              "Generar borrador con IA"
            )}
          </button>
        </>
      )}

      {/* Draft editor */}
      {hasDraft && (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">Contenido del email</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm leading-relaxed focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setHasDraft(false); setSubject(""); setBody(""); }}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Regenerar
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Aprobar y enviar"}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
