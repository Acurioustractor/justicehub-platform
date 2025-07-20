'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface TourStep {
  target: string
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

interface GuidedTourProps {
  isActive: boolean
  onComplete: () => void
}

export function GuidedTour({ isActive, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const steps: TourStep[] = [
    {
      target: '[data-tour="headline-metrics"]',
      title: 'Real-Time Impact',
      content: 'These shocking numbers update in real-time. Click any metric to dive deeper.',
      position: 'bottom'
    },
    {
      target: '[data-tour="human-figures"]',
      title: 'Visual Representation',
      content: 'Each figure represents a young person. See the stark overrepresentation of Indigenous youth.',
      position: 'top'
    },
    {
      target: '[data-tour="cost-counter"]',
      title: 'Watch Money Waste Away',
      content: 'See taxpayer dollars being wasted in real-time. Compare detention vs community programs.',
      position: 'top'
    },
    {
      target: '[data-tour="data-mode"]',
      title: 'Switch Data Modes',
      content: 'Toggle between Overview, Analysis, and Advocacy modes for different perspectives.',
      position: 'left'
    }
  ]

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return

    const target = document.querySelector(steps[currentStep].target)
    if (target) {
      const rect = target.getBoundingClientRect()
      setTargetRect(rect)
      
      // Scroll target into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentStep, isActive])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  if (!isActive || !targetRect) return null

  const step = steps[currentStep]
  
  // Calculate tooltip position
  const getTooltipStyle = () => {
    const padding = 20
    const tooltipWidth = 320
    const tooltipHeight = 150

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      width: tooltipWidth
    }

    switch (step.position) {
      case 'bottom':
        style.top = targetRect.bottom + padding
        style.left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'top':
        style.bottom = window.innerHeight - targetRect.top + padding
        style.left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
        break
      case 'left':
        style.top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        style.right = window.innerWidth - targetRect.left + padding
        break
      case 'right':
        style.top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2)
        style.left = targetRect.right + padding
        break
    }

    return style
  }

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleSkip}
          />

          {/* Highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9998] pointer-events-none"
            style={{
              top: targetRect.top - 10,
              left: targetRect.left - 10,
              width: targetRect.width + 20,
              height: targetRect.height + 20,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '12px'
            }}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={getTooltipStyle()}
            className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-700"
          >
            {/* Step indicator */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                Skip tour
              </button>
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
            <p className="text-gray-300 text-sm mb-4">{step.content}</p>

            {/* Progress dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep ? 'bg-qld-gold' : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-qld-gold text-gray-900 font-medium rounded-lg hover:bg-qld-gold/90 transition"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </motion.div>

          {/* Pulse animation on target */}
          <motion.div
            className="fixed pointer-events-none"
            style={{
              top: targetRect.top - 10,
              left: targetRect.left - 10,
              width: targetRect.width + 20,
              height: targetRect.height + 20,
            }}
          >
            <motion.div
              className="absolute inset-0 border-2 border-qld-gold rounded-xl"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}