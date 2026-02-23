# La Glorieta — Esquema de Entrevista y Definiciones Técnicas V1

## 1. Estructura JSON de Respuestas

Cada `ApplicationInterview.answers` se almacena con la siguiente estructura.
Los IDs de preguntas son estables y no deben cambiar entre versiones.

```json
{
  "schemaVersion": "1.0",
  "basic": {
    "fullName": "",
    "phone": "",
    "positionApplied": "",
    "age": null,
    "neighborhood": "",
    "hasExperience": false,
    "experienceDetails": ""
  },
  "availability": {
    "canWorkWeekends": false,
    "canWorkHolidays": false,
    "availableShifts": [],
    "startDate": "",
    "hasOtherJob": false,
    "otherJobDetails": "",
    "transportMethod": ""
  },
  "motivation": {
    "whyThisJob": "",
    "whatDoYouKnowAboutUs": "",
    "whereDoYouSeeYourself": "",
    "whatMotivatesYou": ""
  },
  "responsibility": {
    "lastJobLeaveReason": "",
    "howDoYouHandlePressure": "",
    "lateArrivalFrequency": "",
    "howDoYouReactToCorrection": "",
    "describeResponsibleMoment": ""
  },
  "scenarios": {
    "angryCustomer": "",
    "teamConflict": "",
    "forgotTask": "",
    "peakHourChaos": ""
  },
  "technical": {},
  "consent": {
    "dataProcessingAccepted": false,
    "informationTruthful": false
  }
}
```

---

## 2. Preguntas por Sección

### 2.1 Datos Básicos (`basic`)

| ID                  | Pregunta                                                        | Tipo       | Obligatorio | Límite   |
| ------------------- | --------------------------------------------------------------- | ---------- | ----------- | -------- |
| `fullName`          | ¿Cuál es tu nombre completo?                                   | texto      | sí          | 100 char |
| `phone`             | ¿Cuál es tu número de celular?                                 | teléfono   | sí          | 15 char  |
| `positionApplied`   | ¿A qué cargo te gustaría aplicar?                              | selección  | sí          | —        |
| `age`               | ¿Cuántos años tienes?                                          | número     | sí          | 16–70    |
| `neighborhood`      | ¿En qué barrio o vereda vives?                                 | texto      | sí          | 100 char |
| `hasExperience`     | ¿Tienes experiencia previa en restaurantes o servicio?         | sí/no      | sí          | —        |
| `experienceDetails` | Si respondiste sí, cuéntanos brevemente tu experiencia         | texto      | condicional | 500 char |

**Opciones de `positionApplied`:**
- `MESERO`
- `COCINERA`
- `AUXILIAR_COCINA`
- `AUXILIAR_MESA`

### 2.2 Disponibilidad (`availability`)

| ID                  | Pregunta                                                        | Tipo       | Obligatorio | Límite   |
| ------------------- | --------------------------------------------------------------- | ---------- | ----------- | -------- |
| `canWorkWeekends`   | ¿Puedes trabajar sábados, domingos y festivos?                 | sí/no      | sí          | —        |
| `canWorkHolidays`   | ¿Puedes trabajar en fechas especiales (Navidad, Año Nuevo)?    | sí/no      | sí          | —        |
| `availableShifts`   | ¿En qué turnos puedes trabajar?                                | múltiple   | sí          | —        |
| `startDate`         | ¿Desde cuándo podrías empezar a trabajar?                      | texto      | sí          | 100 char |
| `hasOtherJob`       | ¿Actualmente tienes otro trabajo?                              | sí/no      | sí          | —        |
| `otherJobDetails`   | Si respondiste sí, cuéntanos los horarios de tu otro trabajo   | texto      | condicional | 300 char |
| `transportMethod`   | ¿Cómo llegarías al restaurante?                                | texto      | sí          | 200 char |

