import type { Editor } from '@tiptap/react'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  decodeStoredDocument,
  encodeStoredDocument,
  type RichTextDocument,
} from '../domain/noteDocument'
import { RichTextEditor } from './RichTextEditor'

afterEach(cleanup)

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
  it('pastes an uploaded image while persisting only its storage ID', async () => {
    let editorInstance: Editor | null = null
    const onChange = vi.fn()
    let finishUpload!: (image: { storageId: string; url: string }) => void
    const onUploadImage = vi.fn(
      () =>
        new Promise<{ storageId: string; url: string }>((resolve) => {
          finishUpload = resolve
        }),
    )
    render(
      <RichTextEditor
        document={{ type: 'doc', content: [{ type: 'paragraph' }] }}
        imageUrls={{}}
        onUploadImage={onUploadImage}
        onChange={onChange}
        onEditorReady={(editor) => {
          editorInstance = editor
        }}
      />,
    )

    const editor = await screen.findByRole('textbox', { name: 'Note body' })
    const file = new File(['png'], 'pasted.png', { type: 'image/png' })
    fireEvent.paste(editor, {
      clipboardData: { files: [file], getData: () => '', types: ['Files'] },
    })

    await waitFor(() => expect(onUploadImage).toHaveBeenCalledWith(file))
    act(() => {
      editorInstance!.commands.insertContentAt(1, 'Typed while uploading')
    })
    await act(async () => {
      finishUpload({
        storageId: 'storage_123',
        url: 'https://example.test/rendered-image.png',
      })
    })
    await waitFor(() =>
      expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain(
        'storage_123',
      ),
    )
    const persisted = onChange.mock.calls.at(-1)?.[0]
    expect(persisted.content[0]).toMatchObject({
      type: 'paragraph',
      content: [{ type: 'text', text: 'Typed while uploading' }],
    })
    expect(JSON.stringify(persisted)).toContain('storage_123')
    expect(JSON.stringify(persisted)).not.toContain('example.test')
    expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument()
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.test/rendered-image.png',
    )
  })

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

  it('persists and restores a resized image width', async () => {
    const onChange = vi.fn()
    const view = render(
      <RichTextEditor
        document={{
          type: 'doc',
          content: [
            { type: 'image', attrs: { storageId: 'storage_123', width: 60 } },
            { type: 'paragraph' },
          ],
        }}
        imageUrls={{ storage_123: 'https://example.test/image.png' }}
        onChange={onChange}
      />,
    )

    const editor = await screen.findByRole('textbox', { name: 'Note body' })
    const image = view.container.querySelector('img')
    const wrapper = image?.closest('.resizable-note-image') as HTMLElement
    const handle = screen.getByRole('button', { name: 'Resize image' })
    expect(wrapper).toHaveStyle({ width: '60%' })
    expect(handle).toBeVisible()

    vi.spyOn(editor, 'getBoundingClientRect').mockReturnValue({
      width: 1000,
    } as DOMRect)
    vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
      width: 600,
    } as DOMRect)
    fireEvent.pointerDown(handle, { clientX: 600 })
    fireEvent.pointerMove(document, { clientX: 800 })
    fireEvent.pointerUp(document)

    await waitFor(() =>
      expect(onChange.mock.calls.at(-1)?.[0].content[0]).toEqual({
        type: 'image',
        attrs: { storageId: 'storage_123', width: 80 },
      }),
    )
    const stored = encodeStoredDocument(onChange.mock.calls.at(-1)?.[0])
    expect(decodeStoredDocument(stored).document.content[0]).toEqual({
      type: 'image',
      attrs: { storageId: 'storage_123', width: 80 },
    })
    view.unmount()
  })

  it('round-trips migrated hard breaks through the mounted editor schema', async () => {
    let editor: Editor | null = null
    const migrated = decodeStoredDocument(
      '<p>First line<br>Second line</p>',
    ).document
    const view = render(
      <RichTextEditor
        document={migrated}
        onChange={vi.fn()}
        onEditorReady={(nextEditor) => {
          editor = nextEditor
        }}
      />,
    )

    await waitFor(() => expect(editor).not.toBeNull())
    expect(view.container.querySelector('br')).toBeInTheDocument()

    const stored = encodeStoredDocument(editor!.getJSON() as RichTextDocument)
    expect(decodeStoredDocument(stored).document).toEqual(migrated)
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
