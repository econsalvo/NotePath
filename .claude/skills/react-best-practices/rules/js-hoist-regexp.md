---
title: Hoist RegExp Creation
impact: LOW-MEDIUM
impactDescription: Avoids creating RegExp every render
tags: js, regexp, hoisting, performance
---

## Hoist RegExp Creation

Don't create RegExp inside render. Hoist to module scope or memoize with `useMemo()`.

**Incorrect (new RegExp every render):**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**Correct (memoized):**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = useMemo(() => new RegExp(`(${query})`, 'gi'), [query])
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**For static patterns (hoisted):**

```tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EmailValidator({ email }: Props) {
  const isValid = EMAIL_REGEX.test(email)
  // ...
}
```

**Note on stateful RegExp:**

```typescript
const regex = /foo/g
regex.test('foo')  // true, lastIndex = 3
regex.test('foo')  // false, lastIndex = 0
```

Be careful with `g` flag - the regex maintains state between calls.
