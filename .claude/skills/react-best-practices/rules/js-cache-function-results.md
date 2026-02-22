---
title: Cache Repeated Function Calls
impact: LOW-MEDIUM
impactDescription: Avoids redundant computation
tags: js, caching, memoization, performance
---

## Cache Repeated Function Calls

Use a module-level Map to cache function results when the same function is called repeatedly with the same inputs.

**Incorrect (redundant computation):**

```typescript
function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // slugify() called 100+ times for same project names
        const slug = slugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**Correct (cached results):**

```typescript
// Module-level cache
const slugCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugCache.has(text)) {
    return slugCache.get(text)!
  }
  const result = slugify(text)
  slugCache.set(text, result)
  return result
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // Computed only once per unique project name
        const slug = cachedSlugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

Use a Map (not a hook) so it works everywhere: utilities, event handlers, not just React components.
