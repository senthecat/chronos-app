import { useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { NotesPanel } from '@/components/notes/NotesPanel'
import { useAppStore } from '@/store/appStore'
import { syncService } from '@/lib/sync'
import '@/styles/calendar.css'

export default function App() {
  const { notesOpen, darkMode, googleAccounts, syncAllGoogleAccounts } = useAppStore()

  useEffect(() => {
    syncService.init()
    return () => syncService.destroy()
  }, [])

  useEffect(() => {
    if (googleAccounts.length > 0) syncAllGoogleAccounts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <CalendarView />
        </main>
        {notesOpen && <NotesPanel />}
      </div>
    </div>
  )
}
