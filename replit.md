# Work Hours Calendar App

## Overview

A multi-client monthly working calendar app with Replit Auth (OIDC) and client management. Users sign in via Replit, configure their own OpenAI API key in Settings, then manage clients. Each client has a configurable report language, their own calendar grid with time slots, tasks with AI-generated daily reports (written in the client's language), and a monthly reports page with full PDF export.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter — routes: `/` (clients list), `/settings`, `/clients/:id/calendar`, `/clients/:id/tasks`, `/clients/:id/reports`, plus 404 fallback
- **Auth**: Replit Auth (OIDC). Unauthenticated users see a landing page with "Sign In with Replit" link to `/api/login`. Authenticated users see TopBar + app routes. Logout redirects to `/api/logout`.
- **State & Data Fetching**: TanStack React Query v5 for server state. Custom hooks in `client/src/hooks/use-work-hours.ts`, `client/src/hooks/use-tasks.ts`, and `client/src/hooks/use-auth.ts`
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives, styled with Tailwind CSS
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages/components:**
- `client/src/pages/SettingsView.tsx` — OpenAI API key management (save, update, remove key)
- `client/src/pages/ClientsView.tsx` — home page: list, add, edit, delete clients with language selector; click to navigate
- `client/src/pages/CalendarView.tsx` — monthly calendar grid per client, slot grouping, PDF export; accepts `clientId` prop
- `client/src/pages/TasksView.tsx` — daily tasks CRUD per client, AI report generation; accepts `clientId` prop
- `client/src/pages/MonthlyReportsView.tsx` — monthly reports list per client, per-report download, full monthly PDF; accepts `clientId` prop
- `client/src/components/CalendarDay.tsx` — individual day cell showing date number and time slot chips
- `client/src/components/WorkHourDialog.tsx` — modal for adding/editing slots for a selected day; accepts `clientId` prop
- `client/src/App.tsx` — routing setup with TopBar (user avatar, settings, logout), ClientNavBar for client-scoped navigation

### Backend Architecture

- **Runtime**: Node.js with Express 5 (TypeScript via tsx in dev, esbuild bundle in prod)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves Vite middleware (dev) or static files (prod)
- **Auth**: Replit Auth via OIDC (openid-client + passport), express-session with connect-pg-simple for PostgreSQL session store
- **Auth integration files**: `server/replit_integrations/auth/` — replitAuth.ts (setup, middleware), storage.ts (user upsert), routes.ts (/api/auth/user), index.ts (exports)
- **Routing**: `server/routes.ts` registers REST endpoints; auth routes handled by Replit Auth integration, all `/api/clients` routes require `isAuthenticated` middleware
- **Storage layer**: `server/storage.ts` defines a `DatabaseStorage` class implementing `IStorage` interface
- **Build**: `script/build.ts` runs Vite for client then esbuild for server

### Data Storage

- **Database**: PostgreSQL via `pg` (node-postgres) connection pool
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres`
- **Session Store**: connect-pg-simple (sessions table mandatory for Replit Auth)
- **Schema** (`shared/schema.ts` + `shared/models/auth.ts`):
  ```
  users (Replit Auth — shared/models/auth.ts)
  ├── id              varchar PRIMARY KEY (UUID from Replit)
  ├── email           varchar UNIQUE
  ├── firstName       varchar
  ├── lastName        varchar
  ├── profileImageUrl varchar
  ├── openaiApiKey    text (nullable, user's own OpenAI key)
  ├── createdAt       timestamp
  └── updatedAt       timestamp

  sessions (Replit Auth — shared/models/auth.ts)
  ├── sid     varchar PRIMARY KEY
  ├── sess    jsonb NOT NULL
  └── expire  timestamp NOT NULL

  clients
  ├── id         serial PRIMARY KEY
  ├── name       text NOT NULL
  ├── language   text NOT NULL DEFAULT 'English'
  └── createdAt  timestamp

  time_slots
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id, CASCADE)
  ├── date       date NOT NULL
  ├── startTime  text NOT NULL (e.g. "8h30")
  └── endTime    text NOT NULL (e.g. "16h30")

  tasks
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id, CASCADE)
  ├── date       date NOT NULL
  ├── title      text NOT NULL
  └── completed  boolean NOT NULL DEFAULT false

  reports
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id, CASCADE)
  ├── date       date NOT NULL
  ├── content    text NOT NULL
  └── createdAt  timestamp
  ```

### API Design

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/login` | No | Redirect to Replit OIDC login |
| GET | `/api/callback` | No | OIDC callback, redirects to / |
| GET | `/api/logout` | No | Logout + OIDC end session |
| GET | `/api/auth/user` | Yes | Get current user profile |
| GET | `/api/settings` | Yes | Get settings (hasOpenaiKey) |
| PATCH | `/api/settings` | Yes | Update OpenAI API key |
| GET | `/api/clients` | Yes | List all clients |
| GET | `/api/clients/:id` | Yes | Get a single client |
| POST | `/api/clients` | Yes | Create a client (name, language) |
| PATCH | `/api/clients/:id` | Yes | Update a client (name, language) |
| DELETE | `/api/clients/:id` | Yes | Delete a client |
| GET | `/api/clients/:clientId/time-slots?month=YYYY-MM` | Yes | List slots for a month |
| POST | `/api/clients/:clientId/time-slots` | Yes | Create a single slot |
| DELETE | `/api/clients/:clientId/time-slots/:id` | Yes | Delete a slot |
| POST | `/api/clients/:clientId/time-slots/bulk` | Yes | Bulk replace slots for a date |
| GET | `/api/clients/:clientId/tasks?date=YYYY-MM-DD` | Yes | List tasks for a date |
| POST | `/api/clients/:clientId/tasks` | Yes | Create a task |
| PATCH | `/api/clients/:clientId/tasks/:id` | Yes | Update a task |
| DELETE | `/api/clients/:clientId/tasks/:id` | Yes | Delete a task |
| POST | `/api/clients/:clientId/tasks/report` | Yes | Generate AI report (uses user's OpenAI key, writes in client's language) |
| GET | `/api/clients/:clientId/reports?month=YYYY-MM` | Yes | List reports for a month |
| DELETE | `/api/clients/:clientId/reports/:id` | Yes | Delete a report |

