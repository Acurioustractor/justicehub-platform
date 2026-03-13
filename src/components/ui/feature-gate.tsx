'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { TIERS, type TierKey } from '@/lib/stripe';

interface FeatureGateProps {
  allowed: boolean;
  /** Feature name for display */
  featureLabel: string;
  /** Required tier key */
  requiredTier: TierKey;
  /** URL to billing/upgrade page */
  upgradeUrl?: string | null;
  /** Whether org is on an active trial */
  trialActive?: boolean;
  /** Custom fallback when locked */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({
  allowed,
  featureLabel,
  requiredTier,
  upgradeUrl,
  trialActive,
  fallback,
  children,
}: FeatureGateProps) {
  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const tier = TIERS[requiredTier];

  return (
    <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 p-8 text-center">
      <div className="mx-auto w-12 h-12 bg-gray-100 border-2 border-gray-300 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-black mb-2">{featureLabel}</h3>
      <p className="text-earth-600 mb-6 max-w-md mx-auto">
        This feature requires the <strong>{tier.name}</strong> plan
        {tier.price ? ` ($${tier.price}/mo)` : ''} or above.
      </p>
      {upgradeUrl && (
        <Link
          href={upgradeUrl}
          className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
        >
          Upgrade Plan
        </Link>
      )}
      {!upgradeUrl && (
        <Link
          href="/pricing"
          className="inline-block px-6 py-3 bg-black text-white font-bold hover:bg-earth-800 transition-colors"
        >
          View Plans
        </Link>
      )}
    </div>
  );
}

/**
 * Inline lock indicator for use in lists/tables (e.g. intervention rows).
 * Shows a small lock icon + tier label instead of full blocked card.
 */
export function FeatureGateInline({
  requiredTier,
  upgradeUrl,
}: {
  requiredTier: TierKey;
  upgradeUrl?: string | null;
}) {
  const tier = TIERS[requiredTier];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-400">
      <Lock className="w-3.5 h-3.5" />
      <span>{tier.name}+</span>
      {upgradeUrl && (
        <Link href={upgradeUrl} className="text-ochre-600 hover:text-ochre-800 underline font-bold ml-1">
          Upgrade
        </Link>
      )}
    </span>
  );
}

/**
 * Trial banner shown at top of hub when org is trialing.
 */
export function TrialBanner({
  trialEndsAt,
  upgradeUrl,
}: {
  trialEndsAt: string;
  upgradeUrl: string;
}) {
  const endDate = new Date(trialEndsAt);
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-100 border-b-2 border-red-600 px-4 py-3 text-center">
        <p className="text-sm font-bold text-red-800">
          Your trial has expired.{' '}
          <Link href={upgradeUrl} className="underline hover:text-red-900">
            Upgrade now
          </Link>{' '}
          to keep access.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-ochre-100 border-b-2 border-ochre-600 px-4 py-3 text-center">
      <p className="text-sm font-bold text-ochre-900">
        {daysLeft} day{daysLeft === 1 ? '' : 's'} left in your trial.{' '}
        <Link href={upgradeUrl} className="underline hover:text-ochre-800">
          Upgrade to keep access
        </Link>
      </p>
    </div>
  );
}
