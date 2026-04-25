export type EventCategory = 'work' | 'personal' | 'health' | 'focus' | 'social'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
  category: EventCategory
  notes?: string
  color?: string
  updatedAt: string
}

export interface Note {
  id: string
  title: string
  content: string
  linkedEventId?: string
  tags: string[]
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  darkMode: boolean
  defaultView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  syncProvider: 'supabase' | 'github' | 'local'
}
