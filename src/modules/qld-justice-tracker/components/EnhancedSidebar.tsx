'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { navigationSections, quickAccessItems, userJourneys } from '@/lib/navigation'
import { ChevronRight, ChevronDown, X, Menu, Sparkles } from 'lucide-react'

interface EnhancedSidebarProps {
  onClose?: () => void
}

export default function EnhancedSidebar({ onClose }: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(['THE EVIDENCE'])
  const [showUserJourneys, setShowUserJourneys] = useState(false)

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-qld-maroon to-qld-gold rounded-lg flex items-center justify-center font-bold text-white">
              QYJ
            </div>
            <div>
              <h2 className="font-bold text-lg">Youth Justice Tracker</h2>
              <p className="text-xs text-gray-400">Queensland Accountability</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Data Sources</span>
            <span className="text-qld-gold font-bold">6 Active</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Last Update</span>
            <span className="text-green-400">2 min ago</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Records</span>
            <span className="text-blue-400">47,382</span>
          </div>
        </div>
      </div>

      {/* User Journey Selector */}
      <div className="px-6 py-3 border-b border-gray-800">
        <button
          onClick={() => setShowUserJourneys(!showUserJourneys)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-900/20 to-purple-900/20 
                     border border-blue-800/30 rounded-lg hover:from-blue-900/30 hover:to-purple-900/30 transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Quick Start Guide</span>
          </div>
          {showUserJourneys ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        
        <AnimatePresence>
          {showUserJourneys && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 space-y-2 overflow-hidden"
            >
              {Object.entries(userJourneys).map(([key, journey]) => (
                <Link
                  key={key}
                  href={journey.path[0].href}
                  className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{journey.icon}</span>
                    <span className="text-sm font-medium">{journey.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 ml-7">
                    {journey.path.map(p => p.label).join(' → ')}
                  </p>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-6">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div className="text-left">
                  <h3 className="font-bold text-sm">{section.title}</h3>
                  <p className="text-xs text-gray-400">{section.description}</p>
                </div>
              </div>
              {expandedSections.includes(section.title) ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <AnimatePresence>
              {expandedSections.includes(section.title) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 ml-4 space-y-1 overflow-hidden"
                >
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center justify-between p-3 rounded-lg transition
                        ${isActiveLink(item.href)
                          ? 'bg-qld-maroon text-white'
                          : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="text-sm font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-xs opacity-75">{item.description}</p>
                          )}
                        </div>
                      </div>
                      {item.badge && (
                        <span className={`
                          px-2 py-1 text-xs rounded-full font-bold
                          ${item.badge === 'LIVE' 
                            ? 'bg-green-500 text-white animate-pulse' 
                            : 'bg-red-500 text-white'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="bg-gradient-to-r from-qld-maroon/20 to-qld-gold/20 rounded-lg p-4 mb-3">
          <p className="text-sm font-bold mb-1">Data Updated Weekly</p>
          <p className="text-xs text-gray-300">
            All data sourced directly from Queensland Government
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/transparency/methodology"
            className="flex-1 text-center py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition"
          >
            Methodology
          </Link>
          <Link
            href="/downloads"
            className="flex-1 text-center py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs transition"
          >
            Download Data
          </Link>
        </div>
      </div>
    </aside>
  )
}