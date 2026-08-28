import type { Editor } from '@tiptap/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { RichTextDocument } from '../domain/noteDocument'
import { EditorToolbar } from './EditorToolbar'
import { RichTextEditor } from './RichTextEditor'

const markedDocument: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Marked',
          marks: [
            { type: 'bold' },
            { type: 'italic' },
            { type: 'textStyle', attrs: { fontSize: '28px' } },
          ],
        },
      ],
    },
  ],
}

function ToolbarHarness({
  onChange,
  onReady,
}: {
  onChange: (document: RichTextDocument) => void
  onReady: (editor: Editor | null) => void
}) {
  const [editor, setEditor] = useState<Editor | null>(null)
  return (
    <>
      <EditorToolbar
        editor={editor}
        canEdit
        isDirty
        isSaving={false}
        saveError={null}
      />
      <RichTextEditor
        document={markedDocument}
        onChange={onChange}
        onEditorReady={(nextEditor) => {
          setEditor(nextEditor)
          onReady(nextEditor)
        }}
      />
    </>
  )
}

describe('EditorToolbar', () => {
  it('tracks active marks, persists selected text size, and clears formatting', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    let editor: Editor | null = null
    render(
      <ToolbarHarness
        onChange={onChange}
        onReady={(nextEditor) => {
          editor = nextEditor
        }}
      />,
    )

    await waitFor(() => expect(editor).not.toBeNull())
    act(() => {
      editor!.commands.setTextSelection({ from: 1, to: 7 })
    })

    expect(await screen.findByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText('28px')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Increase text size' }))
    await waitFor(() => {
      const changedDocument = onChange.mock.calls.at(-1)?.[0]
      const paragraph = changedDocument?.content[0]
      const text = paragraph?.type === 'paragraph' ? paragraph.content?.[0] : null
      expect(text?.type === 'text' ? text.marks : []).toEqual(
        expect.arrayContaining([
          { type: 'bold' },
          { type: 'italic' },
          { type: 'textStyle', attrs: { fontSize: '29px' } },
        ]),
      )
    })

    await user.click(screen.getByRole('button', { name: 'Clear Formatting' }))
    await waitFor(() =>
      expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Marked' }],
          },
        ],
      }),
    )
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('announces failed autosaves assertively', () => {
    render(
      <EditorToolbar
        editor={null}
        canEdit={false}
        isDirty
        isSaving={false}
        saveError="Network unavailable"
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Save failed')
  })
})
