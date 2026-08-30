export const NOTE_DOCUMENT_SCHEMA_VERSION = 1 as const
export const NOTE_DOCUMENT_FORMAT = 'tiptap-json' as const

const FONT_SIZE_PATTERN = /^(1[6-9]|2\d|3[0-4])px$/
const MAX_STORED_CONTENT_LENGTH = 1_000_000
const MAX_DOCUMENT_DEPTH = 20
const MAX_DOCUMENT_NODES = 10_000
const LEGACY_EMPTY_HTML_PATTERN =
  /^\s*(?:<p>\s*(?:<br\s*\/?>|&nbsp;)?\s*<\/p>)?\s*$/i
const LEGACY_PLACEHOLDER_PATTERN =
  /^\s*<p>\s*Start writing\.\.\.\s*<\/p>\s*$/i
const LEGACY_HTML_PATTERN =
  /<\s*\/?\s*[a-z][a-z0-9:-]*(?:\s[^<>]*?)?\/?\s*>/i
const LEGACY_HTML_ENTITY_PATTERN =
  /&(?:#\d+|#x[\da-f]+|[a-z][a-z0-9]+);/i
const LEGACY_INLINE_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BDI',
  'BDO',
  'CITE',
  'CODE',
  'DEL',
  'EM',
  'FONT',
  'I',
  'INS',
  'KBD',
  'LABEL',
  'MARK',
  'Q',
  'S',
  'SAMP',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TIME',
  'U',
  'VAR',
  'WBR',
])
const LEGACY_PARAGRAPH_BLOCK_TAGS = new Set([
  'ADDRESS',
  'DD',
  'DT',
  'FIGCAPTION',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'LEGEND',
  'P',
  'PRE',
  'SUMMARY',
  'TD',
  'TH',
])
const UNSAFE_LEGACY_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'IMG',
  'VIDEO',
  'AUDIO',
  'NOSCRIPT',
  'TEMPLATE',
])

export type RichTextMark =
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'textStyle'; attrs: { fontSize: string } }

export type RichTextTextNode = {
  type: 'text'
  text: string
  marks?: RichTextMark[]
}

export type RichTextHardBreakNode = {
  type: 'hardBreak'
}

export type RichTextInlineNode = RichTextTextNode | RichTextHardBreakNode

export type RichTextParagraphNode = {
  type: 'paragraph'
  content?: RichTextInlineNode[]
}

export type RichTextImageNode = {
  type: 'image'
  attrs: { storageId: string }
}

export type RichTextListItemNode = {
  type: 'listItem'
  content: Array<RichTextParagraphNode | RichTextListNode | RichTextImageNode>
}

export type RichTextListNode = {
  type: 'bulletList' | 'orderedList'
  attrs?: { start: number; type?: null }
  content: RichTextListItemNode[]
}

export type RichTextDocument = {
  type: 'doc'
  content: Array<RichTextParagraphNode | RichTextListNode | RichTextImageNode>
}

export type PersistedNoteDocument = {
  schemaVersion: typeof NOTE_DOCUMENT_SCHEMA_VERSION
  format: typeof NOTE_DOCUMENT_FORMAT
  document: RichTextDocument
}

export type DecodedNoteDocument = {
  document: RichTextDocument
  needsMigration: boolean
}

export class InvalidNoteDocumentError extends Error {
  constructor(message = 'The saved note document is invalid or unsupported.') {
    super(message)
    this.name = 'InvalidNoteDocumentError'
  }
}

export function createEmptyDocument(): RichTextDocument {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function plainTextToDocument(value: string): RichTextDocument {
  const content: RichTextParagraphNode[] = value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      line.length > 0
        ? { type: 'paragraph', content: [{ type: 'text', text: line }] }
        : { type: 'paragraph' },
    )

  return { type: 'doc', content }
}

function marksEqual(left: RichTextMark[] | undefined, right: RichTextMark[]) {
  return JSON.stringify(left ?? []) === JSON.stringify(right)
}

function appendText(
  output: RichTextInlineNode[],
  text: string,
  marks: RichTextMark[],
) {
  if (!text) return
  const previous = output[output.length - 1]
  if (previous?.type === 'text' && marksEqual(previous.marks, marks)) {
    previous.text += text
    return
  }

  output.push({
    type: 'text',
    text,
    ...(marks.length > 0 ? { marks } : {}),
  })
}

function addMark(marks: RichTextMark[], mark: RichTextMark) {
  if (marks.some((current) => current.type === mark.type)) return marks
  return [...marks, mark]
}

