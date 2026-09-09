import { cn } from '@/lib/utils'

const variants = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100   text-red-700',
  info:    'bg-blue-100  text-blue-700',
  neutral: 'bg-gray-100  text-gray-600',
  brand:   'bg-brand-100 text-brand-700',
}

export default function Badge({ children, variant = 'neutral', className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
