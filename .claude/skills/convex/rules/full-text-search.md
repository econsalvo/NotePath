---
title: Full Text Search
impact: MEDIUM
impactDescription: Search functionality
tags: convex, search, fulltext, withSearchIndex
---

## Full Text Search

Use `withSearchIndex` for full-text search queries.

**Define search index in schema:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    channel: v.string(),
    body: v.string(),
    author: v.string(),
  }).searchIndex("search_body", {
    searchField: "body",
    filterFields: ["channel"],
  }),
});
```

**Search query:**

```typescript
export const searchMessages = query({
  args: {
    channel: v.string(),
    searchText: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("messages"),
    body: v.string(),
    channel: v.string(),
  })),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withSearchIndex("search_body", (q) =>
        q.search("body", args.searchText).eq("channel", args.channel)
      )
      .take(10);
    return messages;
  },
});
```

**Search syntax:**
- `.search("field", "query")` - full-text search on field
- `.eq("field", value)` - filter by exact match (must be in filterFields)
- Combine search with filters for scoped results

**Key points:**
- Search indexes are defined separately from regular indexes
- `searchField` is the field to search
- `filterFields` are fields you can filter by in the query
- Results are ordered by relevance