function getLegacyElementMarks(element: HTMLElement, inherited: RichTextMark[]) {
  let marks = inherited
  const tagName = element.tagName
  const fontWeight = element.style.fontWeight

  if (
    tagName === 'B' ||
    tagName === 'STRONG' ||
    fontWeight === 'bold' ||
    (/^\d+$/.test(fontWeight) && Number(fontWeight) >= 600)
  ) {
    marks = addMark(marks, { type: 'bold' })
  }

  if (
    tagName === 'I' ||
    tagName === 'EM' ||
    element.style.fontStyle === 'italic'
  ) {
    marks = addMark(marks, { type: 'italic' })
  }

  const fontSize = element.style.fontSize.trim().toLowerCase()
  if (FONT_SIZE_PATTERN.test(fontSize)) {
    marks = addMark(marks, {
      type: 'textStyle',
      attrs: { fontSize },
    })
  }

  return marks
}

function readLegacyInline(
  node: Node,
  marks: RichTextMark[],
  output: RichTextInlineNode[],
) {
  if (node.nodeType === Node.TEXT_NODE) {
    appendText(output, node.textContent ?? '', marks)
    return
  }

  if (!(node instanceof HTMLElement) || UNSAFE_LEGACY_TAGS.has(node.tagName)) {
    return
  }

  if (node.tagName === 'BR') {
    output.push({ type: 'hardBreak' })
    return
  }

  const nextMarks = getLegacyElementMarks(node, marks)
  node.childNodes.forEach((child) => readLegacyInline(child, nextMarks, output))
}

function paragraphFromLegacyNodes(
  nodes: Node[],
  inheritedMarks: RichTextMark[] = [],
) {
  const content: RichTextInlineNode[] = []
  nodes.forEach((node) => readLegacyInline(node, inheritedMarks, content))
  const hasText = content.some(
    (node) =>
      node.type === 'text' && node.text.replace(/\u00a0/g, ' ').trim(),
  )
  return hasText
    ? ({ type: 'paragraph', content } satisfies RichTextParagraphNode)
    : ({ type: 'paragraph' } satisfies RichTextParagraphNode)
}

function listFromLegacyElement(
  element: HTMLElement,
  inheritedMarks: RichTextMark[],
): RichTextListNode | null {
  const type = element.tagName === 'OL' ? 'orderedList' : 'bulletList'
  const listMarks = getLegacyElementMarks(element, inheritedMarks)
  const content = Array.from(element.children)
    .filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child.tagName === 'LI',
    )
    .map((child) => {
      const itemContent = blocksFromLegacyContainer(child, true, listMarks)

      return {
        type: 'listItem' as const,
        content:
          itemContent.length > 0
            ? itemContent
            : [
                paragraphFromLegacyNodes(
                  Array.from(child.childNodes),
                  getLegacyElementMarks(child, listMarks),
                ),
              ],
      }
    })

  if (content.length === 0) return null

  if (type === 'orderedList') {
    const start = Number(element.getAttribute('start'))
    return {
      type,
      ...(Number.isSafeInteger(start) && start > 1 ? { attrs: { start } } : {}),
      content,
    }
  }

  return { type, content }
}

function blocksFromLegacyContainer(
  container: ParentNode,
  preserveTopLevelBreaks = false,
  inheritedMarks: RichTextMark[] = [],
) {
  const blocks: Array<RichTextParagraphNode | RichTextListNode> = []
  const pendingInline: Node[] = []
  const containerMarks =
    container instanceof HTMLElement
      ? getLegacyElementMarks(container, inheritedMarks)
      : inheritedMarks

  const flushInline = () => {
    const hasMeaningfulText = pendingInline.some((node) =>
      (node.textContent ?? '').replace(/\u00a0/g, ' ').trim(),
    )
    if (hasMeaningfulText) {
      blocks.push(paragraphFromLegacyNodes(pendingInline, containerMarks))
    }
    pendingInline.length = 0
  }

  container.childNodes.forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      pendingInline.push(child)
      return
    }

    if (UNSAFE_LEGACY_TAGS.has(child.tagName)) return

    if (child.tagName === 'UL' || child.tagName === 'OL') {
      flushInline()
      const list = listFromLegacyElement(child, containerMarks)
      if (list) blocks.push(list)
      return
    }

    if (child.tagName === 'BR') {
      if (preserveTopLevelBreaks) {
        pendingInline.push(child)
        return
      }
      flushInline()
      return
    }

    if (LEGACY_PARAGRAPH_BLOCK_TAGS.has(child.tagName)) {
      flushInline()
      blocks.push(
        paragraphFromLegacyNodes(
          Array.from(child.childNodes),
          getLegacyElementMarks(child, containerMarks),
        ),
      )
      return
    }

    if (!LEGACY_INLINE_TAGS.has(child.tagName)) {
      flushInline()
      const nestedBlocks = blocksFromLegacyContainer(
        child,
        false,
        containerMarks,
      )
      blocks.push(
        ...(nestedBlocks.length > 0
          ? nestedBlocks
          : [
              paragraphFromLegacyNodes(
                Array.from(child.childNodes),
                getLegacyElementMarks(child, containerMarks),
              ),
            ]),
      )
      return
    }

    pendingInline.push(child)
  })

  flushInline()
  return blocks
}

