import { cn } from '@/lib/utils'

export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div className={cn('flex gap-1 p-1 bg-gray-100 rounded-xl', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-150 text-center',
            active === tab.id
              ? 'bg-white text-brand-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span className={cn(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
              active === tab.id ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
