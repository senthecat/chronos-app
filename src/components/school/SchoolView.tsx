import { RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { COURSE_COLORS } from '@/lib/canvas'
import { cn } from '@/lib/utils'

export function SchoolView() {
  const {
    canvasSettings, canvasCourseSettings, canvasSyncing, canvasSyncError,
    syncCanvas, updateCourseSetting,
  } = useAppStore()

  if (!canvasSettings) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">No Canvas account connected</p>
          <p className="text-xs text-muted-foreground">Use the sidebar to connect your Canvas account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">School</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {canvasSettings.url.replace(/^https?:\/\//, '')}
            </p>
          </div>
          <button
            onClick={syncCanvas}
            disabled={canvasSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={canvasSyncing ? 'animate-spin' : ''} />
            {canvasSyncing ? 'Syncing…' : 'Sync Canvas'}
          </button>
        </div>

        {canvasSyncError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{canvasSyncError}</p>
        )}

        {/* Course list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-medium text-foreground">Courses</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle tracking and assign a color. Assignments appear as high-priority reminders.
            </p>
          </div>

          {canvasCourseSettings.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-8 text-center">
              No courses found — try syncing.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {canvasCourseSettings.map((course) => (
                <div key={course.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={course.tracked}
                    onChange={() => updateCourseSetting(course.id, { tracked: !course.tracked })}
                    className="accent-primary shrink-0"
                  />
                  <p
                    className="flex-1 text-sm font-medium truncate transition-colors"
                    style={{ color: course.tracked ? course.color : 'hsl(var(--muted-foreground))' }}
                  >
                    {course.name}
                  </p>
                  <div className="flex gap-1 flex-wrap justify-end shrink-0">
                    {COURSE_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateCourseSetting(course.id, { color: c })}
                        title={c}
                        className={cn(
                          'w-3.5 h-3.5 rounded-full transition-transform',
                          course.color === c
                            ? 'scale-125 ring-2 ring-offset-1 ring-foreground/30'
                            : 'hover:scale-110'
                        )}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
