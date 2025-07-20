'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import EnhancedSidebar from './EnhancedSidebar'
import { legacyRouteMap } from '@/lib/navigation'
import { Menu, Bell, Download, Search } from 'lucide-react'
import Link from 'next/link'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Handle legacy route redirects
  useEffect(() => {
    if (legacyRouteMap[pathname]) {
      router.replace(legacyRouteMap[pathname])
    }
  }, [pathname, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-qld-maroon to-qld-gold rounded-lg flex items-center justify-center font-bold text-white text-sm">
              QYJ
            </div>
            <span className="font-bold text-gray-900">Youth Justice Tracker</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/alerts"
              className="p-2 hover:bg-gray-100 rounded-lg transition relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 h-full overflow-hidden">
          <div className="h-full overflow-y-auto">
            <EnhancedSidebar />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative w-80 h-full overflow-hidden animate-slide-in-left">
              <div className="h-full overflow-y-auto">
                <EnhancedSidebar onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Top Bar */}
          <div className="hidden lg:block bg-white border-b sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search data, stories, or actions..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qld-maroon focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/downloads"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Data</span>
                </Link>
                <Link
                  href="/alerts"
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-sm font-medium">3 New Alerts</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}