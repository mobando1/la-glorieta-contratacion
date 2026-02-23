# La Glorieta — Sistema de Contratación Inteligente V1

Sistema web de contratación para el restaurante La Glorieta (Guaduas, Cundinamarca, Colombia).

## Setup

### Requisitos

- Node.js 18+
- npm

### Instalación

```bash
npm install
```

### Base de datos

```bash
# Crear/migrar la base de datos
npx prisma migrate dev

# Crear usuario admin inicial
npm run db:seed
```

**Credenciales por defecto:**
- Email: `admin@laglorieta.com`
- Password: `admin123`

> Cambiar en producción.

### Variables de entorno

Copiar `.env.example` a `.env` y configurar:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Ruta de la base de datos SQLite |
| `AUTH_SECRET` | Secreto para firmar sesiones (mín. 32 caracteres) |
| `LLM_API_KEY` | API key de Anthropic o OpenAI |
| `LLM_MODEL` | Modelo a usar (ej: `claude-sonnet-4-5-20250929` o `gpt-4`) |
| `RUBRIC_VERSION` | Versión de la rúbrica de evaluación |
| `APP_BASE_URL` | URL base de la app (ej: `http://localhost:3000`) |

### Desarrollo

```bash
npm run dev
```

### Tests

```bash
npm test
```

### Build

```bash
npm run build
npm start
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Página principal |
| `/aplicar` | Entrevista para aspirantes (wizard mobile-first) |
| `/admin/login` | Login administrativo |
| `/admin/candidatos` | Panel con ranking y filtros |
| `/admin/candidatos/[id]` | Perfil detallado del candidato |

## Flujo

1. Aspirante completa entrevista en `/aplicar`
2. Sistema evalúa automáticamente con IA
3. Admin revisa en panel, toma decisión final
4. Historial y trazabilidad completa

## Documentación técnica

- [docs/PROJECT.md](docs/PROJECT.md) — Contrato técnico del sistema
- [docs/AI_RUBRIC.md](docs/AI_RUBRIC.md) — Rúbrica de evaluación IA
- [docs/INTERVIEW_SCHEMA.md](docs/INTERVIEW_SCHEMA.md) — Estructura de entrevista y definiciones técnicas

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- Zod (validacion de schemas)
- LLM configurable (Anthropic/OpenAI)

## Docker

```bash
# Build y ejecutar con Docker Compose
docker compose up --build

# O build manual
docker build -t la-glorieta .
docker run -p 3000:3000 --env-file .env la-glorieta
```

## Deploy a produccion

### Opcion 1: Vercel (recomendado)

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno en el dashboard
3. Para PostgreSQL: usar Vercel Postgres o Neon
4. Cambiar `provider = "sqlite"` a `provider = "postgresql"` en `prisma/schema.prisma`
5. Actualizar `DATABASE_URL` al connection string de PostgreSQL

### Opcion 2: Railway

1. Crear proyecto en [railway.app](https://railway.app)
2. Agregar servicio PostgreSQL
3. Conectar repositorio
4. Configurar variables de entorno
5. Railway detecta Dockerfile automaticamente

### Migracion a PostgreSQL

1. En `prisma/schema.prisma`, cambiar `provider = "sqlite"` a `provider = "postgresql"`
2. Actualizar `DATABASE_URL` con el connection string de PostgreSQL
3. Ejecutar `npx prisma migrate dev --name migrate-to-postgres`
4. Ejecutar `npm run db:seed` para crear el admin

## Health check

```bash
curl http://localhost:3000/api/health
```

Retorna: `{ status: "ok", timestamp: "...", checks: { db: "connected", ... } }`

## API Endpoints

| Endpoint | Metodo | Descripcion |
|---|---|---|
| `/api/health` | GET | Health check |
| `/api/aplicar` | POST | Enviar entrevista |
| `/api/evaluate` | POST | Evaluar candidato (interno/admin) |
| `/api/admin/login` | POST | Login admin |
| `/api/admin/logout` | POST | Logout admin |
| `/api/admin/candidates` | GET | Listar candidatos |
| `/api/admin/candidates/[id]` | GET | Detalle candidato |
| `/api/admin/candidates/[id]/decision` | POST | Registrar decision |
| `/api/admin/export-csv` | GET | Exportar CSV |
