import { useState } from 'react'
import { Plus, Pin, Trash2, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { Note } from '@/lib/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function NotesPanel() {
  const { notes, toggleNotes, addNote, updateNote, deleteNote } = useAppStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const sorted = [...notes]
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt.localeCompare(a.updatedAt))

  const selected = notes.find((n) => n.id === selectedId) ?? null

  const handleNew = () => {
    addNote({ title: 'Untitled note', content: '', tags: [], pinned: false })
    const newId = notes[notes.length - 1]?.id // will be stale — use effect in real app
    // Select the new note after state updates
    setTimeout(() => {
      const updated = document.querySelector('[data-note-id]:last-child') as HTMLElement
      if (updated) updated.click()
    }, 50)
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full shrink-0 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
        <span className="font-semibold text-sm">Notes</span>
        <div className="flex items-center gap-1">
          <button onClick={handleNew} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Plus size={15} />
          </button>
          <button onClick={toggleNotes} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full text-sm bg-secondary rounded-lg px-3 py-1.5 outline-none focus:ring-1 ring-primary transition-all placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Note list */}
        <div className="w-full overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notes yet. Click + to create one.
            </div>
          ) : sorted.map((note) => (
            <button
              key={note.id}
              data-note-id={note.id}
              onClick={() => setSelectedId(selectedId === note.id ? null : note.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border transition-colors',
                selectedId === note.id ? 'bg-accent' : 'hover:bg-secondary'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-sm truncate">{note.title || 'Untitled'}</span>
                {note.pinned && <Pin size={11} className="text-primary shrink-0 mt-0.5" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.content || 'No content'}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(note.updatedAt), 'MMM d, h:mm a')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Inline editor */}
      {selected && (
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <input
              value={selected.title}
              onChange={(e) => updateNote(selected.id, { title: e.target.value })}
              className="font-semibold text-sm bg-transparent outline-none flex-1"
              placeholder="Title"
            />
            <div className="flex items-center gap-1">
              <button onClick={() => updateNote(selected.id, { pinned: !selected.pinned })} className={cn('p-1 rounded transition-colors', selected.pinned ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <Pin size={13} />
              </button>
              <button onClick={() => { deleteNote(selected.id); setSelectedId(null) }} className="p-1 rounded text-muted-foreground hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <textarea
            value={selected.content}
            onChange={(e) => updateNote(selected.id, { content: e.target.value })}
            placeholder="Write your note..."
            rows={5}
            className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none focus:ring-1 ring-primary transition-all resize-none placeholder:text-muted-foreground"
          />
        </div>
      )}
    </div>
  )
}