**Opciones de `availableShifts`:**
- `MAÑANA` (6am–2pm)
- `TARDE` (2pm–10pm)
- `COMPLETO` (según necesidad)

### 2.3 Motivación (`motivation`)

| ID                        | Pregunta                                                                    | Tipo  | Obligatorio | Límite   |
| ------------------------- | --------------------------------------------------------------------------- | ----- | ----------- | -------- |
| `whyThisJob`              | ¿Por qué quieres trabajar en La Glorieta?                                  | texto | sí          | 500 char |
| `whatDoYouKnowAboutUs`    | ¿Qué sabes sobre nuestro restaurante?                                      | texto | sí          | 300 char |
| `whereDoYouSeeYourself`   | ¿Dónde te ves trabajando en 6 meses?                                       | texto | sí          | 300 char |
| `whatMotivatesYou`        | ¿Qué es lo que más te motiva de un trabajo?                                | texto | sí          | 300 char |

> **Alimenta:** `attitudeScore` — Orientación al servicio, interés genuino, estabilidad.

### 2.4 Responsabilidad y Hábitos (`responsibility`)

| ID                            | Pregunta                                                                           | Tipo  | Obligatorio | Límite   |
| ----------------------------- | ---------------------------------------------------------------------------------- | ----- | ----------- | -------- |
| `lastJobLeaveReason`          | ¿Por qué saliste de tu último trabajo? (o por qué buscas trabajo ahora)           | texto | sí          | 500 char |
| `howDoYouHandlePressure`      | Cuando hay mucho trabajo y presión, ¿cómo reaccionas?                             | texto | sí          | 500 char |
| `lateArrivalFrequency`        | En tus trabajos anteriores, ¿qué tan seguido llegabas tarde?                      | texto | sí          | 300 char |
| `howDoYouReactToCorrection`   | Si tu jefe te corrige frente a los demás, ¿cómo reaccionas?                       | texto | sí          | 500 char |
| `describeResponsibleMoment`   | Cuéntanos un momento donde demostraste ser responsable en un trabajo              | texto | sí          | 500 char |

> **Alimenta:** `responsibilityScore` — Puntualidad, manejo de presión, reacción a autoridad, compromiso.

### 2.5 Escenarios Reales (`scenarios`)

| ID                | Pregunta                                                                                             | Tipo  | Obligatorio | Límite   |
| ----------------- | ---------------------------------------------------------------------------------------------------- | ----- | ----------- | -------- |
| `angryCustomer`   | Un cliente se enoja porque su pedido está mal. Te grita frente a otros clientes. ¿Qué haces?        | texto | sí          | 500 char |
| `teamConflict`    | Un compañero no hace su parte del trabajo y tú tienes que cubrir. ¿Qué haces?                       | texto | sí          | 500 char |
| `forgotTask`      | Olvidaste hacer algo importante que tu jefe te pidió. ¿Cómo manejas la situación?                   | texto | sí          | 500 char |
| `peakHourChaos`   | Es hora pico, hay 10 mesas llenas, y se cae un plato. ¿Qué haces primero?                          | texto | sí          | 500 char |

> **Alimenta:** `attitudeScore` + `responsibilityScore` — Manejo de conflicto, priorización, honestidad, orientación al servicio.

### 2.6 Técnica Específica por Cargo (`technical`)

Las preguntas técnicas cambian según el `positionApplied`.

#### MESERO

| ID                          | Pregunta                                                                              | Tipo  | Límite   |
| --------------------------- | ------------------------------------------------------------------------------------- | ----- | -------- |
| `mesero_orderProcess`       | Describe paso a paso cómo tomarías un pedido en una mesa de 6 personas               | texto | 500 char |
| `mesero_menuSuggestion`     | Un cliente no sabe qué pedir. ¿Cómo lo ayudarías?                                   | texto | 500 char |
| `mesero_paymentHandling`    | ¿Has manejado caja registradora o datáfono? Cuéntanos tu experiencia                 | texto | 300 char |

