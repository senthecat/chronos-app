import { CalendarEvent } from './types'
import { GoogleAccount } from './types'
import { storage } from './storage'
import { CATEGORY_COLORS, generateId } from './utils'
import {
  listGoogleEvents,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  fromGoogleEvent,
} from './googleCalendar'

function syncWindow() {
  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setMonth(timeMin.getMonth() - 3)
  const timeMax = new Date(now)
  timeMax.setFullYear(timeMax.getFullYear() + 1)
  return { timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString() }
}

export async function performGoogleSync(
  account: GoogleAccount,
  isPrimary: boolean
): Promise<CalendarEvent[]> {
  const { accessToken } = account.tokens
  const { timeMin, timeMax } = syncWindow()

  // 1. Flush pending deletes for this account
  const pendingDeletes = storage.getPendingGoogleDeletes(account.id)
  await Promise.allSettled(
    pendingDeletes.map((gId) => deleteGoogleEvent(accessToken, gId))
  )
  storage.setPendingGoogleDeletes(account.id, [])

  // 2. Fetch Google events
  const googleEvents = await listGoogleEvents(accessToken, timeMin, timeMax)

  let local = storage.getEvents()

  // Index local events that belong to this account
  const localByGoogleId = new Map<string, CalendarEvent>()
  for (const e of local) {
    if (!e.googleEventId) continue
    if (e.googleAccountId === account.id) {
      localByGoogleId.set(e.googleEventId, e)
    } else if (!e.googleAccountId && isPrimary) {
      // Migrate pre-multi-account events to the primary account
      localByGoogleId.set(e.googleEventId, e)
    }
  }

  // 3. Process each Google event
  for (const gEvent of googleEvents) {
    const existing = localByGoogleId.get(gEvent.id)

    if (gEvent.status === 'cancelled') {
      if (existing) local = local.filter((e) => e.id !== existing.id)
      continue
    }

    // Skip read-only special event types (birthdays, holidays, out-of-office, etc.)
    const isReadOnly = gEvent.eventType && gEvent.eventType !== 'default'

    if (existing) {
      if (gEvent.updated > existing.updatedAt) {
        const patch = fromGoogleEvent(gEvent)
        local = local.map((e) =>
          e.id === existing.id
            ? {
                ...e,
                ...patch,
                id: existing.id,
                googleAccountId: account.id,
                color: CATEGORY_COLORS[patch.category],
                updatedAt: gEvent.updated,
              }
            : e
        )
      } else if (existing.updatedAt > gEvent.updated && !isReadOnly) {
        // Only push if locally modified after the last Google update
        await updateGoogleEvent(accessToken, gEvent.id, existing).catch((err) =>
          console.warn('[GoogleSync] update failed:', err)
        )
      }
    } else {
      const imported = fromGoogleEvent(gEvent)
      local.push({
        ...imported,
        id: generateId(),
        googleAccountId: account.id,
        color: CATEGORY_COLORS[imported.category],
        updatedAt: gEvent.updated,
      })
    }
  }

  // 4. Push local events explicitly assigned to this account
  const updated: CalendarEvent[] = []
  for (const e of local) {
    if (!e.googleEventId && e.googleAccountId === account.id) {
      try {
        const gId = await createGoogleEvent(accessToken, e)
        updated.push({ ...e, googleEventId: gId })
      } catch (err) {
        console.warn('[GoogleSync] create failed:', err)
        updated.push(e)
      }
    } else {
      updated.push(e)
    }
  }
  local = updated

  storage.setEvents(local)
  storage.setLastSync(new Date().toISOString())
  return local
}
