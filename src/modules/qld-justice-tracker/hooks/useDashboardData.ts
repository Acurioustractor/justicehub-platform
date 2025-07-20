import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export interface DashboardData {
  timestamp: string
  lastUpdated: {
    court: string
    detention: string
    budget: string
    police: string
    audit: string
  }
  court: {
    totalDefendants: number
    indigenousDefendants: number
    indigenousPercentage: number
    bailRefusedCount: number
    bailRefusedPercentage: number
    remandedInCustody: number
    averageDaysToFinalization: number
    overrepresentationFactor: number
    source: {
      document: string
      url: string
      pageReferences: Record<string, string>
    }
  }
  detention: {
    totalYouth: number
    indigenousYouth: number
    indigenousPercentage: number
    onRemand: number
    remandPercentage: number
    capacityPercentage: number
    overrepresentationFactor: number
    ageBreakdown: {
      '10-13': number
      '14-15': number
      '16-17': number
    }
    source: {
      document: string
      url: string
      date: string
    }
  }
  budget: {
    totalYouthJustice: number
    detentionOperations: number
    detentionPercentage: number
    communityPrograms: number
    communityPercentage: number
    administration: number
    dailyDetentionCost: number
    dailyCommunityProgramCost: number
    costRatio: number
    claimedDetentionCostPerDay: number
    trueCostPerDay: number
    source: {
      document: string
      url: string
      fiscalYear: string
    }
  }
  police: {
    youthOffenders: number
    repeatOffenders: number
    repeatOffenderPercentage: number
    seriousRepeatOffenders: number
    clearanceRate: number
    source: {
      document: string
      url: string
      period: string
    }
  }
  audit: {
    totalSpending2018to2023: number
    trueCostPerDay: number
    claimedCost: number
    hiddenCostPercentage: number
    accountabilityFinding: string
    source: {
      document: string
      url: string
      date: string
    }
  }
  insights: {
    moneyWastedToday: number
    kidsWhoCouldBeHelpedInstead: number
    indigenousOverrepresentation: {
      detention: number
      court: number
      populationPercentage: number
    }
    systemFailures: {
      overcrowding: boolean
      majorityOnRemand: boolean
      highRepeatOffending: boolean
      budgetMisallocation: boolean
    }
  }
}

export function useDashboardData() {
  const { data, error, mutate } = useSWR<DashboardData>(
    '/api/dashboard',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  )

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// Hook for trends data
export interface TrendsData {
  timestamp: string
  courtTrends: {
    periods: string[]
    totalDefendants: number[]
    indigenousPercentage: number[]
    bailRefusedPercentage: number[]
    insights: {
      defendantsTrend: 'increasing' | 'decreasing' | 'stable'
      indigenousTrend: 'increasing' | 'decreasing' | 'stable'
      bailRefusalTrend: 'increasing' | 'decreasing' | 'stable'
    }
  }
  detentionTrends: {
    dates: string[]
    totalYouth: number[]
    indigenousPercentage: number[]
    remandPercentage: number[]
    capacityPercentage: number[]
    insights: {
      populationTrend: 'increasing' | 'decreasing' | 'stable'
      indigenousTrend: 'increasing' | 'decreasing' | 'stable'
      overcrowdingPeriods: number
    }
  }
  budgetTrends: {
    fiscalYears: string[]
    totalAmounts: number[]
    detentionPercentages: number[]
    communityPercentages: number[]
    insights: {
      totalGrowth: number
      detentionShare: number
      communityShare: number
    }
  }
  policeTrends: {
    periods: string[]
    youthOffenders: number[]
    repeatOffenderPercentages: number[]
    insights: {
      offendersTrend: 'increasing' | 'decreasing' | 'stable'
      recidivismTrend: 'increasing' | 'decreasing' | 'stable'
    }
  }
  comparisons: {
    costEffectiveness: any
    overrepresentationGrowth: any
    systemStrain: any
  }
}

export function useTrendsData() {
  const { data, error, mutate } = useSWR<TrendsData>(
    '/api/trends',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true
    }
  )

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// Hook for source data
export interface SourcesData {
  timestamp: string
  verificationStandards: {
    method: string
    quality: string
    requirements: string[]
  }
  primarySources: Array<{
    id: string
    category: string
    name: string
    url: string
    verifiedDate: string
    pageReferences: Record<string, string>
    keyStatistics: string[]
    updateFrequency: string
  }>
  additionalSources: Array<{
    id: string
    name: string
    category: string
    url: string
    description: string
    updateFrequency: string
  }>
  dataQuality: {
    lastFullVerification: string
    nextScheduledUpdate: string
    verificationProcess: string[]
    qualityMetrics: {
      sourcesVerified: number
      statisticsExtracted: number
      lastUpdateErrors: number
      dataCompleteness: number
    }
  }
  citationGuidelines: {
    academicFormat: string
    journalisticFormat: string
    socialMediaFormat: string
    alwaysInclude: string[]
  }
}

export function useSourcesData() {
  const { data, error, mutate } = useSWR<SourcesData>(
    '/api/sources',
    fetcher,
    {
      revalidateOnFocus: false // Sources don't change frequently
    }
  )

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// Utility hook for real-time money counter
export function useMoneyCounter() {
  const { data } = useDashboardData()
  
  if (!data || !data.budget) return { moneyWasted: 0, kidsHelped: 0 }
  
  const dailyDetentionCost = data.budget.dailyDetentionCost
  const dailyCommunityProgramCost = data.budget.dailyCommunityProgramCost
  
  // Calculate money wasted since midnight
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  
  const secondsSinceMidnight = (now.getTime() - midnight.getTime()) / 1000
  const moneyWasted = (dailyDetentionCost / 86400) * secondsSinceMidnight
  const kidsHelped = Math.floor(moneyWasted / dailyCommunityProgramCost)
  
  return { moneyWasted, kidsHelped }
}