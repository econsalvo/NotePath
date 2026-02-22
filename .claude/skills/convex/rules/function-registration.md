---
title: Public vs Internal Functions
impact: CRITICAL
impactDescription: Security - exposes API surface
tags: convex, functions, security, api
---

## Public vs Internal Functions

Use `internalQuery`, `internalMutation`, and `internalAction` for private functions. Use `query`, `mutation`, and `action` for public API functions.

**Incorrect (exposing internal function):**

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// BAD: This sensitive function is exposed to the public Internet
export const deleteAllUserData = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Sensitive operation exposed publicly
  },
});
```

**Correct (internal function):**

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// GOOD: Only callable by other Convex functions
export const deleteAllUserData = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Sensitive operation kept private
  },
});
```

**Guidelines:**
- Public functions (`query`, `mutation`, `action`) are exposed to the Internet
- Internal functions can only be called by other Convex functions
- All functions import from `./_generated/server`
- You CANNOT register functions through `api` or `internal` objects
