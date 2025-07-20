'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, BarChart3, Share2, Download } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileWrapperProps {
  children: React.ReactNode
}

export default function MobileWrapper({ children }: MobileWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Take Action', href: '/action', icon: Share2 },
    { name: 'Downloads', href: '/action?tab=download', icon: Download }
  ]

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-gray-900">
            QLD Youth Justice
          </Link>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 z-50 w-80 max-w-full bg-white shadow-xl"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                            isActive 
                              ? 'bg-qld-maroon text-white' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                
                {/* Quick Stats in Menu */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Quick Facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kids detained:</span>
                      <span className="font-bold">338</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Indigenous:</span>
                      <span className="font-bold">73.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily waste:</span>
                      <span className="font-bold">$1.2M</span>
                    </div>
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content with padding for mobile header */}
      <main className="lg:pt-0 pt-16">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition ${
                  isActive 
                    ? 'text-qld-maroon bg-qld-maroon/10' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}