---
name: convex
description: Use this agent when working with Convex backend functions, queries, mutations, actions, schema, or validators. Invoke when writing or reviewing Convex code, implementing real-time features, or designing database schemas.
allowed-tools: Read, Edit, Grep, Glob, Write
---

# Convex Development Guidelines

Expert guidance for Convex backend development including functions, schema design, and best practices.

## How It Works

1. Read the specified Convex files (or prompt user for files)
2. Check against all rules in the `rules/` folder
3. Provide guidance following Convex best practices

## When to Use

- Writing new Convex functions (queries, mutations, actions)
- Designing database schemas
- Implementing HTTP endpoints
- Working with validators
- Setting up cron jobs or scheduling
- File storage operations
- Reviewing existing Convex code

## Key Principles

### Function Syntax
Always use the new function syntax with `args`, `returns`, and `handler`:
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const f = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
```

### Public vs Internal
- Use `query`, `mutation`, `action` for public API functions
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- Never expose sensitive internal functions publicly

### Queries Best Practices
- Use `withIndex()` instead of `filter()` for performance
- Define indexes in schema matching query patterns
- Use `.order('asc')` or `.order('desc')` for ordering

### Validators
Always include argument and return validators:
- `v.string()`, `v.number()`, `v.boolean()`
- `v.id("tableName")` for document IDs
- `v.array()`, `v.object()`, `v.union()`
- `v.null()` for null returns
- `v.optional()` for optional fields

## Rule Categories

See the `rules/` folder for detailed guidelines:
- **Functions**: syntax, registration, calling, references
- **HTTP Endpoints**: httpRouter, httpAction
- **Validators**: type validators, discriminated unions
- **Schema**: defineSchema, indexes, system fields
- **TypeScript**: Id types, Records, strict typing
- **Queries**: withIndex, ordering, pagination
- **Mutations**: patch vs replace
- **Actions**: "use node", no ctx.db
- **Scheduling**: crons, scheduler.runAfter
- **File Storage**: _storage table, getUrl

## Output Format

When reviewing code, provide findings in `file:line` notation:
```
convex/messages.ts:15 - Use withIndex instead of filter
convex/schema.ts:8 - Index name should include all fields (by_channel_and_author)
convex/actions.ts:3 - Missing "use node" directive for Node.js modules
```
