import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { NotesPanel } from '@/components/notes/NotesPanel'
import { RemindersPanel } from '@/components/reminders/RemindersPanel'
import { SchoolView } from '@/components/school/SchoolView'
import { useAppStore } from '@/store/appStore'
import { syncService } from '@/lib/sync'
import '@/styles/calendar.css'

export default function App() {
  const { notesOpen, remindersOpen, view, darkMode, googleAccounts, canvasSettings, syncAllGoogleAccounts, syncCanvas } = useAppStore()

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
          {view === 'school' ? <SchoolView /> : <CalendarView />}
        </main>
        {notesOpen && <NotesPanel />}
        {remindersOpen && <RemindersPanel />}
      </div>
    </div>
  )
}
