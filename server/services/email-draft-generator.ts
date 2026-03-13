import { callLLM, extractJSON } from "@/server/services/llm";
import { logger } from "@/lib/logger";

interface EmailDraftParams {
  candidateName: string;
  position: string;
  restaurantName: string;
  decision: string;
  reason: string;
  evaluationSummary?: string;
  adminNotes?: string;
}

interface EmailDraft {
  subject: string;
  body: string;
}

/**
 * Returns upcoming Colombian holidays/seasons within ~45 days from now.
 * This gives the AI real context to personalize emails naturally.
 */
function getUpcomingDatesContext(): string {
  const now = new Date();
  const year = now.getFullYear();

  // Colombian holidays & high seasons relevant for restaurants
  const specialDates: { name: string; date: Date; description: string }[] = [
    { name: "Año Nuevo", date: new Date(year, 0, 1), description: "temporada de inicio de año" },
    { name: "Día de los Reyes Magos", date: new Date(year, 0, 6), description: "festivo de Reyes" },
    { name: "Día de San José", date: new Date(year, 2, 19), description: "festivo de San José" },
    { name: "Semana Santa", date: getEasterDate(year), description: "temporada alta de Semana Santa con muchos visitantes en Guaduas" },
    { name: "Día del Trabajo", date: new Date(year, 4, 1), description: "puente festivo" },
    { name: "Día de la Madre", date: getNthSunday(year, 4, 2), description: "Día de la Madre, uno de los días más concurridos en restaurantes" },
    { name: "Día del Padre", date: getNthSunday(year, 5, 3), description: "Día del Padre, alta demanda en restaurantes" },
    { name: "Día de la Independencia", date: new Date(year, 6, 20), description: "festivo patrio con turismo" },
    { name: "Batalla de Boyacá", date: new Date(year, 7, 7), description: "festivo patrio" },
    { name: "Amor y Amistad", date: getNthSaturday(year, 8, 3), description: "Amor y Amistad, alta demanda en restaurantes" },
    { name: "Día de la Raza", date: new Date(year, 9, 12), description: "puente festivo" },
    { name: "Halloween / Día de los Niños", date: new Date(year, 9, 31), description: "celebración de niños con eventos especiales" },
    { name: "Independencia de Cartagena", date: new Date(year, 10, 11), description: "puente festivo" },
    { name: "Temporada Navideña", date: new Date(year, 11, 8), description: "inicio de temporada navideña, la más alta del año para restaurantes" },
    { name: "Navidad", date: new Date(year, 11, 25), description: "plena temporada navideña y de fin de año" },
    { name: "Fin de Año", date: new Date(year, 11, 31), description: "cierre de año con alta demanda" },
    // Also check next year's early dates
    { name: "Año Nuevo", date: new Date(year + 1, 0, 1), description: "temporada de inicio de año" },
    { name: "Semana Santa", date: getEasterDate(year + 1), description: "temporada alta de Semana Santa con muchos visitantes en Guaduas" },
  ];

  // Vacaciones escolares (approximate)
  const vacationPeriods = [
    { name: "Vacaciones de mitad de año", start: new Date(year, 5, 15), end: new Date(year, 6, 15), description: "vacaciones escolares con turismo familiar" },
    { name: "Vacaciones de fin de año", start: new Date(year, 11, 1), end: new Date(year + 1, 0, 15), description: "vacaciones de diciembre, la temporada más fuerte del año" },
    { name: "Semana de Receso (octubre)", start: new Date(year, 9, 7), end: new Date(year, 9, 13), description: "semana de receso escolar con familias viajando" },
  ];

  const upcoming: string[] = [];
  const daysAhead = 45;
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  for (const sd of specialDates) {
    if (sd.date >= now && sd.date <= cutoff) {
      const daysUntil = Math.ceil((sd.date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      upcoming.push(`- ${sd.name} (en ${daysUntil} días): ${sd.description}`);
    }
  }

  for (const vp of vacationPeriods) {
    if ((vp.start <= cutoff && vp.end >= now)) {
      if (now >= vp.start && now <= vp.end) {
        upcoming.push(`- ACTUALMENTE en ${vp.name}: ${vp.description}`);
      } else if (vp.start > now && vp.start <= cutoff) {
        const daysUntil = Math.ceil((vp.start.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        upcoming.push(`- ${vp.name} (inicia en ${daysUntil} días): ${vp.description}`);
      }
    }
  }

  if (upcoming.length === 0) return "";

  return `\nFECHAS ESPECIALES PRÓXIMAS (usa esta información para hacer el mensaje más personal y específico — menciona las fechas relevantes por nombre en vez de hablar genéricamente de "temporadas"):\nFecha de hoy: ${now.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n${upcoming.join("\n")}`;
}

/** Calculate Easter Sunday using the Anonymous Gregorian algorithm */
function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Get the Nth Sunday of a given month */
function getNthSunday(year: number, month: number, n: number): Date {
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  const firstSunday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  return new Date(year, month, firstSunday + (n - 1) * 7);
}

/** Get the Nth Saturday of a given month */
function getNthSaturday(year: number, month: number, n: number): Date {
  const first = new Date(year, month, 1);
  const dayOfWeek = first.getDay();
  const firstSaturday = dayOfWeek <= 6 ? (6 - dayOfWeek + 1) : 1;
  return new Date(year, month, firstSaturday + (n - 1) * 7);
}

function buildEmailPrompt(params: EmailDraftParams): string {
  const { candidateName, position, restaurantName, decision, reason, evaluationSummary, adminNotes } = params;

  const firstName = candidateName.split(" ")[0];

  let decisionContext = "";
  if (decision === "NO_CONTINUAR") {
    decisionContext = `La decisión es NO continuar con este candidato. Razón: "${reason}".

INSTRUCCIONES IMPORTANTES para este tipo de email:
- Agradece genuinamente por su tiempo e interés
- Si hay algo positivo del candidato en el resumen de evaluación, mencionalo brevemente
- Explica la razón de manera elegante y respetuosa (nunca de forma directa o hiriente)
- SIEMPRE menciona oportunidades futuras. Si hay FECHAS ESPECIALES PRÓXIMAS en el contexto, menciónalas por nombre (ej: "se viene Semana Santa y vamos a necesitar apoyo extra"). Si no hay fechas próximas, menciona genéricamente temporadas altas y eventos
- Deja claro que sus datos quedan guardados en la base de datos y que los contactarán cuando surja una oportunidad
- Transmite que esta NO es una puerta cerrada, sino una pausa`;
  } else if (decision === "BASE_DE_DATOS") {
    decisionContext = `La decisión es guardar al candidato en base de datos para futuras oportunidades. Razón: "${reason}".

INSTRUCCIONES IMPORTANTES para este tipo de email:
- Tono positivo y esperanzador
- Destaca que su perfil es interesante y por eso lo guardan
- Explica que actualmente no hay vacante disponible pero que surgen oportunidades constantemente
- Si hay FECHAS ESPECIALES PRÓXIMAS en el contexto, menciónalas por nombre como oportunidades concretas. Si no, menciona genéricamente temporadas altas y eventos
- Asegura que lo contactarán cuando haya una oportunidad compatible`;
  } else if (decision === "CONTRATADO") {
    decisionContext = `La decisión es CONTRATAR al candidato.

INSTRUCCIONES IMPORTANTES para este tipo de email:
- Tono celebratorio y cálido de bienvenida
- Felicita al candidato
- Menciona que pronto recibirá instrucciones para completar su proceso de ingreso
- Transmite emoción de tenerlo en el equipo`;
  }

  return `Eres el redactor de comunicaciones de ${restaurantName}, un grupo de restaurantes familiares en Guaduas, Cundinamarca, Colombia.

Redacta un email para ${firstName} que aplicó al cargo de ${position}.

${decisionContext}

${evaluationSummary ? `CONTEXTO DE EVALUACIÓN (usa esto para personalizar el mensaje, NO lo compartas directamente):\n${evaluationSummary}` : ""}
${adminNotes ? `NOTAS DEL ADMINISTRADOR: ${adminNotes}` : ""}
${getUpcomingDatesContext()}

REGLAS:
- Escribe en español colombiano, tono cálido y profesional
- Máximo 150 palabras en el body
- Usa "tú" (tuteo)
- NO uses emojis
- Firma como "Equipo de Selección - La Glorieta y Salomé"
- El subject debe ser corto y profesional (máximo 60 caracteres)
- El body es texto plano (sin HTML)

Responde ÚNICAMENTE con un JSON válido:
{
  "subject": "asunto del email",
  "body": "contenido del email"
}`;
}

export async function generateEmailDraft(params: EmailDraftParams): Promise<EmailDraft> {
  const prompt = buildEmailPrompt(params);

  try {
    const rawResponse = await callLLM(prompt);
    const parsed = extractJSON(rawResponse) as Record<string, unknown>;

    if (!parsed.subject || !parsed.body || typeof parsed.subject !== "string" || typeof parsed.body !== "string") {
      throw new Error("Respuesta de IA inválida: falta subject o body");
    }

    return {
      subject: parsed.subject,
      body: parsed.body,
    };
  } catch (error) {
    logger.error("Error generating email draft", { error: String(error) });
    throw new Error("No se pudo generar el borrador del email. Intenta de nuevo.");
  }
}
