---
title: Function References and File-Based Routing
impact: HIGH
impactDescription: Correct function addressing
tags: convex, functions, api, internal, routing
---

## Function References and File-Based Routing

Convex uses file-based routing. Use `api` for public functions and `internal` for private functions.

**File structure determines references:**

```
convex/
├── users.ts        → api.users.functionName
├── messages/
│   └── access.ts   → api.messages.access.functionName
└── _internal/
    └── helpers.ts  → internal._internal.helpers.functionName
```

**Incorrect (wrong reference):**

```typescript
// In convex/index.ts
import { internal } from "./_generated/api";

// BAD: Using internal for a public function
await ctx.runQuery(internal.users.getUser, {});

// BAD: Trying to call function directly
await ctx.runQuery(getUser, {});
```

**Correct (proper references):**

```typescript
import { api, internal } from "./_generated/api";

// Public function defined with `query` in convex/users.ts
await ctx.runQuery(api.users.getUser, { userId });

// Internal function defined with `internalQuery` in convex/users.ts
await ctx.runQuery(internal.users.getUserInternal, { userId });

// Nested: public function in convex/messages/access.ts
await ctx.runQuery(api.messages.access.canRead, { messageId });
```

**Key points:**
- `api` object for public functions (`query`, `mutation`, `action`)
- `internal` object for internal functions (`internalQuery`, etc.)
- Path matches file location: `convex/foo/bar.ts` → `api.foo.bar.functionName`
