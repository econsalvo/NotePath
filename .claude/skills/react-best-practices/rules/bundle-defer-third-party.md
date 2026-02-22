---
title: Defer Non-Critical Third-Party Libraries
impact: CRITICAL
impactDescription: Reduces initial bundle size
tags: bundle, dynamic-import, analytics, third-party
---

## Defer Non-Critical Third-Party Libraries

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

**Incorrect (blocks initial bundle):**

```tsx
import { Analytics } from 'analytics-library'

export default function App({ children }) {
  return (
    <div>
      {children}
      <Analytics />
    </div>
  )
}
```

**Correct (loads after hydration):**

```tsx
import { lazy, Suspense } from 'react'

const Analytics = lazy(() => import('analytics-library').then(m => ({ default: m.Analytics })))

export default function App({ children }) {
  return (
    <div>
      {children}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
    </div>
  )
}
```

**When to apply:**
- Analytics libraries
- Error tracking (Sentry, etc.)
- Logging services
- Chat widgets
- Any non-critical third-party code
