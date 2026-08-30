import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import { decodeCanonicalStoredDocument } from '../src/domain/noteDocument'

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
    decodeCanonicalStoredDocument(args.content)
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
    decodeCanonicalStoredDocument(args.content)
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== userId) {
      throw new Error('Note not found')
    }
    await ctx.db.patch(args.id, {
      title: args.title,
      content: args.content,
      updatedAt: Date.now(),
    })
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
    await ctx.db.delete(args.id)
  },
})
