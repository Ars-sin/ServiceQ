import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ label, value, sub, trend, icon: Icon, color = 'brand', className }) {
  const colors = {
    brand:   'bg-brand-50   text-brand-600',
    success: 'bg-green-50   text-green-600',
    warning: 'bg-amber-50   text-amber-600',
    danger:  'bg-red-50     text-red-600',
    info:    'bg-blue-50    text-blue-600',
    neutral: 'bg-gray-50    text-gray-600',
  }

  return (
    <div className={cn('card flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
            <Icon size={20} />
          </div>
        )}
        {trend != null && (
          <div className={cn('flex items-center gap-1 text-xs font-semibold', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
