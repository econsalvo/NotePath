---
title: Use New Function Syntax
impact: CRITICAL
impactDescription: Required syntax for all Convex functions
tags: convex, functions, syntax
---

## Use New Function Syntax

Always use the new function syntax with `args`, `returns`, and `handler` for all Convex functions.

**Incorrect (old syntax):**

```typescript
import { query } from "./_generated/server";

export const getUser = query(async (ctx, args) => {
  return await ctx.db.get(args.userId);
});
```

**Correct (new syntax):**

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.object({ _id: v.id("users"), name: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

**Key points:**
- Always include `args` object with validators
- Always include `returns` validator
- Use `v.null()` if function returns null/undefined
- Handler receives validated args
