---
title: Use Activity Component for Show/Hide
impact: MEDIUM
impactDescription: Preserves state/DOM for expensive components
tags: rendering, activity, show-hide, optimization
---

## Use Activity Component for Show/Hide

Use React's `<Activity>` to preserve state/DOM for expensive components that frequently toggle visibility.

**Usage:**

```tsx
import { Activity } from 'react'

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <ExpensiveMenu />
    </Activity>
  )
}
```

Avoids expensive re-renders and state loss when toggling visibility.

**When to apply:**
- Dropdowns and menus
- Modal dialogs
- Tab panels
- Any component that toggles visibility frequently
