'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface StoryCardProps {
  title: string
  content: string
  impact: string
  image?: string
}

export function StoryCard({ title, content, impact, image }: StoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Story Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </div>

      {/* Story Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '80px' }}
        className="overflow-hidden"
      >
        <p className="text-gray-300 leading-relaxed mb-4">{content}</p>
      </motion.div>

      {/* Impact Statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isExpanded ? 1 : 0 }}
        transition={{ delay: isExpanded ? 0.1 : 0 }}
        className={`${isExpanded ? 'block' : 'hidden'} mt-6 p-4 bg-qld-gold/10 rounded-lg border-l-4 border-qld-gold`}
      >
        <p className="text-sm font-semibold text-qld-gold mb-1">Key Impact</p>
        <p className="text-white">{impact}</p>
      </motion.div>

      {/* Read More Indicator */}
      {!isExpanded && (
        <p className="text-sm text-gray-500 mt-2">Click to read more...</p>
      )}
    </motion.div>
  )
}