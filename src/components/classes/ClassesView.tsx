import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle2, Circle, Megaphone, ChevronDown, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { CanvasAnnouncement, fetchCourseAnnouncements } from '@/lib/canvas'
import { Reminder } from '@/lib/types'
import { cn } from '@/lib/utils'

function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function todayLocal() { return localDateStr(new Date()) }

function formatDue(dateStr: string): string {
  const d = new Date(dateStr.length <= 10 ? dateStr + 'T12:00:00' : dateStr)
  const local = localDateStr(d)
  const t = todayLocal()
  let label: string
  if (local === t) label = 'Today'
  else {
    const diff = Math.round((new Date(local + 'T12:00:00').getTime() - new Date(t + 'T12:00:00').getTime()) / 86400000)
    if (diff === 1) label = 'Tomorrow'
    else if (diff === -1) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return dateStr.length > 10
    ? `${label} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : label
}

function formatPosted(dateStr: string): string {
  const d = new Date(dateStr)
  const local = localDateStr(d)
  const t = todayLocal()
  if (local === t) return 'Today'
  const diff = Math.round((new Date(local + 'T12:00:00').getTime() - new Date(t + 'T12:00:00').getTime()) / 86400000)
  if (diff === -1) return 'Yesterday'
  if (diff > -7) return `${Math.abs(diff)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function AssignmentRow({ reminder }: { reminder: Reminder }) {
  const { toggleReminderComplete } = useAppStore()
  const isOverdue = !!reminder.dueDate &&
    localDateStr(new Date(reminder.dueDate.length <= 10 ? reminder.dueDate + 'T12:00:00' : reminder.dueDate)) < todayLocal()

  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-secondary/40 transition-colors">
      <button
        onClick={() => toggleReminderComplete(reminder.id)}
        className={cn('mt-0.5 shrink-0 transition-colors', reminder.completed ? 'text-primary' : 'text-muted-foreground hover:text-primary')}
      >
        {reminder.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
          {reminder.title}
        </p>
        {reminder.dueDate && (
          <p className={cn('text-xs mt-0.5', reminder.completed ? 'text-muted-foreground' : isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
            {reminder.completed ? 'Submitted' : formatDue(reminder.dueDate)}
            {isOverdue && !reminder.completed ? ' · Overdue' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function AnnouncementCard({ ann }: { ann: CanvasAnnouncement }) {
  const [open, setOpen] = useState(false)
  const preview = stripHtml(ann.message)
  return (
    <div
      className="px-4 py-3 border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer last:border-0"
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-start gap-2">
        <Megaphone size={13} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground leading-snug">{ann.title}</p>
            <span className="text-xs text-muted-foreground shrink-0">{formatPosted(ann.posted_at)}</span>
          </div>
          {ann.author?.display_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{ann.author.display_name}</p>
          )}
          {open && preview && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {preview.slice(0, 600)}{preview.length > 600 ? '…' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ClassesView() {
  const { canvasSettings, canvasCourseSettings, reminders, syncCanvas, canvasSyncing } = useAppStore()

  const trackedCourses = canvasCourseSettings.filter(c => c.tracked)
  const [selectedId, setSelectedId] = useState<number | null>(trackedCourses[0]?.id ?? null)
  const [announcementsMap, setAnnouncementsMap] = useState<Map<number, CanvasAnnouncement[]>>(new Map())
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())
  const [submittedOpen, setSubmittedOpen] = useState(false)

  useEffect(() => {
    if (trackedCourses.length > 0 && selectedId === null) {
      setSelectedId(trackedCourses[0].id)
    }
  }, [trackedCourses.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSubmittedOpen(false)
    if (selectedId !== null) loadAnnouncements(selectedId)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!canvasSettings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">No Canvas account connected</p>
          <p className="text-xs text-muted-foreground">Connect via Settings.</p>
        </div>
      </div>
    )
  }

  if (trackedCourses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">No courses tracked</p>
          <p className="text-xs text-muted-foreground">Enable courses in Settings.</p>
        </div>
      </div>
    )
  }

  const selectedCourse = trackedCourses.find(c => c.id === selectedId) ?? null

  const pending = selectedCourse
    ? reminders
        .filter(r => r.canvasCourseId === selectedCourse.id && !r.completed)
        .sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate < b.dueDate ? -1 : 1
        })
    : []

  const submitted = selectedCourse
    ? reminders
        .filter(r => r.canvasCourseId === selectedCourse.id && r.completed)
        .sort((a, b) => (a.dueDate ?? '') < (b.dueDate ?? '') ? -1 : 1)
    : []

  const courseAnns = selectedId !== null ? announcementsMap.get(selectedId) : undefined
  const isLoadingAnns = selectedId !== null && loadingIds.has(selectedId)

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* Course list */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-card">
        <div className="px-4 py-3.5 border-b border-border flex items-center justify-between shrink-0">
          <span className="font-semibold text-sm text-foreground">Classes</span>
          <button
            onClick={syncCanvas}
            disabled={canvasSyncing}
            title="Sync Canvas"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={canvasSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {trackedCourses.map(course => {
            const count = reminders.filter(r => r.canvasCourseId === course.id && !r.completed).length
            const active = selectedId === course.id
            return (
              <button
                key={course.id}
                onClick={() => setSelectedId(course.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors',
                  active ? 'bg-accent' : 'hover:bg-secondary/50'
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: course.color }} />
                <span className={cn('flex-1 text-sm truncate', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {course.name}
                </span>
                {count > 0 && (
                  <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none shrink-0">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail pane */}
      {selectedCourse && (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedCourse.color }} />
              <h1 className="text-lg font-semibold text-foreground">{selectedCourse.name}</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Assignments card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Assignments</h2>
                  <span className="text-xs text-muted-foreground">
                    {pending.length > 0 ? `${pending.length} pending` : 'All caught up'}
                  </span>
                </div>
                <div>
                  {pending.length === 0 && submitted.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-6 text-center">No assignments found</p>
                  ) : (
                    <>
                      {pending.map(r => <AssignmentRow key={r.id} reminder={r} />)}
                      {submitted.length > 0 && (
                        <>
                          <button
                            onClick={() => setSubmittedOpen(o => !o)}
                            className="w-full flex items-center gap-1.5 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                          >
                            {submittedOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                            Submitted · {submitted.length}
                          </button>
                          {submittedOpen && submitted.map(r => <AssignmentRow key={r.id} reminder={r} />)}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Announcements card */}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-semibold text-foreground">Announcements</h2>
                </div>
                <div>
                  {isLoadingAnns ? (
                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
                      <RefreshCw size={13} className="animate-spin" /> Loading…
                    </div>
                  ) : !courseAnns ? (
                    <p className="text-sm text-muted-foreground px-4 py-6 text-center">Failed to load</p>
                  ) : courseAnns.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-4 py-6 text-center">No recent announcements</p>
                  ) : (
                    courseAnns.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
