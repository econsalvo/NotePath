---
title: Dynamic Imports for Heavy Components
impact: CRITICAL
impactDescription: Reduces main chunk by 100-500KB+
tags: bundle, dynamic-import, code-splitting, lazy-loading
---

## Dynamic Imports for Heavy Components

Use `next/dynamic` or `React.lazy` to lazy-load large components not needed on initial render.

**Incorrect (Monaco bundles with main chunk ~300KB):**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**Correct (Monaco loads on demand):**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**React Native/Expo alternative:**

```tsx
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function Screen() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

**When to apply:**
- Code editors (Monaco, CodeMirror)
- Rich text editors (TipTap, Slate)
- Data visualization libraries
- PDF viewers
- Any component >50KB that isn't needed immediately
