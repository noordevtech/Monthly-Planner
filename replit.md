# Work Hours Calendar App

## Overview

A multi-client monthly working calendar app with authentication and client management. Users register/login, configure their own OpenAI API key in Settings, then manage clients. Each client has their own calendar grid with time slots, tasks with AI-generated daily reports, and a monthly reports page with full PDF export.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter — routes: `/` (clients list), `/settings`, `/clients/:id/calendar`, `/clients/:id/tasks`, `/clients/:id/reports`, plus 404 fallback
- **Auth**: Session-based authentication. Unauthenticated users see AuthPage (login/register). Authenticated users see TopBar + app routes.
- **State & Data Fetching**: TanStack React Query v5 for server state. Custom hooks in `client/src/hooks/use-work-hours.ts`, `client/src/hooks/use-tasks.ts`, and `client/src/hooks/use-auth.ts`
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives, styled with Tailwind CSS
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages/components:**
- `client/src/pages/AuthPage.tsx` — login/register form, toggle between sign in and create account
- `client/src/pages/SettingsView.tsx` — OpenAI API key management (save, update, remove key)
- `client/src/pages/ClientsView.tsx` — home page: list, add, edit, delete clients; click to navigate
- `client/src/pages/CalendarView.tsx` — monthly calendar grid per client, slot grouping, PDF export; accepts `clientId` prop
- `client/src/pages/TasksView.tsx` — daily tasks CRUD per client, AI report generation; accepts `clientId` prop
- `client/src/pages/MonthlyReportsView.tsx` — monthly reports list per client, per-report download, full monthly PDF; accepts `clientId` prop
- `client/src/components/CalendarDay.tsx` — individual day cell showing date number and time slot chips
- `client/src/components/WorkHourDialog.tsx` — modal for adding/editing slots for a selected day; accepts `clientId` prop
- `client/src/App.tsx` — routing setup with TopBar (username, settings, logout), ClientNavBar for client-scoped navigation

### Backend Architecture

- **Runtime**: Node.js with Express 5 (TypeScript via tsx in dev, esbuild bundle in prod)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves Vite middleware (dev) or static files (prod)
- **Auth**: express-session with connect-pg-simple for PostgreSQL session store, bcryptjs for password hashing
- **Routing**: `server/routes.ts` registers REST endpoints; auth routes are public, all `/api/clients` routes require authentication via `requireAuth` middleware
- **Storage layer**: `server/storage.ts` defines a `DatabaseStorage` class implementing `IStorage` interface
- **Build**: `script/build.ts` runs Vite for client then esbuild for server

### Data Storage

- **Database**: PostgreSQL via `pg` (node-postgres) connection pool
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres`
- **Session Store**: connect-pg-simple (auto-creates session table)
- **Schema** (`shared/schema.ts`):
  ```
  users
  ├── id            serial PRIMARY KEY
  ├── username      text NOT NULL UNIQUE
  ├── password      text NOT NULL (bcrypt hashed)
  ├── openaiApiKey  text (nullable, user's own OpenAI key)
  └── createdAt     timestamp

  clients
  ├── id         serial PRIMARY KEY
  └── name       text NOT NULL

  time_slots
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id)
  ├── date       date NOT NULL
  ├── startTime  text NOT NULL (e.g. "8h30")
  └── endTime    text NOT NULL (e.g. "16h30")

  tasks
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id)
  ├── date       date NOT NULL
  ├── title      text NOT NULL
  └── completed  boolean NOT NULL DEFAULT false

  reports
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id)
  ├── date       date NOT NULL
  └── content    text NOT NULL
  ```

### API Design

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | No | Logout |
| GET | `/api/auth/me` | Yes | Get current user |
| PATCH | `/api/auth/settings` | Yes | Update OpenAI API key |
| GET | `/api/clients` | Yes | List all clients |
| GET | `/api/clients/:id` | Yes | Get a single client |
| POST | `/api/clients` | Yes | Create a client |
| PATCH | `/api/clients/:id` | Yes | Update a client |
| DELETE | `/api/clients/:id` | Yes | Delete a client |
| GET | `/api/clients/:clientId/time-slots?month=YYYY-MM` | Yes | List slots for a month |
| POST | `/api/clients/:clientId/time-slots` | Yes | Create a single slot |
| DELETE | `/api/clients/:clientId/time-slots/:id` | Yes | Delete a slot |
| POST | `/api/clients/:clientId/time-slots/bulk` | Yes | Bulk replace slots for a date |
| GET | `/api/clients/:clientId/tasks?date=YYYY-MM-DD` | Yes | List tasks for a date |
| POST | `/api/clients/:clientId/tasks` | Yes | Create a task |
| PATCH | `/api/clients/:clientId/tasks/:id` | Yes | Update a task |
| DELETE | `/api/clients/:clientId/tasks/:id` | Yes | Delete a task |
| POST | `/api/clients/:clientId/tasks/report` | Yes | Generate AI report (uses user's OpenAI key) |
| GET | `/api/clients/:clientId/reports?month=YYYY-MM` | Yes | List reports for a month |
| DELETE | `/api/clients/:clientId/reports/:id` | Yes | Delete a report |

### Shared Code

- `shared/schema.ts` — Drizzle table definitions + Zod schemas + TypeScript types
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
- `express-session` — session management
- `connect-pg-simple` — PostgreSQL session store
- `bcryptjs` — password hashing

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

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session secret for express-session
