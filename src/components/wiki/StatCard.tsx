import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  value: string
  label: string
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'yellow' | 'gray'
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

const colorStyles = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    value: 'text-blue-600',
    label: 'text-blue-900',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    value: 'text-green-600',
    label: 'text-green-900',
    trend: 'text-green-600',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    value: 'text-red-600',
    label: 'text-red-900',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    value: 'text-purple-600',
    label: 'text-purple-900',
    trend: 'text-purple-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    value: 'text-orange-600',
    label: 'text-orange-900',
    trend: 'text-orange-600',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    value: 'text-yellow-600',
    label: 'text-yellow-900',
    trend: 'text-yellow-600',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    value: 'text-gray-600',
    label: 'text-gray-900',
    trend: 'text-gray-600',
  },
}

const sizeStyles = {
  sm: {
    container: 'p-4',
    value: 'text-2xl',
    label: 'text-xs',
    icon: 'w-4 h-4',
  },
  md: {
    container: 'p-6',
    value: 'text-3xl',
    label: 'text-sm',
    icon: 'w-5 h-5',
  },
  lg: {
    container: 'p-8',
    value: 'text-4xl',
    label: 'text-base',
    icon: 'w-6 h-6',
  },
}

export function StatCard({
  value,
  label,
  color = 'blue',
  trend,
  trendLabel,
  size = 'md',
}: StatCardProps) {
  const colors = colorStyles[color]
  const sizes = sizeStyles[size]

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div
      className={`${colors.bg} ${sizes.container} rounded-lg border-2 ${colors.border} transition-all hover:shadow-md`}
    >
      <div className={`${sizes.value} font-bold ${colors.value} mb-2`}>
        {value}
      </div>
      <div className={`${sizes.label} ${colors.label} font-medium`}>
        {label}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 ${colors.trend} ${sizes.label}`}>
          <TrendIcon className={sizes.icon} />
          {trendLabel && <span>{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
