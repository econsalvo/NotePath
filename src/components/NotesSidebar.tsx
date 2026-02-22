import { UserButton } from '@clerk/clerk-react'
import type { Id } from '../../convex/_generated/dataModel'
import type { Note } from '../types/note'
import { formatRelativeTime, getEditorContent, toPlainText } from '../utils/noteFormatting'

type NotesSidebarProps = {
  notes: Note[] | undefined
  selectedNoteId: Id<'notes'> | null
  onCreateNote: () => void
  onSelectNote: (note: Note) => void
  onDeleteNote: (note: Note) => Promise<void>
}

export function NotesSidebar({
  notes,
  selectedNoteId,
  onCreateNote,
  onSelectNote,
  onDeleteNote,
}: NotesSidebarProps) {
  return (
    <aside className="sidebar">
      <button type="button" className="new-note-btn" onClick={onCreateNote}>
        + New Note
      </button>

      <div className="notes-list">
        {notes === undefined && <p className="notes-hint">Loading notes...</p>}
        {notes && notes.length === 0 && (
          <p className="notes-hint">No notes yet. Create your first note.</p>
        )}
        {notes?.map((note) => {
          const preview = toPlainText(getEditorContent(note.content)) || 'Empty note'
          const isActive = note._id === selectedNoteId
          const displayTitle = note.title || 'Untitled Note'
          return (
            <div
              key={note._id}
              className={`note-list-item${isActive ? ' active' : ''}`}
            >
              <button
                type="button"
                className="note-list-select"
                onClick={() => onSelectNote(note)}
              >
                <p className="note-list-title">{displayTitle}</p>
                <p className="note-list-preview">{preview}</p>
                <p className="note-list-time">{formatRelativeTime(note.updatedAt)}</p>
              </button>
              <button
                type="button"
                className="note-delete-btn"
                onClick={() => {
                  void onDeleteNote(note)
                }}
                aria-label={`Delete ${displayTitle}`}
                title="Delete note"
              >
                Delete
              </button>
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <span>Account</span>
        <UserButton />
      </div>
    </aside>
  )
}
