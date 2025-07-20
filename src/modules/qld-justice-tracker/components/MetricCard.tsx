interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  variant?: 'primary' | 'danger' | 'success' | 'warning'
}

export default function MetricCard({ title, value, subtitle, variant = 'primary' }: MetricCardProps) {
  const variantClasses = {
    primary: 'bg-blue-50 border-blue-200 text-blue-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  }

  const valueClasses = {
    primary: 'text-blue-600',
    danger: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${variantClasses[variant]}`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className={`text-3xl font-bold mb-1 ${valueClasses[variant]}`}>{value}</div>
      <p className="text-sm opacity-75">{subtitle}</p>
    </div>
  )
}