import { Calendar, StickyNote, Moon, Sun, Settings, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { syncService } from '@/lib/sync'
import { storage } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { EventCategory } from '@/lib/types'

const NAV_VIEWS = [
  { id: 'dayGridMonth', label: 'Month' },
  { id: 'timeGridWeek', label: 'Week' },
  { id: 'timeGridDay', label: 'Day' },
] as const

const CATEGORIES: { id: EventCategory; label: string; color: string }[] = [
  { id: 'work', label: 'Work', color: '#6366f1' },
  { id: 'personal', label: 'Personal', color: '#10b981' },
  { id: 'health', label: 'Health', color: '#f59e0b' },
  { id: 'focus', label: 'Focus', color: '#8b5cf6' },
  { id: 'social', label: 'Social', color: '#ec4899' },
]

export function Sidebar() {
  const { darkMode, notesOpen, view, selectedCategories, toggleDark, toggleNotes, setView, toggleCategory, selectAllCategories, deselectAllCategories } = useAppStore()
  const lastSync = storage.getLastSync()

  return (
    <aside className={cn(
      'w-56 flex flex-col border-r border-border bg-card h-full shrink-0',
      'transition-colors duration-200'
    )}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Calendar size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Chronos</span>
        </div>
      </div>

      {/* View switcher */}
      <div className="px-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 mb-1.5">View</p>
        <nav className="space-y-0.5">
          {NAV_VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors',
                view === v.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Categories legend */}
      <div className="px-3 pt-5">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Categories</p>
          <div className="flex gap-1">
            <button
              onClick={selectAllCategories}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              All
            </button>
            <span className="text-[10px] text-muted-foreground">/</span>
            <button
              onClick={deselectAllCategories}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              None
            </button>
          </div>
        </div>
        <div className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.has(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                  active
                    ? 'text-foreground hover:bg-secondary'
                    : 'text-muted-foreground/40 hover:bg-secondary hover:text-muted-foreground'
                )}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                  style={{ background: cat.color, opacity: active ? 1 : 0.3 }}
                />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-border pt-3">
        <button
          onClick={toggleNotes}
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
            notesOpen
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <StickyNote size={14} />
          Notes
        </button>
        <button
          onClick={() => syncService.syncNow()}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={lastSync ? `Last synced: ${new Date(lastSync).toLocaleTimeString()}` : 'Not synced yet'}
        >
          <RefreshCw size={14} />
          Sync now
        </button>
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Settings size={14} />
          Settings
        </button>
      </div>
    </aside>
  )
}
