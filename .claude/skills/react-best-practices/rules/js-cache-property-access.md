---
title: Cache Property Access in Loops
impact: LOW-MEDIUM
impactDescription: Reduces property lookups
tags: js, loops, caching, performance
---

## Cache Property Access in Loops

Cache object property lookups in hot paths.

**Incorrect (3 lookups x N iterations):**

```typescript
for (let i = 0; i < arr.length; i++) {
  process(obj.config.settings.value)
}
```

**Correct (1 lookup total):**

```typescript
const value = obj.config.settings.value
const len = arr.length
for (let i = 0; i < len; i++) {
  process(value)
}
```

**When to apply:**
- Tight loops with repeated property access
- Performance-critical code paths
- Any loop accessing the same nested property
