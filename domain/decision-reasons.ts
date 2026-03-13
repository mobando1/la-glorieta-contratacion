export const DECISION_REASONS: Record<string, { value: string; label: string }[]> = {
  NO_CONTINUAR: [
    { value: "personal_completo", label: "Personal completo actualmente" },
    { value: "perfil_no_ajusta", label: "Perfil no se ajusta al cargo" },
    { value: "disponibilidad", label: "Disponibilidad no compatible" },
    { value: "otra", label: "Otra razón" },
  ],
  BASE_DE_DATOS: [
    { value: "sin_vacantes", label: "Buen perfil pero sin vacantes" },
    { value: "para_temporadas", label: "Perfil interesante para temporadas" },
    { value: "experiencia_insuficiente", label: "Experiencia insuficiente pero con potencial" },
  ],
  CONTRATADO: [
    { value: "contratacion", label: "Bienvenida al equipo" },
  ],
};
