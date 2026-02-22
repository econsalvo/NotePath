---
title: Per-Request Deduplication with React.cache()
impact: HIGH
impactDescription: Eliminates duplicate queries within a request
tags: server, caching, react-cache, deduplication
---

## Per-Request Deduplication with React.cache()

Use `React.cache()` for server-side request deduplication. Authentication and database queries benefit most.

**Usage:**

```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id }
  })
})
```

Within a single request, multiple calls to `getCurrentUser()` execute the query only once.

**When to apply:**
- Authentication checks called from multiple components
- User data needed in multiple places
- Any expensive query called multiple times per request
