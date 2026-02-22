---
title: Prevent Waterfall Chains in API Routes
impact: CRITICAL
impactDescription: Eliminates sequential network delays
tags: async, api-routes, server-actions, waterfalls
---

## Prevent Waterfall Chains in API Routes

In API routes and Server Actions, start independent operations immediately, even if you don't await them yet.

**Incorrect (config waits for auth, data waits for both):**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**Correct (auth and config start immediately):**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

**When to apply:**
- API route handlers
- Server Actions
- Any server-side code with multiple async operations

For operations with more complex dependency chains, use `better-all` (see async-dependencies rule).
