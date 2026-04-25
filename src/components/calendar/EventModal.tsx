import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { CalendarEvent, EventCategory } from '@/lib/types'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/lib/utils'

const CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'work', label: 'Work', color: '#6366f1' },
  { value: 'personal', label: 'Personal', color: '#10b981' },
  { value: 'health', label: 'Health', color: '#f59e0b' },
  { value: 'focus', label: 'Focus', color: '#8b5cf6' },
  { value: 'social', label: 'Social', color: '#ec4899' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<CalendarEvent, 'id' | 'updatedAt' | 'color'>) => void
  onDelete: (id: string) => void
  event: CalendarEvent | null
  defaultRange: { start: string; end: string } | null
}

export function EventModal({ open, onClose, onSave, onDelete, event, defaultRange }: Props) {
  const { googleAccounts } = useAppStore()

  const [title, setTitle] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [category, setCategory] = useState<EventCategory>('work')
  const [notes, setNotes] = useState('')
  const [googleAccountId, setGoogleAccountId] = useState('')

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setStart(event.start.slice(0, 16))
      setEnd(event.end?.slice(0, 16) ?? '')
      setAllDay(event.allDay ?? false)
      setCategory(event.category)
      setNotes(event.notes ?? '')
      setGoogleAccountId(event.googleAccountId ?? '')
    } else if (defaultRange) {
      setTitle('')
      setStart(defaultRange.start.slice(0, 16))
      setEnd(defaultRange.end.slice(0, 16))
      setAllDay(false)
      setCategory('work')
      setNotes('')
      setGoogleAccountId(googleAccounts[0]?.id ?? '')
    }
  }, [event, defaultRange, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  // Google-synced events: account is fixed (can't move between calendars)
  const isGoogleEvent = !!event?.googleEventId
  // Local events (new or not yet synced): user can pick which account
  const canChangeAccount = !isGoogleEvent && googleAccounts.length > 0

  const handleSave = () => {
    if (!title.trim()) return
    // For Google-synced events don't override the existing googleAccountId
    const accountPatch = isGoogleEvent ? {} : { googleAccountId: googleAccountId || undefined }
    onSave({ title: title.trim(), start, end: end || undefined, allDay, category, notes, ...accountPatch })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">{event ? 'Edit event' : 'New event'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full bg-transparent text-base font-medium text-foreground placeholder:text-muted-foreground outline-none border-b border-border pb-2 focus:border-primary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />

          {/* Category pills */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  category === cat.value
                    ? 'text-white shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                )}
                style={category === cat.value ? { background: cat.color } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Calendar account selector */}
          {googleAccounts.length > 0 && (
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Calendar</label>
              {isGoogleEvent ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {googleAccounts.find((a) => a.id === googleAccountId)?.email ?? 'Google Calendar'}
                  </span>
                </div>
              ) : (
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  <button
                    onClick={() => setGoogleAccountId('')}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                      googleAccountId === ''
                        ? 'bg-secondary text-foreground ring-1 ring-border shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:bg-muted'
                    )}
                  >
                    Local only
                  </button>
                  {canChangeAccount && googleAccounts.map((acct) => (
                    <button
                      key={acct.id}
                      onClick={() => setGoogleAccountId(acct.id)}
                      title={acct.email}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium transition-all max-w-[160px] truncate',
                        googleAccountId === acct.id
                          ? 'text-white shadow-sm'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                      )}
                      style={googleAccountId === acct.id ? { background: '#4285f4' } : {}}
                    >
                      {acct.email.split('@')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Start</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full mt-1 text-sm text-foreground bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-1 ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">End</label>
              <input
                type={allDay ? 'date' : 'datetime-local'}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full mt-1 text-sm text-foreground bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-1 ring-primary transition-all"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="accent-primary" />
            All day
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={3}
            className="w-full text-sm text-foreground bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-1 ring-primary transition-all resize-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          {event ? (
            <button
              onClick={() => onDelete(event.id)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