#### COCINERA

| ID                          | Pregunta                                                                              | Tipo  | Límite   |
| --------------------------- | ------------------------------------------------------------------------------------- | ----- | -------- |
| `cocinera_hygiene`          | ¿Cuáles son las reglas de higiene más importantes que sigues al cocinar?              | texto | 500 char |
| `cocinera_missingIngredient`| Te falta un ingrediente clave para un plato que ya pidieron. ¿Qué haces?             | texto | 500 char |
| `cocinera_timeManagement`   | Tienes 5 pedidos al tiempo. ¿Cómo organizas los tiempos?                             | texto | 500 char |

#### AUXILIAR_COCINA

| ID                          | Pregunta                                                                              | Tipo  | Límite   |
| --------------------------- | ------------------------------------------------------------------------------------- | ----- | -------- |
| `auxcocina_cleanProcess`    | ¿Cómo organizas la limpieza de tu estación durante el servicio?                      | texto | 500 char |
| `auxcocina_instructions`    | Si el chef te da una instrucción que no entiendes bien, ¿qué haces?                  | texto | 500 char |
| `auxcocina_speed`           | ¿Cómo mantienes la velocidad sin descuidar la limpieza?                              | texto | 500 char |

#### AUXILIAR_MESA

| ID                          | Pregunta                                                                              | Tipo  | Límite   |
| --------------------------- | ------------------------------------------------------------------------------------- | ----- | -------- |
| `auxmesa_priority`          | Hay 3 mesas sucias y llegan clientes nuevos. ¿Qué haces primero?                    | texto | 500 char |
| `auxmesa_detail`            | ¿Qué cosas revisas antes de decir que una mesa está lista?                           | texto | 500 char |
| `auxmesa_initiative`        | ¿Cómo sabes cuándo ayudar sin que te lo pidan?                                       | texto | 500 char |

> **Alimenta:** `technicalScore` — Conocimiento operativo, organización, resolución de problemas técnicos.

### 2.7 Consentimiento (`consent`)

| ID                        | Texto                                                                                                | Tipo     | Obligatorio |
| ------------------------- | ---------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `dataProcessingAccepted`  | Autorizo el uso de mis datos personales para este proceso de selección                               | checkbox | sí          |
| `informationTruthful`     | Confirmo que toda la información proporcionada es verdadera                                          | checkbox | sí          |

Ambos deben ser `true` para enviar la entrevista.

---

## 3. Mapeo Preguntas → Scores

| Score                 | Secciones que lo alimentan                             |
| --------------------- | ------------------------------------------------------ |
| `attitudeScore`       | `motivation` + `scenarios` + tono general              |
| `responsibilityScore` | `responsibility` + `availability` + `scenarios`        |
| `technicalScore`      | `technical` (según cargo)                              |

---

## 4. Runner IA — Arquitectura Técnica

### Flujo:

1. Aspirante envía entrevista → se guarda `ApplicationInterview`
2. Estado del candidato → `PENDIENTE_EVALUACION`
3. Se dispara evaluación IA de forma asíncrona (API route interna)
4. La IA evalúa y devuelve JSON
5. Se valida y guarda `AIEvaluation`
6. Estado del candidato → `EVALUADO`

### Especificaciones:

| Parámetro             | Valor                                          |
| --------------------- | ---------------------------------------------- |
| Trigger               | Automático tras envío de entrevista             |
| Método                | API route interna (`/api/evaluate`)             |
| Reintentos            | 2 (total 3 intentos)                           |
| Timeout por intento   | 30 segundos                                    |
| Delay entre reintentos| 5 segundos                                     |
| Si falla todo         | Estado queda en `PENDIENTE_EVALUACION`         |
|                       | `requiresHumanReview = true` (marcado manual)  |
|                       | Se registra error en `AuditLog`                |
| Concurrencia          | 1 evaluación a la vez (V1)                     |

