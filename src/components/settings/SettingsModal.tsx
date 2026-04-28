import { X, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { COURSE_COLORS } from '@/lib/canvas'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: Props) {
  const {
    canvasSettings, canvasCourseSettings, canvasSyncing, canvasSyncError,
    syncCanvas, updateCourseSetting,
  } = useAppStore()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* School / Canvas section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">School</h3>
                {canvasSettings && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {canvasSettings.url.replace(/^https?:\/\//, '')}
                  </p>
                )}
              </div>
              {canvasSettings && (
                <button
                  onClick={syncCanvas}
                  disabled={canvasSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={canvasSyncing ? 'animate-spin' : ''} />
                  {canvasSyncing ? 'Syncing…' : 'Sync Canvas'}
                </button>
              )}
            </div>

            {canvasSyncError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4">
                {canvasSyncError}
              </p>
            )}

            {!canvasSettings ? (
              <p className="text-sm text-muted-foreground">
                No Canvas account connected. Use the sidebar to connect your Canvas account.
              </p>
            ) : (
              <div className="bg-background border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <h4 className="text-sm font-medium text-foreground">Courses</h4>
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
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
