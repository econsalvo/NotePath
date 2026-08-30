import { FontSize, TextStyle } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import { StarterKit } from '@tiptap/starter-kit'

const NoteImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      storageId: {
        default: null,
        rendered: false,
      },
      width: {
        default: null,
        rendered: false,
      },
    }
  },

  addNodeView() {
    return ({ editor, getPos, node }) => {
      let currentNode = node
      let removeDragListeners: (() => void) | null = null
      const wrapper = document.createElement('span')
      const image = document.createElement('img')
      const handle = document.createElement('button')

      wrapper.className = 'resizable-note-image'
      wrapper.contentEditable = 'false'
      handle.className = 'image-resize-handle'
      handle.type = 'button'
      handle.tabIndex = 0
      handle.setAttribute('aria-label', 'Resize image')
      handle.title = 'Drag to resize image'
      wrapper.append(image, handle)

      const render = () => {
        const width = currentNode.attrs.width
        const src = currentNode.attrs.src
        if (typeof src === 'string') image.src = src
        else image.removeAttribute('src')
        image.alt = currentNode.attrs.alt ?? ''
        wrapper.style.width = typeof width === 'number' ? `${width}%` : 'fit-content'
        image.style.width = typeof width === 'number' ? '100%' : 'auto'
      }

      const startResize = (event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        removeDragListeners?.()

        const editorWidth = editor.view.dom.getBoundingClientRect().width
        const startingWidth = wrapper.getBoundingClientRect().width
        if (editorWidth <= 0 || startingWidth <= 0) return
        const startingX = event.clientX

        const move = (moveEvent: PointerEvent) => {
          const position = getPos()
          if (typeof position !== 'number') return
          const width = Math.round(
            Math.min(
              100,
              Math.max(20, ((startingWidth + moveEvent.clientX - startingX) / editorWidth) * 100),
            ),
          )
          if (width === currentNode.attrs.width) return
          editor.view.dispatch(
            editor.state.tr.setNodeMarkup(position, undefined, {
              ...currentNode.attrs,
              width,
            }),
          )
        }
        const stop = () => removeDragListeners?.()
        removeDragListeners = () => {
          document.removeEventListener('pointermove', move)
          document.removeEventListener('pointerup', stop)
          document.removeEventListener('pointercancel', stop)
          removeDragListeners = null
        }
        document.addEventListener('pointermove', move)
        document.addEventListener('pointerup', stop)
        document.addEventListener('pointercancel', stop)
      }

      handle.addEventListener('pointerdown', startResize)
      render()

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type !== currentNode.type) return false
          currentNode = updatedNode
          render()
          return true
        },
        stopEvent: (event) => event.target === handle,
        ignoreMutation: () => true,
        destroy: () => {
          removeDragListeners?.()
          handle.removeEventListener('pointerdown', startResize)
        },
      }
    }
  },
})

export const noteEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
    trailingNode: false,
    underline: false,
  }),
  TextStyle,
  FontSize.configure({ types: ['textStyle'] }),
  NoteImage,
]
