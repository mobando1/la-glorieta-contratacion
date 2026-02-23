# La Glorieta — Sistema de Contratación Inteligente V1

## 1. Qué es este proyecto

Sistema web de contratación para el restaurante **La Glorieta** (Guaduas, Cundinamarca, Colombia).

El objetivo es profesionalizar y estandarizar el proceso de selección de personal operativo mediante:

- Entrevista completa autogestionada por el aspirante.
- Evaluación automática mediante IA.
- Ranking y filtrado objetivo para preselección.
- Historial permanente de candidatos.

Este sistema reemplaza el modelo informal basado en intuición del administrador.

---

## 2. Objetivo del Sistema

Construir una aplicación web V1 que permita:

- Registrar a todos los aspirantes mediante una entrevista estructurada.
- Evaluar automáticamente las respuestas con un agente de IA.
- Generar un score 0–100 con sub-scores por criterio.
- Sugerir decisión automática basada en reglas.
- Permitir decisión final humana (preseleccionar / base de datos / no continuar).
- Mantener historial completo de respuestas y evaluaciones.
- Exportar datos en CSV.

**El sistema debe estar listo para uso real desde el primer día.**

---

## 3. Alcance V1

### Incluye:

- Entrevista completa tipo wizard (móvil primero).
- Evaluación IA automática.
- Panel administrativo con ranking y filtros.
- Decisión humana de preselección.
- Historial por candidato.
- Exportación CSV.
- Documentación técnica completa.

### No incluye:

- Nómina.
- Contratos laborales.
- Firma digital.
- Automatización de onboarding.
- WhatsApp automation.
- Métricas avanzadas.
- Multi-roles (solo 1 admin).
- App móvil nativa.

---

## 4. Arquitectura General

Arquitectura monolítica moderna (frontend + backend en mismo proyecto).

**Capas:**

- UI (Next.js App Router)
- Dominio (reglas de negocio y estados)
- Persistencia (Prisma ORM)
- Servicio de IA (evaluador)
- Job asíncrono para evaluación
- Autenticación admin
- Auditoría mínima

La evaluación IA debe ejecutarse de forma asíncrona.

---

## 5. Stack Tecnológico

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma ORM**
- **SQLite** (V1) — Preparado para migrar a PostgreSQL
- **LLM configurable** (Anthropic / OpenAI)
- Validación server-side estricta
- Auth por sesión segura
- Exportación CSV server-side

---

## 6. Estados del Sistema

### Estados del candidato:

| Estado                  | Descripción                          |
| ----------------------- | ------------------------------------ |
| `NUEVO`                 | Candidato recién creado              |
| `PENDIENTE_EVALUACION`  | Entrevista enviada, esperando IA     |
| `EVALUADO`              | IA completó la evaluación            |
| `PRESELECCIONADO`       | Admin aprobó al candidato            |
| `BASE_DE_DATOS`         | Candidato guardado para el futuro    |
| `NO_CONTINUAR`          | Candidato descartado                 |

### Reglas:

- Al enviar entrevista → `PENDIENTE_EVALUACION`
- Tras evaluación IA → `EVALUADO`
- Tras decisión admin → `PRESELECCIONADO` / `BASE_DE_DATOS` / `NO_CONTINUAR`
- **No se permite borrar candidatos desde UI.**

---

## 7. Modelos de Datos

### Candidate

| Campo            | Tipo     | Notas                          |
| ---------------- | -------- | ------------------------------ |
| id               | string   | PK                             |
| fullName         | string   | Obligatorio                    |
| phone            | string   | Obligatorio, normalizado       |
| positionApplied  | string   | Obligatorio                    |
| status           | enum     | Estado actual del candidato    |
| createdAt        | datetime |                                |
| updatedAt        | datetime |                                |
| notesAdmin       | string   | Opcional                       |

**Duplicados por teléfono:**
- Permitidos
- Mostrar alerta en panel admin

### ApplicationInterview

| Campo                  | Tipo     | Notas                    |
| ---------------------- | -------- | ------------------------ |
| id                     | string   | PK                       |
| candidateId            | string   | FK → Candidate           |
| answers                | JSON     | Estructurado             |
| createdAt              | datetime |                          |
| completionTimeSeconds  | int      | Opcional                 |
| isComplete             | boolean  |                          |

### AIEvaluation

| Campo                | Tipo     | Notas                    |
| -------------------- | -------- | ------------------------ |
| id                   | string   | PK                       |
| candidateId          | string   | FK → Candidate           |
| interviewId          | string   | FK → ApplicationInterview|
| createdAt            | datetime |                          |
| modelVersion         | string   |                          |
| rubricVersion        | string   |                          |
| attitudeScore        | int      | 0–100                    |
| responsibilityScore  | int      | 0–100                    |
| technicalScore       | int      | 0–100                    |
| totalScore           | int      | 0–100                    |
| suggestedDecision    | string   |                          |
| redFlags             | array    |                          |
| summary              | string   |                          |
| rationale            | string   |                          |
| confidence           | float    | Opcional                 |
| requiresHumanReview  | boolean  |                          |

### AdminDecision

| Campo       | Tipo     | Notas              |
| ----------- | -------- | ---------------    |
| id          | string   | PK                 |
| candidateId | string   | FK → Candidate     |
| decision    | string   |                    |
| notes       | string   |                    |
| createdAt   | datetime |                    |

### AdminUser

