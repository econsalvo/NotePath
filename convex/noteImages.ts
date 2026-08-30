import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { v } from 'convex/values'
import {
  ALLOWED_NOTE_IMAGE_TYPES,
  MAX_NOTE_IMAGE_BYTES,
} from '../src/domain/noteImages'

async function requireOwnedNote(
  ctx: QueryCtx | MutationCtx,
  noteId: Id<'notes'>,
) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Not authenticated')

  const note = await ctx.db.get(noteId)
  if (!note || note.userId !== identity.subject) {
    throw new Error('Note not found')
  }
  return { note, userId: identity.subject }
}

export const generateUploadUrl = mutation({
  args: { noteId: v.id('notes') },
  handler: async (ctx, { noteId }) => {
    await requireOwnedNote(ctx, noteId)
    return await ctx.storage.generateUploadUrl()
  },
})

export const finalizeUpload = mutation({
  args: {
    noteId: v.id('notes'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, { noteId, storageId }) => {
    const { userId } = await requireOwnedNote(ctx, noteId)
    const existing = await ctx.db
      .query('noteImages')
      .withIndex('by_storage', (q) => q.eq('storageId', storageId))
      .unique()

    if (existing) {
      if (existing.noteId !== noteId || existing.userId !== userId) {
        throw new Error('Image not found')
      }
    } else {
      const metadata = await ctx.db.system.get('_storage', storageId)
      const isAllowedType =
        typeof metadata?.contentType === 'string' &&
        (ALLOWED_NOTE_IMAGE_TYPES as readonly string[]).includes(
          metadata.contentType,
        )
      if (
        !metadata ||
        !isAllowedType ||
        metadata.size <= 0 ||
        metadata.size > MAX_NOTE_IMAGE_BYTES
      ) {
        if (metadata) await ctx.storage.delete(storageId)
        throw new Error('Invalid image upload')
      }

      await ctx.db.insert('noteImages', { noteId, userId, storageId })
    }

    const url = await ctx.storage.getUrl(storageId)
    if (!url) throw new Error('Image upload was not found')
    return { storageId, url }
  },
})

export const listUrls = query({
  args: { noteId: v.id('notes') },
  handler: async (ctx, { noteId }) => {
    await requireOwnedNote(ctx, noteId)
    const images = await ctx.db
      .query('noteImages')
      .withIndex('by_note', (q) => q.eq('noteId', noteId))
      .collect()
    const resolved = await Promise.all(
      images.map(async ({ storageId }) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      })),
    )
    return resolved.filter(
      (image): image is { storageId: typeof image.storageId; url: string } =>
        image.url !== null,
    )
  },
})
