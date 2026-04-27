import { create } from 'zustand'
import { CalendarEvent, CanvasCourseSettings, CanvasSettings, EventCategory, GoogleAccount, Note, Reminder } from '@/lib/types'
import { storage } from '@/lib/storage'
import { generateId, CATEGORY_COLORS } from '@/lib/utils'
import { getUserInfo } from '@/lib/googleCalendar'
import { performGoogleSync } from '@/lib/googleSync'
import { performCanvasSync } from '@/lib/canvasSync'

const ALL_CATEGORIES: EventCategory[] = ['work', 'personal', 'health', 'focus', 'social']

// Maps a stored clientId back to its secret at runtime via env vars
function clientSecret(clientId: string): string | undefined {
  if (clientId === import.meta.env.VITE_GOOGLE_CLIENT_ID) return import.meta.env.VITE_GOOGLE_CLIENT_SECRET
  if (clientId === import.meta.env.VITE_PERSONAL_CLIENT_ID) return import.meta.env.VITE_PERSONAL_CLIENT_SECRET
  return undefined
}

// All credential sets declared in env, in priority order
export function availableCredentialSets() {
  return [
    { clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID, clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET },
    { clientId: import.meta.env.VITE_PERSONAL_CLIENT_ID, clientSecret: import.meta.env.VITE_PERSONAL_CLIENT_SECRET },
  ].filter((s) => s.clientId && s.clientSecret)
}

interface AppStore {
  // UI state
  darkMode: boolean
  notesOpen: boolean
  remindersOpen: boolean
  selectedDate: Date | null
  selectedEventId: string | null
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'school'
  selectedCategories: Set<EventCategory>

  // Canvas state
  canvasSettings: CanvasSettings | null
  canvasCourseSettings: CanvasCourseSettings[]
  canvasSyncing: boolean
  canvasSyncError: string | null

  // Google state
  googleAccounts: GoogleAccount[]
  hiddenGoogleAccounts: Set<string>
  googleSyncing: boolean
  googleSyncError: string | null

  // Data
  events: CalendarEvent[]
  notes: Note[]
  reminders: Reminder[]

  // UI actions
  toggleDark: () => void
  toggleNotes: () => void
  toggleReminders: () => void
  setSelectedDate: (date: Date | null) => void
  setSelectedEvent: (id: string | null) => void
  setView: (view: AppStore['view']) => void
  toggleCategory: (category: EventCategory) => void
  selectAllCategories: () => void
  deselectAllCategories: () => void

  // Canvas actions
  connectCanvas: (url: string, token: string) => Promise<void>
  disconnectCanvas: () => void
  syncCanvas: () => Promise<void>
  updateCourseSetting: (courseId: number, patch: Partial<Pick<CanvasCourseSettings, 'tracked' | 'color'>>) => void

  // Google actions
  connectGoogleAccount: (clientId: string, clientSecret: string) => Promise<void>
  disconnectGoogleAccount: (accountId: string) => void
  syncGoogleAccount: (accountId: string) => Promise<void>
  syncAllGoogleAccounts: () => Promise<void>
  toggleGoogleAccountVisibility: (accountId: string) => void
  showAllGoogleAccounts: () => void
  hideAllGoogleAccounts: () => void

  // Event actions
  addEvent: (event: Omit<CalendarEvent, 'id' | 'updatedAt' | 'color'>) => void
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void

