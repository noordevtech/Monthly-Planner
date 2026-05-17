# Monthly Planner — Claude Context

## What This App Does

A multi-client monthly work calendar app. One user account manages multiple clients. Each client has:
- A **Calendar** — monthly grid with daily time slots (start/end times). Slots can be copied across days.
- A **Tasks** page — daily to-do list with AI-generated reports (written in the client's language, appended with the task list).
- A **Reports** page — saved AI reports per date, viewable, editable, deletable, and exportable to PDF.

## Authentication

**Email/password login** (NOT Replit OIDC anymore). Uses Passport.js `LocalStrategy`.

- Login: `POST /api/login` — `{ email, password }` → sets session cookie
- Logout: `POST /api/logout` — destroys session
- User info: `GET /api/auth/user` — returns user object (no `openaiApiKey`)
- Session: stored in PostgreSQL `sessions` table via `connect-pg-simple`
- Passwords: bcrypt-hashed, stored in `users.password_hash` column (added via startup migration in `server/index.ts`)
- The auth files are in `server/replit_integrations/auth/` — `replitAuth.ts` (LocalStrategy + session), `routes.ts` (/api/auth/user), `storage.ts` (getUser/upsertUser), `index.ts` (exports)
- On server startup, `server/index.ts` runs a migration to add `password_hash` column and set the default user's hash if missing

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Wouter routing |
| UI | shadcn/ui (New York style), Radix UI, Tailwind CSS, lucide-react icons |
| State | TanStack React Query v5 |
| Backend | Node.js, Express 5, TypeScript (tsx in dev, esbuild in prod) |
| Database | PostgreSQL via `pg` + Drizzle ORM |
| Auth | Passport.js LocalStrategy + express-session |
| AI | OpenAI (`gpt-4o-mini`) — each user stores their own API key |
| PDF | jspdf |

## Key Files

```
client/src/
  App.tsx                  — routing, TopBar, ClientNavBar, LandingPage (login form)
  hooks/use-auth.ts        — useAuth hook (login/logout via POST, /api/auth/user)
  hooks/use-tasks.ts       — task CRUD hooks
  hooks/use-work-hours.ts  — time slot hooks
  pages/
    ClientsView.tsx        — home: list/add/edit/delete clients + language selector
    CalendarView.tsx       — monthly calendar grid, copy slots, PDF export
    TasksView.tsx          — daily tasks, AI report generation + display
    MonthlyReportsView.tsx — saved reports list, per-report PDF download
    SettingsView.tsx       — OpenAI API key management
  components/
    CalendarDay.tsx        — single day cell (date + time slot chips)
    WorkHourDialog.tsx     — modal to add/edit time slots for a day
    CopySlotsPicker.tsx    — overlay to copy slots to multiple other days

server/
  index.ts                 — app entry, startup migration (password_hash column)
  routes.ts                — all API routes (uses req.user.id for auth user ID)
  storage.ts               — DatabaseStorage class, IStorage interface
  db.ts                    — pool + drizzle instance (exports both `pool` and `db`)
  replit_integrations/auth/
    replitAuth.ts          — LocalStrategy, session setup, /api/login, /api/logout
    routes.ts              — /api/auth/user endpoint
    storage.ts             — getUser, upsertUser
    index.ts               — re-exports

shared/
  schema.ts                — Drizzle tables, Zod schemas, TypeScript types
  models/auth.ts           — users + sessions tables
  routes.ts                — clientApiPaths(clientId) helper
```

## Database Schema

```
users
├── id              varchar PRIMARY KEY
├── email           varchar UNIQUE
├── firstName       varchar
├── lastName        varchar
├── profileImageUrl varchar
├── openaiApiKey    text (nullable)
├── password_hash   text (nullable — added via startup migration)
├── createdAt       timestamp
└── updatedAt       timestamp

sessions
├── sid     varchar PRIMARY KEY
├── sess    jsonb NOT NULL
└── expire  timestamp NOT NULL

clients
├── id         serial PRIMARY KEY
├── name       text NOT NULL
└── language   text NOT NULL DEFAULT 'English'

time_slots
├── id         serial PRIMARY KEY
├── clientId   integer NOT NULL (FK → clients.id CASCADE)
├── date       date NOT NULL
├── startTime  text NOT NULL  (e.g. "8h30")
└── endTime    text NOT NULL  (e.g. "16h30")

tasks
├── id         serial PRIMARY KEY
├── clientId   integer NOT NULL (FK → clients.id CASCADE)
├── date       date NOT NULL
├── title      text NOT NULL
└── completed  boolean NOT NULL DEFAULT false

reports
├── id         serial PRIMARY KEY
├── clientId   integer NOT NULL (FK → clients.id CASCADE)
├── date       date NOT NULL
├── content    text NOT NULL
├── createdAt  timestamp
└── UNIQUE(clientId, date)
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/login` | Login with `{ email, password }` |
| POST | `/api/logout` | Destroy session |
| GET | `/api/auth/user` | Current user (requires auth) |
| GET/PATCH | `/api/settings` | Get/update OpenAI API key |
| GET | `/api/clients` | List clients |
| POST | `/api/clients` | Create client |
| GET/PATCH/DELETE | `/api/clients/:id` | Get/update/delete client |
| GET | `/api/clients/:id/time-slots?month=YYYY-MM` | List slots |
| POST | `/api/clients/:id/time-slots` | Create slot |
| DELETE | `/api/clients/:id/time-slots/:id` | Delete slot |
| POST | `/api/clients/:id/time-slots/bulk` | Bulk replace slots for a date |
| GET | `/api/clients/:id/tasks?date=YYYY-MM-DD` | List tasks |
| POST/PATCH/DELETE | `/api/clients/:id/tasks[/:id]` | Create/update/delete task |
| POST | `/api/clients/:id/tasks/report` | Generate AI report (upserts) |
| GET | `/api/clients/:id/reports?month=YYYY-MM` | List reports |
| GET | `/api/clients/:id/report-by-date?date=YYYY-MM-DD` | Get report by date |
| PATCH/DELETE | `/api/clients/:id/reports/:id` | Update/delete report |

## Important Details

- **User ID**: `req.user.id` (string) — not `req.user.claims.sub` (old Replit OIDC pattern)
- **Time format**: `"8h30"`, `"16h00"` — parsed in `client/src/lib/time-utils.ts`
- **Report format**: AI summary + `\n\n---\n\n**Tasks:**\n` + task list with `✅` (done) / `•` (pending)
- **Report rendering**: line-by-line — `---` → `<hr>`, `**text**` → `<strong>`
- **Report copy**: copies as rich HTML + plain text to clipboard (preserves bold/hr in Word)
- **Calendar week**: starts Sunday (`weekStartsOn: 0`)
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`
- **Environment variables**: `DATABASE_URL`, `SESSION_SECRET`
- **Dev**: `npm run dev` (tsx + Vite), **Prod**: `npm run build` then `npm start`
