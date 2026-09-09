import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="label">{label}</label>}
      <input
        ref={ref}
        className={cn('input', error && 'input-error', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

export default Input
