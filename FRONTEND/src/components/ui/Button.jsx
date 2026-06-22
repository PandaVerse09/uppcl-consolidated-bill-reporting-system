import clsx from 'clsx'

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-300',
  secondary: 'bg-white text-gray-700 border border-surface-border hover:bg-surface-muted focus-visible:ring-gray-200',
  success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-100',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus-visible:ring-danger-100',
  ghost: 'bg-transparent text-gray-600 hover:bg-surface-muted',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
