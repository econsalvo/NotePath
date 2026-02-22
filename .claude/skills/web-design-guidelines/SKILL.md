---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to 'review my UI', 'check accessibility', 'audit design', 'review UX', or 'check my site against best practices'.
allowed-tools: Read, Grep, Glob, WebFetch
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines (100+ rules across 12 categories).

## How It Works

1. Read the specified files (or prompt user for files/pattern)
2. Check against all rules listed below
3. Output findings in terse `file:line` format

## Rule Categories

### Accessibility
- `aria-label` on icon buttons
- `<label>` or `aria-label` on form controls
- Keyboard handlers on interactive elements
- Semantic HTML prioritized over ARIA
- Hierarchical headings with skip links
- `aria-live="polite"` for async updates

### Focus States
- Visible focus indicators via `focus-visible:ring-*`
- No `outline-none` without replacement
- Use `:focus-visible` over `:focus`
- Group focus with `:focus-within`

### Forms
- `autocomplete` attribute
- Correct input `type` attributes
- Clickable labels
- Single hit targets for checkboxes/radios
- Inline error messaging
- Unsaved-change warnings

### Animation
- Honor `prefers-reduced-motion`
- Animate only `transform`/`opacity`
- Avoid `transition: all`
- Keep animations interruptible

### Typography
- Use ellipsis (`...`)
- Curly quotes
- Non-breaking spaces
- `tabular-nums` for number columns
- `text-wrap: balance` on headings

### Content Handling
- Truncation/line-clamping for long text
- `min-w-0` on flex children
- Empty state handling

### Images
- Explicit width/height
- `loading="lazy"` below-fold
- `priority`/`fetchpriority="high"` above-fold

### Performance
- Virtualize lists >50 items
- Avoid layout reads in render
- Batch DOM operations
- Preconnect CDNs, preload critical fonts

### Navigation & State
- URL reflects state (filters, tabs, pagination)
- Use `<a>`/`<Link>` elements
- Confirmation for destructive actions

### Touch & Interaction
- `touch-action: manipulation`
- `overscroll-behavior: contain` in modals
- Disable text selection during drag
- Limit `autoFocus`

### Safe Areas & Layout
- `env(safe-area-inset-*)` for notches
- Prevent unwanted scrollbars
- Prefer Flex/Grid over JS measurement

### Dark Mode & Theming
- `color-scheme: dark` on `<html>`
- Match `theme-color` meta tag
- Explicitly style native `<select>`

### Locale & i18n
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat`
- Detect language via headers/API, not IP

## Usage

When a user provides a file or pattern argument:
1. Read the specified files
2. Apply all rules from the categories above
3. Output findings using the format below

If no files specified, ask the user which files to review.

## Output Format

Group findings by file using `file:line` notation:

```
src/components/Button.tsx:15 - Missing aria-label on icon button
src/components/Form.tsx:42 - Input missing autocomplete attribute
src/components/Modal.tsx:8 - Missing overscroll-behavior: contain
```

Be terse. State the issue without verbose explanation.
