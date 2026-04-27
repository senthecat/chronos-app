import { CalendarEvent, CanvasCourseSettings, CanvasSettings, GoogleAccount, Note, Reminder } from './types'

const KEYS = {
  events: 'chronos:events',
  notes: 'chronos:notes',
  reminders: 'chronos:reminders',
  lastSync: 'chronos:lastSync',
  googleAccounts: 'chronos:googleAccounts',
  canvasSettings: 'chronos:canvasSettings',
  canvasCourseSettings: 'chronos:canvasCourseSettings',
}

function pendingDeletesKey(accountId: string) {
  return `chronos:pendingDeletes:${accountId}`
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

  getReminders: (): Reminder[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.reminders) || '[]') }
    catch { return [] }
  },
  setReminders: (reminders: Reminder[]) =>
    localStorage.setItem(KEYS.reminders, JSON.stringify(reminders)),

  getCanvasSettings: (): CanvasSettings | null => {
    try {
      const s = localStorage.getItem(KEYS.canvasSettings)
      return s ? JSON.parse(s) : null
    } catch { return null }
  },
  setCanvasSettings: (s: CanvasSettings) =>
    localStorage.setItem(KEYS.canvasSettings, JSON.stringify(s)),
  removeCanvasSettings: () =>
    localStorage.removeItem(KEYS.canvasSettings),

  getCanvasCourseSettings: (): CanvasCourseSettings[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.canvasCourseSettings) || '[]') }
    catch { return [] }
  },
  setCanvasCourseSettings: (s: CanvasCourseSettings[]) =>
    localStorage.setItem(KEYS.canvasCourseSettings, JSON.stringify(s)),
  removeCanvasCourseSettings: () =>
    localStorage.removeItem(KEYS.canvasCourseSettings),

  getLastSync: (): string | null => localStorage.getItem(KEYS.lastSync),
  setLastSync: (ts: string) => localStorage.setItem(KEYS.lastSync, ts),

  getGoogleAccounts: (): GoogleAccount[] => {
    try { return JSON.parse(localStorage.getItem(KEYS.googleAccounts) || '[]') }
    catch { return [] }
  },
  setGoogleAccounts: (accounts: GoogleAccount[]) =>
    localStorage.setItem(KEYS.googleAccounts, JSON.stringify(accounts)),
  removeGoogleAccount: (accountId: string) => {
    const accounts = storage.getGoogleAccounts().filter(a => a.id !== accountId)
    localStorage.setItem(KEYS.googleAccounts, JSON.stringify(accounts))
    localStorage.removeItem(pendingDeletesKey(accountId))
  },

  getPendingGoogleDeletes: (accountId: string): string[] => {
    try { return JSON.parse(localStorage.getItem(pendingDeletesKey(accountId)) || '[]') }
    catch { return [] }
  },
  setPendingGoogleDeletes: (accountId: string, ids: string[]) =>
    localStorage.setItem(pendingDeletesKey(accountId), JSON.stringify(ids)),
}
