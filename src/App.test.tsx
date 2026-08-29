import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const appState = vi.hoisted(() => ({
  clerkSignedIn: false,
  auth: { isLoading: false, isAuthenticated: false },
  notes: undefined as unknown[] | undefined,
  tiptapModuleLoads: 0,
  mutations: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }: { children: ReactNode }) =>
    appState.clerkSignedIn ? children : null,
  SignedOut: ({ children }: { children: ReactNode }) =>
    appState.clerkSignedIn ? null : children,
  SignInButton: ({ children }: { children: ReactNode }) => children,
  SignUpButton: ({ children }: { children: ReactNode }) => children,
  UserButton: () => <div data-testid="user-button" />,
}))

vi.mock('../convex/_generated/api', () => ({
  api: {
    notes: {
      list: 'list',
      create: 'create',
      update: 'update',
      remove: 'remove',
    },
  },
}))

vi.mock('convex/react', () => ({
  useConvexAuth: () => appState.auth,
  useQuery: () => appState.notes,
  useMutation: (reference: keyof typeof appState.mutations) =>
    appState.mutations[reference],
}))

vi.mock('@tiptap/react', () => {
  appState.tiptapModuleLoads += 1
  return {
    EditorContent: () => <div />,
    useEditor: () => null,
    useEditorState: () => null,
  }
})

const storedDocument =
  '{"schemaVersion":1,"format":"tiptap-json","document":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Original body"}]}]}}'

function note() {
  return {
    _id: 'note-a',
    _creationTime: 1,
    userId: 'user-a',
    title: 'Original title',
    content: storedDocument,
    createdAt: 1,
    updatedAt: 1,
  }
}

beforeEach(() => {
  appState.clerkSignedIn = false
  appState.auth = { isLoading: false, isAuthenticated: false }
  appState.notes = undefined
  appState.tiptapModuleLoads = 0
  appState.mutations.create.mockReset().mockResolvedValue('new-note')
  appState.mutations.update.mockReset().mockResolvedValue(undefined)
  appState.mutations.remove.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  cleanup()
})

describe('App editor loading boundary', () => {
  it('keeps TipTap out of signed-out, auth-loading, and no-note startup paths', async () => {
    const { default: App } = await import('./App')
    const view = render(<App />)

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible()

    appState.clerkSignedIn = true
    appState.auth = { isLoading: true, isAuthenticated: false }
    view.rerender(<App />)
    expect(screen.getByText('Checking authentication...')).toBeVisible()

    appState.auth = { isLoading: false, isAuthenticated: true }
    appState.notes = []
    view.rerender(<App />)
    expect(screen.getByText('Create a note to start writing.')).toBeVisible()

    expect(appState.tiptapModuleLoads).toBe(0)
  })

  it('flushes on sign-out and restores a failed draft instead of discarding it', async () => {
    appState.clerkSignedIn = true
    appState.auth = { isLoading: false, isAuthenticated: true }
    appState.notes = [note()]
    appState.mutations.update.mockRejectedValue(
      new Error('Signed out before save'),
    )

    const { default: App } = await import('./App')
    const view = render(<App />)
    const title = await screen.findByRole('textbox', { name: 'Note title' })

    fireEvent.change(title, { target: { value: 'Unsaved title' } })
    appState.clerkSignedIn = false
    appState.auth = { isLoading: false, isAuthenticated: false }
    appState.notes = undefined
    view.rerender(<App />)

    await waitFor(() => expect(appState.mutations.update).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible()

    appState.clerkSignedIn = true
    appState.auth = { isLoading: false, isAuthenticated: true }
    appState.notes = [note()]
    view.rerender(<App />)

    expect(
      await screen.findByRole('textbox', { name: 'Note title' }),
    ).toHaveValue('Unsaved title')
    expect(screen.getByText('Save failed')).toBeVisible()
    expect(screen.getByText('Signed out before save')).toBeVisible()
  })

  it('keeps create/delete errors separate from autosave status after a successful save', async () => {
    appState.clerkSignedIn = true
    appState.auth = { isLoading: false, isAuthenticated: true }
    appState.notes = [note()]
    appState.mutations.remove.mockRejectedValue(new Error('Delete unavailable'))

    const { default: App } = await import('./App')
    render(<App />)
    const title = await screen.findByRole('textbox', { name: 'Note title' })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Original title' }))
    expect(await screen.findByText('Delete unavailable')).toBeVisible()

    fireEvent.change(title, { target: { value: 'Saved title' } })
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    await waitFor(() => expect(appState.mutations.update).toHaveBeenCalledOnce())

    expect(screen.getByText('Delete unavailable')).toBeVisible()
    expect(screen.getByText('Auto-saved')).toBeVisible()
    expect(screen.queryByText('Save failed')).not.toBeInTheDocument()
  })
})
