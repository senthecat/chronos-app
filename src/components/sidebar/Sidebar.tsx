import { Calendar, StickyNote, Moon, Sun, Settings, RefreshCw, CalendarPlus, X } from 'lucide-react'
import { useAppStore, availableCredentialSets } from '@/store/appStore'
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
  const {
    darkMode, notesOpen, view,
    selectedCategories,
    googleAccounts, hiddenGoogleAccounts, googleSyncing, googleSyncError,
    toggleDark, toggleNotes, setView,
    toggleCategory, selectAllCategories, deselectAllCategories,
    connectGoogleAccount, disconnectGoogleAccount, syncGoogleAccount,
    toggleGoogleAccountVisibility, showAllGoogleAccounts, hideAllGoogleAccounts,
  } = useAppStore()
  const lastSync = storage.getLastSync()

  const credSets = availableCredentialSets()
  const connectedClientIds = new Set(googleAccounts.map((a) => a.clientId))
  const nextCredSet = credSets.find((c) => !connectedClientIds.has(c.clientId))

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

      {/* Categories */}
      <div className="px-3 pt-5">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Categories</p>
          <div className="flex gap-1">
            <button onClick={selectAllCategories} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">All</button>
            <span className="text-[10px] text-muted-foreground">/</span>
            <button onClick={deselectAllCategories} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">None</button>
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
                <span className="w-2 h-2 rounded-full shrink-0 transition-opacity" style={{ background: cat.color, opacity: active ? 1 : 0.3 }} />
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

        {/* Google Calendar accounts */}
        {(googleAccounts.length > 0 || nextCredSet) && (
          <div className="mb-1">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Google Calendar</p>
              {googleAccounts.length > 1 && (
                <div className="flex gap-1">
                  <button onClick={showAllGoogleAccounts} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">All</button>
                  <span className="text-[10px] text-muted-foreground">/</span>
                  <button onClick={hideAllGoogleAccounts} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">None</button>
                </div>
              )}
            </div>

            {googleAccounts.map((account) => {
              const visible = !hiddenGoogleAccounts.has(account.id)
              return (
                <div key={account.id} className="flex items-center gap-1 px-2 py-1.5 rounded-md group hover:bg-secondary">
                  <button
                    onClick={() => toggleGoogleAccountVisibility(account.id)}
                    className={cn(
                      'flex-1 flex items-center gap-2 text-sm text-left min-w-0 transition-colors',
                      visible ? 'text-foreground' : 'text-muted-foreground/40'
                    )}
                    title={visible ? 'Hide events' : 'Show events'}
                  >
                    <span className={cn(
                      'w-2 h-2 rounded-full shrink-0 transition-opacity',
                      visible ? 'bg-green-500' : 'bg-muted-foreground/40'
                    )} />
                    <span className="truncate">{account.email}</span>
                  </button>
                  <button
                    onClick={() => syncGoogleAccount(account.id)}
                    disabled={googleSyncing}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all disabled:opacity-30"
                    title="Sync"
                  >
                    <RefreshCw size={12} className={googleSyncing ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => disconnectGoogleAccount(account.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    title="Disconnect"
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}

            {nextCredSet && (
              <button
                onClick={() => connectGoogleAccount(nextCredSet.clientId, nextCredSet.clientSecret)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <CalendarPlus size={14} />
                Add Account
              </button>
            )}

            {googleSyncError && (
              <p className="px-2 text-[10px] text-destructive truncate" title={googleSyncError}>
                {googleSyncError}
              </p>
            )}
          </div>
        )}

        {/* Show connect button only when no accounts and no cred sets shown yet */}
        {googleAccounts.length === 0 && !nextCredSet && credSets[0] && (
          <button
            onClick={() => connectGoogleAccount(credSets[0].clientId, credSets[0].clientSecret)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <CalendarPlus size={14} />
            Connect Google
          </button>
        )}

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
