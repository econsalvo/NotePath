---
title: Dependency-Based Parallelization
impact: CRITICAL
impactDescription: Maximizes parallelism with partial dependencies
tags: async, parallelization, better-all, waterfalls
---

## Dependency-Based Parallelization

For operations with partial dependencies, use `better-all` to maximize parallelism. It automatically starts each task at the earliest possible moment.

**Incorrect (profile waits for config unnecessarily):**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**Correct (config and profile run in parallel):**

```typescript
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() {
    return fetchProfile((await this.$.user).id)
  }
})
```

**When to apply:**
- Operations with complex dependency chains
- When some operations depend on others but not all

**References:**
- [better-all](https://github.com/shuding/better-all)
