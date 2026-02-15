/**
 * Intelligence Layout
 *
 * NOTE: This layout is intentionally minimal. Each Intelligence page
 * renders its own Navigation/Footer to maintain full control over
 * page structure and avoid double-header issues.
 */
export default function IntelligenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
