---
title: Validators Reference
impact: CRITICAL
impactDescription: Type safety and runtime validation
tags: convex, validators, types, v
---

## Validators Reference

Always use validators for arguments and return types. Import from `convex/values`.

**Core validators:**

| Validator | TypeScript | Example |
|-----------|------------|---------|
| `v.id("table")` | `Id<"table">` | `v.id("users")` |
| `v.null()` | `null` | `v.null()` |
| `v.int64()` | `bigint` | `v.int64()` |
| `v.number()` | `number` | `v.number()` |
| `v.boolean()` | `boolean` | `v.boolean()` |
| `v.string()` | `string` | `v.string()` |
| `v.bytes()` | `ArrayBuffer` | `v.bytes()` |
| `v.array(v)` | `T[]` | `v.array(v.string())` |
| `v.object({})` | `{ ... }` | `v.object({ name: v.string() })` |
| `v.record(k, v)` | `Record<K, V>` | `v.record(v.string(), v.number())` |
| `v.union(...)` | `A \| B` | `v.union(v.string(), v.null())` |
| `v.literal(x)` | `"x"` | `v.literal("active")` |
| `v.optional(v)` | `T \| undefined` | `v.optional(v.string())` |

**Discriminated unions:**

```typescript
v.union(
  v.object({
    kind: v.literal("error"),
    errorMessage: v.string(),
  }),
  v.object({
    kind: v.literal("success"),
    value: v.number(),
  }),
)
```

**Important notes:**
- Use `v.null()` for null returns (not `undefined`)
- Use `v.int64()` instead of deprecated `v.bigint()`
- `v.map()` and `v.set()` are NOT supported - use `v.record()`
- Arrays max 8192 items, objects max 1024 fields
- Field names cannot start with `$` or `_`
