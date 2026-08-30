import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import {
  decodeCanonicalStoredDocument,
  imageStorageIds,
} from '../src/domain/noteDocument'

async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity.subject
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    return await ctx.db
      .query('notes')
      .withIndex('by_user_updated_at', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const document = decodeCanonicalStoredDocument(args.content)
    if (imageStorageIds(document).length > 0) {
      throw new Error('Images can only be added to an existing note')
    }
    const now = Date.now()
    return await ctx.db.insert('notes', {
      userId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('notes'),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const nextDocument = decodeCanonicalStoredDocument(args.content)
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== userId) {
      throw new Error('Note not found')
    }

    const nextImageIds = new Set(imageStorageIds(nextDocument))
    const trackedImages = await ctx.db
      .query('noteImages')
      .withIndex('by_note', (q) => q.eq('noteId', args.id))
      .collect()
    const trackedByStorageId = new Map<string, (typeof trackedImages)[number]>(
      trackedImages.map((image) => [image.storageId, image]),
    )

    for (const storageId of nextImageIds) {
      const image = trackedByStorageId.get(storageId)
      if (!image || image.userId !== userId) {
        throw new Error('Image not found')
      }
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      updatedAt: Date.now(),
    })

    for (const image of trackedImages) {
      if (nextImageIds.has(image.storageId)) continue
      await ctx.storage.delete(image.storageId)
      await ctx.db.delete(image._id)
    }
  },
})

export const remove = mutation({
  args: {
    id: v.id('notes'),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== userId) {
      throw new Error('Note not found')
    }
    const images = await ctx.db
      .query('noteImages')
      .withIndex('by_note', (q) => q.eq('noteId', args.id))
      .collect()
    for (const image of images) {
      await ctx.storage.delete(image.storageId)
      await ctx.db.delete(image._id)
    }
    await ctx.db.delete(args.id)
  },
})
