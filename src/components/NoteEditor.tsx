import type { RefObject } from 'react'
import type { Note } from '../types/note'
import {
  formatCreatedDate,
  formatRelativeTime,
  hasMeaningfulContent,
} from '../utils/noteFormatting'

type NoteEditorProps = {
  note: Note
  draftTitle: string
  draftContent: string
  isDirty: boolean
  saveError: string | null
  editorFontSize: number
  editorRef: RefObject<HTMLDivElement | null>
  onTitleChange: (title: string) => void
  onContentInput: (content: string) => void
}

export function NoteEditor({
  note,
  draftTitle,
  draftContent,
  isDirty,
  saveError,
  editorFontSize,
  editorRef,
  onTitleChange,
  onContentInput,
}: NoteEditorProps) {
  const isEditorEmpty = !hasMeaningfulContent(draftContent)

  return (
    <>
      <input
        className="title-input"
        value={draftTitle}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Untitled Note"
      />

      <div className="meta-row">
        <span>Created {formatCreatedDate(note.createdAt)}</span>
        <span>
          {isDirty ? 'Unsaved changes' : `Modified ${formatRelativeTime(note.updatedAt)}`}
        </span>
      </div>

      <div className="divider" />

      <div
        ref={editorRef}
        className={`editor-input${isEditorEmpty ? ' is-empty' : ''}`}
        style={{ fontSize: `${editorFontSize}px` }}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing..."
        onInput={(event) => {
          onContentInput(event.currentTarget.innerHTML)
        }}
      />

      {saveError && <p className="save-error">{saveError}</p>}
    </>
  )
}
