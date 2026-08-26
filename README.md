# ACE Submission Portal

A polished, production-grade submission portal for **ACE**: students sign in with their Google account, complete a profile, pick a domain, work through tasks, and submit (PDF / links / both). Admins manage domains and tasks in a focused dashboard.

> Design source of truth: `DESIGN.md` - the VoidZero Console design system (bordered panels, monospace uppercase labels, single violet accent per screen, border-first depth, skeleton loading, restrained motion). All tokens are implemented in `src/index.css`.

---

## Stack

- **React 19 + TypeScript + Vite 6** - strict typing, `@/` path alias
- **Tailwind CSS v4** (`@tailwindcss/vite`) - design tokens via `@theme` in `src/index.css`
- **shadcn/ui-style components** (Radix primitives) - adapted to the design system, not stock defaults: `button`, `input`, `textarea`, `label`, `select`, `switch`, `checkbox`, `badge`, `card`, `dialog`, `dropdown-menu`, `avatar`, `separator`, `skeleton`
- **Supabase** - auth (Google OAuth), Postgres, Row Level Security
- **Hugging Face** - private PDF storage, proxied server-side (never a client token)

## Project layout

```
src/
  components/
    layout/        AppShell, Sidebar, Topbar, CommandPalette (⌘K), Breadcrumbs
    ui/            shadcn-style primitives adapted to DESIGN.md tokens
    auth/          RequireAuth, RequireAdmin, RequireProfile, ProfileForm
    domains/       DomainCard
    tasks/         TaskCard (timeline-style task list row)
    submission/    SubmissionPanel, PdfUpload (drag & drop + progress), LinkInput
    admin/         DomainFormDialog, TaskFormDialog, ConfirmDialog
    states/        EmptyState, ErrorState, LoadingState (skeletons)
    shared/        PageHeader, StatCell, DifficultyBadge, SubmissionStatusBadge
  pages/
    auth/          LoginPage
    student/       ProfilePage, DomainsPage, DomainTasksPage, TaskDetailPage
    admin/         AdminOverview, AdminDomains, AdminTasks
  context/         AuthContext (session + profile), ThemeContext (light/dark)
  hooks/           useFetch, useDebounce
  lib/             supabase client, types, storage service, difficulty labels, utils
supabase/
  migrations/      0001_init.sql (schema + RLS), 0002_seed.sql (dev seed data)
  functions/
    upload-pdf/    Edge Function - secure Hugging Face upload proxy
    _shared/cors.ts
```

## Getting started

### 1. Create a Supabase project

1. [supabase.com](https://supabase.com) → New project.
2. **Authentication → Providers → Google**: enable + add your Google OAuth Client ID/Secret (`https://console.cloud.google.com/apis/credentials`). Add your site origin (e.g. `http://localhost:5173`) to the Google OAuth app's authorized origins and `http://localhost:5173` redirect URI, and mirror the callback in Supabase: `Authentication → URL Configuration → Redirect URLs`.

### 2. Apply the database schema

- **Option A (CLI):** `supabase init` (link your project with `supabase link --project-ref <ref>`), then `supabase db push`.
- **Option B (dashboard):** open **SQL Editor** and paste the contents of `supabase/migrations/0001_init.sql` (schema + RLS), then optionally `0002_seed.sql` (dev seed data).

Optional seed: `select public.set_admin_role('your-email@college.edu');` - promote yourself to admin.

### 3. Configure the environment

```bash
cp .env.example .env
# Fill in from Supabase → Project Settings → API:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
```

### 4. Hugging Face private storage (server-side)

1. Create a **private dataset** at <https://huggingface.co/new-dataset> (e.g. `ace/private-submissions`).
2. Create a Hugging Face access token with **write** access to that repo.
3. Deploy the proxy + set secrets - credentials never ship to the browser:

```bash
supabase functions deploy upload-pdf
supabase secrets set HF_TOKEN=hf_xxx
supabase secrets set HF_REPO_ID=ace/private-submissions
```

The client uploads through `POST /functions/v1/upload-pdf` with the Supabase JWT; the function verifies the caller, streams the PDF to the **private** dataset repo, and returns only a reference path that is stored in `submissions.pdf_reference`.

> To test without deploying the function (e.g. `supabase functions serve`), the client `storage.ts` preview uses the same route.

### 5. Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

## Security model (never client-side only)

| Resource            | Students                                                               | Admins                                                               |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `profiles`          | read/update own row; **cannot change `role`** (trigger guard)          | read all                                                             |
| `domains`           | read `is_visible = true` only                                          | full CRUD                                                            |
| `tasks`             | read visible tasks in visible domains only                             | full CRUD                                                            |
| `submissions`       | select own, insert own, update own **failed** rows only; delete denied | full review (select/update `selected_for_interview` + `admin_notes`) |
| `interview_records` | none                                                                   | full CRUD                                                            |

Admin authorization is enforced by `public.is_admin()` (a `SECURITY DEFINER` function checking `profiles.role`), used in every policy. A student who bypasses the UI entirely still gets nothing - RLS rejects them at the database.

## Admin submissions & interview pipeline (ported from admintable-old)

- `Submissions` (`/admin/submissions`) - every student with submissions, filters (search / domain / year / selection), per-task "selected for interview" checkbox + persistent admin notes, stat cells (students, submissions, top tasks).
- `Interviews` (`/admin/interviews`) - students shortlisted for at least one task, grouped by domain, per student × domain interview-done / selected-for-ACE checkboxes and interview notes (stored in `interview_records`), plus a server-side CSV export (`export-interviews` edge function).
- `view-pdf` edge function - admin-only proxy that streams privately stored PDFs (HF_TOKEN stays server-side).
- Migration: `supabase/migrations/0004_admin_review.sql` - adds `submissions.selected_for_interview`, `submissions.admin_notes`, the `interview_records` table, and admin-only RLS + guards.

## MVP checklist (PRD §32)

Google sign-in / sign-out · protected student + admin routes · profile gate before tasks · domains & tasks served from Supabase only · per-task difficulty · per-task submission type (PDF, Link, PDF+Link) · PDF stored privately on Hugging Face via the server proxy · submission metadata in Supabase · visible submitted state everywhere · full admin CRUD + reorder + visibility for domains and tasks · loading/empty/error states · responsive (mobile-first, tables collapse) · design.md applied throughout.
