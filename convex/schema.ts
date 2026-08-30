import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user_updated_at', ['userId', 'updatedAt']),
  noteImages: defineTable({
    noteId: v.id('notes'),
    userId: v.string(),
    storageId: v.id('_storage'),
  })
    .index('by_note', ['noteId'])
    .index('by_storage', ['storageId']),
})
