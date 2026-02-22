---
title: Function Calling Context
impact: HIGH
impactDescription: Correct inter-function communication
tags: convex, functions, context, runQuery, runMutation
---

## Function Calling Context

Use the correct context methods to call other functions: `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`.

**Incorrect (passing function directly):**

```typescript
export const parent = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // BAD: Cannot pass function directly
    await ctx.runQuery(childQuery, { id: "123" });
  },
});
```

**Correct (using function reference):**

```typescript
import { api, internal } from "./_generated/api";

export const parent = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // GOOD: Use api/internal for function references
    const result = await ctx.runQuery(api.users.getUser, { id: "123" });
    await ctx.runMutation(internal.users.updateInternal, { id: "123" });
  },
});
```

**Context method availability:**
- Queries: `ctx.runQuery`
- Mutations: `ctx.runQuery`, `ctx.runMutation`
- Actions: `ctx.runQuery`, `ctx.runMutation`, `ctx.runAction`

**Same-file calls need type annotation:**

```typescript
export const g = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Type annotation needed for same-file calls
    const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
    return null;
  },
});
```
