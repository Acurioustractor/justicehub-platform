'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, DollarSign, Settings, FileText, Home } from 'lucide-react';

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items: {
    title: string;
    slug: string;
    wordCount?: string;
  }[];
}

const navigation: NavSection[] = [
  {
    title: 'Strategic Planning',
    icon: <Book className="w-5 h-5" />,
    items: [
      { title: 'Strategic Overview', slug: 'strategic-overview', wordCount: '20K words' },
      { title: 'Executive Summary', slug: 'executive-summary', wordCount: '5K words' },
      { title: 'One-Page Overview', slug: 'one-page-overview', wordCount: '1.5K words' },
      { title: 'JusticeHub Planning', slug: 'justicehub-planning', wordCount: '25K words' },
    ],
  },
  {
    title: 'Budget & Funding',
    icon: <DollarSign className="w-5 h-5" />,
    items: [
      { title: 'Budget Summary', slug: 'budget-summary', wordCount: '5K words' },
      { title: 'Funding Pitch Templates', slug: 'funding-pitch-templates', wordCount: '12K words' },
    ],
  },
  {
    title: 'Platform Documentation',
    icon: <Settings className="w-5 h-5" />,
    items: [
      { title: 'Admin User Guide', slug: 'admin-user-guide', wordCount: '12K words' },
      { title: 'Admin Quick Start', slug: 'admin-quick-start', wordCount: '5K words' },
      { title: 'Admin Routes Complete', slug: 'admin-routes-complete', wordCount: '8K words' },
      { title: 'Admin Complete Flows', slug: 'admin-complete-flows' },
      { title: 'Admin Flows Analysis', slug: 'admin-flows-analysis' },
    ],
  },
  {
    title: 'Technical Documentation',
    icon: <FileText className="w-5 h-5" />,
    items: [
      { title: 'Centre of Excellence Complete', slug: 'centre-of-excellence-complete' },
      { title: 'Empathy Ledger Integration', slug: 'empathy-ledger-full-integration' },
      { title: 'Auto-Linking System', slug: 'auto-linking-complete' },
      { title: 'Blog Editor Complete', slug: 'blog-editor-complete' },
      { title: 'Programs Consolidation', slug: 'programs-consolidation-complete' },
    ],
  },
];

export function WikiSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/wiki" className="flex items-center space-x-2 group">
          <Home className="w-6 h-6 group-hover:text-blue-600 transition-colors" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              JusticeHub Wiki
            </h1>
            <p className="text-xs text-gray-500">Strategic Planning & Docs</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="flex items-center space-x-2 px-3 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider">
              {section.icon}
              <span>{section.title}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === `/wiki/${item.slug}`;
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/wiki/${item.slug}`}
                      className={`
                        block px-3 py-2 rounded-md text-sm transition-colors
                        ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <span>{item.title}</span>
                        {item.wordCount && (
                          <span className="text-xs text-gray-400">{item.wordCount}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Link
          href="/"
          className="block text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to JusticeHub
        </Link>
      </div>
    </aside>
  );
}
