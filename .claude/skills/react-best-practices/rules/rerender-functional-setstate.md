---
title: Use Functional setState
impact: MEDIUM
impactDescription: Avoids stale closure bugs
tags: rerender, useState, setState, optimization
---

## Use Functional setState

Use the functional form of setState when the new state depends on the previous state.

**Incorrect (may use stale state):**

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const incrementTwice = () => {
    setCount(count + 1)
    setCount(count + 1)  // Still uses the same stale `count`
  }

  return <button onClick={incrementTwice}>{count}</button>
}
// Result: count increases by 1, not 2
```

**Correct (always uses latest state):**

```tsx
function Counter() {
  const [count, setCount] = useState(0)

  const incrementTwice = () => {
    setCount(prev => prev + 1)
    setCount(prev => prev + 1)  // Uses updated value from first call
  }

  return <button onClick={incrementTwice}>{count}</button>
}
// Result: count increases by 2
```

**When to apply:**
- Incrementing/decrementing counters
- Toggling boolean state
- Any state update based on previous value
- Updates in async callbacks or event handlers
