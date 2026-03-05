# Work Hours Calendar App

## Overview

This is a work hours scheduling application built as a full-stack TypeScript monorepo. The app presents a monthly calendar view where users can click on any day to open a dialog and set work time slots (start/end times). Time slots are stored in a PostgreSQL database and can be created, deleted, or bulk-replaced for a given date.

The main feature is the calendar interface (`CalendarView`) which shows a month grid with existing time slots displayed on each day. Clicking a day opens a `WorkHourDialog` where users can add, remove, or update time slots for that day using a bulk-save approach (the entire day's slots are replaced on save).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) — single route at `/` renders `CalendarView`, with a 404 fallback
- **State & Data Fetching**: TanStack React Query v5 for server state. Custom hooks in `client/src/hooks/use-work-hours.ts` wrap all API calls
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives, styled with Tailwind CSS
- **Forms**: react-hook-form with Zod resolvers (available but not yet heavily used in existing forms — the WorkHourDialog uses local state instead)
- **Date Handling**: date-fns for all calendar math (month grids, day formatting, today checks, etc.)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages/components:**
- `client/src/pages/CalendarView.tsx` — main calendar grid, month navigation, slot grouping by date
- `client/src/components/CalendarDay.tsx` — individual day cell showing date number and time slot chips
- `client/src/components/WorkHourDialog.tsx` — modal for adding/editing slots for a selected day

### Backend Architecture

- **Runtime**: Node.js with Express 5 (TypeScript via tsx in dev, esbuild bundle in prod)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves Vite middleware (dev) or static files (prod)
- **Routing**: `server/routes.ts` registers REST endpoints using path/input definitions from `shared/routes.ts`
- **Storage layer**: `server/storage.ts` defines a `DatabaseStorage` class implementing `IStorage` interface — all DB access goes through this abstraction
- **Build**: `script/build.ts` runs Vite for client then esbuild for server; selected server deps are bundled (allowlist) while others are externalized

### Data Storage

- **Database**: PostgreSQL via `pg` (node-postgres) connection pool
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres`
- **Schema** (`shared/schema.ts`):
  ```
  time_slots
  ├── id         serial PRIMARY KEY
  ├── date       date NOT NULL        (YYYY-MM-DD string)
  ├── startTime  text NOT NULL        (e.g. "09:00")
  └── endTime    text NOT NULL        (e.g. "17:00")
  ```
- **Migrations**: Drizzle Kit (`drizzle-kit push`) — schema in `shared/schema.ts`, config in `drizzle.config.ts`
- **Zod integration**: `drizzle-zod` auto-generates `insertTimeSlotSchema` from the table definition

### API Design

Routes are defined in `shared/routes.ts` as a typed `api` object (method, path, input schema, response schemas), shared between client and server. This gives end-to-end type safety without a full RPC framework.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/time-slots?month=YYYY-MM` | List slots for a month |
| POST | `/api/time-slots` | Create a single slot |
| DELETE | `/api/time-slots/:id` | Delete a slot by ID |
| POST | `/api/time-slots/bulk` | Bulk replace all slots for a date |

The bulk-save endpoint (`bulkSave`) deletes all existing slots for a date then inserts the new set — this is the primary save path used by `WorkHourDialog`.

The `month` query param uses `YYYY-MM` format; `date` fields use `YYYY-MM-DD` strings throughout.

### Shared Code

The `shared/` directory is imported by both client and server:
- `shared/schema.ts` — Drizzle table definition + Zod schemas + TypeScript types
- `shared/routes.ts` — API contract (paths, input/output Zod schemas)

This avoids duplicating type definitions and keeps client/server in sync.

## External Dependencies

### Database
- **PostgreSQL** — required, connection via `DATABASE_URL` environment variable
- `pg` (node-postgres) — connection pooling
- `drizzle-orm` — query builder and ORM
- `drizzle-kit` — schema migrations and push

### UI & Styling
- **Radix UI** — full suite of accessible headless primitives (accordion, dialog, select, toast, etc.)
- **Tailwind CSS** — utility-first styling with CSS custom property theming (HSL variables)
- **shadcn/ui** — component patterns wrapping Radix, configured in `components.json`
- **lucide-react** — icon set
- **class-variance-authority** + **clsx** + **tailwind-merge** — conditional class utilities

### Frontend Libraries
- **@tanstack/react-query** v5 — async state and caching
- **wouter** — client-side routing
- **date-fns** — date manipulation for calendar logic
- **react-hook-form** + **@hookform/resolvers** — form management with Zod validation
- **zod** — runtime schema validation (shared across client and server)

### Dev & Build Tools
- **Vite** + **@vitejs/plugin-react** — frontend bundler and dev server
- **tsx** — TypeScript execution for dev server
- **esbuild** — server bundler for production
- **@replit/vite-plugin-runtime-error-modal** — dev error overlay
- **@replit/vite-plugin-cartographer** + **@replit/vite-plugin-dev-banner** — Replit-specific dev tools (only active in Replit environment)

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (mandatory; app throws on startup without it)