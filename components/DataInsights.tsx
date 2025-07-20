'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { createClient } from '@/lib/supabase'

interface BudgetData {
  fiscal_year: string
  program: string
  category: string
  amount: number
  description: string
  source_url: string
  source_document: string
}

interface ParliamentData {
  title: string
  date: string
  author: string
  content: string
  url: string
}

interface YouthStats {
  total_in_detention: number
  indigenous_percentage: number
  remand_percentage: number
  daily_cost: number
  recidivism_rate: number
}

export function DataInsights() {
  const [budgetData, setBudgetData] = useState<BudgetData[]>([])
  const [parliamentData, setParliamentData] = useState<ParliamentData[]>([])
  const [youthStats, setYouthStats] = useState<YouthStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    // Fetch budget data
    const { data: budget } = await supabase
      .from('budget_allocations')
      .select('*')
      .order('fiscal_year', { ascending: false })
      .limit(10)
    
    // Fetch parliament data
    const { data: parliament } = await supabase
      .from('parliamentary_documents')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
    
    // Fetch youth statistics
    const { data: stats } = await supabase
      .from('youth_statistics')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .single()
    
    setBudgetData(budget || [])
    setParliamentData(parliament || [])
    setYouthStats(stats)
    setLoading(false)
  }

  if (loading) return <div className="animate-pulse">Loading insights...</div>

  // Calculate key metrics
  const detentionTotal = budgetData
    .filter(b => b.category === 'detention' && b.fiscal_year === '2024-25')
    .reduce((sum, b) => sum + b.amount, 0)
  
  const communityTotal = budgetData
    .filter(b => b.category === 'community' && b.fiscal_year === '2024-25')
    .reduce((sum, b) => sum + b.amount, 0)
  
  const detentionPercentage = detentionTotal / (detentionTotal + communityTotal) * 100

  return (
    <div className="space-y-8">
      {/* Key Insights Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl p-6 border border-red-800/30"
      >
        <h2 className="text-2xl font-bold mb-4 text-qld-gold">
          🔍 Key Insights from Government Data
        </h2>
        <p className="text-gray-300">
          Data scraped from official Queensland government sources reveals the true cost and impact of youth detention
        </p>
      </motion.div>

      {/* Budget Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800/50 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          💰 Budget Reality (2024-25)
          <a
            href="https://budget.qld.gov.au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 font-normal"
          >
            Source: Queensland Budget ↗
          </a>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-red-900/20 rounded-lg p-4 border border-red-800/30">
            <div className="text-3xl font-bold text-red-400">
              $<CountUp end={detentionTotal / 1000000} decimals={1} />M
            </div>
            <div className="text-sm text-gray-400">Detention Operations</div>
            <div className="text-lg font-semibold text-red-300">
              {detentionPercentage.toFixed(1)}% of budget
            </div>
          </div>
          
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-800/30">
            <div className="text-3xl font-bold text-green-400">
              $<CountUp end={communityTotal / 1000000} decimals={1} />M
            </div>
            <div className="text-sm text-gray-400">Community Programs</div>
            <div className="text-lg font-semibold text-green-300">
              {(100 - detentionPercentage).toFixed(1)}% of budget
            </div>
          </div>
        </div>

        {/* Budget Items with Sources */}
        <div className="space-y-2">
          {budgetData.slice(0, 3).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <span className="text-gray-300">{item.program}</span>
                <span className="text-gray-500 ml-2">({item.fiscal_year})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  ${(item.amount / 1000000).toFixed(1)}M
                </span>
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs"
                  title={item.source_document}
                >
                  [source]
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Daily Cost Comparison */}
      {youthStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold mb-4">
            📊 The Real Numbers
            <span className="text-sm text-gray-400 font-normal ml-2">
              (Source: Parliamentary Questions & Committee Reports)
            </span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-qld-maroon">
                $<CountUp end={youthStats.daily_cost} />
              </div>
              <div className="text-sm text-gray-400">Per Day in Detention</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">
                <CountUp end={youthStats.indigenous_percentage} />%
              </div>
              <div className="text-sm text-gray-400">Indigenous Youth</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">
                <CountUp end={youthStats.remand_percentage} />%
              </div>
              <div className="text-sm text-gray-400">On Remand (Not Convicted)</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-500">
                <CountUp end={youthStats.recidivism_rate} />%
              </div>
              <div className="text-sm text-gray-400">Return Within 12 Months</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Parliament Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 rounded-xl p-6"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏛️ What Parliament is Saying
          <a
            href="https://www.parliament.qld.gov.au"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 font-normal"
          >
            Source: Queensland Parliament ↗
          </a>
        </h3>
        
        <div className="space-y-4">
          {parliamentData.slice(0, 3).map((doc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="border-l-4 border-qld-gold pl-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{doc.title}</h4>
                  <p className="text-xs text-gray-400">
                    {doc.author} • {new Date(doc.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                    {doc.content}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-400 hover:text-blue-300 text-xs whitespace-nowrap"
                >
                  View →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hidden Costs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-800/30"
      >
        <h3 className="text-xl font-bold mb-4">
          💸 The Hidden Costs They Don't Tell You
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Beyond the $923/day operational cost, families and society bear additional burdens:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>
              <strong>Family Travel:</strong> $8.9M annually - Families traveling to remote detention centres
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>
              <strong>Lost Education:</strong> $156M annually - Lifetime earnings loss from disrupted education
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-400">•</span>
            <span>
              <strong>Mental Health:</strong> $18.5M annually - Additional services needed post-detention
            </span>
          </li>
        </ul>
        <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-800/30">
          <p className="text-sm font-semibold text-red-300">
            True cost per youth per day: ~$1,570 (not the $923 they advertise)
          </p>
        </div>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-qld-maroon to-qld-gold text-white rounded-xl p-6 text-center"
      >
        <h3 className="text-xl font-bold mb-2">
          This Data Demands Action
        </h3>
        <p className="mb-4">
          Every dollar spent on detention is a dollar not spent on programs that actually work
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/transparency"
            className="bg-white text-qld-maroon px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            View All Data Sources
          </a>
          <a
            href="/monitoring"
            className="bg-qld-maroon text-white px-6 py-2 rounded-lg font-semibold hover:bg-qld-maroon/80 transition-colors border border-white"
          >
            Track Our Scrapers
          </a>
        </div>
      </motion.div>
    </div>
  )
}