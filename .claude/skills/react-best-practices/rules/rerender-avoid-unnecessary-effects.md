---
title: Avoid Unnecessary useEffect
impact: HIGH
impactDescription: Eliminates cascading updates, reduces complexity, prevents bugs
tags: rerender, useEffect, optimization, derived-state, event-handlers
---

## Avoid Unnecessary useEffect

If no external system is involved, you probably don't need an Effect. Unnecessary Effects cause cascading updates, make code harder to follow, and introduce subtle bugs.

### Don't use useEffect for transforming data

**Incorrect (cascading updates):**

```tsx
function FilteredList({ items, filter }: Props) {
  const [filteredItems, setFilteredItems] = useState(items)

  useEffect(() => {
    setFilteredItems(items.filter(item => item.includes(filter)))
  }, [items, filter])

  return <List items={filteredItems} />
}
```

Triggers an extra render: first with stale data, then with filtered data.

**Correct (calculate during render):**

```tsx
function FilteredList({ items, filter }: Props) {
  const filteredItems = items.filter(item => item.includes(filter))
  return <List items={filteredItems} />
}
```

### Don't use useEffect for expensive calculations

**Incorrect:**

```tsx
function ExpensiveComponent({ data }: Props) {
  const [processed, setProcessed] = useState(null)

  useEffect(() => {
    setProcessed(expensiveCalculation(data))
  }, [data])

  return <Display data={processed} />
}
```

**Correct (use useMemo):**

```tsx
function ExpensiveComponent({ data }: Props) {
  const processed = useMemo(() => expensiveCalculation(data), [data])
  return <Display data={processed} />
}
```

### Don't use useEffect for handling user events

**Incorrect:**

```tsx
function BuyButton({ productId }: Props) {
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    if (purchased) {
      fetch('/api/buy', { method: 'POST', body: JSON.stringify({ productId }) })
    }
  }, [purchased, productId])

  return <button onClick={() => setPurchased(true)}>Buy</button>
}
```

Side effects in response to user actions belong in event handlers, not Effects.

**Correct:**

```tsx
function BuyButton({ productId }: Props) {
  const handleBuy = async () => {
    await fetch('/api/buy', { method: 'POST', body: JSON.stringify({ productId }) })
  }

  return <button onClick={handleBuy}>Buy</button>
}
```

### Don't use useEffect to reset state on prop change

**Incorrect:**

```tsx
function ProfilePage({ userId }: Props) {
  const [comment, setComment] = useState('')

  useEffect(() => {
    setComment('')
  }, [userId])

  return <CommentInput value={comment} onChange={setComment} />
}
```

**Correct (use key to reset):**

```tsx
function ProfilePage({ userId }: Props) {
  return <Profile userId={userId} key={userId} />
}

function Profile({ userId }: Props) {
  const [comment, setComment] = useState('')
  return <CommentInput value={comment} onChange={setComment} />
}
```

### Don't use useEffect for derived state from props

**Incorrect:**

```tsx
function Form({ items }: Props) {
  const [selection, setSelection] = useState(null)

  useEffect(() => {
    setSelection(items[0])
  }, [items])

  // ...
}
```

**Correct (adjust state in render):**

```tsx
function Form({ items }: Props) {
  const [selection, setSelection] = useState(null)
  const [prevItems, setPrevItems] = useState(items)

  if (items !== prevItems) {
    setPrevItems(items)
    setSelection(items[0])
  }

  // ...
}
```

Or better, compute the selection:

```tsx
function Form({ items }: Props) {
  const [selectedId, setSelectedId] = useState(null)
  const selection = items.find(item => item.id === selectedId) ?? items[0]
  // ...
}
```

### When TO use useEffect

Use Effects only for synchronizing with external systems:

```tsx
// DOM manipulation
useEffect(() => {
  const dialog = dialogRef.current
  dialog.showModal()
  return () => dialog.close()
}, [])

// Third-party widgets
useEffect(() => {
  const map = mapRef.current
  map.setZoomLevel(zoomLevel)
}, [zoomLevel])

// Network subscriptions
useEffect(() => {
  const connection = createConnection(serverUrl)
  connection.connect()
  return () => connection.disconnect()
}, [serverUrl])
```

**When to apply:**
- Updating state based on props/state changes
- Computing derived values
- Handling user-initiated actions
- Resetting state when identity changes

**References:**
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
