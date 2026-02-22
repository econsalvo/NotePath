# Rule Template

Use this template when creating new performance rules.

## File Naming

Format: `{prefix}-{description}.md`

Prefixes by category:
- `async-` - Eliminating waterfalls
- `bundle-` - Bundle size optimization
- `server-` - Server-side performance
- `client-` - Client-side data fetching
- `rerender-` - Re-render optimization
- `rendering-` - Rendering performance
- `js-` - JavaScript performance
- `advanced-` - Advanced patterns

## Template

```markdown
---
title: Rule Title Here
impact: CRITICAL|HIGH|MEDIUM|LOW
impactDescription: Brief description of impact (e.g., "2-10x improvement")
tags: relevant, tags, here
---

## Rule Title Here

Brief explanation of the rule and why it matters.

**Incorrect:**

\`\`\`tsx
// Code showing the problematic pattern
\`\`\`

Explanation of why this is problematic.

**Correct:**

\`\`\`tsx
// Code showing the optimized pattern
\`\`\`

Explanation of why this is better.

**When to apply:**
- Scenario 1
- Scenario 2

**References:**
- [Link text](url)
```

## Guidelines

1. Keep rules focused on a single optimization
2. Always include incorrect and correct code examples
3. Use TypeScript/TSX for examples
4. Include practical impact metrics when possible
5. Link to external references for deeper understanding