  // Reminder actions
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateReminder: (id: string, patch: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminderComplete: (id: string) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  darkMode: false,
  notesOpen: false,
  remindersOpen: false,
  selectedDate: null,
  selectedEventId: null,
  view: 'dayGridMonth',
  selectedCategories: new Set(ALL_CATEGORIES),
  canvasSettings: storage.getCanvasSettings(),
  canvasCourseSettings: storage.getCanvasCourseSettings(),
  canvasSyncing: false,
  canvasSyncError: null,
  googleAccounts: storage.getGoogleAccounts(),
  hiddenGoogleAccounts: new Set<string>(),
  googleSyncing: false,
  googleSyncError: null,
  events: storage.getEvents(),
  notes: storage.getNotes(),
  reminders: storage.getReminders(),

  toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
  toggleNotes: () => set((s) => ({ notesOpen: !s.notesOpen })),
  toggleReminders: () => set((s) => ({ remindersOpen: !s.remindersOpen })),
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

  connectGoogleAccount: async (cId, cSecret) => {
    if (!window.electronAPI) {
      set({ googleSyncError: 'Run the app with: npm run electron:dev' })
      return
    }
    set({ googleSyncError: null })
    try {
      const tokens = await window.electronAPI.startGoogleAuth(cId, cSecret)
      const { email, name } = await getUserInfo(tokens.accessToken)

      // Prevent connecting the same Google account twice
      if (get().googleAccounts.some((a) => a.email === email)) {
        set({ googleSyncError: `${email} is already connected` })
        return
      }

      const account: GoogleAccount = { id: generateId(), email, name, clientId: cId, tokens }
      set((s) => {
        const googleAccounts = [...s.googleAccounts, account]
        storage.setGoogleAccounts(googleAccounts)
        return { googleAccounts }
      })
      await get().syncGoogleAccount(account.id)
    } catch (e: unknown) {
      set({ googleSyncError: e instanceof Error ? e.message : 'Connection failed' })
    }
  },

  disconnectGoogleAccount: (accountId) => {
    storage.removeGoogleAccount(accountId)
    set((s) => ({
      googleAccounts: s.googleAccounts.filter((a) => a.id !== accountId),
      googleSyncError: null,
    }))
  },

  syncGoogleAccount: async (accountId) => {
    if (!window.electronAPI) return
    set({ googleSyncing: true, googleSyncError: null })
    try {
      const accounts = storage.getGoogleAccounts()
      let account = accounts.find((a) => a.id === accountId)
      if (!account) throw new Error('Account not found')

      // Refresh token if expiring within 60 s
      if (account.tokens.expiresAt < Date.now() + 60_000) {
        const secret = clientSecret(account.clientId)
        if (!secret) throw new Error('Client secret not found for this account')
        const refreshed = await window.electronAPI.refreshGoogleToken(account.clientId, secret, account.tokens.refreshToken)
        account = { ...account, tokens: { ...account.tokens, ...refreshed } }
        const updated = accounts.map((a) => (a.id === accountId ? account! : a))
        storage.setGoogleAccounts(updated)
        set({ googleAccounts: updated })
      }

      const isPrimary = accounts[0]?.id === accountId
      const synced = await performGoogleSync(account, isPrimary)
      set({ events: synced })
    } catch (e: unknown) {
      set({ googleSyncError: e instanceof Error ? e.message : 'Sync failed' })
    } finally {
      set({ googleSyncing: false })
    }
  },

  syncAllGoogleAccounts: async () => {
    const { googleAccounts, syncGoogleAccount } = get()
    for (const account of googleAccounts) {
      await syncGoogleAccount(account.id)
    }
  },

  toggleGoogleAccountVisibility: (accountId) => set((s) => {
    const next = new Set(s.hiddenGoogleAccounts)
    if (next.has(accountId)) next.delete(accountId)
    else next.add(accountId)
    return { hiddenGoogleAccounts: next }
  }),
  showAllGoogleAccounts: () => set({ hiddenGoogleAccounts: new Set() }),
  hideAllGoogleAccounts: () => set((s) => ({
    hiddenGoogleAccounts: new Set(s.googleAccounts.map((a) => a.id)),
  })),

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
      const event = s.events.find((e) => e.id === id)
      if (event?.googleEventId && event?.googleAccountId) {
        const pending = storage.getPendingGoogleDeletes(event.googleAccountId)
        storage.setPendingGoogleDeletes(event.googleAccountId, [...pending, event.googleEventId])
      }
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

  addReminder: (reminder) => {
    const now = new Date().toISOString()
    const newReminder: Reminder = { ...reminder, id: generateId(), createdAt: now, updatedAt: now }
    set((s) => {
      const reminders = [...s.reminders, newReminder]
      storage.setReminders(reminders)
      return { reminders }
    })
  },

  updateReminder: (id, patch) => {
    set((s) => {
      const reminders = s.reminders.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      )
      storage.setReminders(reminders)
      return { reminders }
    })
  },

  deleteReminder: (id) => {
    set((s) => {
      const reminders = s.reminders.filter((r) => r.id !== id)
      storage.setReminders(reminders)
      return { reminders }
    })
  },

  toggleReminderComplete: (id) => {
    set((s) => {
      const reminders = s.reminders.map((r) =>
        r.id === id ? { ...r, completed: !r.completed, updatedAt: new Date().toISOString() } : r
      )
      storage.setReminders(reminders)
      return { reminders }
    })
  },

  connectCanvas: async (url, token) => {
    if (!window.electronAPI) {
      set({ canvasSyncError: 'Run the app with: npm run electron:dev' })
      return
    }
    set({ canvasSyncing: true, canvasSyncError: null })
    try {
      const settings: CanvasSettings = { url: url.trim(), token: token.trim() }
      const { reminders, courseSettings } = await performCanvasSync(settings, [])
      storage.setCanvasSettings(settings)
      storage.setCanvasCourseSettings(courseSettings)
      set({ canvasSettings: settings, canvasCourseSettings: courseSettings, reminders })
    } catch (e: unknown) {
      set({ canvasSyncError: e instanceof Error ? e.message : 'Failed to connect to Canvas' })
    } finally {
      set({ canvasSyncing: false })
    }
  },

  disconnectCanvas: () => {
    storage.removeCanvasSettings()
    storage.removeCanvasCourseSettings()
    const reminders = storage.getReminders().filter((r) => r.source !== 'canvas')
    storage.setReminders(reminders)
    set({ canvasSettings: null, canvasCourseSettings: [], canvasSyncError: null, reminders })
  },

  syncCanvas: async () => {
    const { canvasSettings, canvasCourseSettings } = get()
    if (!canvasSettings || !window.electronAPI) return
    set({ canvasSyncing: true, canvasSyncError: null })
    try {
      const { reminders, courseSettings } = await performCanvasSync(canvasSettings, canvasCourseSettings)
      storage.setCanvasCourseSettings(courseSettings)
      set({ reminders, canvasCourseSettings: courseSettings })
    } catch (e: unknown) {
      set({ canvasSyncError: e instanceof Error ? e.message : 'Canvas sync failed' })
    } finally {
      set({ canvasSyncing: false })
    }
  },

  updateCourseSetting: (courseId, patch) => {
    set((s) => {
      const canvasCourseSettings = s.canvasCourseSettings.map((c) =>
        c.id === courseId ? { ...c, ...patch } : c
      )
      storage.setCanvasCourseSettings(canvasCourseSettings)

      // On color change, update reminder colors immediately (no re-sync needed)
      let { reminders } = s
      if (patch.color !== undefined) {
        reminders = reminders.map((r) =>
          r.source === 'canvas' && r.canvasCourseId === courseId ? { ...r, color: patch.color } : r
        )
        storage.setReminders(reminders)
      }

      return { canvasCourseSettings, reminders }
    })
  },
}))
