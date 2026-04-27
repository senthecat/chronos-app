import { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { useAppStore } from '@/store/appStore'
import { EventModal } from './EventModal'
import { CalendarEvent, Reminder } from '@/lib/types'

function reminderColor(r: Reminder): string {
  if (r.color) return r.color
  if (r.priority === 'high') return '#ef4444'
  if (r.priority === 'medium') return '#f59e0b'
  return '#6b7280'
}

export function CalendarView() {
  const { events, reminders, view: appView, selectedCategories, hiddenGoogleAccounts, addEvent, updateEvent, deleteEvent } = useAppStore()
  const view = (appView === 'school' ? 'dayGridMonth' : appView) as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  const calendarRef = useRef<FullCalendar>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)

  // Map store events → FullCalendar format, filtered by selected categories and account visibility
  const fcEvents = events
    .filter((e) => selectedCategories.has(e.category))
    .filter((e) => !e.googleAccountId || !hiddenGoogleAccounts.has(e.googleAccountId))
    .map((e) => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color,
      borderColor: e.color,
      extendedProps: { isReminder: false },
    }))

  // Non-completed reminders with a due date shown as read-only visual indicators.
  // These are local-only and never synced to Google Calendar.
  const fcReminders = reminders
    .filter((r) => !r.completed && !!r.dueDate)
    .map((r) => {
      const color = reminderColor(r)
      return {
        id: `reminder::${r.id}`,
        title: `🔔 ${r.title}`,
        start: r.dueDate!,
        allDay: true,
        editable: false,
        backgroundColor: `${color}22`,
        borderColor: color,
        textColor: color,
        classNames: ['fc-reminder-event'],
        extendedProps: { isReminder: true },
      }
    })

  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedRange({ start: arg.startStr, end: arg.endStr })
    setEditingEvent(null)
    setModalOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
    if (arg.event.extendedProps.isReminder) return
    const event = events.find((e) => e.id === arg.event.id)
    if (event) {
      setEditingEvent(event)
      setSelectedRange(null)
      setModalOpen(true)
    }
  }

  const handleSave = (data: Omit<CalendarEvent, 'id' | 'updatedAt' | 'color'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, data)
    } else {
      addEvent(data)
    }
    setModalOpen(false)
    setEditingEvent(null)
  }

  const handleDelete = (id: string) => {
    deleteEvent(id)
    setModalOpen(false)
    setEditingEvent(null)
  }

  return (
    <div className="flex-1 overflow-hidden p-4">
      <style>{`
        .fc-reminder-event { cursor: default !important; }
        .fc-reminder-event .fc-daygrid-event-dot { display: none; }
        .fc-reminder-event.fc-daygrid-event { border-style: dashed !important; border-width: 1.5px !important; }
        .fc-reminder-event.fc-timegrid-event { border-style: dashed !important; border-width: 1.5px !important; }
      `}</style>
      <div className="h-full rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          key={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={[...fcEvents, ...fcReminders]}
          selectable
          selectMirror
          editable
          dayMaxEvents={3}
          weekends
          nowIndicator
          height="100%"
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={(info) => {
            if (info.event.extendedProps.isReminder) { info.revert(); return }
            updateEvent(info.event.id, { start: info.event.startStr, end: info.event.endStr ?? undefined })
          }}
          eventResize={(info) => {
            if (info.event.extendedProps.isReminder) { info.revert(); return }
            updateEvent(info.event.id, { end: info.event.endStr })
          }}
        />
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEvent(null) }}
        onSave={handleSave}
        onDelete={handleDelete}
        event={editingEvent}
        defaultRange={selectedRange}
      />
    </div>
  )
}
