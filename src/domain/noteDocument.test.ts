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

  it('round-trips durable image storage IDs without render URLs', () => {
    const document: RichTextDocument = {
      type: 'doc',
      content: [
        { type: 'image', attrs: { storageId: 'storage_123', width: 65 } },
        { type: 'paragraph' },
      ],
    }

    const stored = encodeStoredDocument(document)

    expect(decodeStoredDocument(stored).document).toEqual(document)
    expect(stored).not.toContain('http')
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

  it('decodes entities from legacy innerHTML that contains no elements', () => {
    expect(decodeStoredDocument('A &amp;amp; B')).toEqual({
      needsMigration: true,
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'A &amp; B' }],
          },
        ],
      },
    })
    expect(
      documentToPlainText(
        decodeStoredDocument('&lt;script&gt;plain text&lt;/script&gt;').document,
      ),
    ).toBe('<script>plain text</script>')
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

  it('preserves supported marks applied by a legacy block wrapper', () => {
    expect(
      decodeStoredDocument(
        '<p style="font-size: 28px; font-weight: bold">Wrapped text</p>',
      ),
    ).toEqual({
      needsMigration: true,
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Wrapped text',
                marks: [
                  { type: 'bold' },
                  { type: 'textStyle', attrs: { fontSize: '28px' } },
                ],
              },
            ],
          },
        ],
      },
    })
  })

  it('preserves legacy hard line breaks inside paragraphs and list items', () => {
    expect(
      decodeStoredDocument(
        '<p>First line<br>Second line</p><ul><li>First item line<br>Second item line</li></ul>',
      ),
    ).toEqual({
      needsMigration: true,
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'First line' },
              { type: 'hardBreak' },
              { type: 'text', text: 'Second line' },
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
                    content: [
                      { type: 'text', text: 'First item line' },
                      { type: 'hardBreak' },
                      { type: 'text', text: 'Second item line' },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    })
  })

  it('migrates headings and unsupported legacy blocks to safe paragraphs without losing text', () => {
    const stored = [
      '<h1>Roadmap</h1>',
      '<section><h2>First phase</h2>',
      '<blockquote>Keep <u>every</u> word</blockquote></section>',
      '<article><header>Opening</header><footer>Closing</footer></article>',
      '<ul><li><h3>List heading</h3><p>List detail</p></li></ul>',
    ].join('')

    expect(decodeStoredDocument(stored)).toEqual({
      needsMigration: true,
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Roadmap' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First phase' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Keep every word' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Opening' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Closing' }],
          },
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'List heading' }],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'List detail' }],
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

  it('preserves valid JSON text that is not a complete canonical envelope', () => {
    const stored = '{"document":"draft"}'

    expect(decodeStoredDocument(stored)).toEqual({
      needsMigration: true,
      document: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: stored }],
          },
        ],
      },
    })
  })
})
