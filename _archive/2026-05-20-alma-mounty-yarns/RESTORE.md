# Mounty Yarns route archive

**Archived:** 2026-05-20
**Why:** Mounty Yarns was removed from the four-anchor-community set (Oonchiumpa, PICC, BG Fit, MMEIC are the active four). The standalone `/alma/mounty-yarns` route was orphaned and contradicted the updated anchor list.

**Source path:** `src/app/alma/mounty-yarns/page.tsx`
**Archive path:** `_archive/2026-05-20-alma-mounty-yarns/page-route/page.tsx`

## To restore

```bash
mkdir -p src/app/alma/mounty-yarns
git mv _archive/2026-05-20-alma-mounty-yarns/page-route/page.tsx src/app/alma/mounty-yarns/page.tsx
```

Then update the four-anchor-community memory + any docs that reference the active anchor set.
