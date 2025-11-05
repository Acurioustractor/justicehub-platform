'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function MindarooBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb based on path
  const pathParts = pathname.split('/').filter(Boolean);
  const isSubPage = pathParts.length > 2; // /wiki/mindaroo-pitch/one-pager

  return (
    <div className="text-sm text-gray-500 mb-8 flex items-center gap-2">
      <Link href="/wiki" className="hover:text-blue-600 transition-colors">
        Wiki
      </Link>
      <span className="text-gray-400">/</span>
      <Link href="/wiki/mindaroo-pitch" className="hover:text-blue-600 transition-colors">
        Mindaroo Pitch
      </Link>
      {isSubPage && (
        <>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">
            {pathParts[pathParts.length - 1]
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </span>
        </>
      )}
    </div>
  );
}
