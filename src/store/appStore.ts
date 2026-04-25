import { create } from 'zustand'
import { CalendarEvent, EventCategory, Note } from '@/lib/types'
import { storage } from '@/lib/storage'
import { generateId, CATEGORY_COLORS } from '@/lib/utils'

const ALL_CATEGORIES: EventCategory[] = ['work', 'personal', 'health', 'focus', 'social']

interface AppStore {
  // UI state
  darkMode: boolean
  notesOpen: boolean
  selectedDate: Date | null
  selectedEventId: string | null
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  selectedCategories: Set<EventCategory>

  // Data
  events: CalendarEvent[]
  notes: Note[]

  // UI actions
  toggleDark: () => void
  toggleNotes: () => void
  setSelectedDate: (date: Date | null) => void
  setSelectedEvent: (id: string | null) => void
  setView: (view: AppStore['view']) => void
  toggleCategory: (category: EventCategory) => void
  selectAllCategories: () => void
  deselectAllCategories: () => void

  // Event actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'updatedAt' | 'color'>) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  darkMode: false,
  notesOpen: false,
  selectedDate: null,
  selectedEventId: null,
  view: 'dayGridMonth',
  selectedCategories: new Set(ALL_CATEGORIES),
  events: storage.getEvents(),
  notes: storage.getNotes(),

  toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
  toggleNotes: () => set((s) => ({ notesOpen: !s.notesOpen })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
  setView: (view) => set({ view }),
  toggleCategory: (category) => set((s) => {
    const next = new Set(s.selectedCategories)
    if (next.has(category)) next.delete(category)
    else next.add(category)
    return { selectedCategories: next }
  }),
  selectAllCategories: () => set({ selectedCategories: new Set(ALL_CATEGORIES) }),
  deselectAllCategories: () => set({ selectedCategories: new Set() }),

  addEvent: (event) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: generateId(),
      color: CATEGORY_COLORS[event.category],
      updatedAt: new Date().toISOString(),
    }
    set((s) => {
      const events = [...s.events, newEvent]
      storage.setEvents(events)
      return { events }
    })
  },

  updateEvent: (id, patch) => {
    set((s) => {
      const events = s.events.map((e) =>
        e.id === id
          ? { ...e, ...patch, color: CATEGORY_COLORS[patch.category ?? e.category], updatedAt: new Date().toISOString() }
          : e
      )
      storage.setEvents(events)
      return { events }
    })
  },

  deleteEvent: (id) => {
    set((s) => {
      const events = s.events.filter((e) => e.id !== id)
      storage.setEvents(events)
      return { events }
    })
  },

  addNote: (note) => {
    const now = new Date().toISOString()
    const newNote: Note = { ...note, id: generateId(), createdAt: now, updatedAt: now }
    set((s) => {
      const notes = [...s.notes, newNote]
      storage.setNotes(notes)
      return { notes }
    })
  },

  updateNote: (id, patch) => {
    set((s) => {
      const notes = s.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      )
      storage.setNotes(notes)
      return { notes }
    })
  },

  deleteNote: (id) => {
    set((s) => {
      const notes = s.notes.filter((n) => n.id !== id)
      storage.setNotes(notes)
      return { notes }
    })
  },
}))
