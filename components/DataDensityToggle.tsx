'use client'

import { motion } from 'framer-motion'

interface DataDensityToggleProps {
  mode: 'overview' | 'analysis' | 'advocacy'
  onModeChange: (mode: 'overview' | 'analysis' | 'advocacy') => void
}

export function DataDensityToggle({ mode, onModeChange }: DataDensityToggleProps) {
  const modes = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: '👁️',
      description: 'Quick scanning',
      color: 'from-blue-600 to-blue-700'
    },
    {
      id: 'analysis' as const,
      label: 'Analysis',
      icon: '📊',
      description: 'Deep research',
      color: 'from-purple-600 to-purple-700'
    },
    {
      id: 'advocacy' as const,
      label: 'Advocacy',
      icon: '📢',
      description: 'Share-ready',
      color: 'from-qld-gold to-amber-600'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-6 right-6 z-50 bg-gray-900/90 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-gray-700"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 px-3 hidden md:block">Data Mode:</span>
        <div className="flex gap-1">
          {modes.map((modeOption) => (
            <motion.button
              key={modeOption.id}
              onClick={() => onModeChange(modeOption.id)}
              className={`
                relative px-4 py-2 rounded-xl transition-all duration-300
                ${mode === modeOption.id 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-200'
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {mode === modeOption.id && (
                <motion.div
                  layoutId="activeMode"
                  className={`absolute inset-0 bg-gradient-to-r ${modeOption.color} rounded-xl`}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span className="text-lg">{modeOption.icon}</span>
                <span className="font-medium hidden sm:block">{modeOption.label}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Mode Description */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-2 px-3 overflow-hidden"
      >
        <p className="text-xs text-gray-500">
          {modes.find(m => m.id === mode)?.description}
        </p>
      </motion.div>

      {/* Keyboard Shortcuts Hint */}
      <div className="hidden lg:block mt-3 pt-3 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">1</kbd>{' '}
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">2</kbd>{' '}
          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">3</kbd> to switch
        </p>
      </div>
    </motion.div>
  )
}