### Validación de respuesta IA:

- Debe ser JSON válido
- Todos los scores deben estar entre 0 y 100
- `suggestedDecision` debe ser uno de los 3 valores válidos
- `redFlags` debe ser array de strings
- Si la validación falla → cuenta como intento fallido → reintento

### Retry manual:

- El admin puede disparar re-evaluación desde el panel para candidatos en `PENDIENTE_EVALUACION`

---

## 5. Política de Duplicados

### Regla:

**Se permite aplicar múltiples veces.** Cada aplicación es un registro independiente.

### Comportamiento:

| Situación                        | Acción del sistema                                  |
| -------------------------------- | --------------------------------------------------- |
| Mismo teléfono, nueva aplicación | Se crea nuevo `Candidate` + nueva `Interview`       |
| Detección en panel admin         | Badge "Posible duplicado" con conteo de aplicaciones |
| Filtro en panel                  | Opción de filtrar candidatos con duplicados          |

### Lógica de detección:

- Se busca por `phone` normalizado (solo dígitos, sin espacios ni guiones)
- Si existe 1+ candidatos previos con el mismo teléfono → marcar como duplicado

### Por qué no bloqueamos:

- Las personas pueden aplicar a diferentes cargos
- Pueden mejorar con el tiempo
- El admin decide qué hacer con duplicados

---

## 6. UX del Panel Administrativo

### Vista principal (lista de candidatos):

| Elemento              | Definición                                                |
| --------------------- | --------------------------------------------------------- |
| Orden por defecto     | `totalScore` descendente (mejores primero)                |
| Registros por página  | 20                                                        |
| Vista                 | Tabla compacta con expansión al hacer click               |

### Columnas visibles en tabla:

| Columna         | Siempre visible |
| --------------- | --------------- |
| Nombre          | sí              |
| Cargo           | sí              |
| Score total     | sí              |
| Estado          | sí              |
| Red flags (qty) | sí              |
| Fecha           | sí              |
| Acciones        | sí              |

### Color coding por score:

| Rango        | Color                    |
| ------------ | ------------------------ |
| 80–100       | Verde                    |
| 65–79        | Amarillo                 |
| 0–64         | Rojo                     |

### Badges visibles:

| Badge              | Condición                           | Color    |
| ------------------ | ----------------------------------- | -------- |
| "Red Flags"        | `redFlags.length > 0`               | Rojo     |
| "Revisión humana"  | `requiresHumanReview = true`        | Naranja  |
| "Duplicado"        | Teléfono existente en otro registro | Gris     |

### Filtros disponibles:

- Cargo (multiselección)
- Estado (multiselección)
- Rango de score (slider o rangos predefinidos)
- Sugerencia IA (`suggestedDecision`)
- Solo con red flags (toggle)
- Solo requiere revisión humana (toggle)
- Rango de fecha

### Vista detalle de candidato:

- Datos personales
- Respuestas completas de la entrevista
- Sub-scores desglosados (actitud, responsabilidad, técnica)
- Score total con barra visual
- Red flags listadas
- Summary y rationale de la IA
- Historial de decisiones
- Botones de acción: Preseleccionar / Base de datos / No continuar
- Campo de notas del admin
- Si es duplicado: enlace a otros registros del mismo teléfono

---

## 7. Resumen de Definiciones Cerradas

| Punto                     | Estado     | Definición                                        |
| ------------------------- | ---------- | ------------------------------------------------- |
| Estructura JSON answers   | Definido   | Sección 1 y 2 de este documento                   |
| Runner IA                 | Definido   | Auto-trigger, 3 intentos, 30s timeout             |
| Política de duplicados    | Definido   | Permitidos, badge en panel, registros separados    |
| UX Admin                  | Definido   | Tabla compacta, color coding, filtros, badges      |

> **Con este documento + INSTRUCCIONES.md + AI_RUBRIC.md, el sistema está al 100% definido para construcción.**
