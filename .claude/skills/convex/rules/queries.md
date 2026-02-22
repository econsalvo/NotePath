---
title: Query Best Practices
impact: CRITICAL
impactDescription: Performance - avoid table scans
tags: convex, queries, indexes, withIndex
---

## Query Best Practices

Use `withIndex()` instead of `filter()` for efficient queries. Define indexes in schema.

**Incorrect (table scan with filter):**

```typescript
export const getMessagesByChannel = query({
  args: { channelId: v.id("channels") },
  returns: v.array(v.object({ /* ... */ })),
  handler: async (ctx, args) => {
    // BAD: Scans entire table
    return await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("channelId"), args.channelId))
      .collect();
  },
});
```

**Correct (index-based query):**

```typescript
export const getMessagesByChannel = query({
  args: { channelId: v.id("channels") },
  returns: v.array(v.object({ /* ... */ })),
  handler: async (ctx, args) => {
    // GOOD: Uses index, efficient
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .collect();
  },
});
```

**Ordering:**

```typescript
// Default: ascending by _creationTime
// Explicit ordering:
.order("desc")  // newest first
.order("asc")   // oldest first (default)
```

**Query methods:**
- `.collect()` - get all results as array
- `.take(n)` - get first n results
- `.unique()` - get single result (throws if multiple)
- `.first()` - get first result or null

**Async iteration (no collect):**

```typescript
for await (const message of ctx.db.query("messages").withIndex(...)) {
  // Process each message
}
```

**Deleting documents:**

```typescript
// Cannot use .delete() on queries
// Instead:
const docs = await ctx.db.query("messages").withIndex(...).collect();
for (const doc of docs) {
  await ctx.db.delete(doc._id);
}
```
