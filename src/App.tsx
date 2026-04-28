import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { ClassesView } from '@/components/classes/ClassesView'
import { NotesPanel } from '@/components/notes/NotesPanel'
import { RemindersPanel } from '@/components/reminders/RemindersPanel'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { useAppStore } from '@/store/appStore'
import { syncService } from '@/lib/sync'
import { useReminderNotifications } from '@/hooks/useReminderNotifications'
import '@/styles/calendar.css'

export default function App() {
  const { notesOpen, remindersOpen, settingsOpen, view, toggleSettings, darkMode, googleAccounts, canvasSettings, syncAllGoogleAccounts, syncCanvas, reminders } = useAppStore()
  useReminderNotifications(reminders)

  useEffect(() => {
    syncService.init()
    return () => syncService.destroy()
  }, [])

  useEffect(() => {
    if (googleAccounts.length > 0) syncAllGoogleAccounts()
    if (canvasSettings) syncCanvas()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          {view === 'classes' ? <ClassesView /> : <CalendarView />}
        </main>
        {notesOpen && <NotesPanel />}
        {remindersOpen && <RemindersPanel />}
        <SettingsModal open={settingsOpen} onClose={toggleSettings} />
      </div>
    </div>
  )
}
