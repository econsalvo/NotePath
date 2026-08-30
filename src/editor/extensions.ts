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
