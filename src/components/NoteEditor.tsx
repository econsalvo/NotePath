import type { Editor } from '@tiptap/react'
import type { Note } from '../types/note'
import type { RichTextDocument } from '../domain/noteDocument'
import { formatCreatedDate, formatRelativeTime } from '../utils/noteFormatting'
import { RichTextEditor } from './RichTextEditor'
import type { UploadedNoteImage } from './RichTextEditor'

type NoteEditorProps = {
  note: Note
  draftTitle: string
  draftDocument: RichTextDocument
  isDirty: boolean
  saveError: string | null
  imageUrls: Record<string, string>
  onUploadImage: (file: File) => Promise<UploadedNoteImage>
  onDiscardImage: (storageId: string) => Promise<void>
  onTitleChange: (title: string) => void
  onDocumentChange: (document: RichTextDocument) => void
  onEditorReady: (editor: Editor | null) => void
}

export function NoteEditor({
  note,
  draftTitle,
  draftDocument,
  isDirty,
  saveError,
  imageUrls,
  onUploadImage,
  onDiscardImage,
  onTitleChange,
  onDocumentChange,
  onEditorReady,
}: NoteEditorProps) {
  return (
    <>
      <label className="sr-only" htmlFor="note-title">
        Note title
      </label>
      <input
        id="note-title"
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

      <RichTextEditor
        document={draftDocument}
        imageUrls={imageUrls}
        onUploadImage={onUploadImage}
        onDiscardImage={onDiscardImage}
        onChange={onDocumentChange}
        onEditorReady={onEditorReady}
      />

      {saveError && (
        <p className="save-error" role="alert">
          {saveError}
        </p>
      )}
    </>
  )
}
