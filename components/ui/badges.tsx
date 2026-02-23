import type { CandidateStatus } from "@/domain/types";

const STATUS_COLORS: Record<string, string> = {
  NUEVO: "bg-blue-50 text-blue-700",
  PENDIENTE_EVALUACION: "bg-amber-50 text-amber-700",
  EVALUANDO: "bg-indigo-50 text-indigo-700",
  EVALUADO: "bg-purple-50 text-purple-700",
  PRESELECCIONADO: "bg-primary-50 text-primary-700",
  CITADO_ENTREVISTA: "bg-cyan-50 text-cyan-700",
  ENTREVISTA_REALIZADA: "bg-sky-50 text-sky-700",
  EVALUANDO_ENTREVISTA: "bg-indigo-50 text-indigo-700",
  EVALUADO_ENTREVISTA: "bg-violet-50 text-violet-700",
  CONTRATADO: "bg-teal-50 text-teal-700",
  BASE_DE_DATOS: "bg-gray-100 text-gray-700",
  NO_CONTINUAR: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  PENDIENTE_EVALUACION: "Pendiente",
  EVALUANDO: "Evaluando...",
  EVALUADO: "Evaluado",
  PRESELECCIONADO: "Preseleccionado",
  CITADO_ENTREVISTA: "Citado a Entrevista",
  ENTREVISTA_REALIZADA: "Entrevista Realizada",
  EVALUANDO_ENTREVISTA: "Evaluando Entrevista...",
  EVALUADO_ENTREVISTA: "Evaluado (Entrevista)",
  CONTRATADO: "Contratado",
  BASE_DE_DATOS: "Base de Datos",
  NO_CONTINUAR: "No Continuar",
};

export function StatusBadge({ status }: { status: CandidateStatus | string }) {
  const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  let colors: string;
  if (score >= 80) {
    colors = "bg-primary-50 text-primary-700";
  } else if (score >= 65) {
    colors = "bg-yellow-50 text-yellow-700";
  } else if (score >= 60) {
    colors = "bg-orange-50 text-orange-700";
  } else {
    colors = "bg-red-50 text-red-700";
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${colors}`}>
      {score}
    </span>
  );
}
