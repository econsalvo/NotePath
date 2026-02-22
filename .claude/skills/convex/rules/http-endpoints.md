---
title: HTTP Endpoint Syntax
impact: MEDIUM
impactDescription: Correct HTTP endpoint setup
tags: convex, http, endpoints, httpAction
---

## HTTP Endpoint Syntax

HTTP endpoints are defined in `convex/http.ts` using `httpRouter` and `httpAction`.

**Incorrect (wrong file or syntax):**

```typescript
// BAD: HTTP routes in wrong file
// convex/api.ts
export const echoEndpoint = httpAction(...);
```

**Correct (http.ts with router):**

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/echo",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.bytes();
    return new Response(body, { status: 200 });
  }),
});

http.route({
  path: "/api/users",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const users = await ctx.runQuery(api.users.list, {});
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
```

**Key points:**
- HTTP endpoints must be in `convex/http.ts`
- Use `httpRouter()` to create the router
- Use `httpAction()` for handlers
- Path is exact (no prefix added): `/api/users` → `/api/users`
- Export the router as default
