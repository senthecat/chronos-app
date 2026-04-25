import { CalendarEvent, EventCategory } from './types'

const API_BASE = 'https://www.googleapis.com/calendar/v3'

export interface GoogleEvent {
  id: string
  summary?: string
  description?: string
  colorId?: string
  status: string
  updated: string
  eventType?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

const CATEGORY_TO_COLOR_ID: Record<string, string> = {
  work: '9',      // Blueberry (dark blue ≈ indigo)
  personal: '2',  // Sage (green ≈ emerald)
  health: '5',    // Banana (yellow ≈ amber)
  focus: '3',     // Grape (purple)
  social: '4',    // Flamingo (pink)
}

const COLOR_ID_TO_CATEGORY: Record<string, EventCategory> = {
  '9': 'work', '1': 'work', '7': 'work',
  '2': 'personal', '10': 'personal',
  '5': 'health', '6': 'health',
  '3': 'focus', '8': 'focus',
  '4': 'social', '11': 'social',
}

export function toGoogleEvent(event: CalendarEvent): object {
  const isAllDay = !!event.allDay
  return {
    summary: event.title,
    description: event.notes || '',
    colorId: CATEGORY_TO_COLOR_ID[event.category] ?? '9',
    start: isAllDay
      ? { date: event.start.split('T')[0] }
      : { dateTime: event.start },
    end: isAllDay
      ? { date: (event.end || event.start).split('T')[0] }
      : { dateTime: event.end || event.start },
  }
}

export function fromGoogleEvent(g: GoogleEvent): Omit<CalendarEvent, 'id' | 'updatedAt'> {
  const allDay = !!g.start.date
  return {
    googleEventId: g.id,
    title: g.summary || '(No title)',
    start: g.start.dateTime ?? g.start.date ?? '',
    end: g.end?.dateTime ?? g.end?.date ?? undefined,
    allDay,
    category: COLOR_ID_TO_CATEGORY[g.colorId ?? ''] ?? 'work',
    notes: g.description || '',
    color: '',
  }
}

export async function getUserInfo(accessToken: string): Promise<{ email: string; name: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch Google account info')
  const data = await res.json()
  return { email: data.email as string, name: (data.name || data.email) as string }
}

async function gRequest(method: string, path: string, accessToken: string, body?: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`
    throw new Error(`Google Calendar API: ${msg}`)
  }
  return data
}

export async function listGoogleEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<GoogleEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
    showDeleted: 'true',
  })
  const data = await gRequest('GET', `/calendars/primary/events?${params}`, accessToken)
  return (data?.items ?? []) as GoogleEvent[]
}

export async function createGoogleEvent(
  accessToken: string,
  event: CalendarEvent
): Promise<string> {
  const data = await gRequest('POST', '/calendars/primary/events', accessToken, toGoogleEvent(event))
  return data.id as string
}

export async function updateGoogleEvent(
  accessToken: string,
  googleEventId: string,
  event: CalendarEvent
): Promise<void> {
  await gRequest('PUT', `/calendars/primary/events/${googleEventId}`, accessToken, toGoogleEvent(event))
}

export async function deleteGoogleEvent(
  accessToken: string,
  googleEventId: string
): Promise<void> {
  await gRequest('DELETE', `/calendars/primary/events/${googleEventId}`, accessToken)
}
