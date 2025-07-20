'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import CountUp from 'react-countup'

interface CostCounterProps {
  detentionCost: number
  communityCost: number
  mode: 'overview' | 'analysis' | 'advocacy'
}

export function CostCounter({ detentionCost, communityCost, mode }: CostCounterProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  
  useEffect(() => {
    if (!isRunning) return
    
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isRunning])

  // Calculate costs per second
  const detentionPerSecond = detentionCost / 86400
  const communityPerSecond = communityCost / 86400
  
  // Calculate cumulative costs
  const detentionTotal = detentionPerSecond * timeElapsed
  const communityTotal = communityPerSecond * timeElapsed
  const difference = detentionTotal - communityTotal
  
  // Calculate what could be done with the difference
  const youthWorkersHired = Math.floor(difference / 200) // $200/day per worker
  const familiesCounseled = Math.floor(difference / 150) // $150/session
  const mealsProvided = Math.floor(difference / 15) // $15/meal
  
  return (
    <div className="py-12 space-y-8">
      {/* Timer Control */}
      <div className="text-center">
        <p className="text-gray-400 mb-2">Time since you started watching</p>
        <div className="text-4xl font-mono text-white">
          {Math.floor(timeElapsed / 60).toString().padStart(2, '0')}:
          {(timeElapsed % 60).toString().padStart(2, '0')}
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="mt-2 text-sm text-gray-500 hover:text-gray-300 transition"
        >
          {isRunning ? 'Pause' : 'Resume'} Timer
        </button>
      </div>

      {/* Cost Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Detention Cost */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-2xl p-8"
        >
          <h3 className="text-xl font-bold text-red-400 mb-4">Detention Costs</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Per Day</p>
              <p className="text-3xl font-bold text-white">${detentionCost}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Since You've Been Watching</p>
              <div className="text-4xl font-bold text-red-500">
                $<CountUp
                  start={0}
                  end={detentionTotal}
                  duration={0.5}
                  decimals={2}
                  preserveValue
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Community Cost */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 rounded-2xl p-8"
        >
          <h3 className="text-xl font-bold text-emerald-400 mb-4">Community Program Costs</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Per Day</p>
              <p className="text-3xl font-bold text-white">${communityCost}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Since You've Been Watching</p>
              <div className="text-4xl font-bold text-emerald-500">
                $<CountUp
                  start={0}
                  end={communityTotal}
                  duration={0.5}
                  decimals={2}
                  preserveValue
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Waste Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 rounded-2xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Money Wasted: 
          <span className="text-amber-500 ml-2">
            $<CountUp
              start={0}
              end={difference}
              duration={0.5}
              decimals={2}
              preserveValue
            />
          </span>
        </h3>
        
        <p className="text-gray-300 mb-6">With this difference, we could have:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-white">
              <CountUp end={youthWorkersHired} duration={1} preserveValue />
            </div>
            <p className="text-gray-400 mt-2">Youth workers for a day</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-white">
              <CountUp end={familiesCounseled} duration={1} preserveValue />
            </div>
            <p className="text-gray-400 mt-2">Family counseling sessions</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800/50 rounded-lg p-6 text-center"
          >
            <div className="text-3xl font-bold text-white">
              <CountUp end={mealsProvided} duration={1} preserveValue />
            </div>
            <p className="text-gray-400 mt-2">Meals for hungry kids</p>
          </motion.div>
        </div>
      </motion.div>

      {mode === 'advocacy' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-xl text-gray-300 mb-4">
            Every second, Queensland wastes ${(detentionPerSecond - communityPerSecond).toFixed(2)} 
            that could transform young lives
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-qld-gold text-gray-900 font-bold rounded-lg shadow-lg"
          >
            Share This Waste
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}