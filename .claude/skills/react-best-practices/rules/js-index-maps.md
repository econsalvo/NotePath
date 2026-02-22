---
title: Build Index Maps for Repeated Lookups
impact: LOW-MEDIUM
impactDescription: O(1) lookups instead of O(n)
tags: js, map, lookup, performance
---

## Build Index Maps for Repeated Lookups

Multiple `.find()` calls by the same key should use a Map.

**Incorrect (O(n) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)
  }))
}
```

**Correct (O(1) per lookup):**

```typescript
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map(u => [u.id, u]))

  return orders.map(order => ({
    ...order,
    user: userById.get(order.userId)
  }))
}
```

Build map once (O(n)), then all lookups are O(1).

For 1000 orders x 1000 users: 1M ops -> 2K ops.

**When to apply:**
- Joining data from two arrays
- Multiple lookups by the same key
- Any repeated `.find()` or `.filter()` by id
