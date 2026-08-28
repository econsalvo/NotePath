import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import {
  assertRichTextDocument,
  type RichTextDocument,
} from '../domain/noteDocument'
import { noteEditorExtensions } from '../editor/extensions'

type RichTextEditorProps = {
  document: RichTextDocument
  onChange: (document: RichTextDocument) => void
  onEditorReady?: (editor: Editor | null) => void
}

export function RichTextEditor({
  document,
  onChange,
  onEditorReady,
}: RichTextEditorProps) {
  const lastValidDocumentRef = useRef(document)
  const editor = useEditor({
    extensions: noteEditorExtensions,
    content: document,
    enableContentCheck: true,
    editorProps: {
      attributes: {
        'aria-label': 'Note body',
        'aria-multiline': 'true',
        'data-placeholder': 'Start writing...',
        role: 'textbox',
        class: 'editor-input',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      const nextDocument: unknown = updatedEditor.getJSON()
      try {
        assertRichTextDocument(nextDocument)
        lastValidDocumentRef.current = nextDocument
        onChange(nextDocument)
      } catch {
        updatedEditor.commands.setContent(lastValidDocumentRef.current, {
          emitUpdate: false,
          errorOnInvalidContent: true,
        })
      }
    },
  })

  useEffect(() => {
    lastValidDocumentRef.current = document
  }, [document])

  useEffect(() => {
    onEditorReady?.(editor)
    return () => onEditorReady?.(null)
  }, [editor, onEditorReady])

  return <EditorContent editor={editor} />
}
