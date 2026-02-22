# Code Review — 2026-02-20

Files: `app/food-detail.tsx`, `app/search-food.tsx`, `convex/foodEntries.ts`

---

## Critical (Must Fix)

### 1. HTML entity `&quot;` in React Native — [food-detail.tsx:551](../app/food-detail.tsx#L551)

React Native's `<Text>` does not parse HTML entities. `&quot;` renders literally on screen as `&quot;` instead of `"`.

```tsx
// Bug: renders as — delete &quot;Chicken&quot; from your custom foods.
This will permanently delete &quot;{params.name}&quot; from your custom foods.

// Fix:
This will permanently delete "{params.name}" from your custom foods.
```

---

### 2. Queries don't verify caller identity — [convex/foodEntries.ts:5,23,57](../convex/foodEntries.ts#L5)

`getFoodEntriesByDate`, `getDailySummary`, and `getRecentFoods` accept `clerkUserId` as a client-supplied arg but never confirm the authenticated session matches it. Any signed-in user can read another user's food diary by passing an arbitrary `clerkUserId`.

`addFoodEntry` and `updateFoodEntry`/`deleteFoodEntry` already do this correctly — queries need the same check:

```typescript
// Add to the top of each query handler:
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error("Unauthenticated")
if (identity.subject !== args.clerkUserId) throw new Error("Unauthorized")
```

---

## Warning (Should Fix)

### 3. Zero-amount save not validated — [food-detail.tsx:170–171](../app/food-detail.tsx#L170)

`parseFloat(amount) || 0` means an empty input or `0` saves an entry with `0g` portion and 0 calories. No guard exists before the mutation call.

```tsx
// Add before mutation calls in handleSave:
if (numericAmount <= 0) {
    showToast('Enter a valid amount', 'error')
    setIsSubmitting(false)
    return
}
```

---

### 4. `isSubmitting` and `isDeleting` not reset on success — [food-detail.tsx:186,229](../app/food-detail.tsx#L186)

On the success path, neither `setIsSubmitting(false)` nor `setIsDeleting(false)` is called. If navigation is slow or fails silently the buttons stay permanently disabled. Use `finally` instead of only resetting in `catch`:

```tsx
} finally {
    setIsSubmitting(false) // or setIsDeleting(false)
}
```

---

### 5. Standard serving info hardcodes `g` — [food-detail.tsx:418](../app/food-detail.tsx#L418)

```tsx
// Renders "Standard serving is 5g" even when unit is oz, lb, etc.
Standard serving is {defaultServingSize}g

// Fix:
Standard serving is {defaultServingSize}{initialPortion.unit}
```

---

### 6. `handleBarcodeScan` not memoized — [search-food.tsx:278](../app/search-food.tsx#L278)

The function is recreated on every render and passed as `onScanned` to `<BarcodeScanner>`. If `BarcodeScanner` uses `React.memo`, this defeats memoization. Wrap in `useCallback` with deps `[handleItemPress, convex, showToast, router, mealType, entryDate]`.

---

### 7. Scanner not closed before navigating away — [search-food.tsx:285–305](../app/search-food.tsx#L285)

When a barcode matches and `handleItemPress` is called, `setScannerVisible(false)` is never called before the early `return`. The scanner stays mounted. When the user presses back from food-detail, the scanner modal is still open.

Move `setScannerVisible(false)` to the `finally` block (it's already there for `setScanLoading(false)`).

---

### 8. Missing `returns` validators on all Convex functions — [convex/foodEntries.ts](../convex/foodEntries.ts)

None of the queries or mutations declare a `returns` validator. This is required by current Convex best practices and is needed for end-to-end type safety and runtime validation.

```typescript
export const getFoodEntriesByDate = query({
  args: { ... },
  returns: v.array(v.object({ ... })),
  handler: async (ctx, args) => { ... },
})
```

---

### 9. `getRecentFoods` uses an inefficient index for recency — [convex/foodEntries.ts:66](../convex/foodEntries.ts#L66)

```typescript
.withIndex("by_user_date", (q) => q.eq("clerkUserId", args.clerkUserId))
.order("desc")
.take(200)
```

`by_user_date` is indexed on `(clerkUserId, date)`. Using only the prefix and ordering desc works but sorts by date (day), not by insertion time. Two entries on the same day have unpredictable order. A `by_user_created` index on `(clerkUserId, createdAt)` would give true recency ordering and the same prefix-scan efficiency.

---

## Suggestions (Nice to Have)

### 10. Massive code duplication between the two screens

Both files independently define identical or near-identical copies of:
- `MealType`, `Unit` types
- `SOURCE_BADGE`, `MEAL_LABELS`, `UNIT_TO_GRAMS` constants
- `getTodayDateString()` function
- Portion-parsing logic (`parsePortion` vs `parsePortionString` — same logic, different names)

Extract to `utils/food.ts`. The naming divergence already hints at drift.

---

### 11. `getRecentFoods` deduplicates only by name — [convex/foodEntries.ts:74](../convex/foodEntries.ts#L74)

Two foods with the same `foodName` but different nutritional content (e.g., same product logged at different serving sizes or from different sources) collapse into one, showing only the most recent macros silently. Consider deduplicating by `(foodName, portion)` or `(foodName, calories)`.

---

### 12. `fdcId` param declared but unused — [food-detail.tsx:78](../app/food-detail.tsx#L78)

`fdcId` is in the `useLocalSearchParams` type definition but is never read anywhere in the component. Remove it.

---

### 13. Date string not validated — [convex/foodEntries.ts:88](../convex/foodEntries.ts#L88)

`date: v.string()` accepts any string. An invalid value like `"not-a-date"` can be stored without error. Add a pattern check in the handler:

```typescript
if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("Invalid date format")
```

---

### 14. Hardcoded `#102216` button text color — [food-detail.tsx:762](../app/food-detail.tsx#L762), [search-food.tsx:353](../app/search-food.tsx#L353)

The add/save button text and icon use a raw hex instead of a theme token. This breaks under light/dark theme switching. Use a semantic color from `useTheme()`.

---

### 15. `getDailySummary` duplicates the DB scan from `getFoodEntriesByDate` — [convex/foodEntries.ts:23](../convex/foodEntries.ts#L23)

Both queries do an identical index scan. If a screen needs both the list and the summary, two round-trips are made. Consider returning both from one query, or extract a shared `internalQuery` helper.

---

## What's Working Well

- `searchIdRef` stale-result guard in `handleSearch` correctly prevents out-of-order USDA/OFF race conditions.
- `useMemo` on `scaledValues` in food-detail.tsx is correctly dependency-arrayed.
- The edit-mode per-100g back-calculation (`editModeMultiplier`) is mathematically sound.
- `useCallback` applied consistently to FlatList `renderItem` functions.
- Convex `v.union(v.literal(...))` on `mealType` provides solid server-side enum validation.
- The `"skip"` pattern for conditional Convex queries is used correctly throughout.
- `updateFoodEntry` and `deleteFoodEntry` already properly verify ownership via `ctx.auth`.
