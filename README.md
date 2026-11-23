# PDPA Breach Response Tracker

A web-based personal data inventory and breach response system for Malaysian SMEs.
It helps a small business know where its personal data is kept, respond to a data
breach within the 72-hour notification window of the Personal Data Protection Act,
and keep a record of every decision.

IMS568 Capstone, Faculty of Information Science, UiTM Puncak Perdana.

> All businesses, people and data in this project are fictional. The system stores
> metadata about personal data (field names, not real records). It suggests and
> explains; a person always decides. It never gives legal advice and never sends
> notifications itself.

## Status

| Sprint | Work | Status |
|---|---|---|
| 1 | Database, sign-in, roles, security rules (RLS), users, audit log | Done |
| – | Landing page, dashboard design (Breach Response Hub), Next.js 16 | Done |
| 2 | Data inventory | Next |
| 3 | Incidents, assessment, deadlines | Planned |
| 4 | Tasks, notification drafts and approval, breach register | Planned |
| 5 | Reports, testing, deployment | Planned |

Pages for later sprints show a "Coming in Sprint N" card.

## Who uses it

| Role | Can do |
|---|---|
| Staff | Report a breach, see their own reports and tasks |
| Compliance Officer (`dp_lead`) | Data inventory, incidents, assessment, decisions, tasks, register, reports |
| Manager | Everything the officer sees, plus approving notice drafts, users and the audit log |

People join only by invitation from a manager. A page a role may not use answers
"not found", so its existence is not revealed.

## Tech

- **Next.js 16** (App Router, TypeScript, Turbopack) and **React 19**
- **Supabase**: PostgreSQL with row-level security, Auth, Vault, pg_cron
- **Tailwind CSS 4** and plain CSS for the custom design
- Fonts: Manrope (app), Instrument Sans and Instrument Serif (landing page)

## Run it on your laptop

You need [Node.js 20.9 or newer](https://nodejs.org). Check with `node -v`.

```bash
git clone https://github.com/nurliyananajwa/databreach.git
cd databreach
npm install
```

Put the `.env.local` file in the `databreach` folder (the same folder as
`package.json`). `.env.example` lists the values it needs. Never commit `.env.local`.

```bash
npm run dev
```

Open http://localhost:3000. Until Google sign-in is switched on, open
**Development access** on the sign-in page and pick a test role.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Runs the app on your laptop, reloading as you edit |
| `npm run build` | Builds the app the way the live site runs it |
| `npm start` | Runs the built app (after `npm run build`) |
| `npm run typecheck` | Checks the TypeScript for errors |
| `npm run db:test` | Runs the database test suite on a local PostgreSQL (see `supabase/README.md`) |

### Settings (`.env.local`)

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project address |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The public key; safe in the browser because RLS protects the data |
| `DEV_LOGIN`, `DEV_TEST_PASSWORD` | Test sign-in for local work. Leave empty on the live site; it is also forced off there |
| `GOOGLE_SIGN_IN` | Set to `true` once Google sign-in is set up in Supabase |

## Project structure

```
app/
  page.tsx                 Landing page
  sign-in/                 Sign-in page and its moving data background
  not-invited/             Shown to a signed-in account nobody invited
  auth/callback/           Google sign-in returns here
  (app)/                   Everything behind sign-in
    layout.tsx             Top bar, menu, bell; the shared frame
    hub.css                The app's design (header, tabs, cards)
    home/                  Dashboard for each role
    users/                 Invite people, change roles (Manager)
    notifications/         Alerts for the signed-in person
    reports/ …             Other pages, filled in sprint by sprint
  globals.css              Base styles for every page
components/
  app/                     Top menu, page header, bell, sign-out button
  app/hub/                 Dashboard parts: cards, icons, count-up numbers, loading bar
  landing/                 Landing page sections, the 72-hour story and their styles
lib/
  auth.ts                  Who is signed in; page guards (requirePage)
  roles.ts                 The one list that drives both the menu and the page guards
  supabase/                Database client and settings check
proxy.ts                   Refreshes the session; sends signed-out visitors to sign-in
supabase/
  migrations/              Every database change, in order
  tests/                   Database test suite (local only)
mockups/                   Design mockups kept for the record (not part of the app)
```

## Security in short

- **Two locks on every page:** `proxy.ts` sends signed-out visitors to sign-in, and
  every page checks the person's role itself (`requirePage` in `lib/auth.ts`).
- **The database checks again:** row-level security on all 17 tables; every action
  is a database function that checks the caller's role. Signed-out visitors can read nothing.
- **Encrypted text:** incident descriptions and containment notes are stored
  encrypted (pgcrypto), with the key in Supabase Vault.
- **Locked history:** the audit log, decisions and inventory versions can only be
  added to, never edited; incidents are kept for 2 years after closing.
- **Tested:** 115 database tests, including attacks by each role (see `supabase/README.md`).

## Before going live (Sprint 5)

- Switch on Google sign-in and set `GOOGLE_SIGN_IN=true`.
- Leave `DEV_LOGIN` empty, and delete the test accounts or turn off password sign-in in Supabase.
- Deploy on Vercel with the two `NEXT_PUBLIC_SUPABASE_*` settings.

See `supabase/README.md` for the database design and its tests.
