---
title: Schema Definition
impact: CRITICAL
impactDescription: Database structure and indexes
tags: convex, schema, indexes, defineSchema
---

## Schema Definition

Always define schema in `convex/schema.ts` using `defineSchema` and `defineTable`.

**Correct schema structure:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("user")),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  messages: defineTable({
    channelId: v.id("channels"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_channel", ["channelId"])
    .index("by_channel_and_author", ["channelId", "authorId"]),

  channels: defineTable({
    name: v.string(),
  }),
});
```

**System fields (auto-added):**
- `_id`: `v.id(tableName)` - unique document ID
- `_creationTime`: `v.number()` - creation timestamp

**Index naming convention:**
Include all indexed fields in the name:
- Single field: `by_email`
- Multiple fields: `by_channel_and_author`

**Index field order matters:**
If you need to query by field1 then field2 AND by field2 then field1, create separate indexes.

**Key points:**
- Schema must be in `convex/schema.ts`
- Import from `convex/server`
- Index fields must be queried in order defined
