---
title: Early Length Check for Array Comparisons
impact: LOW-MEDIUM
impactDescription: O(1) check before O(n log n) sort
tags: js, arrays, comparison, performance
---

## Early Length Check for Array Comparisons

When comparing arrays with expensive operations, check lengths first. If lengths differ, the arrays cannot be equal.

**Incorrect (always runs expensive comparison):**

```typescript
function hasChanges(current: string[], original: string[]) {
  // Always sorts and joins, even when lengths differ
  return current.sort().join() !== original.sort().join()
}
```

**Correct (O(1) length check first):**

```typescript
function hasChanges(current: string[], original: string[]) {
  // Early return if lengths differ
  if (current.length !== original.length) {
    return true
  }
  // Only sort/join when lengths match
  const currentSorted = current.toSorted()
  const originalSorted = original.toSorted()
  for (let i = 0; i < currentSorted.length; i++) {
    if (currentSorted[i] !== originalSorted[i]) {
      return true
    }
  }
  return false
}
```

**Benefits:**
- Avoids sorting when lengths differ
- Avoids memory allocation for joined strings
- Returns early when difference found
- Doesn't mutate original arrays
