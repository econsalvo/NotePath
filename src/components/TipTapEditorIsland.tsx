import type { Editor } from '@tiptap/react'
import { useState } from 'react'
import type { RichTextDocument } from '../domain/noteDocument'
import type { Note } from '../types/note'
import { EditorToolbar } from './EditorToolbar'
import { NoteEditor } from './NoteEditor'
import type { UploadedNoteImage } from './RichTextEditor'

type TipTapEditorIslandProps = {
  note: Note
  draftTitle: string
  draftDocument: RichTextDocument
  isDirty: boolean
  isSaving: boolean
  autosaveError: string | null
  operationError: string | null
  imageUrls: Record<string, string>
  onUploadImage: (file: File) => Promise<UploadedNoteImage>
  onDiscardImage: (storageId: string) => Promise<void>
  onTitleChange: (title: string) => void
  onDocumentChange: (document: RichTextDocument) => void
}

export function TipTapEditorIsland({
  note,
  draftTitle,
  draftDocument,
  isDirty,
  isSaving,
  autosaveError,
  operationError,
  imageUrls,
  onUploadImage,
  onDiscardImage,
  onTitleChange,
  onDocumentChange,
}: TipTapEditorIslandProps) {
  const [editor, setEditor] = useState<Editor | null>(null)

  return (
    <>
      <EditorToolbar
        editor={editor}
        canEdit
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={autosaveError}
      />

      <section className="editor-content">
        <NoteEditor
          note={note}
          draftTitle={draftTitle}
          draftDocument={draftDocument}
          isDirty={isDirty}
          saveError={autosaveError}
          imageUrls={imageUrls}
          onUploadImage={onUploadImage}
          onDiscardImage={onDiscardImage}
          onTitleChange={onTitleChange}
          onDocumentChange={onDocumentChange}
          onEditorReady={setEditor}
        />

        {operationError && (
          <p className="save-error" role="alert">
            {operationError}
          </p>
        )}
      </section>
    </>
  )
}
