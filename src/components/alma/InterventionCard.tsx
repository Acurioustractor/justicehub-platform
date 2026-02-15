import Link from 'next/link';
import { EvidenceBadge } from './EvidenceBadge';
import { ConsentIndicator } from './ConsentIndicator';
import type { AlmaIntervention, PortfolioScore } from '@/types/alma';

interface InterventionCardProps {
  intervention: AlmaIntervention & {
    evidence?: Array<{ evidence_type: string }>;
    outcomes?: Array<any>;
  };
  portfolioScore?: PortfolioScore | null;
  showPortfolioScore?: boolean;
  showEvidenceBadge?: boolean;
  showConsentLevel?: boolean;
  compact?: boolean;
  href?: string;
}

export function InterventionCard({
  intervention,
  portfolioScore,
  showPortfolioScore = false,
  showEvidenceBadge = false,
  showConsentLevel = true,
  compact = false,
  href,
}: InterventionCardProps) {
  const evidenceCount = intervention.evidence?.length || 0;
  const evidenceType = intervention.evidence?.[0]?.evidence_type;
  const linkHref = href || `/intelligence/interventions/${intervention.id}`;

  const CardContent = (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3
          className={`${
            compact ? 'text-lg' : 'text-xl'
          } font-bold text-gray-900 flex-1 mr-4`}
        >
          {intervention.name}
        </h3>

        {showEvidenceBadge && (
          <EvidenceBadge
            evidenceCount={evidenceCount}
            evidenceType={evidenceType as any}
            compact={compact}
          />
        )}
      </div>

      {/* Consent Level */}
      {showConsentLevel && (
        <div className="mb-4">
          <ConsentIndicator
            consentLevel={intervention.consent_level}
            culturalAuthority={intervention.cultural_authority}
            showAuthority={!compact}
            compact={compact}
          />
        </div>
      )}

      {/* Description */}
      {!compact && intervention.description && (
        <p className="text-gray-600 mt-2 mb-4 line-clamp-3 flex-1">
          {intervention.description}
        </p>
      )}

      {/* Metadata */}
      <div className="mt-auto pt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 border-t border-gray-100">
        <span className="inline-flex items-center">
          <span className="font-medium text-gray-700">Type:</span>
          <span className="ml-1">{intervention.type}</span>
        </span>

        {intervention.metadata?.state && (
          <span className="inline-flex items-center">
            <span className="font-medium text-gray-700">State:</span>
            <span className="ml-1">{intervention.metadata.state}</span>
          </span>
        )}

        {intervention.metadata?.target_cohort && !compact && (
          <span className="inline-flex items-center">
            <span className="font-medium text-gray-700">Cohort:</span>
            <span className="ml-1 line-clamp-1">
              {intervention.metadata.target_cohort}
            </span>
          </span>
        )}
      </div>

      {/* Portfolio Score */}
      {showPortfolioScore && portfolioScore && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Portfolio Score
            </span>
            <span className="text-2xl font-bold text-ochre-600">
              {(portfolioScore.composite * 100).toFixed(0)}
            </span>
          </div>

          {/* Tier Badge */}
          {portfolioScore.tier && (
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  portfolioScore.tier === 'High Impact'
                    ? 'bg-green-100 text-green-800'
                    : portfolioScore.tier === 'Promising'
                    ? 'bg-blue-100 text-blue-800'
                    : portfolioScore.tier === 'Needs Development'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {portfolioScore.tier}
              </span>
            </div>
          )}

          {/* Top Signal */}
          {portfolioScore.community_authority >= 0.7 && (
            <div className="mt-2 text-xs text-ochre-700 font-medium">
              ⭐ High Community Authority
            </div>
          )}
          {portfolioScore.evidence_strength >= 0.7 && (
            <div className="mt-2 text-xs text-blue-700 font-medium">
              ⭐ Strong Evidence Base
            </div>
          )}
        </div>
      )}
    </div>
  );

  return href !== false ? (
    <Link href={linkHref} className="block h-full">
      {CardContent}
    </Link>
  ) : (
    CardContent
  );
}
