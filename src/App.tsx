import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { AuthScreen } from './components/AuthScreen'
import { NotesSidebar } from './components/NotesSidebar'
import {
  createEmptyDocument,
  decodeStoredDocument,
  encodeStoredDocument,
  InvalidNoteDocumentError,
} from './domain/noteDocument'
import { useNoteDraftAutosave } from './hooks/useNoteDraftAutosave'
import type { Note } from './types/note'
import { normalizeTitle } from './utils/noteFormatting'
import './App.css'

const TipTapEditorIsland = lazy(() =>
  import('./components/TipTapEditorIsland').then((module) => ({
    default: module.TipTapEditorIsland,
  })),
)

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const notes = useQuery(api.notes.list, isAuthenticated ? {} : 'skip')
  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const removeNote = useMutation(api.notes.remove)
  const generateImageUploadUrl = useMutation(api.noteImages.generateUploadUrl)
  const finalizeImageUpload = useMutation(api.noteImages.finalizeUpload)

  const [selectedNoteId, setSelectedNoteId] = useState<Id<'notes'> | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [documentError, setDocumentError] = useState<string | null>(null)
  const storedImageUrls = useQuery(
    api.noteImages.listUrls,
    isAuthenticated && selectedNoteId ? { noteId: selectedNoteId } : 'skip',
  )

  const imageUrls = useMemo(
    () =>
      Object.fromEntries(
        (storedImageUrls ?? []).map(({ storageId, url }) => [storageId, url]),
      ),
    [storedImageUrls],
  )

  const uploadImage = useCallback(
    async (noteId: Id<'notes'>, file: File) => {
      const uploadUrl = await generateImageUploadUrl({ noteId })
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!response.ok) throw new Error('Could not upload image.')

      const uploaded: unknown = await response.json()
      if (
        typeof uploaded !== 'object' ||
        uploaded === null ||
        !('storageId' in uploaded) ||
        typeof uploaded.storageId !== 'string'
      ) {
        throw new Error('Image upload returned an invalid response.')
      }

      return await finalizeImageUpload({
        noteId,
        storageId: uploaded.storageId as Id<'_storage'>,
      })
    },
    [finalizeImageUpload, generateImageUploadUrl],
  )

  const persistDraft = useCallback(
    async ({
      noteId,
      title,
      content,
    }: {
      noteId: Id<'notes'>
      title: string
      content: string
    }) => {
      await updateNote({
        id: noteId,
        title: normalizeTitle(title),
        content,
      })
    },
    [updateNote],
  )

  const autosave = useNoteDraftAutosave<Id<'notes'>>({ save: persistDraft })
  const {
    draft,
    error: autosaveError,
    isDirty,
    isSaving,
    loadDraft,
    discardDraft,
    updateTitle,
    updateDocument,
    flushDraft,
    flushAndDiscardDraft,
  } = autosave

  const orderedNotes = useMemo(() => {
    if (!notes) return notes
    return [...notes].sort((a, b) => b.createdAt - a.createdAt)
  }, [notes])

  const selectedNote = useMemo(
    () => orderedNotes?.find((note) => note._id === selectedNoteId) ?? null,
    [orderedNotes, selectedNoteId],
  )

  useEffect(() => {
    if (isAuthenticated) return

    let cancelled = false
    void flushAndDiscardDraft().then((didDiscard) => {
      if (cancelled || !didDiscard) return
      setSelectedNoteId(null)
      setOperationError(null)
      setDocumentError(null)
    })

    return () => {
      cancelled = true
    }
  }, [flushAndDiscardDraft, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !orderedNotes) return

    if (orderedNotes.length === 0) {
      // The remote collection is authoritative for which note can be selected.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedNoteId(null)
      setDocumentError(null)
      discardDraft()
      return
    }

    if (!selectedNoteId) {
      setSelectedNoteId(orderedNotes[0]._id)
      return
    }

    const selectedStillExists = orderedNotes.some(
      (note) => note._id === selectedNoteId,
    )
    const selectedIsPendingCreate = draft?.noteId === selectedNoteId
    if (!selectedStillExists && !selectedIsPendingCreate) {
      setSelectedNoteId(orderedNotes[0]._id)
    }
  }, [discardDraft, draft?.noteId, isAuthenticated, orderedNotes, selectedNoteId])

  useEffect(() => {
    if (
      !isAuthenticated ||
      !selectedNote ||
      draft?.noteId === selectedNote._id
    ) {
      return
    }

    // Load the selected remote note into the isolated local editor draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOperationError(null)
    try {
      const decoded = decodeStoredDocument(selectedNote.content)
      setDocumentError(null)
      loadDraft(
        {
          noteId: selectedNote._id,
          title: selectedNote.title,
          document: decoded.document,
        },
        { needsMigration: decoded.needsMigration },
      )
    } catch (error) {
      discardDraft()
      setDocumentError(
        error instanceof InvalidNoteDocumentError
          ? 'This note uses an invalid or newer document format and was not opened or overwritten.'
          : errorMessage(error, 'Could not open this note.'),
      )
    }
  }, [discardDraft, draft?.noteId, isAuthenticated, loadDraft, selectedNote])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void flushDraft()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [flushDraft])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const handleCreate = useCallback(async () => {
    const didSave = await flushDraft()
    if (!didSave) return

    setOperationError(null)
    setDocumentError(null)
    try {
      const document = createEmptyDocument()
      const newId = await createNote({
        title: 'Untitled Note',
        content: encodeStoredDocument(document),
      })
      setSelectedNoteId(newId)
      loadDraft({
        noteId: newId,
        title: 'Untitled Note',
        document,
      })
    } catch (error) {
      setOperationError(errorMessage(error, 'Could not create note'))
    }
  }, [createNote, flushDraft, loadDraft])

  const handleSelectNote = useCallback(
    async (note: Note) => {
      if (note._id === selectedNoteId) return
      const didSave = await flushDraft()
      if (!didSave) return

      setOperationError(null)
      setDocumentError(null)
      setSelectedNoteId(note._id)
    },
    [flushDraft, selectedNoteId],
  )

  const handleDeleteNote = useCallback(
    async (note: Note) => {
      const isSelectedNote = note._id === selectedNoteId
      setOperationError(null)

      try {
        await removeNote({ id: note._id })
        if (isSelectedNote) {
          setSelectedNoteId(null)
          setDocumentError(null)
          discardDraft()
        }
      } catch (error) {
        setOperationError(errorMessage(error, 'Could not delete note'))
      }
    },
    [discardDraft, removeNote, selectedNoteId],
  )

  const draftMatchesSelection =
    Boolean(selectedNote) && draft?.noteId === selectedNote?._id
  const canRenderEditor =
    !isLoading &&
    isAuthenticated &&
    selectedNote &&
    draftMatchesSelection &&
    draft &&
    !documentError

  return (
    <div className="app-shell">
      <SignedOut>
        <AuthScreen />
      </SignedOut>

      <SignedIn>
        <NotesSidebar
          notes={orderedNotes}
          selectedNoteId={selectedNoteId}
          onCreateNote={handleCreate}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
        />

        <main className="editor-pane">
          {canRenderEditor ? (
            <Suspense
              fallback={
                <section className="editor-content">
                  <p className="editor-empty">Loading editor...</p>
                </section>
              }
            >
              <TipTapEditorIsland
                key={selectedNote._id}
                note={selectedNote}
                draftTitle={draft.title}
                draftDocument={draft.document}
                isDirty={isDirty}
                isSaving={isSaving}
                autosaveError={autosaveError}
                operationError={operationError}
                imageUrls={imageUrls}
                onUploadImage={(file) => uploadImage(selectedNote._id, file)}
                onTitleChange={updateTitle}
                onDocumentChange={updateDocument}
              />
            </Suspense>
          ) : (
            <section className="editor-content">
              {isLoading && (
                <p className="editor-empty">Checking authentication...</p>
              )}
              {!isLoading && !isAuthenticated && (
                <p className="editor-empty">
                  You need to sign in before using notes.
                </p>
              )}
              {!isLoading && isAuthenticated && !selectedNote && (
                <p className="editor-empty">Create a note to start writing.</p>
              )}
              {documentError && (
                <p className="editor-empty save-error" role="alert">
                  {documentError}
                </p>
              )}
              {operationError && (
                <p className="save-error" role="alert">
                  {operationError}
                </p>
              )}
            </section>
          )}
        </main>
      </SignedIn>
    </div>
  )
}

export default App