function legacyHtmlToDocument(value: string): RichTextDocument {
  if (typeof DOMParser === 'undefined') {
    return plainTextToDocument(value)
  }

  const parsed = new DOMParser().parseFromString(value, 'text/html')
  const content = blocksFromLegacyContainer(parsed.body)
  const document = content.length > 0 ? { type: 'doc' as const, content } : createEmptyDocument()
  assertRichTextDocument(document)
  return document
}

function migrateLegacyDocument(stored: string): DecodedNoteDocument {
  if (
    !stored.trim() ||
    LEGACY_EMPTY_HTML_PATTERN.test(stored) ||
    LEGACY_PLACEHOLDER_PATTERN.test(stored)
  ) {
    return { document: createEmptyDocument(), needsMigration: true }
  }

  const document =
    LEGACY_HTML_PATTERN.test(stored) || LEGACY_HTML_ENTITY_PATTERN.test(stored)
    ? legacyHtmlToDocument(stored)
    : plainTextToDocument(stored)
  return { document, needsMigration: true }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  return Object.keys(value).every((key) => allowedKeys.includes(key))
}

function hasCanonicalEnvelopeShape(value: Record<string, unknown>) {
  const hasOwn = (key: string) =>
    Object.prototype.hasOwnProperty.call(value, key)
  return (
    hasOwn('schemaVersion') &&
    hasOwn('format') &&
    hasOwn('document')
  )
}

function isValidMark(value: unknown): value is RichTextMark {
  if (!isRecord(value) || typeof value.type !== 'string') return false

  if (value.type === 'bold' || value.type === 'italic') {
    return hasOnlyKeys(value, ['type'])
  }

  if (value.type !== 'textStyle' || !hasOnlyKeys(value, ['type', 'attrs'])) {
    return false
  }

  const attrs = value.attrs
  return (
    isRecord(attrs) &&
    hasOnlyKeys(attrs, ['fontSize']) &&
    typeof attrs.fontSize === 'string' &&
    FONT_SIZE_PATTERN.test(attrs.fontSize)
  )
}

function isValidTextNode(value: unknown) {
  if (!isRecord(value) || value.type !== 'text') return false
  if (!hasOnlyKeys(value, ['type', 'text', 'marks'])) return false
  if (typeof value.text !== 'string' || value.text.length === 0) return false
  if (value.marks === undefined) return true
  return Array.isArray(value.marks) && value.marks.every(isValidMark)
}

function isValidHardBreakNode(value: unknown) {
  return isRecord(value) && value.type === 'hardBreak' && hasOnlyKeys(value, ['type'])
}

function isValidImageNode(value: unknown): value is RichTextImageNode {
  if (!isRecord(value) || value.type !== 'image') return false
  if (!hasOnlyKeys(value, ['type', 'attrs']) || !isRecord(value.attrs)) return false
  return (
    hasOnlyKeys(value.attrs, ['storageId']) &&
    typeof value.attrs.storageId === 'string' &&
    /^[A-Za-z0-9_-]{1,256}$/.test(value.attrs.storageId)
  )
}

function isValidParagraphNode(value: unknown, nodeCounter: { count: number }) {
  if (!isRecord(value) || value.type !== 'paragraph') return false
  if (!hasOnlyKeys(value, ['type', 'content'])) return false
  nodeCounter.count += 1
  if (nodeCounter.count > MAX_DOCUMENT_NODES) return false
  if (value.content === undefined) return true
  return (
    Array.isArray(value.content) &&
    value.content.every(
      (node) => isValidTextNode(node) || isValidHardBreakNode(node),
    )
  )
}

