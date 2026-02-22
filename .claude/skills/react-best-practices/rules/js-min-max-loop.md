---
title: Use Loop for Min/Max Instead of Sort
impact: LOW-MEDIUM
impactDescription: O(n) instead of O(n log n)
tags: js, arrays, min-max, performance
---

## Use Loop for Min/Max Instead of Sort

Finding the smallest or largest element only requires a single pass. Sorting is wasteful.

**Incorrect (O(n log n) - sort to find latest):**

```typescript
function getLatestProject(projects: Project[]) {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
  return sorted[0]
}
```

**Correct (O(n) - single loop):**

```typescript
function getLatestProject(projects: Project[]) {
  if (projects.length === 0) return null

  let latest = projects[0]

  for (let i = 1; i < projects.length; i++) {
    if (projects[i].updatedAt > latest.updatedAt) {
      latest = projects[i]
    }
  }

  return latest
}
```

**For both min and max:**

```typescript
function getOldestAndNewest(projects: Project[]) {
  if (projects.length === 0) return { oldest: null, newest: null }

  let oldest = projects[0]
  let newest = projects[0]

  for (let i = 1; i < projects.length; i++) {
    if (projects[i].updatedAt < oldest.updatedAt) oldest = projects[i]
    if (projects[i].updatedAt > newest.updatedAt) newest = projects[i]
  }

  return { oldest, newest }
}
```

Single pass, no copying, no sorting.
