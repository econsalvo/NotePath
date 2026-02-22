---
title: Scheduling and Crons
impact: MEDIUM
impactDescription: Background and scheduled tasks
tags: convex, scheduling, crons, scheduler
---

## Scheduling and Crons

Use `ctx.scheduler.runAfter` for delayed execution and `cronJobs` for recurring tasks.

**Delayed execution:**

```typescript
import { mutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: { channelId: v.id("channels"), content: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", args);
    // Schedule action to run after 0ms (immediately, but async)
    await ctx.scheduler.runAfter(0, internal.ai.generateResponse, {
      channelId: args.channelId,
    });
    return null;
  },
});
```

**Cron jobs (convex/crons.ts):**

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every 2 hours
crons.interval("cleanup old data", { hours: 2 }, internal.cleanup.run, {});

// Cron expression (minute hour day month weekday)
crons.cron("daily report", "0 9 * * *", internal.reports.daily, {});

export default crons;
```

**Important cron rules:**
- Only use `crons.interval` or `crons.cron`
- Do NOT use `crons.hourly`, `crons.daily`, `crons.weekly` helpers
- Always pass a FunctionReference (use `internal` or `api`)
- Export `crons` as default
- Import `internal` even for same-file functions

**Scheduler methods:**
- `ctx.scheduler.runAfter(delayMs, functionRef, args)`
- `ctx.scheduler.runAt(timestamp, functionRef, args)`
