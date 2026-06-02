# Hero Background Images

Use this when changing the large header images on public JusticeHub routes.

## Current setup

Managed hero backgrounds live in:

`src/content/hero-backgrounds.ts`

The Adelaide header uses the `adelaide` entry, which currently controls:

- `/adelaide`
- `/contained/adelaide`

The image file is:

`public/images/contained/justicehub-hero-landscape.png`

The public URL path used in code is:

`/images/contained/justicehub-hero-landscape.png`

## How to change a header background

1. Add the new image under `public/images/...`.
2. Open `src/content/hero-backgrounds.ts`.
3. Change the `image` field for the relevant key.
4. Adjust `position` if the focal point is off. Good values are `center`, `center top`, `center 35%`, `left center`, or `right center`.
5. Keep or tune the `overlay` so the headline remains readable.

Example:

```ts
adelaide: {
  label: 'Adelaide CONTAINED launch',
  routes: ['/adelaide', '/contained/adelaide'],
  image: '/images/contained/my-new-adelaide-hero.jpg',
  alt: 'Short description of the image.',
  position: 'center 35%',
  overlay: 'linear-gradient(90deg, rgba(10,10,10,0.90), rgba(10,10,10,0.58), rgba(10,10,10,0.86))',
  notes: 'Primary public-share hero for the June 23 Adelaide pathway.',
}
```

## Local Empathy Ledger swaps

The Adelaide hero also supports the existing Empathy Ledger photo picker in local/admin mode.

1. Open `/adelaide?admin=1`.
2. Use the `Adelaide hero` control in the top-right of the hero.
3. Pick an image from the Empathy Ledger `contained` project.
4. The selected image is saved through `/api/admin/contained/photo-overrides` under the key `adelaide/hero`.
5. Use `Default` to clear the override and fall back to `src/content/hero-backgrounds.ts`.

After you enable admin mode once, it persists in localStorage as `contained-admin`. Open any CONTAINED page with `?admin=0` to turn it off.

## Image rules

- Use real photography or a real campaign artifact when possible.
- Use 16:9 landscape images for page heroes.
- Aim for at least 1800px wide; 2400px wide is better for large screens.
- Keep files compressed. Prefer `.webp` or optimized `.jpg` for photos.
- Avoid text inside the image unless it is meant to be partly obscured by the overlay.
- Never put private or consent-pending story material into a public hero.

## Admin photo swaps

Some CONTAINED tour and room images already support the `?admin=1` photo-swap flow through `/api/admin/contained/photo-overrides`.

That is separate from these public route headers. Public launch headers should use `src/content/hero-backgrounds.ts` so the production route is predictable and reviewable in git.
