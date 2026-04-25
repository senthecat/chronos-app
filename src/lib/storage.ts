import { CalendarEvent, Note } from './types'

const KEYS = {
  events: 'chronos:events',
  notes: 'chronos:notes',
  lastSync: 'chronos:lastSync',
}

export const storage = {
  getEvents: (): CalendarEvent[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.events) || '[]') }
    catch { return [] }
  },
  setEvents: (events: CalendarEvent[]) =>
    localStorage.setItem(KEYS.events, JSON.stringify(events)),

  getNotes: (): Note[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.notes) || '[]') }
    catch { return [] }
  },
  setNotes: (notes: Note[]) =>
    localStorage.setItem(KEYS.notes, JSON.stringify(notes)),

  getLastSync: (): string | null => localStorage.getItem(KEYS.lastSync),
  setLastSync: (ts: string) => localStorage.setItem(KEYS.lastSync, ts),
}