function isValidListNode(
  value: unknown,
  depth: number,
  nodeCounter: { count: number },
): value is RichTextListNode {
  if (depth > MAX_DOCUMENT_DEPTH || !isRecord(value)) return false
  if (value.type !== 'bulletList' && value.type !== 'orderedList') return false
  if (!hasOnlyKeys(value, ['type', 'attrs', 'content'])) return false
  nodeCounter.count += 1
  if (nodeCounter.count > MAX_DOCUMENT_NODES) return false

  if (value.attrs !== undefined) {
    if (value.type !== 'orderedList' || !isRecord(value.attrs)) return false
    if (!hasOnlyKeys(value.attrs, ['start', 'type'])) return false
    if (!Number.isSafeInteger(value.attrs.start) || Number(value.attrs.start) < 1) {
      return false
    }
    if (value.attrs.type !== undefined && value.attrs.type !== null) return false
  }

  return (
    Array.isArray(value.content) &&
    value.content.length > 0 &&
    value.content.every((item) => {
      if (!isRecord(item) || item.type !== 'listItem') return false
      if (!hasOnlyKeys(item, ['type', 'content'])) return false
      nodeCounter.count += 1
      if (nodeCounter.count > MAX_DOCUMENT_NODES) return false
      if (!Array.isArray(item.content) || item.content.length === 0) return false
      return item.content.every((child) =>
        isValidParagraphNode(child, nodeCounter) ||
        isValidListNode(child, depth + 1, nodeCounter) ||
        isValidImageNode(child),
      )
    })
  )
}

export function isRichTextDocument(value: unknown): value is RichTextDocument {
  if (!isRecord(value) || value.type !== 'doc') return false
  if (!hasOnlyKeys(value, ['type', 'content'])) return false
  if (!Array.isArray(value.content) || value.content.length === 0) return false

  const nodeCounter = { count: 1 }
  return value.content.every((node) =>
    isValidParagraphNode(node, nodeCounter) ||
    isValidListNode(node, 1, nodeCounter) ||
    isValidImageNode(node),
  )
}

export function assertRichTextDocument(
  value: unknown,
): asserts value is RichTextDocument {
  if (!isRichTextDocument(value)) {
    throw new InvalidNoteDocumentError()
  }
}

function nodeText(
  node: RichTextParagraphNode | RichTextListNode | RichTextImageNode,
): string {
  if (node.type === 'image') return ''
  if (node.type === 'paragraph') {
    return node.content
      ?.map((child) => (child.type === 'text' ? child.text : '\n'))
      .join('') ?? ''
  }

  return node.content
    .flatMap((item) => item.content.map(nodeText))
    .filter(Boolean)
    .join(' ')
}

export function documentToPlainText(document: RichTextDocument) {
  assertRichTextDocument(document)
  return document.content
    .map(nodeText)
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasMeaningfulDocument(document: RichTextDocument) {
  return documentToPlainText(document).length > 0
}

export function imageStorageIds(document: RichTextDocument) {
  assertRichTextDocument(document)
  const storageIds = new Set<string>()

  const visit = (
    node: RichTextParagraphNode | RichTextListNode | RichTextImageNode,
  ) => {
    if (node.type === 'image') {
      storageIds.add(node.attrs.storageId)
      return
    }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      node.content.forEach((item) => item.content.forEach(visit))
    }
  }

  document.content.forEach(visit)
  return [...storageIds]
}

export function encodeStoredDocument(document: RichTextDocument) {
  assertRichTextDocument(document)
  const persisted: PersistedNoteDocument = {
    schemaVersion: NOTE_DOCUMENT_SCHEMA_VERSION,
    format: NOTE_DOCUMENT_FORMAT,
    document,
  }
  const encoded = JSON.stringify(persisted)
  if (encoded.length > MAX_STORED_CONTENT_LENGTH) {
    throw new InvalidNoteDocumentError('The note document is too large to save.')
  }
  return encoded
}

export function decodeCanonicalStoredDocument(stored: string) {
  if (stored.length > MAX_STORED_CONTENT_LENGTH) {
    throw new InvalidNoteDocumentError('The saved note document is too large.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    throw new InvalidNoteDocumentError()
  }

  if (
    !isRecord(parsed) ||
    !hasOnlyKeys(parsed, ['schemaVersion', 'format', 'document']) ||
    parsed.schemaVersion !== NOTE_DOCUMENT_SCHEMA_VERSION ||
    parsed.format !== NOTE_DOCUMENT_FORMAT
  ) {
    throw new InvalidNoteDocumentError()
  }

  assertRichTextDocument(parsed.document)
  return parsed.document
}

export function decodeStoredDocument(stored: string): DecodedNoteDocument {
  if (stored.length > MAX_STORED_CONTENT_LENGTH) {
    throw new InvalidNoteDocumentError('The saved note document is too large.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(stored)
  } catch {
    return migrateLegacyDocument(stored)
  }

  if (!isRecord(parsed)) {
    return migrateLegacyDocument(stored)
  }

  if (!hasCanonicalEnvelopeShape(parsed)) {
    return migrateLegacyDocument(stored)
  }
  return {
    document: decodeCanonicalStoredDocument(stored),
    needsMigration: false,
  }
}
