---
title: Pagination
impact: MEDIUM
impactDescription: Efficient large dataset handling
tags: convex, pagination, cursor
---

## Pagination

Use `paginationOptsValidator` and `.paginate()` for paginated queries.

**Paginated query:**

```typescript
import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const listMessages = query({
  args: {
    channelId: v.id("channels"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

**Pagination options:**

```typescript
// Client passes:
{
  numItems: 10,              // Max items per page
  cursor: null,              // null for first page, string for subsequent
}
```

**Pagination result:**

```typescript
// Query returns:
{
  page: Document[],          // Array of documents
  isDone: boolean,           // true if last page
  continueCursor: string,    // Cursor for next page
}
```

**Client usage:**

```typescript
// First page
const result = await client.query(api.messages.listMessages, {
  channelId,
  paginationOpts: { numItems: 10, cursor: null },
});

// Next page
const nextResult = await client.query(api.messages.listMessages, {
  channelId,
  paginationOpts: { numItems: 10, cursor: result.continueCursor },
});
```
