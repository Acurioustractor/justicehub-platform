import { SignalGauge } from './SignalGauge';
import type { PortfolioScore } from '@/types/alma';

interface PortfolioScoreCardProps {
  score: PortfolioScore;
  interventionId?: string;
  showRecommendations?: boolean;
}

export function PortfolioScoreCard({
  score,
  interventionId,
  showRecommendations = true,
}: PortfolioScoreCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-900">Portfolio Score</h3>

      {/* Overall Score */}
      <div className="text-center mb-6 pb-6 border-b border-gray-200">
        <div className="text-5xl font-bold text-ochre-600 mb-1">
          {(score.composite * 100).toFixed(0)}
        </div>
        <p className="text-sm text-gray-600">Overall Score</p>
      </div>

      {/* 5 Signal Breakdown */}
      <div className="space-y-4">
        <SignalGauge
          label="Evidence Strength"
          value={score.evidence_strength}
          color="blue"
        />

        <SignalGauge
          label="Community Authority"
          value={score.community_authority}
          color="ochre"
          weight={30} // Highest weight
        />

        <SignalGauge
          label="Harm Risk"
          value={score.harm_risk}
          color="red"
          inverted // Lower is better
        />

        <SignalGauge
          label="Implementation Capability"
          value={score.implementation_capability}
          color="green"
        />

        <SignalGauge
          label="Option Value"
          value={score.option_value}
          color="purple"
        />
      </div>

      {/* Tier Display */}
      {score.tier && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Tier</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                score.tier === 'High Impact'
                  ? 'bg-green-100 text-green-800'
                  : score.tier === 'Promising'
                  ? 'bg-blue-100 text-blue-800'
                  : score.tier === 'Needs Development'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {score.tier}
            </span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && score.recommendations && score.recommendations.length > 0 && (
        <div className="mt-6 bg-eucalyptus-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
          <ul className="text-sm space-y-1 text-gray-700">
            {score.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start">
                <span className="text-eucalyptus-600 mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {score.tags && score.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {score.tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-sand-100 text-sand-800 rounded text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
