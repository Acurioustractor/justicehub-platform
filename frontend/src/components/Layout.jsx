import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, MapPin, Info, Menu, X, Download, BarChart3, DollarSign, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Home', href: '/', icon: MapPin },
    { name: 'Search Services', href: '/search', icon: Search },
    { name: 'Budget Intelligence', href: '/budget', icon: TrendingUp },
    { name: 'Spending Analysis', href: '/spending', icon: DollarSign },
    { name: 'Data Downloads', href: '/data', icon: Download },
    { name: 'About', href: '/about', icon: Info },
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center min-w-0 flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate">
                    Youth Justice Service Finder
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Australia</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2 lg:space-x-4 xl:space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`desktop-nav-item ${
                      isActive(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:inline xl:inline">{item.name}</span>
                    <span className="lg:hidden xl:hidden text-xs">{item.name.split(' ')[0]}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className="touch-target text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`mobile-nav-item ${
                        isActive(item.href)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto container-mobile section-mobile">
          <div className="grid-mobile-auto">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Youth Justice Service Finder</h3>
              </div>
              <p className="text-mobile-sm text-gray-600">
                Connecting young people with essential support services across Australia.
                Find legal aid, mental health support, housing assistance, and more.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-3 sm:space-y-2 text-mobile-sm text-gray-600">
                <li><Link to="/search" className="hover:text-gray-900 touch-target">Search Services</Link></li>
                <li><Link to="/spending" className="hover:text-gray-900 touch-target">Spending Analysis</Link></li>
                <li><Link to="/data" className="hover:text-gray-900 touch-target">Data Downloads</Link></li>
                <li><Link to="/about" className="hover:text-gray-900 touch-target">About</Link></li>
                <li><a href="https://youth-justice-service-finder-production.up.railway.app/docs" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 touch-target">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Emergency Contacts</h4>
              <ul className="space-y-3 sm:space-y-2 text-mobile-sm text-gray-600">
                <li><strong>Emergency:</strong> <a href="tel:000" className="hover:text-gray-900">000</a></li>
                <li><strong>Kids Helpline:</strong> <a href="tel:1800551800" className="hover:text-gray-900">1800 55 1800</a></li>
                <li><strong>Lifeline:</strong> <a href="tel:131114" className="hover:text-gray-900">13 11 14</a></li>
                <li><strong>Legal Aid Australia:</strong> <a href="tel:1300651188" className="hover:text-gray-900">1300 651 188</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-6 mobile-center text-mobile-sm text-gray-500">
            <p>© 2025 Youth Justice Service Finder. Built for Australia's youth justice ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}