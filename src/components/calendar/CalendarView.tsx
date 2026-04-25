import { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { useAppStore } from '@/store/appStore'
import { EventModal } from './EventModal'
import { CalendarEvent } from '@/lib/types'

export function CalendarView() {
  const { events, view, selectedCategories, addEvent, updateEvent, deleteEvent } = useAppStore()
  const calendarRef = useRef<FullCalendar>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)

  // Map store events → FullCalendar format, filtered by selected categories
  const fcEvents = events.filter((e) => selectedCategories.has(e.category)).map((e) => ({
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: e.allDay,
    backgroundColor: e.color,
    borderColor: e.color,
  }))

  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedRange({ start: arg.startStr, end: arg.endStr })
    setEditingEvent(null)
    setModalOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
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
          events={fcEvents}
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
            updateEvent(info.event.id, { start: info.event.startStr, end: info.event.endStr ?? undefined })
          }}
          eventResize={(info) => {
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
