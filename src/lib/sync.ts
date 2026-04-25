import { getSupabase } from './supabase'
import { storage } from './storage'
import { CalendarEvent, Note } from './types'

class SyncService {
  private interval: ReturnType<typeof setInterval> | null = null

  init() {
    this.syncNow()
    this.interval = setInterval(() => this.syncNow(), 60_000)
  }

  destroy() {
    if (this.interval) clearInterval(this.interval)
  }

  async syncNow() {
    const sb = getSupabase()
    if (!sb) return // local-only mode, skip

    try {
      // --- Events ---
      const { data: remoteEvents } = await sb.from('events').select('*')
      if (remoteEvents) {
        const merged = this.mergeByUpdatedAt(
          storage.getEvents(),
          remoteEvents as CalendarEvent[]
        )
        storage.setEvents(merged)
      }
      const events = storage.getEvents()
      if (events.length) await sb.from('events').upsert(events)

      // --- Notes ---
      const { data: remoteNotes } = await sb.from('notes').select('*')
      if (remoteNotes) {
        const merged = this.mergeByUpdatedAt(
          storage.getNotes(),
          remoteNotes as Note[]
        )
        storage.setNotes(merged)
      }
      const notes = storage.getNotes()
      if (notes.length) await sb.from('notes').upsert(notes)

      storage.setLastSync(new Date().toISOString())
      console.info('[Chronos] Synced at', new Date().toLocaleTimeString())
    } catch (e) {
      console.warn('[Chronos] Sync failed:', e)
    }
  }

  private mergeByUpdatedAt<T extends { id: string; updatedAt: string }>(
    local: T[],
    remote: T[]
  ): T[] {
    const map = new Map<string, T>()
    for (const item of [...local, ...remote]) {
      const existing = map.get(item.id)
      if (!existing || item.updatedAt > existing.updatedAt) {
        map.set(item.id, item)
      }
    }
    return Array.from(map.values())
  }
}

export const syncService = new SyncService()
