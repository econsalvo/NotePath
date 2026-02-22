import type { ReactNode } from 'react'

type EditorToolbarProps = {
  canEdit: boolean
  isDirty: boolean
  isSaving: boolean
  saveError: string | null
  fontSize: number
  canDecreaseFont: boolean
  canIncreaseFont: boolean
  onDecreaseFont: () => void
  onIncreaseFont: () => void
  onCommand: (command: string) => void
}

type ToolbarAction = {
  command: string
  label: string
  icon: ReactNode
}

const actions: ToolbarAction[] = [
  {
    command: 'bold',
    label: 'Bold',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 12.8c1.8-.6 3-2.1 3-4 0-2.7-2.1-4.8-5.2-4.8H6v16h6.4c3 0 5.2-2.2 5.2-4.9 0-2.2-1.5-3.8-3.6-4.3ZM9 6.7h2.7c1.4 0 2.3.8 2.3 2s-.9 2-2.3 2H9V6.7Zm3.1 10.6H9v-4h3.1c1.5 0 2.5.8 2.5 2s-1 2-2.5 2Z" />
      </svg>
    ),
  },
  {
    command: 'italic',
    label: 'Italic',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 4v2h2.7l-3.4 12H6v2h8v-2h-2.6l3.4-12H18V4h-8Z" />
      </svg>
    ),
  },
  {
    command: 'insertUnorderedList',
    label: 'Bulleted List',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 1h12v2H8V7Zm-4 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 1h12v2H8v-2Zm-4 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 1h12v2H8v-2Z" />
      </svg>
    ),
  },
  {
    command: 'insertOrderedList',
    label: 'Numbered List',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7h13v2H7V7Zm0 7h13v2H7v-2Zm0 7h13v2H7v-2ZM3 8V6H2V5h2v3H3Zm1 8H2v-1h1v-1H2v-1h2v3Zm0 6H2v-1h1v-1H2v-1h2v3Z" />
      </svg>
    ),
  },
  {
    command: 'removeFormat',
    label: 'Clear Formatting',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4 6 1.4-1.4L20 19.2 18.6 20.6l-4.5-4.5L12 20h-2l2.6-4.8-4-4L6 16H4l3.6-6.5L4 6Zm10.8 5.2L13 8H9.2l-1-2H18v2h-2.4l1.8 3.2-2.2-2Z" />
      </svg>
    ),
  },
]

function saveStatusText(isDirty: boolean, isSaving: boolean, saveError: string | null) {
  if (saveError) return 'Save failed'
  if (isSaving) return 'Saving...'
  if (isDirty) return 'Unsaved changes'
  return 'Auto-saved'
}

export function EditorToolbar({
  canEdit,
  isDirty,
  isSaving,
  saveError,
  fontSize,
  canDecreaseFont,
  canIncreaseFont,
  onDecreaseFont,
  onIncreaseFont,
  onCommand,
}: EditorToolbarProps) {
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-group">
          {actions.map((action) => (
            <button
              key={action.command}
              type="button"
              className="toolbar-btn icon-only"
              title={action.label}
              aria-label={action.label}
              onClick={() => onCommand(action.command)}
              disabled={!canEdit}
            >
              {action.icon}
            </button>
          ))}
        </div>

        <div className="font-size-controls" aria-label="Text size controls">
          <button
            type="button"
            className="toolbar-btn font-size-btn"
            onClick={onDecreaseFont}
            disabled={!canEdit || !canDecreaseFont}
            aria-label="Decrease text size"
            title="Decrease text size"
          >
            A-
          </button>
          <span className="font-size-value">{fontSize}px</span>
          <button
            type="button"
            className="toolbar-btn font-size-btn"
            onClick={onIncreaseFont}
            disabled={!canEdit || !canIncreaseFont}
            aria-label="Increase text size"
            title="Increase text size"
          >
            A+
          </button>
        </div>
      </div>

      <p className={`autosave-status${saveError ? ' error' : ''}`}>
        {saveStatusText(isDirty, isSaving, saveError)}
      </p>
    </header>
  )
}
