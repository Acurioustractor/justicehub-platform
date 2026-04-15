/**
 * Admin postcards dashboard. Full source resolver, publication queue, and
 * EL draft creation UI. For the print-ready public deck, see
 * /judges-on-country/postcards.
 */
import { PostcardsPageContent } from '@/app/judges-on-country/postcards/postcards-content';

export const metadata = {
  title: 'Postcards admin | Judges on Country | JusticeHub',
  robots: { index: false, follow: false },
};

export default function AdminPostcardsPage() {
  return <PostcardsPageContent mode="admin" />;
}
