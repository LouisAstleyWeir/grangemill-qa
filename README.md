# Grangemill QA System

Sample registration and quality assurance dashboard for Grangemill.

## Stack

- **Next.js 15** (App Router, server components, server actions)
- **TypeScript**
- **Supabase** (PostgreSQL, RLS, RPCs)
- **Recharts** (dashboard charts)
- **Vercel** (hosting)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Get these from your Supabase project → Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (never expose client-side)

### 3. Database

Run `grangemill_schema.sql` in the Supabase SQL editor.
This creates all tables, reference data, RLS policies, and RPC functions.

### 4. Generate TypeScript types (optional but recommended)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push to GitHub
2. Import repo in Vercel
3. Add the three environment variables in Vercel → Settings → Environment Variables
4. Deploy

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── submit/page.tsx       # New submission form (server)
│   ├── submissions/page.tsx  # Submission list with filters
│   ├── exceptions/page.tsx   # Exceptions list + resolve
│   ├── reports/page.tsx      # Charts and on-demand reports
│   ├── actions.ts            # Server actions (submit, resolve)
│   └── api/
│       ├── materials/        # Cascading dropdown: materials by category
│       └── products/         # Cascading dropdown: products by material
├── components/
│   ├── form/
│   │   ├── QAForm.tsx        # Main dynamic form — branch logic lives here
│   │   ├── SampleSelector.tsx # Category → material → product cascade
│   │   └── QuestionField.tsx  # Renders all question types
│   ├── dashboard/
│   │   ├── ReportsClient.tsx # Recharts visualisations
│   │   └── ResolveButton.tsx # Exception resolve action
│   └── ui/
│       └── Sidebar.tsx       # Nav
├── lib/
│   ├── supabase.ts           # Browser + admin Supabase clients
│   └── queries.ts            # All data fetching + branch resolution
└── types/
    ├── index.ts              # App types
    └── database.ts           # Supabase generated types (placeholder)
```

## Adding spec limits

To add min/max spec limits for automatic exception detection, update the relevant question rows:

```sql
update questions
set spec_min = 50, spec_max = 100
where field_key = 'bit_pen_mean';
```

The `raise_out_of_spec_exceptions` RPC will then auto-flag any submission where that value falls outside range.

## Adding new staff members

```sql
insert into users (id, full_name, email, role)
values (auth.uid(), 'New Person', 'new@grangemill.com', 'qa_staff');
```

Also update the `options` JSON on the `sampled_by` and `tested_by` questions:

```sql
update questions
set options = '["Jonathan Buist","Hayley Whitworth","Dominic Birch","Jonny Gregg","New Person"]'
where field_key in ('sampled_by', 'tested_by');
```
