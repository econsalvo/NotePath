import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmptyDocument } from '../domain/noteDocument'
import {
  useNoteDraftAutosave,
  type PersistedNoteDraft,
} from './useNoteDraftAutosave'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function documentWithText(text: string) {
  return {
    type: 'doc' as const,
    content: [
      {
        type: 'paragraph' as const,
        content: [{ type: 'text' as const, text }],
      },
    ],
  }
}

describe('note draft autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces edits and reports dirty, saving, and saved states accurately', async () => {
    const pendingSave = deferred()
    const save = vi.fn<(draft: PersistedNoteDraft) => Promise<void>>(
      () => pendingSave.promise,
    )
    const { result } = renderHook(() =>
      useNoteDraftAutosave({ save, delayMs: 900 }),
    )

    act(() => {
      result.current.loadDraft({
        noteId: 'note-a',
        title: 'A note',
        document: createEmptyDocument(),
      })
      result.current.updateDocument({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Edited' }],
          },
        ],
      })
    })

    expect(result.current.status).toBe('dirty')
    expect(result.current.isDirty).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(899)
    })
    expect(save).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.status).toBe('saving')
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0]?.[0]).toMatchObject({
      noteId: 'note-a',
      title: 'A note',
    })
    expect(save.mock.calls[0]?.[0].content).toContain('"schemaVersion":1')

    await act(async () => {
      pendingSave.resolve()
      await pendingSave.promise
    })
    expect(result.current.status).toBe('saved')
    expect(result.current.isDirty).toBe(false)
  })

  it('keeps a failed draft unsaved and retries after the next edit', async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(() =>
      useNoteDraftAutosave({ save, delayMs: 900 }),
    )

    act(() => {
      result.current.loadDraft({
        noteId: 'note-a',
        title: 'A note',
        document: createEmptyDocument(),
      })
      result.current.updateDocument(documentWithText('Still here'))
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Network unavailable')
    expect(result.current.isDirty).toBe(true)
    expect(result.current.draft?.document).toEqual(documentWithText('Still here'))

    act(() => {
      result.current.updateDocument(documentWithText('Retry this'))
    })
    expect(result.current.status).toBe('dirty')
    expect(result.current.error).toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('saved')
  })

  it('queues the latest revision when editing during an in-flight save', async () => {
    const firstSave = deferred()
    const secondSave = deferred()
    const save = vi
      .fn()
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => secondSave.promise)
    const { result } = renderHook(() =>
      useNoteDraftAutosave({ save, delayMs: 900 }),
    )

    act(() => {
      result.current.loadDraft({
        noteId: 'note-a',
        title: 'A note',
        document: createEmptyDocument(),
      })
      result.current.updateDocument(documentWithText('Revision one'))
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })

    act(() => {
      result.current.updateDocument(documentWithText('Revision two'))
    })
    expect(result.current.status).toBe('saving')
    expect(result.current.isDirty).toBe(true)

    await act(async () => {
      firstSave.resolve()
      await firstSave.promise
    })
    expect(save).toHaveBeenCalledTimes(2)
    expect(save.mock.calls[1]?.[0].content).toContain('Revision two')
    expect(result.current.status).toBe('saving')

    await act(async () => {
      secondSave.resolve()
      await secondSave.promise
    })
    expect(result.current.status).toBe('saved')
    expect(result.current.isDirty).toBe(false)
  })

  it('autosaves a legacy document loaded for migration', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() =>
      useNoteDraftAutosave({ save, delayMs: 900 }),
    )

    act(() => {
      result.current.loadDraft(
        {
          noteId: 'legacy-note',
          title: 'Legacy',
          document: documentWithText('Migrated'),
        },
        { needsMigration: true },
      )
    })

    expect(result.current.status).toBe('dirty')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(save).toHaveBeenCalledOnce()
    expect(save.mock.calls[0]?.[0].content).toContain('"schemaVersion":1')
    expect(result.current.status).toBe('saved')
  })

  it('flushes immediately and reports failure so note switching can be blocked', async () => {
    const save = vi.fn().mockRejectedValue(new Error('Save rejected'))
    const { result } = renderHook(() =>
      useNoteDraftAutosave({ save, delayMs: 900 }),
    )

    act(() => {
      result.current.loadDraft({
        noteId: 'note-a',
        title: 'A note',
        document: createEmptyDocument(),
      })
      result.current.updateTitle('Changed title')
    })

    let didSave = true
    await act(async () => {
      didSave = await result.current.flushDraft()
    })

    expect(didSave).toBe(false)
    expect(save).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('failed')
    expect(result.current.draft?.noteId).toBe('note-a')
  })
})
