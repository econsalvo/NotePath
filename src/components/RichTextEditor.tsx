import {
  EditorContent,
  useEditor,
  type Editor,
  type JSONContent,
} from '@tiptap/react'
import type { Transaction } from '@tiptap/pm/state'
import { useEffect, useRef, useState } from 'react'
import {
  assertRichTextDocument,
  type RichTextDocument,
} from '../domain/noteDocument'
import { validateNoteImage } from '../domain/noteImages'
import { noteEditorExtensions } from '../editor/extensions'

export type UploadedNoteImage = { storageId: string; url: string }

type RichTextEditorProps = {
  document: RichTextDocument
  imageUrls?: Record<string, string>
  onUploadImage?: (file: File) => Promise<UploadedNoteImage>
  onDiscardImage?: (storageId: string) => Promise<void>
  onChange: (document: RichTextDocument) => void
  onEditorReady?: (editor: Editor | null) => void
}

function persistedDocument(node: JSONContent): RichTextDocument {
  const stripTransientImageAttrs = (current: JSONContent): JSONContent => {
    if (current.type === 'image') {
      const width = current.attrs?.width
      return {
        type: 'image',
        attrs: {
          storageId: current.attrs?.storageId,
          ...(typeof width === 'number' ? { width } : {}),
        },
      }
    }
    return {
      ...current,
      ...(current.content
        ? { content: current.content.map(stripTransientImageAttrs) }
        : {}),
    }
  }

  const result: unknown = stripTransientImageAttrs(node)
  assertRichTextDocument(result)
  return result
}

function renderableDocument(
  node: JSONContent,
  imageUrls: Record<string, string>,
): JSONContent {
  if (node.type === 'image') {
    const storageId = node.attrs?.storageId
    const width = node.attrs?.width
    return {
      type: 'image',
      attrs: {
        storageId,
        ...(typeof width === 'number' ? { width } : {}),
        src: typeof storageId === 'string' ? imageUrls[storageId] ?? null : null,
      },
    }
  }
  return {
    ...node,
    ...(node.content
      ? { content: node.content.map((child) => renderableDocument(child, imageUrls)) }
      : {}),
  }
}

export function RichTextEditor({
  document,
  imageUrls = {},
  onUploadImage,
  onDiscardImage,
  onChange,
  onEditorReady,
}: RichTextEditorProps) {
  const lastValidDocumentRef = useRef(document)
  const imageUrlsRef = useRef(imageUrls)
  const editorRef = useRef<Editor | null>(null)
  const onUploadImageRef = useRef(onUploadImage)
  const onDiscardImageRef = useRef(onDiscardImage)
  const [imageStatus, setImageStatus] = useState<
    { kind: 'uploading'; count: number } | { kind: 'error'; message: string } | null
  >(null)

  imageUrlsRef.current = imageUrls
  onUploadImageRef.current = onUploadImage
  onDiscardImageRef.current = onDiscardImage

  const editor = useEditor({
    extensions: noteEditorExtensions,
    content: renderableDocument(document, imageUrls),
    enableContentCheck: true,
    editorProps: {
      attributes: {
        'aria-label': 'Note body',
        'aria-multiline': 'true',
        'data-placeholder': 'Start writing...',
        role: 'textbox',
        class: 'editor-input',
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (files.length === 0) return false

        event.preventDefault()
        const pasteEditor = editorRef.current
        let position = view.state.selection.from
        void (async () => {
          const uploadImage = onUploadImageRef.current
          if (!uploadImage || !pasteEditor) {
            setImageStatus({ kind: 'error', message: 'Image upload is unavailable.' })
            return
          }

          const mapPastePosition = ({ transaction }: { transaction: Transaction }) => {
            position = transaction.mapping.map(position, 1)
          }
          pasteEditor.on('transaction', mapPastePosition)
          setImageStatus({ kind: 'uploading', count: files.length })
          let finalizedImage: UploadedNoteImage | null = null
          try {
            for (const file of files) {
              validateNoteImage(file)
              finalizedImage = await uploadImage(file)
              const currentEditor = editorRef.current
              if (
                currentEditor !== pasteEditor ||
                currentEditor.isDestroyed ||
                !currentEditor.commands.insertContentAt(position, {
                  type: 'image',
                  attrs: {
                    storageId: finalizedImage.storageId,
                    src: finalizedImage.url,
                  },
                })
              ) {
                throw new Error('Could not insert uploaded image.')
              }
              finalizedImage = null
            }
            setImageStatus(null)
          } catch (error) {
            if (finalizedImage) {
              await onDiscardImageRef.current?.(finalizedImage.storageId).catch(
                () => undefined,
              )
            }
            setImageStatus({
              kind: 'error',
              message: error instanceof Error ? error.message : 'Could not upload image.',
            })
          } finally {
            pasteEditor.off('transaction', mapPastePosition)
          }
        })()
        return true
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      try {
        const nextDocument = persistedDocument(updatedEditor.getJSON())
        lastValidDocumentRef.current = nextDocument
        onChange(nextDocument)
      } catch {
        updatedEditor.commands.setContent(
          renderableDocument(lastValidDocumentRef.current, imageUrlsRef.current),
          { emitUpdate: false, errorOnInvalidContent: true },
        )
      }
    },
  })

  useEffect(() => {
    lastValidDocumentRef.current = document
  }, [document])

  useEffect(() => {
    editorRef.current = editor
    onEditorReady?.(editor)
    return () => {
      editorRef.current = null
      onEditorReady?.(null)
    }
  }, [editor, onEditorReady])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const current = persistedDocument(editor.getJSON())
    const next = renderableDocument(current, imageUrls)
    const currentImageSources = JSON.stringify(editor.getJSON())
    if (JSON.stringify(next) === currentImageSources) return
    editor.commands.setContent(next, {
      emitUpdate: false,
      errorOnInvalidContent: true,
    })
  }, [editor, imageUrls])

  return (
    <>
      <EditorContent editor={editor} />
      {imageStatus?.kind === 'uploading' && (
        <p className="image-upload-status" role="status">
          Uploading {imageStatus.count === 1 ? 'image' : `${imageStatus.count} images`}…
        </p>
      )}
      {imageStatus?.kind === 'error' && (
        <p className="image-upload-status error" role="alert">
          {imageStatus.message}
        </p>
      )}
    </>
  )
}
