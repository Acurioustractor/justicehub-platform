import { WikiSidebar } from '@/components/WikiSidebar';
import { MindarooBreadcrumb } from '@/components/wiki/MindarooBreadcrumb';
import Link from 'next/link';

// Force dynamic rendering for interactive MDX components (Tabs, etc.)
export const dynamic = 'force-dynamic';

export default function MindarooPitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <WikiSidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        <article className="max-w-5xl mx-auto px-8 py-12">
          {/* Breadcrumb */}
          <MindarooBreadcrumb />

          {/* MDX Content */}
          <div className="prose prose-lg max-w-none">
            {children}
          </div>

          {/* Back to Wiki */}
          <div className="mt-16 pt-8 border-t-2 border-gray-200">
            <Link
              href="/wiki/mindaroo-pitch"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Pitch Package
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
