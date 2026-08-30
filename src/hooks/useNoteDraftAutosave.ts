import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  encodeStoredDocument,
  type RichTextDocument,
} from '../domain/noteDocument'

export type AutosaveStatus = 'saved' | 'dirty' | 'saving' | 'failed'

export type NoteDraft<TNoteId extends string = string> = {
  noteId: TNoteId
  title: string
  document: RichTextDocument
}

export type PersistedNoteDraft<TNoteId extends string = string> = {
  noteId: TNoteId
  title: string
  content: string
}

type VersionedDraft<TNoteId extends string> = NoteDraft<TNoteId> & {
  generation: number
  revision: number
}

type SavedRevision<TNoteId extends string> = {
  noteId: TNoteId
  generation: number
  revision: number
}

type UseNoteDraftAutosaveOptions<TNoteId extends string> = {
  save: (draft: PersistedNoteDraft<TNoteId>) => Promise<void>
  delayMs?: number
  isPaused?: boolean
}

type LoadDraftOptions = {
  needsMigration?: boolean
}

const DEFAULT_AUTOSAVE_DELAY_MS = 900

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Could not save note'
}

export function useNoteDraftAutosave<TNoteId extends string = string>({
  save,
  delayMs = DEFAULT_AUTOSAVE_DELAY_MS,
  isPaused = false,
}: UseNoteDraftAutosaveOptions<TNoteId>) {
  const [draftState, setDraftState] = useState<VersionedDraft<TNoteId> | null>(
    null,
  )
  const [status, setStatusState] = useState<AutosaveStatus>('saved')
  const [error, setError] = useState<string | null>(null)

  const draftRef = useRef<VersionedDraft<TNoteId> | null>(null)
  const savedRevisionRef = useRef<SavedRevision<TNoteId> | null>(null)
  const inFlightRef = useRef<Promise<boolean> | null>(null)
  const generationRef = useRef(0)

  const setStatus = useCallback((nextStatus: AutosaveStatus) => {
    setStatusState(nextStatus)
  }, [])

  const commitDraft = useCallback((draft: VersionedDraft<TNoteId> | null) => {
    draftRef.current = draft
    setDraftState(draft)
  }, [])

  const isRevisionDirty = useCallback(
    (draft: VersionedDraft<TNoteId> | null) => {
      if (!draft) return false
      const saved = savedRevisionRef.current
      return (
        !saved ||
        saved.noteId !== draft.noteId ||
        saved.generation !== draft.generation ||
        saved.revision < draft.revision
      )
    },
    [],
  )

  const loadDraft = useCallback(
    (draft: NoteDraft<TNoteId>, options: LoadDraftOptions = {}) => {
      const generation = generationRef.current + 1
      generationRef.current = generation
      const loadedDraft = { ...draft, generation, revision: 0 }
      commitDraft(loadedDraft)
      savedRevisionRef.current = {
        noteId: draft.noteId,
        generation,
        revision: options.needsMigration ? -1 : 0,
      }
      setError(null)
      setStatus(options.needsMigration ? 'dirty' : 'saved')
    },
    [commitDraft, setStatus],
  )

  const discardDraft = useCallback(() => {
    generationRef.current += 1
    commitDraft(null)
    savedRevisionRef.current = null
    setError(null)
    setStatus('saved')
  }, [commitDraft, setStatus])

  const updateDraft = useCallback(
    (update: (current: VersionedDraft<TNoteId>) => VersionedDraft<TNoteId>) => {
      const current = draftRef.current
      if (!current) return
      const next = update(current)
      if (next === current) return
      commitDraft(next)
      setError(null)
      if (!inFlightRef.current) setStatus('dirty')
    },
    [commitDraft, setStatus],
  )

  const updateTitle = useCallback(
    (title: string) => {
      updateDraft((current) =>
        current.title === title
          ? current
          : { ...current, title, revision: current.revision + 1 },
      )
    },
    [updateDraft],
  )

  const updateDocument = useCallback(
    (document: RichTextDocument) => {
      updateDraft((current) => ({
        ...current,
        document,
        revision: current.revision + 1,
      }))
    },
    [updateDraft],
  )

  const persistRevision = useCallback(
    async (snapshot: VersionedDraft<TNoteId>) => {
      setStatus('saving')
      setError(null)

      try {
        await save({
          noteId: snapshot.noteId,
          title: snapshot.title,
          content: encodeStoredDocument(snapshot.document),
        })

        const current = draftRef.current
        if (
          current &&
          current.noteId === snapshot.noteId &&
          current.generation === snapshot.generation
        ) {
          savedRevisionRef.current = {
            noteId: snapshot.noteId,
            generation: snapshot.generation,
            revision: snapshot.revision,
          }
          setStatus(
            current.revision === snapshot.revision ? 'saved' : 'dirty',
          )
        }
        return true
      } catch (saveError) {
        const current = draftRef.current
        if (
          current &&
          current.noteId === snapshot.noteId &&
          current.generation === snapshot.generation
        ) {
          setError(toErrorMessage(saveError))
          setStatus('failed')
        }
        return false
      }
    },
    [save, setStatus],
  )

  const flushDraft = useCallback(async () => {
    while (true) {
      const current = draftRef.current
      if (!current || !isRevisionDirty(current)) return true

      if (inFlightRef.current) {
        const didSave = await inFlightRef.current
        if (!didSave) return false
        continue
      }

      const operation = persistRevision(current)
      inFlightRef.current = operation
      const didSave = await operation
      if (inFlightRef.current === operation) {
        inFlightRef.current = null
      }
      if (!didSave) return false
    }
  }, [isRevisionDirty, persistRevision])

  const flushAndDiscardDraft = useCallback(async () => {
    const generation = draftRef.current?.generation
    if (generation === undefined) return true

    const didSave = await flushDraft()
    if (!didSave) return false

    const current = draftRef.current
    if (
      current?.generation === generation &&
      !isRevisionDirty(current)
    ) {
      discardDraft()
    }
    return true
  }, [discardDraft, flushDraft, isRevisionDirty])

  const isDirty = Boolean(draftState) && status !== 'saved'

  useEffect(() => {
    if (isPaused || !draftState || !isDirty || status !== 'dirty') return

    const timerId = window.setTimeout(() => {
      void flushDraft()
    }, delayMs)
    return () => window.clearTimeout(timerId)
  }, [delayMs, draftState, flushDraft, isDirty, isPaused, status])

  const draft = useMemo<NoteDraft<TNoteId> | null>(() => {
    if (!draftState) return null
    return {
      noteId: draftState.noteId,
      title: draftState.title,
      document: draftState.document,
    }
  }, [draftState])

  return {
    draft,
    status,
    error,
    isDirty,
    isSaving: status === 'saving',
    loadDraft,
    discardDraft,
    updateTitle,
    updateDocument,
    flushDraft,
    flushAndDiscardDraft,
  }
}
