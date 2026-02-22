import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { AuthScreen } from './components/AuthScreen'
import { NoteEditor } from './components/NoteEditor'
import { EditorToolbar } from './components/EditorToolbar'
import { NotesSidebar } from './components/NotesSidebar'
import type { Note } from './types/note'
import {
  getEditorContent,
  normalizeContentForSave,
  normalizeTitle,
} from './utils/noteFormatting'
import './App.css'

const AUTO_SAVE_DELAY_MS = 900

function App() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const notes = useQuery(api.notes.list, isAuthenticated ? {} : 'skip')
  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const removeNote = useMutation(api.notes.remove)

  const [selectedNoteId, setSelectedNoteId] = useState<Id<'notes'> | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const editorRef = useRef<HTMLDivElement | null>(null)
  const savePromiseRef = useRef<Promise<boolean> | null>(null)
  const changedWhileSavingRef = useRef(false)

  const selectedNote = useMemo(
    () => notes?.find((note) => note._id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  )

  useEffect(() => {
    if (!notes) return

    if (notes.length === 0) {
      setSelectedNoteId(null)
      setDraftTitle('')
      setDraftContent('')
      setIsDirty(false)
      setSaveError(null)
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
      return
    }

    if (!selectedNoteId || !notes.some((note) => note._id === selectedNoteId)) {
      setSelectedNoteId(notes[0]._id)
    }
  }, [notes, selectedNoteId])

  useEffect(() => {
    if (!selectedNote || isDirty) return

    const contentForEditor = getEditorContent(selectedNote.content)

    setDraftTitle(selectedNote.title)
    setDraftContent(contentForEditor)

    if (editorRef.current && editorRef.current.innerHTML !== contentForEditor) {
      editorRef.current.innerHTML = contentForEditor
    }
  }, [selectedNote, isDirty])

  const markDirty = useCallback(() => {
    setIsDirty(true)
    setSaveError(null)
    if (savePromiseRef.current) {
      changedWhileSavingRef.current = true
    }
  }, [])

  const saveDraft = useCallback(async () => {
    if (!selectedNoteId || !isDirty) return true
    if (savePromiseRef.current) {
      return await savePromiseRef.current
    }

    const noteId = selectedNoteId
    const normalizedTitle = normalizeTitle(draftTitle)
    const normalizedContent = normalizeContentForSave(draftContent)

    const saveOperation = (async () => {
      changedWhileSavingRef.current = false
      setIsSaving(true)
      setSaveError(null)

      try {
        await updateNote({
          id: noteId,
          title: normalizedTitle,
          content: normalizedContent,
        })

        if (!changedWhileSavingRef.current) {
          setIsDirty(false)
          if (!draftTitle.trim()) {
            setDraftTitle(normalizedTitle)
          }
        }

        return true
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Could not save note')
        return false
      } finally {
        setIsSaving(false)
        savePromiseRef.current = null
      }
    })()

    savePromiseRef.current = saveOperation
    return await saveOperation
  }, [draftContent, draftTitle, isDirty, selectedNoteId, updateNote])

  useEffect(() => {
    if (!selectedNoteId || !isDirty) return

    const timerId = window.setTimeout(() => {
      void saveDraft()
    }, AUTO_SAVE_DELAY_MS)

    return () => window.clearTimeout(timerId)
  }, [draftContent, draftTitle, isDirty, saveDraft, selectedNoteId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveDraft()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveDraft])

  const executeCommand = useCallback(
    (command: string) => {
      document.execCommand(command, false)
      editorRef.current?.focus()
      const nextContent = editorRef.current?.innerHTML ?? ''
      setDraftContent(nextContent)
      markDirty()
    },
    [markDirty],
  )

  const handleCreate = useCallback(async () => {
    const didSave = await saveDraft()
    if (!didSave) return

    const newId = await createNote({
      title: 'Untitled Note',
      content: '<p></p>',
    })

    setSelectedNoteId(newId)
    setDraftTitle('Untitled Note')
    setDraftContent('')
    setIsDirty(false)
    setSaveError(null)
    if (editorRef.current) {
      editorRef.current.innerHTML = ''
    }
  }, [createNote, saveDraft])

  const handleSelectNote = useCallback(async (note: Note) => {
    if (note._id === selectedNoteId) return
    const didSave = await saveDraft()
    if (!didSave) return

    setSelectedNoteId(note._id)
    setIsDirty(false)
    setSaveError(null)
  }, [saveDraft, selectedNoteId])

  const handleDeleteNote = useCallback(async (note: Note) => {
    const isSelectedNote = note._id === selectedNoteId
    const hadUnsavedChanges = isSelectedNote && isDirty
    const shouldDelete = window.confirm(
      hadUnsavedChanges
        ? 'Delete this note? Unsaved changes will be lost.'
        : 'Delete this note?',
    )

    if (!shouldDelete) return

    if (isSelectedNote) {
      setIsDirty(false)
      setSaveError(null)
    }

    try {
      await removeNote({ id: note._id })
    } catch (error) {
      if (isSelectedNote && hadUnsavedChanges) {
        setIsDirty(true)
      }
      setSaveError(error instanceof Error ? error.message : 'Could not delete note')
    }
  }, [isDirty, removeNote, selectedNoteId])

  const canEdit = Boolean(selectedNoteId)

  return (
    <div className="app-shell">
      <SignedOut>
        <AuthScreen />
      </SignedOut>

      <SignedIn>
        <NotesSidebar
          notes={notes}
          selectedNoteId={selectedNoteId}
          onCreateNote={handleCreate}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
        />

        <main className="editor-pane">
          <EditorToolbar
            canEdit={canEdit}
            isDirty={isDirty}
            isSaving={isSaving}
            saveError={saveError}
            onCommand={executeCommand}
          />

          <section className="editor-content">
            {isLoading && <p className="editor-empty">Checking authentication...</p>}
            {!isLoading && !isAuthenticated && (
              <p className="editor-empty">You need to sign in before using notes.</p>
            )}
            {!isLoading && isAuthenticated && !selectedNote && (
              <p className="editor-empty">Create a note to start writing.</p>
            )}

            {!isLoading && isAuthenticated && selectedNote && (
              <NoteEditor
                note={selectedNote}
                draftTitle={draftTitle}
                draftContent={draftContent}
                isDirty={isDirty}
                saveError={saveError}
                editorRef={editorRef}
                onTitleChange={(title) => {
                  setDraftTitle(title)
                  markDirty()
                }}
                onContentInput={(content) => {
                  setDraftContent(content)
                  markDirty()
                }}
              />
            )}
          </section>
        </main>
      </SignedIn>
    </div>
  )
}

export default App
