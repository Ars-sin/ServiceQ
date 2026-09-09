import { cn } from '@/lib/utils'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary:   'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm',
    secondary: 'bg-white text-brand-600 border border-brand-200 hover:bg-brand-50 focus:ring-brand-400',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:     'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    success:   'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
