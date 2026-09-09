import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Select = forwardRef(function Select({ label, error, children, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={cn('input', error && 'input-error', className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Select
