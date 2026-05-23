/**
 * Shell for every lens screen. Adds the persistent lens bar on top, the
 * email-capture footer at the bottom, and the IdleWatcher that resets to
 * the hook after 60s of inactivity.
 *
 * The current-lens highlight is computed from the URL via the segment
 * passed through children's metadata (each lens page sets it via the
 * `current` prop on <LensBar />). We render an empty bar here so layout
 * shifts don't happen on navigation; each page overrides with its own bar.
 *
 * Pattern: each lens page renders its own <LensBar current="..." /> at the
 * top because Next.js layouts can't read the path easily server-side.
 */

import { EmailCaptureFooter } from '../components/EmailCaptureFooter';
import { IdleWatcher } from '../components/IdleWatcher';

export default function LensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IdleWatcher timeoutMs={60_000} />
      <main className="flex-1 flex flex-col">{children}</main>
      <EmailCaptureFooter />
    </>
  );
}
