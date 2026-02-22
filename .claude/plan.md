# Recent Foods Feature

## Context
Users repeat the same foods daily. Currently they must re-search every time. Adding a "recent foods" section in the search screen (shown when query is empty) lets users quickly re-add or adjust previous entries.

## Approach
No schema changes. Query existing `foodEntries` table, deduplicate by `foodName` in JS, show top 10 in search-food when query is empty.

---

## Step 1 — Add `getRecentFoods` query (`convex/foodEntries.ts`)

```ts
export const getRecentFoods = query({
  args: { clerkUserId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10
    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user_date", (q) => q.eq("clerkUserId", args.clerkUserId))
      .order("desc")
      .take(200)
    const seen = new Set<string>()
    const unique: typeof entries = []
    for (const e of entries) {
      if (!seen.has(e.foodName)) {
        seen.add(e.foodName)
        unique.push(e)
      }
      if (unique.length >= limit) break
    }
    return unique
  },
})
```

Uses existing `by_user_date` index (prefix query on `clerkUserId`, ordered desc by `date`). No schema change needed.

---

## Step 2 — Add helpers to `app/search-food.tsx`

```ts
const UNIT_TO_GRAMS: Record<string, number> = { g: 1, oz: 28.3495, lb: 453.592, kg: 1000 }

function parsePortion(portion: string): { amount: number; unit: string } {
  const match = portion.match(/^(\d+(?:\.\d+)?)(g|oz|lb|kg)?$/)
  return match ? { amount: parseFloat(match[1]), unit: match[2] ?? 'g' } : { amount: 100, unit: 'g' }
}
```

---

## Step 3 — Add state + query hook

```ts
const [quickAddingRecentId, setQuickAddingRecentId] = useState<Id<'foodEntries'> | null>(null)
const showRecentFoods = query.trim().length === 0
const recentFoods = useQuery(
  api.foodEntries.getRecentFoods,
  showRecentFoods && user?.id ? { clerkUserId: user.id, limit: 10 } : 'skip'
)
// recentFoods is undefined while loading — use recentFoods?.length ?? 0 in render
```

---

## Step 4 — `handleRecentQuickAdd` — re-add at stored portion instantly

Guard: `if (!user?.id || !mealType || quickAddingRecentId) return`

Calls `addFoodEntry` using diary entry fields directly (NOT FoodResult fields):
- `foodName: entry.foodName`
- `portion: entry.portion`
- `calories: entry.calories`
- `protein/fat/carbs/fiber: entry.protein/fat/carbs/fiber`

---

## Step 5 — `handleRecentItemPress` — open food-detail for adjustment

Parse stored portion: `parsePortion(entry.portion)` → `{ amount, unit }`
`portion_grams = amount * UNIT_TO_GRAMS[unit]` (fallback: 100g for unrecognised formats — known limitation)

Navigate to `food-detail` with:
- `name: entry.foodName`
- `calories: (entry.calories * 100 / portion_grams).toString()` (normalised to per-100g)
- `protein/fat/carbs/fiber`: same normalisation
- `servingSize: amount.toString()`, `servingSizeUnit: unit`
- `source: 'custom'` (no source stored on diary entries)
- `date: entryDate`, `mealType`

---

## Step 6 — `renderRecentFoodItem`

Reuse existing `foodItem`/`addButton` styles. Subtitle: `{calories} kcal · {portion}`.

---

## Step 7 — Update render

Replace empty-state else-branch: when `showRecentFoods && (recentFoods?.length ?? 0) > 0`, render "Recent" label + FlatList. Otherwise show "Start typing to search".

---

## Files Modified
- `convex/foodEntries.ts` — add `getRecentFoods` query
- `app/search-food.tsx` — helpers, state, handlers, render item, render update

## Verification
1. Open diary → tap "Add Food" → recent foods shown immediately
2. Quick-add tap → entry appears in diary with correct values
3. Row tap → food-detail opens with pre-filled portion, macro scaling correct, can adjust
4. Typing → recent list hides, search results show
5. New user → "Start typing" empty state shows
