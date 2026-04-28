import { useState, useMemo, useEffect } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronRight, Circle, CheckCircle2, Bell } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
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

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

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

function defaultDueDateTime(): string {
  const d = new Date(Date.now() + 30 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDueDate(dateStr: string): string {
  const localDate = toLocalDateStr(dateStr)
  const t = todayStr()
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
    else dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return timeStr ? `${dayLabel} at ${timeStr}` : dayLabel
}

interface ItemProps {
  reminder: Reminder
  isEditing: boolean
  isOverdue: boolean
  onStartEdit: () => void
  onSave: (patch: Partial<Reminder>) => void
  onCancel: () => void
  onToggle: () => void
  onDelete: () => void
}

function ReminderItem({ reminder, isEditing, isOverdue, onStartEdit, onSave, onCancel, onToggle, onDelete }: ItemProps) {
  const [editTitle, setEditTitle] = useState(reminder.title)
  const [editDue, setEditDue] = useState(toDatetimeLocal(reminder.dueDate ?? ''))
  const [editPriority, setEditPriority] = useState<ReminderPriority>(reminder.priority)
  const [editNotes, setEditNotes] = useState(reminder.notes ?? '')
  const [editAlert, setEditAlert] = useState(reminder.alertMinutesBefore ?? 20)

  useEffect(() => {
    if (isEditing) {
      setEditTitle(reminder.title)
      setEditDue(toDatetimeLocal(reminder.dueDate ?? ''))
      setEditPriority(reminder.priority)
      setEditNotes(reminder.notes ?? '')
      setEditAlert(reminder.alertMinutesBefore ?? 20)
    }
  }, [isEditing]) // eslint-disable-line react-hooks/exhaustive-deps

  const commitSave = () => {
    if (!editTitle.trim()) return
    onSave({
      title: editTitle.trim(),
      dueDate: editDue || undefined,
      priority: editPriority,
      notes: editNotes || undefined,
      alertMinutesBefore: editAlert,
    })
  }

  if (isEditing) {
    return (
      <div className="bg-secondary/60 rounded-xl p-3 space-y-2.5 border border-border">
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitSave(); if (e.key === 'Escape') onCancel() }}
          className="w-full text-sm text-foreground bg-transparent outline-none border-b border-border pb-1.5 focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
        <input
          type="datetime-local"
          value={editDue}
          onChange={(e) => setEditDue(e.target.value)}
          className="w-full text-xs text-foreground bg-background rounded-lg px-2 py-1 outline-none focus:ring-1 ring-primary transition-all"
        />
        <div className="flex gap-1.5 items-center">
          {(['low', 'medium', 'high'] as ReminderPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setEditPriority(p)}
              className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
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
            className="text-[10px] text-foreground bg-background rounded px-1 py-0.5 outline-none focus:ring-1 ring-primary"
          >
            {ALERT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Add notes..."
          rows={2}
          className="w-full text-xs text-foreground bg-background rounded-lg px-2 py-1.5 outline-none focus:ring-1 ring-primary resize-none placeholder:text-muted-foreground transition-all"
        />
        <div className="flex justify-end gap-1.5">
          <button onClick={onCancel} className="px-2.5 py-1 text-xs rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={commitSave}
            disabled={!editTitle.trim()}
            className="px-2.5 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary transition-colors">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        className={cn('mt-0.5 shrink-0 transition-colors', reminder.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
      >
        {reminder.completed ? <CheckCircle2 size={15} /> : <Circle size={15} />}
      </button>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onStartEdit}>
        <div className="flex items-center gap-1.5">
          <span
            className={cn('text-sm truncate', reminder.completed && 'line-through text-muted-foreground')}
            style={!reminder.completed && reminder.color ? { color: reminder.color } : undefined}
          >
            {reminder.title}
          </span>
          <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY[reminder.priority].color }} />
        </div>
        {reminder.dueDate && (
          <span className={cn('text-[10px]', isOverdue && !reminder.completed ? 'text-red-500' : 'text-muted-foreground')}>
            {formatDueDate(reminder.dueDate)}
          </span>
        )}
        {reminder.notes && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{reminder.notes}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export function RemindersPanel() {
  const { reminders, canvasCourseSettings, toggleReminders, addReminder, updateReminder, deleteReminder, toggleReminderComplete } = useAppStore()

  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState(defaultDueDateTime)
  const [newPriority, setNewPriority] = useState<ReminderPriority>('medium')
  const [newAlert, setNewAlert] = useState(20)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)

  const t = todayStr()

  const trackedCourseIds = useMemo(
    () => new Set(canvasCourseSettings.filter((c) => c.tracked).map((c) => c.id)),
    [canvasCourseSettings]
  )

  const visibleReminders = useMemo(
    () => reminders.filter((r) =>
      r.source !== 'canvas' || !r.canvasCourseId || trackedCourseIds.has(r.canvasCourseId)
    ),
    [reminders, trackedCourseIds]
  )

  const { overdue, dueToday, upcoming, completed } = useMemo(() => {
    const incomplete = visibleReminders.filter((r) => !r.completed)
    return {
      overdue: incomplete
        .filter((r) => r.dueDate && toLocalDateStr(r.dueDate) < t)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1)),
      dueToday: incomplete.filter((r) => r.dueDate && toLocalDateStr(r.dueDate) === t),
      upcoming: incomplete
        .filter((r) => !r.dueDate || toLocalDateStr(r.dueDate) > t)
        .sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate < b.dueDate ? -1 : 1
        }),
      completed: visibleReminders
        .filter((r) => r.completed)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }
  }, [visibleReminders, t])

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addReminder({
      title: newTitle.trim(),
      dueDate: newDue || undefined,
      priority: newPriority,
      alertMinutesBefore: newAlert,
      completed: false,
      source: 'personal',
    })
    setNewTitle('')
    setNewDue(defaultDueDateTime())
    setNewPriority('medium')
    setNewAlert(20)
  }

  const handleSave = (id: string, patch: Partial<Reminder>) => {
    if (!patch.title?.trim()) return
    updateReminder(id, patch)
    setEditingId(null)
  }

  const incompleteCount = overdue.length + dueToday.length + upcoming.length

  const renderGroup = (label: string, items: Reminder[], accent?: string) => {
    if (items.length === 0) return null
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1" style={{ color: accent ?? 'hsl(var(--muted-foreground))' }}>
          {label} <span className="font-normal opacity-60">· {items.length}</span>
        </p>
        <div className="space-y-0.5">
          {items.map((r) => (
            <ReminderItem
              key={r.id}
              reminder={r}
              isEditing={editingId === r.id}
              isOverdue={!!r.dueDate && toLocalDateStr(r.dueDate) < t}
              onStartEdit={() => setEditingId(r.id)}
              onSave={(patch) => handleSave(r.id, patch)}
              onCancel={() => setEditingId(null)}
              onToggle={() => toggleReminderComplete(r.id)}
              onDelete={() => deleteReminder(r.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <aside className="w-72 flex flex-col border-l border-border bg-card h-full shrink-0">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-foreground">Reminders</h2>
          {incompleteCount > 0 && (
            <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
              {incompleteCount}
            </span>
          )}
        </div>
        <button onClick={toggleReminders} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Quick add */}
      <div className="px-3 pt-3 pb-3 border-b border-border space-y-2">
        <div className="flex gap-1.5">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add reminder..."
            className="flex-1 text-sm text-foreground bg-secondary rounded-lg px-3 py-1.5 outline-none focus:ring-1 ring-primary placeholder:text-muted-foreground transition-all"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="px-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
          </button>
        </div>
        <input
          type="datetime-local"
          value={newDue}
          onChange={(e) => setNewDue(e.target.value)}
          className="w-full text-xs text-foreground bg-secondary rounded-lg px-2 py-1 outline-none focus:ring-1 ring-primary transition-all"
        />
        <div className="flex items-center gap-1.5">
          {(['low', 'medium', 'high'] as ReminderPriority[]).map((p) => (
            <button
              key={p}
              onClick={() => setNewPriority(p)}
              className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                newPriority === p ? 'text-white' : 'bg-secondary text-muted-foreground hover:bg-muted'
              )}
              style={newPriority === p ? { background: PRIORITY[p].color } : {}}
            >
              {PRIORITY[p].label}
            </button>
          ))}
          <div className="flex-1" />
          <Bell size={10} className="text-muted-foreground" />
          <select
            value={newAlert}
            onChange={(e) => setNewAlert(Number(e.target.value))}
            className="text-[10px] text-foreground bg-secondary rounded px-1 py-0.5 outline-none focus:ring-1 ring-primary"
          >
            {ALERT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {visibleReminders.length === 0 && (
          <p className="text-center text-xs text-muted-foreground pt-8">No reminders yet</p>
        )}

        {renderGroup('Overdue', overdue, '#ef4444')}
        {renderGroup('Today', dueToday, 'hsl(var(--primary))')}
        {renderGroup('Upcoming', upcoming)}

        {completed.length > 0 && (
          <div>
            <button
              onClick={() => setCompletedOpen((o) => !o)}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1 hover:text-foreground transition-colors"
            >
              {completedOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              Completed · {completed.length}
            </button>
            {completedOpen && (
              <div className="space-y-0.5">
                {completed.map((r) => (
                  <ReminderItem
                    key={r.id}
                    reminder={r}
                    isEditing={editingId === r.id}
                    isOverdue={false}
                    onStartEdit={() => setEditingId(r.id)}
                    onSave={(patch) => handleSave(r.id, patch)}
                    onCancel={() => setEditingId(null)}
                    onToggle={() => toggleReminderComplete(r.id)}
                    onDelete={() => deleteReminder(r.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
