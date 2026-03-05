# Work Hours Calendar App

## Overview

A multi-client monthly working calendar app with client management. Each client has their own calendar grid with time slots, tasks with AI-generated daily reports, and a monthly reports page with full PDF export. The home page shows a list of clients; clicking a client navigates to their Calendar, Tasks, or Reports views.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter — routes: `/` (clients list), `/clients/:id/calendar`, `/clients/:id/tasks`, `/clients/:id/reports`, plus 404 fallback
- **State & Data Fetching**: TanStack React Query v5 for server state. Custom hooks in `client/src/hooks/use-work-hours.ts` and `client/src/hooks/use-tasks.ts` wrap all API calls, accepting `clientId` as first parameter
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives, styled with Tailwind CSS
- **Forms**: react-hook-form with Zod resolvers
- **Date Handling**: date-fns for all calendar math
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages/components:**
- `client/src/pages/ClientsView.tsx` — home page: list, add, edit, delete clients; click to navigate
- `client/src/pages/CalendarView.tsx` — monthly calendar grid per client, slot grouping, PDF export; accepts `clientId` prop
- `client/src/pages/TasksView.tsx` — daily tasks CRUD per client, AI report generation; accepts `clientId` prop
- `client/src/pages/MonthlyReportsView.tsx` — monthly reports list per client, per-report download, full monthly PDF; accepts `clientId` prop
- `client/src/components/CalendarDay.tsx` — individual day cell showing date number and time slot chips
- `client/src/components/WorkHourDialog.tsx` — modal for adding/editing slots for a selected day; accepts `clientId` prop
- `client/src/App.tsx` — routing setup with `ClientNavBar` component for client-scoped navigation (back to clients, Calendar/Tasks/Reports tabs)

### Backend Architecture

- **Runtime**: Node.js with Express 5 (TypeScript via tsx in dev, esbuild bundle in prod)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves Vite middleware (dev) or static files (prod)
- **Routing**: `server/routes.ts` registers REST endpoints; all resource routes are scoped under `/api/clients/:clientId/...`
- **Storage layer**: `server/storage.ts` defines a `DatabaseStorage` class implementing `IStorage` interface — all DB access goes through this abstraction; all methods accept `clientId` for scoping
- **Build**: `script/build.ts` runs Vite for client then esbuild for server

### Data Storage

- **Database**: PostgreSQL via `pg` (node-postgres) connection pool
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres`
- **Schema** (`shared/schema.ts`):
  ```
  clients
  ├── id         serial PRIMARY KEY
  └── name       text NOT NULL

  time_slots
  ├── id         serial PRIMARY KEY
  ├── clientId   integer NOT NULL (FK → clients.id)
  ├── date       date NOT NULL        (YYYY-MM-DD string)
  ├── startTime  text NOT NULL        (e.g. "8h30")
  └── endTime    text NOT NULL        (e.g. "16h30")

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
- **Migrations**: Drizzle Kit (`drizzle-kit push`)
- **Zod integration**: `drizzle-zod` auto-generates insert schemas from table definitions

### API Design

Routes are scoped by clientId. `shared/routes.ts` exports `clientApiPaths(clientId)` to generate all scoped paths for the frontend.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clients` | List all clients |
| GET | `/api/clients/:id` | Get a single client |
| POST | `/api/clients` | Create a client |
| PATCH | `/api/clients/:id` | Update a client |
| DELETE | `/api/clients/:id` | Delete a client |
| GET | `/api/clients/:clientId/time-slots?month=YYYY-MM` | List slots for a month |
| POST | `/api/clients/:clientId/time-slots` | Create a single slot |
| DELETE | `/api/clients/:clientId/time-slots/:id` | Delete a slot |
| POST | `/api/clients/:clientId/time-slots/bulk` | Bulk replace slots for a date |
| GET | `/api/clients/:clientId/tasks?date=YYYY-MM-DD` | List tasks for a date |
| POST | `/api/clients/:clientId/tasks` | Create a task |
| PATCH | `/api/clients/:clientId/tasks/:id` | Update a task |
| DELETE | `/api/clients/:clientId/tasks/:id` | Delete a task |
| POST | `/api/clients/:clientId/tasks/report` | Generate AI report from day's tasks |
| GET | `/api/clients/:clientId/reports?month=YYYY-MM` | List reports for a month |
| DELETE | `/api/clients/:clientId/reports/:id` | Delete a report |

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

### UI & Styling
- **Radix UI** — accessible headless primitives
- **Tailwind CSS** — utility-first styling with HSL CSS variable theming
- **shadcn/ui** — component patterns wrapping Radix
- **lucide-react** — icon set
- **class-variance-authority** + **clsx** + **tailwind-merge** — conditional class utilities

### Frontend Libraries
- **@tanstack/react-query** v5 — async state and caching
- **wouter** — client-side routing
- **date-fns** — date manipulation
- **react-hook-form** + **@hookform/resolvers** — form management with Zod validation
- **zod** — runtime schema validation
- **jspdf** — PDF generation for calendar and report exports

### Dev & Build Tools
- **Vite** + **@vitejs/plugin-react** — frontend bundler and dev server
- **tsx** — TypeScript execution for dev server
- **esbuild** — server bundler for production

### AI Integration
- **OpenAI** via Replit AI Integrations — used for generating daily work reports from tasks
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL` (auto-configured)

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `SESSION_SECRET` — Session secret
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (auto-configured)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (auto-configured)
