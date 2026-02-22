---
title: TypeScript Best Practices
impact: HIGH
impactDescription: Type safety with Convex
tags: convex, typescript, Id, types
---

## TypeScript Best Practices

Use strict typing with Convex's generated types for maximum safety.

**Use Id<"table"> for document IDs:**

```typescript
import { Id } from "./_generated/dataModel";

// GOOD: Strict ID typing
function processUser(userId: Id<"users">) {
  // ...
}

// BAD: Loose string type
function processUser(userId: string) {
  // ...
}
```

**Record types with Id keys:**

```typescript
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const getUsernames = query({
  args: { userIds: v.array(v.id("users")) },
  returns: v.record(v.id("users"), v.string()),
  handler: async (ctx, args) => {
    const result: Record<Id<"users">, string> = {};
    for (const userId of args.userIds) {
      const user = await ctx.db.get(userId);
      if (user) {
        result[user._id] = user.name;
      }
    }
    return result;
  },
});
```

**Use `as const` for literals:**

```typescript
// GOOD
const status = "active" as const;

// In discriminated unions
result.push({ role: "user" as const, content: message });
```

**Array and Record initialization:**

```typescript
// Always specify types
const items: Array<string> = [];
const map: Record<string, number> = {};
```

**Node.js modules:**
Add `@types/node` to `package.json` when using Node.js built-ins.
