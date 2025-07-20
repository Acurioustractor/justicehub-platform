'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { useState, useEffect } from 'react'
import { TreasuryBadge, AIHWBadge, QPSBadge, CourtsBadge } from './DataSourceBadge'
import { useDashboardData } from '@/hooks/useDashboardData'

interface HeadlineMetricsProps {
  onSectionClick: (section: string) => void
  mode: 'overview' | 'analysis' | 'advocacy'
}

export function HeadlineMetrics({ onSectionClick, mode }: HeadlineMetricsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const { data, isLoading } = useDashboardData()
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate real-time metrics
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const secondsSinceMidnight = (currentTime.getTime() - todayStart.getTime()) / 1000
  
  // Use real data or fallback values
  const dailyDetentionCost = data?.budget?.dailyDetentionCost || 1213698
  const moneyBurnedToday = (dailyDetentionCost / 86400) * secondsSinceMidnight
  const indigenousPercentage = data?.detention?.indigenousPercentage || 73.4
  const costRatio = data?.budget?.costRatio || 21
  const communityProgramsLost = data?.insights?.kidsWhoCouldBeHelpedInstead || Math.floor(dailyDetentionCost / 41)
  
  const metricsData = [
    {
      id: 'money-burned',
      label: "Burned on Detention Today",
      value: moneyBurnedToday,
      prefix: '$',
      decimals: 0,
      color: 'text-red-500',
      bgColor: 'from-red-500/20 to-red-600/20',
      description: 'Real-time taxpayer money spent',
      clickSection: 'costs',
      source: 'treasury',
      verified: data?.budget?.source?.document
    },
    {
      id: 'indigenous-kids',
      label: "Indigenous Kids Locked Up",
      value: indigenousPercentage,
      suffix: '%',
      color: 'text-amber-500',
      bgColor: 'from-amber-500/20 to-amber-600/20',
      description: `Despite being ${data?.insights?.indigenousOverrepresentation?.populationPercentage || 4.6}% of population`,
      clickSection: 'indigenous',
      source: 'detention',
      verified: data?.detention?.source?.document
    },
    {
      id: 'cost-ratio',
      label: "More Expensive Than Community",
      value: costRatio,
      suffix: 'x',
      color: 'text-purple-500',
      bgColor: 'from-purple-500/20 to-purple-600/20',
      description: `$${data?.budget?.claimedDetentionCostPerDay || 857}/day vs $${data?.budget?.dailyCommunityProgramCost || 41}/day`,
      clickSection: 'costs',
      source: 'treasury',
      verified: data?.budget?.source?.document
    },
    {
      id: 'alternatives-lost',
      label: "Community Programs Lost Daily",
      value: communityProgramsLost,
      suffix: '',
      color: 'text-emerald-500',
      bgColor: 'from-emerald-500/20 to-emerald-600/20',
      description: 'Kids who could be helped instead',
      clickSection: 'alternatives',
      source: 'treasury',
      verified: data?.budget?.source?.document
    }
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-12"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-100 rounded-xl h-48"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4"
      >
        Queensland's Youth Justice
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl sm:text-2xl md:text-3xl text-qld-maroon mb-8 sm:mb-12"
      >
        The Shocking Truth in Real-Time
      </motion.p>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-4"
      >
        {metricsData.map((metric, index) => (
          <motion.div
            key={metric.id}
            variants={item}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSectionClick(metric.clickSection)}
            className={`cursor-pointer bg-gradient-to-br ${metric.bgColor} backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl transition-all overflow-hidden relative`}
          >
            <div className="space-y-2">
              <h3 className={`${
                metric.id === 'money-burned' 
                  ? 'text-2xl sm:text-3xl md:text-4xl' 
                  : 'text-3xl sm:text-4xl md:text-5xl'
              } font-bold ${metric.color} break-all`}>
                <CountUp
                  start={0}
                  end={metric.value}
                  duration={2.5}
                  separator=","
                  decimals={metric.decimals}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  preserveValue={metric.id === 'money-burned'}
                />
              </h3>
              <p className="text-sm sm:text-base text-gray-700 font-medium">{metric.label}</p>
              <p className="text-xs sm:text-sm text-gray-600">{metric.description}</p>
              
              {/* Data Source Badge */}
              <div className="mt-3">
                {metric.source === 'treasury' && <TreasuryBadge size="sm" />}
                {metric.source === 'detention' && <AIHWBadge size="sm" />}
                {metric.source === 'courts' && <CourtsBadge size="sm" />}
                {metric.source === 'qps' && <QPSBadge size="sm" />}
              </div>
            </div>
            
            {/* Pulse effect for money counter */}
            {metric.id === 'money-burned' && (
              <motion.div
                className="absolute -inset-1 bg-red-500 rounded-2xl opacity-20"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            {/* Click indicator */}
            <div className="mt-4 flex items-center justify-center text-gray-400">
              <span className="text-xs">Click to explore</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {mode === 'analysis' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-8 text-sm text-gray-400"
        >
          <p>Data updated every 30 seconds from Queensland Government sources</p>
          <p>Last sync: {currentTime.toLocaleTimeString()}</p>
        </motion.div>
      )}
    </div>
  )
}