import { OnePagerContent, type OnePagerMedia } from './one-pager-content';
import { getContainedMedia } from '@/lib/empathy-ledger/contained-media';

// Server component: fetches Empathy Ledger v2 media, passes URLs to the
// client component. Forces dynamic rendering so v2 fetch happens at request
// time rather than at build (we don't want stale URLs cached forever).
export const dynamic = 'force-dynamic';

export default async function FunderOnePagerPage() {
  let media: OnePagerMedia = {
    twoRoomsUrl: null,
    twoRoomsAlt: 'The CONTAINED installation: a therapeutic room and a detention cell side by side',
  };

  try {
    const twoRooms = await getContainedMedia('twoRooms');
    if (twoRooms?.url) {
      media = {
        twoRoomsUrl: twoRooms.url,
        twoRoomsAlt: twoRooms.altText ?? media.twoRoomsAlt,
      };
    }
  } catch (err) {
    // EL v2 not configured or transient failure — fall through with null URL,
    // client component renders the brand-block fallback (red/blue/black).
    console.warn('[contained/one-pager] EL v2 media fetch failed:', err);
  }

  return <OnePagerContent media={media} />;
}
