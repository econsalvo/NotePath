import { describe, expect, it } from 'vitest'
import {
  decodeStoredDocument,
  documentToPlainText,
  encodeStoredDocument,
  InvalidNoteDocumentError,
  type RichTextDocument,
} from './noteDocument'

describe('persisted note documents', () => {
  it('round-trips the canonical versioned rich-text format', () => {
    const document: RichTextDocument = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Persistent formatting',
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

    const stored = encodeStoredDocument(document)

    expect(stored).toBe(
      '{"schemaVersion":1,"format":"tiptap-json","document":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Persistent formatting","marks":[{"type":"bold"},{"type":"italic"},{"type":"textStyle","attrs":{"fontSize":"28px"}}]}]}]}}',
    )
    expect(decodeStoredDocument(stored)).toEqual({
      document,
      needsMigration: false,
    })
  })

  it.each([
    ['', { type: 'doc', content: [{ type: 'paragraph' }] }],
    ['   ', { type: 'doc', content: [{ type: 'paragraph' }] }],
    ['<p><br></p>', { type: 'doc', content: [{ type: 'paragraph' }] }],
    [
      '<p>Start writing...</p>',
      { type: 'doc', content: [{ type: 'paragraph' }] },
    ],
    [
      'first line\nsecond line',
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'first line' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'second line' }],
          },
        ],
      },
    ],
  ])('migrates legacy blank or plain-text content %#', (stored, document) => {
    expect(decodeStoredDocument(stored)).toEqual({
      document,
      needsMigration: true,
    })
  })

  it('migrates supported legacy HTML and strips unsafe markup', () => {
    const stored = [
      '<p onclick="steal()"><strong>Bold</strong> <em>Italic</em> ',
      '<span style="font-size: 28px; background-image: url(javascript:steal())">Large</span>',
      '<script>alert("unsafe")</script><img src="x" onerror="steal()"></p>',
      '<ul><li>Bullet</li></ul>',
      '<ol><li>Numbered</li></ol>',
    ].join('')

    expect(decodeStoredDocument(stored)).toEqual({
      needsMigration: true,
      document: {
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
                marks: [
                  { type: 'textStyle', attrs: { fontSize: '28px' } },
                ],
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
      },
    })
  })

  it('projects rich-text documents to safe sidebar text', () => {
    const migrated = decodeStoredDocument(
      '<p><strong>Opening</strong> paragraph</p><ul><li>Bullet item</li></ul>',
    )

    expect(documentToPlainText(migrated.document)).toBe(
      'Opening paragraph Bullet item',
    )
  })

  it.each([
    '{"schemaVersion":2,"format":"tiptap-json","document":{"type":"doc","content":[{"type":"paragraph"}]}}',
    '{"schemaVersion":1,"format":"tiptap-json","document":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Unsafe","marks":[{"type":"textStyle","attrs":{"fontSize":"16px; background:url(javascript:steal())"}}]}]}]}}',
    '{"schemaVersion":1,"format":"tiptap-json","document":{"type":"doc","content":[{"type":"paragraph","attrs":{"onclick":"steal()"}}]}}',
  ])('rejects invalid or unsupported persisted JSON %#', (stored) => {
    expect(() => decodeStoredDocument(stored)).toThrow(InvalidNoteDocumentError)
  })

  it('preserves malformed JSON-looking legacy plain text as text', () => {
    const stored = '{not valid JSON}'

    expect(documentToPlainText(decodeStoredDocument(stored).document)).toBe(stored)
  })
})
