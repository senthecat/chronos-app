import { useEffect, useRef } from 'react'
import { Reminder } from '@/lib/types'

const STORAGE_KEY = 'chronos:notified-reminders'

function loadNotified(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveNotified(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-500)))
}

function dueDateMs(dueDate: string): number {
  // Bare date string (YYYY-MM-DD) treated as local midnight
  return new Date(dueDate.length <= 10 ? dueDate + 'T00:00:00' : dueDate).getTime()
}

export function useReminderNotifications(reminders: Reminder[]) {
  const notified = useRef<Set<string>>(loadNotified())

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      const now = Date.now()

      for (const r of reminders) {
        if (r.completed || !r.dueDate) continue

        const alertMs = (r.alertMinutesBefore ?? 20) * 60 * 1000
        const dueMs = dueDateMs(r.dueDate)
        const alertAt = dueMs - alertMs
        // Fire if we're inside the alert window (alertAt to alertAt+65s covers a 30s poll interval)
        const key = `${r.id}:${r.dueDate}:${r.alertMinutesBefore ?? 20}`
        if (now >= alertAt && now < alertAt + 65_000 && !notified.current.has(key)) {
          notified.current.add(key)
          saveNotified(notified.current)

          const minutesLeft = Math.max(0, Math.round((dueMs - now) / 60_000))
          const body = minutesLeft > 0
            ? `Due in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`
            : 'Due now!'
          try {
            new Notification(`🔔 ${r.title}`, { body })
          } catch {
            // Notification may be blocked; fail silently
          }
        }
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => clearInterval(id)
  }, [reminders])
}
