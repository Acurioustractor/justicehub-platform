'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

const SHORTLIST_STORAGE_KEY = 'funding-discovery-shortlist';
const SHORTLIST_UPDATED_EVENT = 'funding-discovery-shortlist-updated';

function normalizeShortlistIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )
  );
}

export function getFundingDiscoveryShortlistIds() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return normalizeShortlistIds(parsedValue);
  } catch {
    return [];
  }
}

export function setFundingDiscoveryShortlistIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = normalizeShortlistIds(ids);
  window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(SHORTLIST_UPDATED_EVENT, { detail: normalized }));
}

export function FundingDiscoveryShortlistButton({
  organizationId,
  compact = false,
}: {
  organizationId: string;
  compact?: boolean;
}) {
  const normalizedOrganizationId = String(organizationId || '').trim();
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    if (!normalizedOrganizationId) {
      setIsShortlisted(false);
      return;
    }

    const sync = () => {
      const shortlistIds = getFundingDiscoveryShortlistIds();
      setIsShortlisted(shortlistIds.includes(normalizedOrganizationId));
    };

    sync();
    window.addEventListener(SHORTLIST_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(SHORTLIST_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [normalizedOrganizationId]);

  const label = isShortlisted ? 'Shortlisted' : compact ? 'Shortlist' : 'Add to Shortlist';

  return (
    <button
      type="button"
      onClick={() => {
        const shortlistIds = getFundingDiscoveryShortlistIds();
        if (shortlistIds.includes(normalizedOrganizationId)) {
          setFundingDiscoveryShortlistIds(
            shortlistIds.filter((id) => id !== normalizedOrganizationId)
          );
          setIsShortlisted(false);
          return;
        }

        setFundingDiscoveryShortlistIds([...shortlistIds, normalizedOrganizationId]);
        setIsShortlisted(true);
      }}
      className={`inline-flex items-center gap-2 border-2 border-black font-black transition-colors ${
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
      } ${
        isShortlisted ? 'bg-[#0f766e] text-white hover:bg-[#115e59]' : 'bg-white hover:bg-gray-100'
      }`}
    >
      {isShortlisted ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {label}
    </button>
  );
}

export function FundingDiscoveryShortlistLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getFundingDiscoveryShortlistIds().length);

    sync();
    window.addEventListener(SHORTLIST_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(SHORTLIST_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const label = useMemo(() => {
    if (count === 0) return 'Shortlist';
    if (count === 1) return 'Shortlist (1)';
    return `Shortlist (${count})`;
  }, [count]);

  return (
    <Link
      href="/funding/discovery/shortlist"
      className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-black font-bold hover:bg-gray-100 transition-colors"
    >
      <Bookmark className="w-4 h-4" />
      {label}
    </Link>
  );
}