### Shared Code

- `shared/schema.ts` — Drizzle table definitions + Zod schemas + TypeScript types (re-exports from shared/models/auth.ts)
- `shared/models/auth.ts` — Replit Auth users + sessions Drizzle tables
- `shared/routes.ts` — `clientApiPaths(clientId)` helper for generating scoped API URLs

### Time Format

Time values use format like "8h30", "11h00", "16h30" — parsed in `client/src/lib/time-utils.ts`.

## External Dependencies

### Database
- **PostgreSQL** — required, connection via `DATABASE_URL` environment variable
- `pg` (node-postgres) — connection pooling
- `drizzle-orm` — query builder and ORM
- `drizzle-kit` — schema migrations and push

### Authentication
- `openid-client` — Replit OIDC client
- `passport` — authentication middleware
- `express-session` — session management
- `connect-pg-simple` — PostgreSQL session store
- `memoizee` — memoization for OIDC config

### UI & Styling
- **Radix UI** — accessible headless primitives
- **Tailwind CSS** — utility-first styling with HSL CSS variable theming
- **shadcn/ui** — component patterns wrapping Radix
- **lucide-react** — icon set

### Frontend Libraries
- **@tanstack/react-query** v5 — async state and caching
- **wouter** — client-side routing
- **date-fns** — date manipulation
- **zod** — runtime schema validation
- **jspdf** — PDF generation for calendar and report exports

### AI Integration
- **OpenAI** — used for generating daily work reports from tasks
- Each user stores their own OpenAI API key in their user profile (Settings page)
- The report generation endpoint reads the user's key from the database
- Reports are written in the client's configured language

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session secret for express-session
