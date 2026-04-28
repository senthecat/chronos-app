import { useState } from 'react'
import { X, ChevronDown, ChevronRight, RefreshCw, CheckCircle2, Circle, Megaphone } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { CanvasAnnouncement, fetchCourseAnnouncements } from '@/lib/canvas'
import { Reminder } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── date helpers (local time, no UTC drift) ──────────────────────────────────

function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayLocal(): string {
  return localDateStr(new Date())
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  const local = localDateStr(d)
  const t = todayLocal()
  if (local === t) return 'Today'
  const diff = Math.round(
    (new Date(local + 'T12:00:00').getTime() - new Date(t + 'T12:00:00').getTime()) / 86400000
  )
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatAssignmentDue(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  const time = dateStr.length > 10
    ? ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''
  return dayLabel(dateStr) + time
}

function formatPostedAt(dateStr: string): string {
  const d = new Date(dateStr)
  const local = localDateStr(d)
  const t = todayLocal()
  if (local === t) return 'Today'
  const diff = Math.round(
    (new Date(local + 'T12:00:00').getTime() - new Date(t + 'T12:00:00').getTime()) / 86400000
  )
  if (diff === -1) return 'Yesterday'
  if (diff > -7) return `${Math.abs(diff)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── sub-components ────────────────────────────────────────────────────────────

function AssignmentRow({ reminder }: { reminder: Reminder }) {
  const { toggleReminderComplete } = useAppStore()
  const isOverdue = !!reminder.dueDate &&
    localDateStr(new Date(reminder.dueDate.length <= 10 ? reminder.dueDate + 'T12:00:00' : reminder.dueDate)) < todayLocal()

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/60 transition-colors">
      <button
        onClick={() => toggleReminderComplete(reminder.id)}
        className={cn(
          'mt-0.5 shrink-0 transition-colors',
          reminder.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )}
      >
        {reminder.completed ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs leading-snug',
          reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'
        )}>
          {reminder.title}
        </p>
        {reminder.dueDate && (
          <p className={cn(
            'text-[10px] mt-0.5',
            reminder.completed
              ? 'text-muted-foreground'
              : isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
          )}>
            {reminder.completed ? 'Submitted' : formatAssignmentDue(reminder.dueDate)}
            {isOverdue && !reminder.completed ? ' · Overdue' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function AnnouncementRow({ ann }: { ann: CanvasAnnouncement }) {
  const [open, setOpen] = useState(false)
  const preview = stripHtml(ann.message)

  return (
    <div
      className="px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-1.5">
        <Megaphone size={11} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-foreground leading-snug line-clamp-2 flex-1">{ann.title}</p>
            <span className="text-[10px] text-muted-foreground shrink-0">{formatPostedAt(ann.posted_at)}</span>
          </div>
          {ann.author?.display_name && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{ann.author.display_name}</p>
          )}
          {open && preview && (
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
              {preview.slice(0, 300)}{preview.length > 300 ? '…' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── main panel ────────────────────────────────────────────────────────────────

export function ClassesPanel() {
  const {
    canvasSettings, canvasCourseSettings, reminders,
    syncCanvas, canvasSyncing,
  } = useAppStore()

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [announcementsMap, setAnnouncementsMap] = useState<Map<number, CanvasAnnouncement[]>>(new Map())
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [submittedOpen, setSubmittedOpen] = useState<Set<number>>(new Set())

  const trackedCourses = canvasCourseSettings.filter(c => c.tracked)

  const loadAnnouncements = async (courseId: number) => {
    if (!canvasSettings || announcementsMap.has(courseId) || loadingIds.has(courseId)) return
    setLoadingIds(prev => { const s = new Set(prev); s.add(courseId); return s })
    try {
      const data = await fetchCourseAnnouncements(canvasSettings.url, canvasSettings.token, courseId)
      setAnnouncementsMap(prev => new Map(prev).set(courseId, data))
    } catch {
      setAnnouncementsMap(prev => new Map(prev).set(courseId, []))
    } finally {
      setLoadingIds(prev => { const s = new Set(prev); s.delete(courseId); return s })
    }
  }

  const handleToggleCourse = (courseId: number) => {
    if (expandedId === courseId) {
      setExpandedId(null)
    } else {
      setExpandedId(courseId)
      loadAnnouncements(courseId)
    }
  }

  const toggleSubmitted = (courseId: number) => {
    setSubmittedOpen(prev => {
      const s = new Set(prev)
      s.has(courseId) ? s.delete(courseId) : s.add(courseId)
      return s
    })
  }

  return (
    <aside className="w-80 flex flex-col border-l border-border bg-card h-full shrink-0 animate-slide-in">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-foreground">Classes</h2>
          {trackedCourses.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{trackedCourses.length} tracked</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {canvasSettings && (
            <button
              onClick={syncCanvas}
              disabled={canvasSyncing}
              title="Sync Canvas"
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <RefreshCw size={13} className={canvasSyncing ? 'animate-spin' : ''} />
            </button>
          )}
          <button
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!canvasSettings ? (
          <div className="px-4 py-12 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">No Canvas account connected</p>
            <p className="text-xs text-muted-foreground">Connect via Settings.</p>
          </div>
        ) : trackedCourses.length === 0 ? (
          <div className="px-4 py-12 text-center space-y-1">
            <p className="text-sm font-medium text-foreground">No courses tracked</p>
            <p className="text-xs text-muted-foreground">Enable courses in Settings.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {trackedCourses.map(course => {
              const isExpanded = expandedId === course.id
              const courseReminders = reminders.filter(r => r.canvasCourseId === course.id)

              const pending = courseReminders
                .filter(r => !r.completed)
                .sort((a, b) => {
                  if (!a.dueDate && !b.dueDate) return 0
                  if (!a.dueDate) return 1
                  if (!b.dueDate) return -1
                  return a.dueDate < b.dueDate ? -1 : 1
                })

              const submitted = courseReminders
                .filter(r => r.completed)
                .sort((a, b) => (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1)

              const courseAnns = announcementsMap.get(course.id)
              const isLoading = loadingIds.has(course.id)
              const showSubmitted = submittedOpen.has(course.id)

              return (
                <div key={course.id}>

                  {/* Course header row */}
                  <button
                    onClick={() => handleToggleCourse(course.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: course.color }} />
                    <span className="flex-1 text-sm font-medium text-foreground truncate">{course.name}</span>
                    {pending.length > 0 && (
                      <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none shrink-0">
                        {pending.length}
                      </span>
                    )}
                    {isExpanded
                      ? <ChevronDown size={13} className="text-muted-foreground shrink-0" />
                      : <ChevronRight size={13} className="text-muted-foreground shrink-0" />
                    }
                  </button>

                  {isExpanded && (
                    <div className="bg-secondary/10 px-3 pb-3">

                      {/* Assignments */}
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 pt-3 pb-1">
                        Assignments
                      </p>

                      {pending.length === 0 && submitted.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-1">No assignments</p>
                      ) : (
                        <div className="space-y-0.5">
                          {pending.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1">All caught up</p>
                          )}
                          {pending.map(r => <AssignmentRow key={r.id} reminder={r} />)}

                          {submitted.length > 0 && (
                            <>
                              <button
                                onClick={() => toggleSubmitted(course.id)}
                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 mt-1"
                              >
                                {showSubmitted ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                                Submitted · {submitted.length}
                              </button>
                              {showSubmitted && submitted.map(r => <AssignmentRow key={r.id} reminder={r} />)}
                            </>
                          )}
                        </div>
                      )}

                      {/* Announcements */}
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 pt-4 pb-1">
                        Announcements
                      </p>

                      {isLoading ? (
                        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                          <RefreshCw size={11} className="animate-spin" />
                          Loading…
                        </div>
                      ) : !courseAnns ? (
                        <p className="text-xs text-muted-foreground px-2 py-1">Failed to load</p>
                      ) : courseAnns.length === 0 ? (
                        <p className="text-xs text-muted-foreground px-2 py-1">No recent announcements</p>
                      ) : (
                        <div className="space-y-0.5">
                          {courseAnns.map(ann => <AnnouncementRow key={ann.id} ann={ann} />)}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
