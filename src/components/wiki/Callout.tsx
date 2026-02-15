import { ReactNode } from 'react'
import { Info, CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react'

type CalloutType = 'info' | 'success' | 'warning' | 'error' | 'tip'

const calloutStyles = {
  info: {
    container: 'bg-blue-50 border-l-4 border-blue-500',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    Icon: Info,
  },
  success: {
    container: 'bg-green-50 border-l-4 border-green-500',
    icon: 'text-green-600',
    title: 'text-green-900',
    Icon: CheckCircle,
  },
  warning: {
    container: 'bg-yellow-50 border-l-4 border-yellow-500',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    Icon: AlertTriangle,
  },
  error: {
    container: 'bg-red-50 border-l-4 border-red-500',
    icon: 'text-red-600',
    title: 'text-red-900',
    Icon: XCircle,
  },
  tip: {
    container: 'bg-purple-50 border-l-4 border-purple-500',
    icon: 'text-purple-600',
    title: 'text-purple-900',
    Icon: Lightbulb,
  },
}

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: ReactNode
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const style = calloutStyles[type]
  const Icon = style.Icon

  return (
    <div className={`my-6 p-4 rounded-r-lg ${style.container}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
        <div className="flex-1">
          {title && (
            <div className={`font-bold mb-2 ${style.title}`}>{title}</div>
          )}
          <div className="text-gray-700 text-sm leading-relaxed [&>p]:mb-0 [&>ul]:mb-0 [&>ol]:mb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
