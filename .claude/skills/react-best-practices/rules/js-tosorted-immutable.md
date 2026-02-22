---
title: Use toSorted() Instead of sort() for Immutability
impact: LOW-MEDIUM
impactDescription: Avoids mutating original array
tags: js, arrays, sorting, immutability
---

## Use toSorted() Instead of sort() for Immutability

`.sort()` mutates the array in place, which can cause bugs with React state and props. Use `.toSorted()` to create a new sorted array.

**Incorrect (mutates original array):**

```typescript
function UserList({ users }: { users: User[] }) {
  // Mutates the users prop array!
  const sorted = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**Correct (creates new array):**

```typescript
function UserList({ users }: { users: User[] }) {
  // Creates new sorted array, original unchanged
  const sorted = useMemo(
    () => users.toSorted((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**Fallback for older browsers:**

```typescript
const sorted = [...items].sort((a, b) => a.value - b.value)
```

**Other immutable array methods:**
- `toSorted()` - immutable sort
- `toReversed()` - immutable reverse
- `toSpliced()` - immutable splice
- `with()` - immutable index update
