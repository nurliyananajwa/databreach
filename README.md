# PDPA Breach Response Tracker

A web-based personal data inventory and breach response system for Malaysian SMEs.
IMS568 Capstone, Faculty of Information Science, UiTM Puncak Perdana.

All businesses, people and data in this project are fictional. The system gives no
legal advice and never sends notifications.

## Tech
Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS 4, Supabase (PostgreSQL, RLS, Auth, Vault).

## Run it on your laptop
You need [Node.js 20 or newer](https://nodejs.org).

```bash
git clone https://github.com/nurliyananajwa/databreach.git
cd databreach
npm install
```

Put the `.env.local` file in the `databreach` folder. Use `.env.example` to see which values it needs. Never commit `.env.local`.

```bash
npm run dev
```

Open http://localhost:3000. To sign in before Google sign-in is set up, use **Developer sign-in** and choose a role.

## Project structure
| Folder | What is inside |
|---|---|
| `app/` | Pages: the landing page, sign-in, and the signed-in app in `app/(app)/` |
| `components/` | Shared parts such as the response clock, side menu and page header |
| `lib/` | Supabase client, current-user helpers, role menu |
| `supabase/migrations/` | Every database change, in order |
| `supabase/tests/` | RLS attack suite and scenario tests (local only) |

See `supabase/README.md` for the database design and its tests.
