import { ExternalLink, CheckCircle, Info } from 'lucide-react'
import { useState } from 'react'

interface DataSource {
  name: string
  url?: string
  lastUpdated?: string
  confidence?: number
  agency?: string
}

interface DataSourceBadgeProps {
  source: DataSource
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
}

export function DataSourceBadge({ 
  source, 
  size = 'sm',
  showDetails = true,
  className = ''
}: DataSourceBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full font-medium
          bg-gradient-to-r from-green-50 to-blue-50 
          border border-green-200 text-green-800
          hover:from-green-100 hover:to-blue-100 transition cursor-help
          ${sizeClasses[size]}
        `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <CheckCircle className={iconSize[size]} />
        <span>Official Government Data</span>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex hover:text-green-900"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className={iconSize[size]} />
          </a>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white rounded-lg p-3 shadow-xl max-w-xs">
            <div className="flex items-start gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{source.name}</p>
                {source.agency && (
                  <p className="text-xs text-gray-400">{source.agency}</p>
                )}
              </div>
            </div>
            
            {source.confidence && (
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Data Confidence</span>
                  <span>{source.confidence}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-1.5 rounded-full"
                    style={{ width: `${source.confidence}%` }}
                  />
                </div>
              </div>
            )}

            {source.lastUpdated && (
              <p className="text-xs text-gray-400">
                Updated: {new Date(source.lastUpdated).toLocaleDateString()}
              </p>
            )}

            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
              >
                View source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Preset badges for common sources
export function AIHWBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <DataSourceBadge
      source={{
        name: "Australian Institute of Health and Welfare",
        agency: "Federal Department of Health",
        url: "https://www.aihw.gov.au/reports/youth-justice",
        confidence: 95,
        lastUpdated: new Date().toISOString()
      }}
      size={size}
    />
  )
}

export function TreasuryBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <DataSourceBadge
      source={{
        name: "Queensland Treasury Budget Papers",
        agency: "Queensland Treasury",
        url: "https://budget.qld.gov.au",
        confidence: 98,
        lastUpdated: new Date().toISOString()
      }}
      size={size}
    />
  )
}

export function CourtsBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <DataSourceBadge
      source={{
        name: "Children's Court of Queensland",
        agency: "Queensland Courts",
        url: "https://www.courts.qld.gov.au/courts/childrens-court",
        confidence: 92,
        lastUpdated: new Date().toISOString()
      }}
      size={size}
    />
  )
}

export function QPSBadge({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <DataSourceBadge
      source={{
        name: "Queensland Police Service Statistics",
        agency: "Queensland Police",
        url: "https://www.police.qld.gov.au/maps-and-statistics",
        confidence: 85,
        lastUpdated: new Date().toISOString()
      }}
      size={size}
    />
  )
}