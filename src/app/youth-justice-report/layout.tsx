import { Navigation, Footer } from '@/components/ui/navigation';
import Link from 'next/link';

const reportSections = [
  { href: '/youth-justice-report', label: 'Overview', icon: '📊' },
  { href: '/youth-justice-report/interventions', label: 'Interventions by State', icon: '🗺️' },
  { href: '/youth-justice-report/research', label: 'Australian Research', icon: '📚' },
  { href: '/youth-justice-report/inquiries', label: 'Historical Inquiries', icon: '⚖️' },
  { href: '/youth-justice-report/international', label: 'International Practices', icon: '🌏' },
  { href: '/youth-justice-report/recommendations', label: 'Recommendations', icon: '💡' },
];

export const metadata = {
  title: 'Youth Justice Live Report | JusticeHub',
  description: 'Live data on Australian youth justice - interventions, research, inquiries, and international best practices.',
};

export default function YouthJusticeReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-black page-content">
      <Navigation />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r-2 border-black min-h-[calc(100vh-12rem)] sticky top-48 h-screen overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-4">
              Report Sections
            </h2>
            <nav className="space-y-1">
              {reportSections.map((section) => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:bg-ochre-50 border-l-4 border-transparent hover:border-ochre-500 transition-all"
                >
                  <span className="text-lg">{section.icon}</span>
                  {section.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <Link
                href="/chat"
                className="flex items-center gap-3 px-3 py-3 bg-ochre-100 border-2 border-black text-sm font-bold hover:bg-ochre-200 transition-colors"
              >
                <span className="text-lg">💬</span>
                Ask ALMA About This Report
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-5rem)]">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
