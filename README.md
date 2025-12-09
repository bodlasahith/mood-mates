# MoodMates

## Overview

MoodMates is a simple, social mood-tracking web app where users log their daily vibe, share it with friends, and visualize emotional trends over time. It’s designed for fun, self-expression, and connection. It is both lighthearted and comprehensive.

---

## Motivation

Social media often feels performative, but traditional journaling apps feel private and serious. MoodMates strikes a balance between them. It is a minimal, emoji-based daily check-in where you and your friends can see each other’s moods in a colorful, supportive feed.

---

## User Experience & Features

### Core Interactions

- **Sign up / Login** – Secure user authentication via Supabase with email verification.
- **Log Mood** – Select emoji or color (😊 😐 😞 etc.) and add an optional short note.
- **Feed View** – See friends’ moods for the day in a scrolling, color-coded feed.
- **History View** – View your past moods as a week/month chart or color calendar.
- **Friends System** – Add or remove friends to share moods privately.

### Stretch Features (optional)

- Daily “quote of the day” pulled from a public API.
- Streak counter for consistent mood logging.

---

## Similar Apps & Differentiation

**Similar:** Daylio (private mood tracker), BeReal (social check-in).
**Different:** MoodMates focuses on simplicity and connection, no complex journaling or photo sharing, just moods, colors, and quick insights.

---

## Technical Design
- Frontend: React + Tailwind CSS (mobile-first) using @supabase/supabase-js for auth, database, and optional realtime updates.
- Backend: Minimal/optional. Most operations go directly from the client to Supabase; use Supabase Edge Functions or a small Node/Express proxy for privileged workflows if needed (e.g., friend invites/acceptance).
- Database: Supabase Postgres with RLS-enabled tables (moods, friends). Client reads/writes via SDK under RLS policies.
- Auth: Supabase Auth (email sign-up/login with verification). Sessions managed by the SDK; no custom JWT handling required.
- Realtime (optional): Subscribe to mood insert/update events for live feed updates.
- Storage (optional): Supabase Storage for avatars or media.
- External API (optional): “Quote of the Day” fetched client-side or via an Edge Function.
- Environment: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY provided via .env; service_role key never exposed client-side.
- Security: Enforce least-privilege RLS policies (users can manage only their data; feed limited to friends).

### Key Endpoints

- `POST /auth/register` – create account
- `POST /auth/login` – login
- `POST /moods` – submit daily mood
- `GET /moods` – get recent moods (feed)
- `GET /moods/:userId` – get a user’s mood history
- `POST /friends/:id` – add/accept friend
- `DELETE /friends/:id` – remove friend

---

## Design & UX Focus

- Bright, friendly color palette tied to mood levels.
- Emoji-based logging for fast, universal input.
- Calendar & chart visualizations for reflection.
- Accessible design with ARIA labels and large touch targets.

---

## Heuristic Evaluation Plan

A small usability test with 3–5 classmates performing these tasks:

1. Log a mood for today.
2. Add a friend and view their mood in the feed.
3. Review your past moods in history view.

Feedback will be rated (0–4 severity). The top five issues (e.g., unclear icons, layout bugs) will be fixed and retested in one revision cycle.

## Supabase setup (auth + database)

This project uses Supabase for authentication and as the database instead of Prisma/JWT. The frontend talks directly to Supabase using the anon key and the public URL. For production, restrict RLS policies appropriately and use server-side logic where needed.

Quick setup:

1. Create a free project at https://app.supabase.com and note the Project URL and anon public key.
2. In the Supabase SQL editor, create the tables we use (simple example):

```sql
-- users table is managed by Supabase Auth, but create a view if you like
create table if not exists moods (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id),
	emoji text,
	note text,
	created_at timestamptz default now()
);

create table if not exists friends (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id),
	friend_id uuid references auth.users(id),
	created_at timestamptz default now()
);
```

3. Enable Row Level Security (RLS) for `moods` and `friends` and add policies that allow users to insert their own records and select public friend feed per your rules. See Supabase docs about RLS.

4. Locally provide env variables for the app. Create a `.env` file in the `mood-mates` folder with:

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

5. Install deps and run locally:

```bash
cd mood-mates
npm install
npm start
```

Notes:

- The current UI is a lightweight mobile-first React app. It expects the `moods` and `friends` tables described above.
- After provisioning, you may want to tighten policies (for example, allow select on moods only for friends) and add functions for friend invites/acceptance.

## Tailwind CSS styling

The app uses Tailwind utility classes instead of bespoke CSS.

Key files:

- `tailwind.config.js` — theme customization (brand + mood palette)
- `postcss.config.js` — PostCSS pipeline (Tailwind + Autoprefixer)
- `src/index.css` — Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
- Component files use utility classes (no separate component CSS)

Development tips:

1. If classes don't apply, ensure dev deps (`tailwindcss`, `postcss`, `autoprefixer`) are installed.
2. Restart `npm start` after adding/changing config paths.
3. Purge/content is configured via `content` array in `tailwind.config.js` (covers `src/**/*.{js,jsx,ts,tsx}` and `public/index.html`).

You can extend theme tokens (colors, spacing, shadows) in `tailwind.config.js` as the design evolves.
