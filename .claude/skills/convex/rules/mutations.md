---
title: Mutation Best Practices
impact: HIGH
impactDescription: Correct data modification
tags: convex, mutations, patch, replace, insert
---

## Mutation Best Practices

Use the correct method for data modifications: `insert`, `patch`, or `replace`.

**Insert new documents:**

```typescript
export const createUser = mutation({
  args: { name: v.string(), email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
    });
  },
});
```

**Patch (partial update):**

```typescript
export const updateUserName = mutation({
  args: { userId: v.id("users"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // GOOD: Only updates specified fields
    await ctx.db.patch(args.userId, { name: args.name });
    return null;
  },
});
```

**Replace (full document replacement):**

```typescript
export const replaceUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    email: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Replaces entire document (except _id and _creationTime)
    await ctx.db.replace(args.userId, {
      name: args.name,
      email: args.email,
    });
    return null;
  },
});
```

**Delete documents:**

```typescript
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
    return null;
  },
});
```

**Key differences:**
- `patch`: Shallow merge, keeps unspecified fields
- `replace`: Overwrites entire document
- Both throw if document doesn't exist
