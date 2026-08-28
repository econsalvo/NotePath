import { FontSize, TextStyle } from '@tiptap/extension-text-style'
import { StarterKit } from '@tiptap/starter-kit'

export const noteEditorExtensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    hardBreak: false,
    heading: false,
    horizontalRule: false,
    link: false,
    strike: false,
    trailingNode: false,
    underline: false,
  }),
  TextStyle,
  FontSize.configure({ types: ['textStyle'] }),
]
