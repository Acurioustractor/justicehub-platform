'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, ArrowLeft, Crown, Users } from 'lucide-react';
import { TIERS, type TierKey } from '@/lib/stripe';
import { TrialBanner } from '@/components/ui/feature-gate';

interface BillingClientProps {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: TierKey;
    type: string | null;
    partnerTier: string | null;
    billingStatus: string;
    trialEndsAt: string | null;
    hasStripe: boolean;
  };
  memberCount: number;
}

const TIER_ORDER: TierKey[] = ['community', 'organisation', 'institution', 'enterprise'];

export function BillingClient({ org, memberCount }: BillingClientProps) {
  const [upgrading, setUpgrading] = useState(false);
  const isBasecamp = org.type === 'basecamp' || org.partnerTier === 'basecamp';
  const currentTierIndex = TIER_ORDER.indexOf(org.plan);

  async function handleUpgrade(tier: TierKey) {
    setUpgrading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org.id,
          tier,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setUpgrading(false);
    }
  }

  async function handleManage() {
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: org.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 page-content">
      {org.trialEndsAt && (
        <TrialBanner trialEndsAt={org.trialEndsAt} upgradeUrl={`/portal/${org.slug}/billing`} />
      )}
      <div className="container-justice py-8 max-w-5xl">
        <Link href={`/portal/${org.slug}`} className="text-sm font-bold text-earth-600 hover:text-black flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Portal
        </Link>

        <h1 className="text-3xl font-black mb-2">Billing & Plan</h1>
        <p className="text-earth-600 mb-8">{org.name}</p>

        {/* Current plan card */}
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Crown className="w-5 h-5 text-ochre-600" />
                <h2 className="text-xl font-black">
                  {isBasecamp ? 'Basecamp (Full Access)' : TIERS[org.plan]?.name || 'Community'} Plan
                </h2>
              </div>
              <p className="text-sm text-earth-500">
                {isBasecamp
                  ? 'Your organisation has full access as a JusticeHub basecamp partner.'
                  : org.billingStatus === 'trialing'
                    ? 'Trial period — upgrade to keep access after trial ends.'
                    : org.billingStatus === 'active'
                      ? 'Active subscription'
                      : 'Free tier — upgrade to unlock more features.'}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-earth-500 mb-1">
                <Users className="w-4 h-4" />
                {memberCount} team member{memberCount === 1 ? '' : 's'}
              </div>
              {org.hasStripe && org.billingStatus === 'active' && (
                <button
                  onClick={handleManage}
                  className="text-sm text-ochre-600 hover:text-ochre-800 font-bold underline flex items-center gap-1"
                >
                  <CreditCard className="w-3.5 h-3.5" /> Manage Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tier comparison */}
        {!isBasecamp && (
          <div className="grid md:grid-cols-4 gap-4">
            {TIER_ORDER.map((tierKey, i) => {
              const tier = TIERS[tierKey];
              const isCurrent = tierKey === org.plan;
              const isUpgrade = i > currentTierIndex;
              const isEnterprise = tierKey === 'enterprise';

              return (
                <div
                  key={tierKey}
                  className={`bg-white border-2 p-5 ${
                    isCurrent ? 'border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-black text-lg mb-1">{tier.name}</h3>
                  <p className="text-2xl font-black mb-3">
                    {tier.price === 0 ? 'Free' : tier.price === null ? 'Custom' : `$${tier.price}`}
                    {tier.price && tier.price > 0 && <span className="text-sm font-normal text-earth-500">/mo</span>}
                  </p>
                  <ul className="space-y-2 mb-6 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="text-center text-sm font-bold text-earth-500 py-2 border-2 border-gray-200">
                      Current Plan
                    </div>
                  ) : isUpgrade && !isEnterprise ? (
                    <button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={upgrading}
                      className="w-full py-2 bg-black text-white font-bold text-sm hover:bg-earth-800 disabled:opacity-50"
                    >
                      {upgrading ? 'Redirecting...' : 'Upgrade'}
                    </button>
                  ) : isEnterprise ? (
                    <a
                      href="mailto:benjamin@act.place?subject=JusticeHub Enterprise"
                      className="block text-center py-2 bg-black text-white font-bold text-sm hover:bg-earth-800"
                    >
                      Contact Us
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
