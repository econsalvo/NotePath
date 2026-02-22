---
title: Use Set/Map for O(1) Lookups
impact: LOW-MEDIUM
impactDescription: O(1) instead of O(n) per check
tags: js, set, map, lookup, performance
---

## Use Set/Map for O(1) Lookups

Convert arrays to Set/Map for repeated membership checks.

**Incorrect (O(n) per check):**

```typescript
const allowedIds = ['a', 'b', 'c', ...]
items.filter(item => allowedIds.includes(item.id))
```

**Correct (O(1) per check):**

```typescript
const allowedIds = new Set(['a', 'b', 'c', ...])
items.filter(item => allowedIds.has(item.id))
```

**When to apply:**
- Checking if item exists in a list
- Multiple membership checks on the same data
- Any repeated `.includes()` or `.indexOf()` calls
