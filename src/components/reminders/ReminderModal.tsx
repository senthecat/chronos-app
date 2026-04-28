import { useState, useEffect } from 'react'
import { X, Trash2, Circle, CheckCircle2, Bell } from 'lucide-react'
import { Reminder, ReminderPriority } from '@/lib/types'
import { cn } from '@/lib/utils'

const PRIORITY: Record<ReminderPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#10b981' },
  medium: { label: 'Med', color: '#f59e0b' },
  high: { label: 'High', color: '#ef4444' },
}

const ALERT_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 120, label: '2 hr' },
  { value: 1440, label: '1 day' },
]

function toLocalDateStr(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toDatetimeLocal(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDueDateFull(dateStr: string): string {
  const localDate = toLocalDateStr(dateStr)
  const d0 = new Date(); const p0 = (n: number) => String(n).padStart(2, '0')
  const t = `${d0.getFullYear()}-${p0(d0.getMonth() + 1)}-${p0(d0.getDate())}`
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  const hasTime = dateStr.length > 10
  const timeStr = hasTime
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''

  let dayLabel: string
  if (localDate === t) dayLabel = 'Today'
  else {
    const diff = Math.round(
      (new Date(localDate + 'T12:00:00').getTime() - new Date(t + 'T12:00:00').getTime()) / 86400000
    )
    if (diff === 1) dayLabel = 'Tomorrow'
    else if (diff === -1) dayLabel = 'Yesterday'
    else dayLabel = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  }

  return timeStr ? `${dayLabel} at ${timeStr}` : dayLabel
}

interface Props {
  reminder: Reminder | null
  open: boolean
  onClose: () => void
  onSave: (id: string, patch: Partial<Reminder>) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function ReminderModal({ reminder, open, onClose, onSave, onDelete, onToggle }: Props) {
  const [editTitle, setEditTitle] = useState('')
  const [editDue, setEditDue] = useState('')
  const [editPriority, setEditPriority] = useState<ReminderPriority>('medium')
  const [editNotes, setEditNotes] = useState('')
  const [editAlert, setEditAlert] = useState(20)

  useEffect(() => {
    if (reminder) {
      setEditTitle(reminder.title)
      setEditDue(toDatetimeLocal(reminder.dueDate ?? ''))
      setEditPriority(reminder.priority)
      setEditNotes(reminder.notes ?? '')
      setEditAlert(reminder.alertMinutesBefore ?? 20)
    }
  }, [reminder?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !reminder) return null

  const localToday = (() => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` })()
  const isOverdue =
    !!reminder.dueDate &&
    toLocalDateStr(reminder.dueDate) < localToday

  const handleSave = () => {
    if (!editTitle.trim()) return
    onSave(reminder.id, {
      title: editTitle.trim(),
      dueDate: editDue || undefined,
      priority: editPriority,
      notes: editNotes || undefined,
      alertMinutesBefore: editAlert,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {reminder.source === 'canvas' ? 'Canvas Reminder' : 'Reminder'}
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Title */}
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
          placeholder="Reminder title"
          className="w-full text-sm font-medium text-foreground bg-transparent outline-none border-b border-border pb-1.5 focus:border-primary transition-colors placeholder:text-muted-foreground"
        />

        {/* Due date/time */}
        <input
          type="datetime-local"
          value={editDue}
          onChange={(e) => setEditDue(e.target.value)}
          className="w-full text-xs text-foreground bg-secondary rounded-lg px-2 py-1 outline-none focus:ring-1 ring-primary transition-all"
        />

        {/* Due label */}
        {reminder.dueDate && (
          <p className={cn('text-[10px] -mt-1', isOverdue && !reminder.completed ? 'text-red-500' : 'text-muted-foreground')}>
            {formatDueDateFull(reminder.dueDate)}{isOverdue && !reminder.completed ? ' · Overdue' : ''}
          </p>
        )}

        {/* Priority + alert */}
        <div className="flex items-center gap-1.5">
          {(['low', 'medium', 'high'] as ReminderPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setEditPriority(p)}
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                editPriority === p ? 'text-white' : 'bg-muted text-muted-foreground hover:bg-secondary'
              )}
              style={editPriority === p ? { background: PRIORITY[p].color } : {}}
            >
              {PRIORITY[p].label}
            </button>
          ))}
          <div className="flex-1" />
          <Bell size={10} className="text-muted-foreground" />
          <select
            value={editAlert}
            onChange={(e) => setEditAlert(Number(e.target.value))}
            className="text-[10px] text-foreground bg-secondary rounded px-1 py-0.5 outline-none focus:ring-1 ring-primary"
          >
            {ALERT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Add notes..."
          rows={3}
          className="w-full text-xs text-foreground bg-secondary rounded-lg px-2 py-1.5 outline-none focus:ring-1 ring-primary resize-none placeholder:text-muted-foreground transition-all"
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5">
            <button
              onClick={() => { onToggle(reminder.id); onClose() }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors',
                reminder.completed
                  ? 'bg-muted text-muted-foreground hover:text-foreground'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              {reminder.completed ? <Circle size={12} /> : <CheckCircle2 size={12} />}
              {reminder.completed ? 'Undo' : 'Complete'}
            </button>
            <button
              onClick={() => { onDelete(reminder.id); onClose() }}
              className="p-1.5 text-xs rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editTitle.trim()}
              className="px-2.5 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
