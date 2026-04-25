# Chronos — AI Build Prompt

Use this prompt when starting a new Claude conversation to build out or extend the Chronos scheduling app.

---

## Prompt

You are helping me build **Chronos**, a personal scheduling app. Here is the complete project context:

### Tech stack
- React 18 + Vite + TypeScript
- FullCalendar v6 (dayGridPlugin, timeGridPlugin, interactionPlugin)
- Tailwind CSS with CSS custom properties for theming
- Zustand for global state (`src/store/appStore.ts`)
- Supabase for optional cross-device sync (`src/lib/sync.ts`)
- localStorage as the local-first persistence layer (`src/lib/storage.ts`)
- lucide-react for icons
- date-fns for date formatting

### Design system
- CSS variables for all colors (defined in `src/styles/globals.css`)
- Dark mode via `.dark` class on root div
- Geist font family
- Primary color: indigo (`hsl(246 83% 62%)`)
- Event categories: work (#6366f1), personal (#10b981), health (#f59e0b), focus (#8b5cf6), social (#ec4899)
- Rounded corners: `rounded-lg` (0.625rem) / `rounded-xl` for cards
- Component pattern: bg-card border-border shadow-sm

### Core data types
```typescript
interface CalendarEvent {
  id: string
  title: string
  start: string       // ISO string
  end?: string        // ISO string
  allDay?: boolean
  category: 'work' | 'personal' | 'health' | 'focus' | 'social'
  notes?: string
  color?: string      // hex, derived from category
  updatedAt: string   // ISO string, used for sync conflict resolution
}

interface Note {
  id: string
  title: string
  content: string
  linkedEventId?: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}
```

### Project structure
```
src/
  components/
    calendar/       CalendarView.tsx, EventModal.tsx
    notes/          NotesPanel.tsx
    sidebar/        Sidebar.tsx
  lib/
    types.ts        interfaces
    utils.ts        cn(), generateId(), CATEGORY_COLORS
    storage.ts      localStorage wrapper
    supabase.ts     Supabase client factory (reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    sync.ts         SyncService class (60s interval, last-write-wins merge on updatedAt)
  store/
    appStore.ts     Zustand store — events, notes, dark mode, view, selected state
  styles/
    globals.css     CSS vars, Tailwind base
    calendar.css    FullCalendar overrides
  App.tsx           Layout: Sidebar + CalendarView + optional NotesPanel
  main.tsx          React root
```

### Conventions
- Always import from `@/` (alias for `src/`)
- Use `cn()` from `@/lib/utils` for conditional classNames
- All mutations go through the Zustand store — never call `storage.*` directly from components
- When creating a new event or note, `generateId()` provides the ID; `new Date().toISOString()` provides `updatedAt`
- Tailwind only — no inline styles except for dynamic category colors
- Components are functional with hooks; no class components

### What already exists
- Full calendar with month/week/day views, drag-and-drop, click-to-create
- Event modal (create/edit/delete) with category picker and date fields
- Notes panel with list, search, inline editor, pin/delete
- Sidebar with view switcher, category legend, dark mode toggle, sync button
- Supabase sync service (runs every 60s, merges local ↔ remote by updatedAt)
- Local storage persistence (works fully offline)

---

Now, here is what I want to build next:

[DESCRIBE YOUR FEATURE HERE]

Please write clean, production-quality TypeScript code following the conventions above. If you need to create new files, place them in the appropriate directory. If you modify existing files, show the full updated file content.
