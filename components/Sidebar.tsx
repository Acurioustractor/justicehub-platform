'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Public Dashboard', href: '/public-dashboard' },
  { name: 'Accountability Dashboard', href: '/accountability-dashboard' },
  { name: 'Data Visualization', href: '/visualization' },
  { name: 'Real-Time Alerts', href: '/alerts' },
  { name: 'Data Sources', href: '/data-sources' },
  { name: 'Monitoring', href: '/monitoring' },
  { name: 'Debug Data', href: '/debug-data' },
  { name: 'Raw Data Download', href: '/raw-data' },
  { name: 'Data Explorer', href: '/data-explorer' },
  { name: 'Live Demo', href: '/live-demo' },
  { name: 'Visualizations', href: '/visualizations' },
  { name: 'Spending Analysis', href: '/spending' },
  { name: 'Youth Statistics', href: '/youth-statistics' },
  { name: 'Transparency Hub', href: '/transparency' },
  { name: 'Reports & Analysis', href: '/reports' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center justify-center h-16 bg-gray-900 text-white">
        <span className="font-bold text-lg">Qld Youth Justice</span>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 bg-gray-800">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                pathname === item.href
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
