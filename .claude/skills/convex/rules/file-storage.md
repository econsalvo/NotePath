---
title: File Storage
impact: MEDIUM
impactDescription: File upload and retrieval
tags: convex, storage, files, blobs
---

## File Storage

Use Convex file storage for large files like images, videos, and PDFs.

**Get file URL:**

```typescript
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Returns signed URL or null if file doesn't exist
    return await ctx.storage.getUrl(args.fileId);
  },
});
```

**Get file metadata (query _storage table):**

```typescript
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

type FileMetadata = {
  _id: Id<"_storage">;
  _creationTime: number;
  contentType?: string;
  sha256: string;
  size: number;
};

export const getFileMetadata = query({
  args: { fileId: v.id("_storage") },
  returns: v.union(
    v.object({
      _id: v.id("_storage"),
      _creationTime: v.number(),
      contentType: v.optional(v.string()),
      sha256: v.string(),
      size: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Use system table, NOT deprecated ctx.storage.getMetadata
    const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
    return metadata;
  },
});
```

**Generate upload URL (mutation):**

```typescript
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Key points:**
- Files stored as `Blob` objects
- Use `v.id("_storage")` for file IDs
- Query `_storage` system table for metadata
- Do NOT use deprecated `ctx.storage.getMetadata`
- `ctx.storage.getUrl()` returns `null` if file doesn't exist
