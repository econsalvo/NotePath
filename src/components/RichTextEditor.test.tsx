import type { Editor } from '@tiptap/react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  decodeStoredDocument,
  encodeStoredDocument,
  type RichTextDocument,
} from '../domain/noteDocument'
import { RichTextEditor } from './RichTextEditor'

const fullyFormattedDocument: RichTextDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'Italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ' ' },
        {
          type: 'text',
          text: 'Large',
          marks: [{ type: 'textStyle', attrs: { fontSize: '28px' } }],
        },
      ],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Bullet' }],
            },
          ],
        },
      ],
    },
    {
      type: 'orderedList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Numbered' }],
            },
          ],
        },
      ],
    },
  ],
}

function expectSupportedFormatting(container: HTMLElement) {
  expect(container.querySelector('strong')).toHaveTextContent('Bold')
  expect(container.querySelector('em')).toHaveTextContent('Italic')
  expect(container.querySelector('span[style="font-size: 28px;"]')).toHaveTextContent(
    'Large',
  )
  expect(container.querySelector('ul')).toHaveTextContent('Bullet')
  expect(container.querySelector('ol')).toHaveTextContent('Numbered')
}

describe('RichTextEditor', () => {
  it('round-trips every supported formatting type through persisted JSON', async () => {
    let editor: Editor | null = null
    const onChange = vi.fn()
    const firstRender = render(
      <RichTextEditor
        document={fullyFormattedDocument}
        onChange={onChange}
        onEditorReady={(nextEditor) => {
          editor = nextEditor
        }}
      />,
    )

    expect(await screen.findByRole('textbox', { name: 'Note body' })).toHaveAttribute(
      'aria-multiline',
      'true',
    )
    expectSupportedFormatting(firstRender.container)
    await waitFor(() => expect(editor).not.toBeNull())

    const stored = encodeStoredDocument(editor!.getJSON() as RichTextDocument)
    const restored = decodeStoredDocument(stored).document
    firstRender.unmount()

    const secondRender = render(
      <RichTextEditor document={restored} onChange={vi.fn()} />,
    )
    expect(await screen.findByRole('textbox', { name: 'Note body' })).toBeVisible()
    expectSupportedFormatting(secondRender.container)
  })

  it('does not carry stored formatting or history into another note', async () => {
    let editor: Editor | null = null
    const onChange = vi.fn()
    const onEditorReady = (nextEditor: Editor | null) => {
      editor = nextEditor
    }
    const noteA: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Alpha' }],
        },
      ],
    }
    const noteB: RichTextDocument = {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    }

    const view = render(
      <RichTextEditor
        key="note-a"
        document={noteA}
        onChange={onChange}
        onEditorReady={onEditorReady}
      />,
    )
    await waitFor(() => expect(editor).not.toBeNull())
    const noteAEditor = editor!
    act(() => {
      noteAEditor.chain().setTextSelection(6).setBold().run()
    })
    expect(noteAEditor.isActive('bold')).toBe(true)

    view.rerender(
      <RichTextEditor
        key="note-b"
        document={noteB}
        onChange={onChange}
        onEditorReady={onEditorReady}
      />,
    )
    await waitFor(() => expect(editor).not.toBe(noteAEditor))

    expect(editor!.isActive('bold')).toBe(false)
    expect(editor!.can().undo()).toBe(false)
    act(() => {
      editor!.commands.insertContent('Beta')
    })
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Beta' }],
        },
      ],
    })
  })

  it('rolls back editor updates with unsafe formatting attributes', async () => {
    let editor: Editor | null = null
    const onChange = vi.fn()
    const document: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Safe text' }],
        },
      ],
    }
    const view = render(
      <RichTextEditor
        document={document}
        onChange={onChange}
        onEditorReady={(nextEditor) => {
          editor = nextEditor
        }}
      />,
    )

    await waitFor(() => expect(editor).not.toBeNull())
    act(() => {
      editor!
        .chain()
        .setTextSelection({ from: 1, to: 10 })
        .setFontSize('16px; background: url(javascript:steal())')
        .run()
    })

    expect(editor!.getJSON()).toEqual(document)
    expect(view.container.querySelector('[style]')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })
})
