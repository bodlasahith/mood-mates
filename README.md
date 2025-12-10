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
- **Feed View** – See friends’ moods for the day in a scrolling feed.
- **History View** – View your past moods.
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
- Backend: Minimal/optional. Most operations go directly from the client via Express backend to Supabase
- Database: Supabase Postgres with RLS-enabled tables (moods, friends)
- Auth: Supabase Auth (email sign-up/login with verification)
- External API (optional): “Quote of the Day” fetched client-side or via an Edge Function.
- Environment: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY provided via .env

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

## Tailwind CSS styling

The app uses Tailwind utility classes instead of bespoke CSS.

Key files:

- `tailwind.config.js` — theme customization (brand + mood palette)
- `postcss.config.js` — PostCSS pipeline (Tailwind + Autoprefixer)
- `src/index.css` — Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
- Component files use utility classes (no separate component CSS)
