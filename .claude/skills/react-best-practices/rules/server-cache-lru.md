---
title: Cross-Request LRU Caching
impact: HIGH
impactDescription: Eliminates repeated DB queries across requests
tags: server, caching, lru, performance
---

## Cross-Request LRU Caching

`React.cache()` only works within one request. For data shared across sequential requests (user clicks button A then button B), use an LRU cache.

**Implementation:**

```typescript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000  // 5 minutes
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// Request 1: DB query, result cached
// Request 2: cache hit, no DB query
```

**When to apply:**
- Sequential user actions hitting multiple endpoints needing the same data
- Frequently accessed reference data
- User profile data

**Note:** In serverless environments, consider Redis for cross-process caching.

**References:**
- [node-lru-cache](https://github.com/isaacs/node-lru-cache)
