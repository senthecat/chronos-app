# Chronos — Personalized Scheduling App

A clean, fast scheduling app built with React, FullCalendar, and Supabase for cross-device sync.

## Stack
- **React + Vite + TypeScript** — fast dev experience
- **FullCalendar** — month/week/day views, drag & drop
- **shadcn/ui patterns + Tailwind** — polished UI with dark mode
- **Zustand** — lightweight global state
- **Supabase** — optional realtime sync across devices
- **localStorage** — local-first, works offline

## Quick start

```bash
npm install
npm run dev
```

The app works fully offline without any sync config.

## Enable cross-device sync (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Run this SQL in the Supabase dashboard:

```sql
create table events (
  id text primary key,
  title text not null,
  start text not null,
  "end" text,
  all_day boolean default false,
  category text default 'work',
  notes text,
  color text,
  updated_at text not null
);

create table notes (
  id text primary key,
  title text not null,
  content text default '',
  linked_event_id text,
  tags jsonb default '[]',
  pinned boolean default false,
  created_at text not null,
  updated_at text not null
);

alter table events enable row level security;
alter table notes enable row level security;

-- Allow all for now (add auth later for multi-user)
create policy "allow all" on events for all using (true) with check (true);
create policy "allow all" on notes for all using (true) with check (true);
```

3. Copy your project URL and anon key from Settings → API
4. Create `.env` from `.env.example` and fill in the values
5. Restart dev server — sync runs automatically every 60 seconds

## Project structure

```
src/
  components/
    calendar/     CalendarView + EventModal
    notes/        NotesPanel
    sidebar/      Sidebar navigation
  lib/
    types.ts      TypeScript interfaces
    utils.ts      Helpers (cn, generateId, colors)
    storage.ts    localStorage wrapper
    supabase.ts   Supabase client factory
    sync.ts       Cross-device sync service
  store/
    appStore.ts   Zustand store (events, notes, UI state)
  styles/
    globals.css   CSS variables + Tailwind base
    calendar.css  FullCalendar theme overrides
```

## Features
- Month / week / day calendar views
- Click to create events, drag to move/resize
- Color-coded event categories (work, personal, health, focus, social)
- Notes panel with search and pinning
- Dark mode toggle
- Cross-device sync via Supabase (last-write-wins)
- Works fully offline with local storage