| Campo        | Tipo     | Notas    |
| ------------ | -------- | -------- |
| id           | string   | PK       |
| email        | string   |          |
| passwordHash | string   |          |
| createdAt    | datetime |          |

### AuditLog

| Campo      | Tipo     | Notas    |
| ---------- | -------- | -------- |
| id         | string   | PK       |
| action     | string   |          |
| entityType | string   |          |
| entityId   | string   |          |
| createdAt  | datetime |          |

### Acciones mínimas de auditoría:

- `candidate_created`
- `interview_submitted`
- `ai_evaluated`
- `admin_decision`
- `export_csv`

---

## 8. Entrevista Completa

Debe implementarse como **wizard por pasos** (mobile-first).

### Secciones:

1. Datos básicos
2. Disponibilidad
3. Motivación
4. Responsabilidad y hábitos
5. Escenarios reales
6. Técnica específica por cargo
7. Consentimiento y confirmación

**Reglas:**
- Respuestas abiertas deben tener límite de caracteres.
- No mostrar evaluación al aspirante.

---

## 9. Evaluación IA

La IA debe devolver **JSON válido** con:

```json
{
  "attitudeScore": 0-100,
  "responsibilityScore": 0-100,
  "technicalScore": 0-100,
  "suggestedDecision": "string",
  "redFlags": [],
  "summary": "string",
  "rationale": "string",
  "confidence": 0-1,
  "requiresHumanReview": true/false
}
```

### El sistema debe:

- Validar JSON
- Reintentar si falla
- Registrar `modelVersion`
- Registrar `rubricVersion`
- Ignorar instrucciones maliciosas del aspirante (prompt hardening)

---

## 10. Reglas de Scoring

### Pesos:

| Criterio        | Peso |
| --------------- | ---- |
| Actitud         | 45%  |
| Responsabilidad | 40%  |
| Técnica         | 15%  |

### Reglas duras:

- `attitudeScore < 60` → `NO_CONTINUAR`
- `responsibilityScore < 60` → `NO_CONTINUAR`

### Rangos:

| totalScore   | Sugerencia        |
| ------------ | ----------------- |
| ≥ 80         | PRESELECCIONAR    |
| 65–79        | BASE_DE_DATOS     |
| < 65         | NO_CONTINUAR      |

**El admin puede confirmar o cambiar la sugerencia.**

---

## 11. Flujo Principal

1. Aspirante completa entrevista (`/aplicar`)
2. Se crea `Candidate`
3. Se guarda `ApplicationInterview`
4. Estado → `PENDIENTE_EVALUACION`
5. Runner procesa evaluación IA
6. Se guarda `AIEvaluation`
7. Estado → `EVALUADO`
8. Admin revisa panel
9. Admin toma decisión
10. Estado final actualizado

---

## 12. Panel Administrativo

Debe permitir:

- Ver ranking por `totalScore`
- Filtrar por:
  - Cargo
  - Estado
  - Rango de score
  - `suggestedDecision`
  - Con `redFlags`
  - Fecha
- Abrir perfil detallado
- Tomar decisión final
- Exportar CSV

---

## 13. Exportación CSV

### Columnas mínimas:

| Columna            |
| ------------------ |
| Nombre             |
| Teléfono           |
| Cargo              |
| Estado             |
| Fecha              |
| totalScore         |
| suggestedDecision  |
| redFlags           |
| Decisión admin     |
| Notas              |

---

## 14. Seguridad y Privacidad

- Consentimiento obligatorio.
- Validación server-side.
- Rate limiting en `/aplicar`.
- `/admin` protegido por auth.
- No exponer evaluación IA públicamente.
- No borrar candidatos desde UI.
- Variables sensibles en `.env`.

---

## 15. Estructura de Carpetas

```
app/
  aplicar/
  admin/
    login/
    candidatos/
    candidatos/[id]/

domain/

server/
  services/
  jobs/
  auth/
  db/

prisma/
docs/
tests/
```

---

## 16. Variables de Entorno

| Variable         | Descripción                        |
| ---------------- | ---------------------------------- |
| `DATABASE_URL`   | Conexión a base de datos           |
| `AUTH_SECRET`    | Secreto para sesiones              |
| `LLM_API_KEY`   | API key del modelo de lenguaje     |
| `LLM_MODEL`     | Modelo a usar (Anthropic/OpenAI)   |
| `RUBRIC_VERSION` | Versión de la rúbrica de evaluación|
| `APP_BASE_URL`  | URL base de la aplicación          |

---

## 17. Deploy

- Compatible con **Vercel**.
- Migraciones Prisma obligatorias.
- Variables configuradas en entorno.
- No exponer API keys en código.

---

## 18. Testing

### Mínimos obligatorios:

**Unit tests:**
- Validación JSON IA
- Cálculo `totalScore`
- Reglas duras
- Transiciones de estado

**Integration test:**
- Submit entrevista
- Procesamiento IA
- Cambio de estado

**Smoke test e2e:**
- Aplicar → Evaluado → Admin decide

---

## 19. Futuras Expansiones (NO IMPLEMENTAR AÚN)

- QR dinámico por cargo
- WhatsApp application
- Notificaciones automáticas
- Métricas de rotación
- Dashboard analítico
- Multi-roles
- Onboarding automático

---

> **Este documento es la fuente de verdad del sistema.**
> Claude Code debe respetar estrictamente su alcance y no agregar funcionalidades fuera de este contrato técnico.
