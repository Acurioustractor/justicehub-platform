# Community Map Guide

## Overview

The Community Map (`/community-map`) visualises high-impact justice services across Australia. Each location highlights programs with strong evidence, clear cultural safety, and active service delivery. Data lives in `src/content/community-map-services.ts` and is rendered by `src/app/community-map/page.tsx` using MapLibre GL.

## Adding a New Service

1. **Collect core details**
   - Name and short description (1–2 sentences focused on impact).
   - Primary category (`justice`, `healing`, `skills`, `housing`, `mental_health`, `education`, `family`, or `emergency`).
   - Focus areas (2–4 bullet keywords).
   - `regions`: array of state/territory codes or descriptors (`Remote`, `Regional`).
   - `coordinates`: decimal latitude and longitude (WGS84) for the main service location.
   - Evidence summary (`highlight`) and 2–3 impact statements.
   - Contact link (`website`) plus optional phone/email.
   - Tags that describe the service (e.g. `First Nations-led`, `housing-first`, `bail support`).

2. **Verify accuracy**
   - Confirm coordinates against an official address or geocoding service.
   - Check that the program is currently operating and accepting referrals.
   - Validate impact statements with reports, partner endorsements, or published metrics.
   - Ensure any tags such as `First Nations-led` are community endorsed.

3. **Update the dataset**
   - Append a new `CommunityMapService` entry in `src/content/community-map-services.ts`.
   - Maintain alphabetical order by `name` where practical.
   - Re-run `npm run lint` or the project build to confirm type safety.

4. **Visual QA**
   - Start the dev server (`npm run dev`) and open `/community-map`.
   - Confirm the marker renders in the correct location and the popup text fits within 260 px.
   - Verify filters (category, region, search) surface the new service as expected.

5. **Team review**
   - Share the update with JusticeHub partners or the nominated organisation for sign-off.
   - Record evidence sources and contacts in your internal knowledge base for future audits.

## Technical Notes

- Map tiles use the public Carto Positron style (`https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`).
- If that CDN is blocked, the map gracefully falls back to OpenStreetMap raster tiles—expect a simpler basemap when the warning banner appears.
- When tiles can’t load, an alert explains the issue; refresh or check network access to restore maps.
- Set `NEXT_PUBLIC_MAP_STYLE_URL` if you need to point at a corporate CDN or self-hosted MapLibre style JSON.
- CSP already whitelists Carto, MapLibre demo, and OpenStreetMap tile hosts plus blob workers; add your custom tile endpoint to `connect-src` in `src/middleware.ts` if you introduce another provider.
- Markers are colour-coded via `categoryColors` in `src/app/community-map/page.tsx`.
- Popups are rendered with minimal inline styles to avoid Tailwind purge issues.
- To install mapping dependencies, run `npm install maplibre-gl` (lockfile update required).
- Navigation includes a direct link under **Explore → Community Map**.

## Future Enhancements

- Pull live geocoded data from Supabase once services include latitude/longitude.
- Add clustering when the dataset grows beyond ~100 locations.
- Integrate map selections with the Service Finder for deep dives into program detail pages.
