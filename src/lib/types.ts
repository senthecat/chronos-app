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
  googleEventId?: string
  googleAccountId?: string
  updatedAt: string
}

export interface GoogleTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface GoogleAccount {
  id: string
  email: string
  name: string
  clientId: string
  tokens: GoogleTokens
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

export interface CanvasSettings {
  url: string
  token: string
}

export interface CanvasCourseSettings {
  id: number
  name: string
  color: string
  tracked: boolean
}

export type ReminderPriority = 'low' | 'medium' | 'high'
export type ReminderSource = 'personal' | 'canvas'

export interface Reminder {
  id: string
  title: string
  notes?: string
  dueDate?: string
  alertMinutesBefore?: number
  completed: boolean
  priority: ReminderPriority
  source: ReminderSource
  color?: string
  canvasAssignmentId?: string
  canvasCourseId?: number
  createdAt: string
  updatedAt: string
}
