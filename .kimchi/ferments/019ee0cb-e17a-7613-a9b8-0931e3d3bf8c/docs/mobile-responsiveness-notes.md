# Mobile Responsiveness Implementation Notes

## Date: 2026-06-19
## Task: Ensure mobile responsiveness across all refactored pages

---

## Responsive Standards Applied

### Grid Patterns
- **Stats cards**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6`
- **Form fields**: `grid-cols-1 sm:grid-cols-2 gap-4`
- **Toolbars/search**: `flex flex-col sm:flex-row` for stacking on mobile
- **Tables**: Always `overflow-x-auto` with `min-w-[900px]` or similar

### Typography Responsive
- Labels: `text-[9px] md:text-[10px]` for small labels
- Values: `text-2xl md:text-3xl` for key metrics
- Headers: `text-base md:text-lg` for section titles

### Spacing
- Container: `max-w-[1200px] mx-auto` with appropriate horizontal padding
- Mobile padding: `p-4 md:p-6 lg:p-8` scale
- Gaps: `gap-4 md:gap-6` for consistent mobile-to-desktop transition

### Touch Targets
- Buttons: minimum `h-11` (44px) via `size="md"` or custom classes
- Action buttons use responsive text: `"+ New Assembly"` on desktop, `"+ New"` on mobile

---

## Components Updated

### 1. page.tsx
**Changes:**
- Header height: `h-16 md:h-20` (smaller on mobile)
- Header padding: `px-4 md:px-10` (tighter on mobile)
- Main content padding: `p-4 md:p-12` (scaled for mobile)
- **Already correct**: Mobile bottom nav, sidebar collapse logic, `md:pl-20`/`md:pl-72` for sidebar offset

### 2. DashboardStats.tsx
**Changes:**
- Grid gap: `gap-4 md:gap-6` (was `gap-6`)
- Card value text: `text-2xl md:text-3xl` (was only `text-2xl`)
- Label text: `text-[9px] md:text-[10px]` (was `text-[10px]`)
- **Already correct**: Grid pattern `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

### 3. DashboardView.tsx
**Changes:**
- Section gap: `gap-4 md:gap-6` (was `gap-6`)
- Status panel spacing: `space-y-4 md:space-y-6` (was `space-y-6`)
- **Already correct**: Flex column on mobile, row on desktop via `flex-col lg:flex-row`

### 4. InwardLedger.tsx
**Changes:**
- KPI grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (was `grid-cols-1 lg:grid-cols-3`)
- Search card: `sm:col-span-2 lg:col-span-2` for proper mobile stacking
- **Already correct**: Table with `minWidth="950px"` and `overflow-x-auto` handling

### 5. InventoryView.tsx
**Changes:**
- Stats grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (was `grid-cols-1 md:grid-cols-3`)
- Stats gap: `gap-4 md:gap-6` (was `gap-6`)
- Asset/Low Stock values: `text-2xl md:text-3xl` (were `text-3xl`)
- Labels: `text-[9px] md:text-[10px]` (were `text-[9px]`)
- Catalog card button layout: `flex-col sm:flex-row` with `gap-4`
- Toolbar: `flex flex-col sm:flex-row` (was `flex-col xl:flex-row`)
- Toolbar admin section: `pt-4 sm:pt-0 border-t sm:border-t-0` (was `pt-4 xl:pt-0 border-t xl:border-t-0`)
- **Already correct**: Table scroll handling

### 6. StockInwardForm.tsx
**Changes:**
- Quantity/Date grid: `grid-cols-1 sm:grid-cols-2` (was `grid-cols-2`)

### 7. OrderBook.tsx
**Changes:**
- Header card: `flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4` (was single row)
- Expanded content grid: `grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-12` (was `gap-12`)
- Expanded content padding: `p-4 md:p-6 lg:p-8` (was `p-8`)
- **Already correct**: Table with `minWidth="700px"`

### 8. BomView.tsx
**Changes:**
- Action toolbar gap: `gap-1 sm:gap-2` (tighter on mobile)
- "New Assembly" button: responsive text `"+ New Assembly"` / `"+ New"` on mobile
- Added `overflow-x-auto` to table card wrapper for horizontal scroll
- **Already correct**: Header tabs `flex flex-col sm:flex-row`, production modal `p-2 sm:p-4`

### 9. Sidebar.tsx
**Status:** Desktop-only component (hidden on mobile via `hidden md:block`)
**Mobile handling:** Handled by bottom navigation in page.tsx
**No changes needed**

---

## Verification Results

### TypeScript Check
- **Status**: Passes (same pre-existing errors as before changes)
- Pre-existing errors unrelated to responsiveness:
  - `papaparse` type declaration missing
  - Auth adapter type mismatch
  - Various `any` type annotations in actions.ts (pre-existing)

### ESLint Check
- **Status**: Passes (same pre-existing warnings/errors as before changes)
- All lint errors are pre-existing in actions.ts, route.ts, and BomView.tsx
- No new lint issues introduced by responsiveness changes

---

## Summary of Patterns Applied

| Pattern | Mobile | Tablet (md:) | Desktop (lg:) |
|---------|--------|--------------|---------------|
| Stats grid | 1 col | 2 cols | 4 cols |
| Gap | 4 | 6 | - |
| Form fields | 1 col | 2 cols | - |
| Section padding | p-4 | p-6 | p-8 |
| Header height | h-16 | h-20 | - |
| Text labels | 9px | 10px | - |
| Text values | 2xl | 3xl | - |
| Table min-width | 700-950px (scroll) | - | - |

---

## Notes

- All changes are purely responsive/tailwind class additions - no logic changes
- Mobile-first approach: default styles for mobile, enhanced with `md:`/`lg:` prefixes
- Tables consistently use `overflow-x-auto` and `min-w-*` for horizontal scrolling
- Touch targets meet 44px minimum via existing Button component sizes
- The mobile bottom navigation in page.tsx is unaffected by these changes