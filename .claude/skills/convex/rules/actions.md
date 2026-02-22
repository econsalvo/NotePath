---
title: Action Best Practices
impact: HIGH
impactDescription: External API calls and Node.js usage
tags: convex, actions, node, external
---

## Action Best Practices

Actions are for external API calls and Node.js operations. They cannot access the database directly.

**Use "use node" for Node.js modules:**

```typescript
"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI();

export const generateText = action({
  args: { prompt: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: args.prompt }],
    });
    return response.choices[0].message.content ?? "";
  },
});
```

**No ctx.db in actions:**

```typescript
// BAD: Actions cannot access database
export const badAction = action({
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {}); // ERROR!
  },
});

// GOOD: Use runMutation to write data
export const goodAction = action({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Call a mutation to write data
    await ctx.runMutation(internal.users.create, { name: args.name });
    return null;
  },
});
```

**Minimize query/mutation calls:**

```typescript
// BAD: Multiple transactions, race condition risk
const user = await ctx.runQuery(api.users.get, { id });
await ctx.runMutation(api.users.update, { id, count: user.count + 1 });

// GOOD: Single transaction in mutation
await ctx.runMutation(api.users.incrementCount, { id });
```

**Cross-runtime calls:**
Only use `ctx.runAction` when crossing runtimes (V8 to Node). Otherwise, extract shared code into helper functions.
