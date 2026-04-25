import { CalendarEvent, GoogleAccount, Note } from './types'

const KEYS = {
  events: 'chronos:events',
  notes: 'chronos:notes',
  lastSync: 'chronos:lastSync',
  googleAccounts: 'chronos:googleAccounts',
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
