'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface HumanFiguresProps {
  indigenousPercentage: number
  populationPercentage: number
  mode: 'overview' | 'analysis' | 'advocacy'
}

export function HumanFigures({ indigenousPercentage, populationPercentage, mode }: HumanFiguresProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Calculate figures
  const totalFigures = 100
  const indigenousInDetention = Math.round((indigenousPercentage / 100) * totalFigures)
  const nonIndigenousInDetention = totalFigures - indigenousInDetention
  const indigenousInPopulation = Math.round((populationPercentage / 100) * totalFigures)
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.01,
        delayChildren: 0.3
      }
    }
  }

  const item = {
    hidden: { opacity: 0, scale: 0 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  }

  const renderFigure = (index: number, isIndigenous: boolean, isHighlighted: boolean = false) => (
    <motion.div
      key={`figure-${index}`}
      variants={item}
      className={`relative`}
      whileHover={{ scale: 1.2, zIndex: 10 }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={`${
          isIndigenous 
            ? isHighlighted 
              ? 'fill-qld-gold drop-shadow-glow' 
              : 'fill-amber-600'
            : 'fill-gray-600'
        } transition-colors duration-300`}
      >
        <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M12 7C13.7 7 15 8.3 15 10V16H13V22H11V16H9V10C9 8.3 10.3 7 12 7Z" />
      </svg>
    </motion.div>
  )

  return (
    <div className="py-12">
      <div className="space-y-12">
        {/* Detention visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            In Youth Detention Today
          </h3>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate={isVisible ? "show" : "hidden"}
            className="grid grid-cols-10 md:grid-cols-20 gap-2 mb-6"
          >
            {Array.from({ length: totalFigures }, (_, i) => 
              renderFigure(i, i < indigenousInDetention, true)
            )}
          </motion.div>

          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-qld-gold rounded-full animate-pulse"></div>
              <span className="text-white">
                <span className="font-bold text-2xl">{indigenousPercentage}%</span> Indigenous
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
              <span className="text-white">
                <span className="font-bold text-2xl">{100 - indigenousPercentage}%</span> Non-Indigenous
              </span>
            </div>
          </div>
        </motion.div>

        {/* Population comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            In Queensland's Population
          </h3>
          
          <motion.div 
            variants={container}
            initial="hidden"
            animate={isVisible ? "show" : "hidden"}
            className="grid grid-cols-10 md:grid-cols-20 gap-2 mb-6"
          >
            {Array.from({ length: totalFigures }, (_, i) => 
              renderFigure(i, i < indigenousInPopulation, false)
            )}
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-amber-600 rounded-full"></div>
            <span className="text-white">
              <span className="font-bold text-2xl">{populationPercentage}%</span> of total population
            </span>
          </div>
        </motion.div>

        {/* Impact statement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-red-900/50 to-amber-900/50 rounded-2xl p-8 text-center"
        >
          <p className="text-3xl font-bold text-white mb-2">
            {Math.round(indigenousPercentage / populationPercentage)}x Overrepresented
          </p>
          <p className="text-lg text-gray-300">
            Indigenous youth are locked up at {Math.round(indigenousPercentage / populationPercentage)} times the rate they exist in the population
          </p>
          
          {mode === 'analysis' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-400">National Average</p>
                <p className="text-xl font-bold text-white">19x</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-400">Queensland Rate</p>
                <p className="text-xl font-bold text-qld-gold">22-33x</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="text-gray-400">Worst in</p>
                <p className="text-xl font-bold text-red-500">Australia</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <style jsx>{`
        .drop-shadow-glow {
          filter: drop-shadow(0 0 8px rgba(253, 185, 19, 0.5));
        }
      `}</style>
    </div>
  )
}