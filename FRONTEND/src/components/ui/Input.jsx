import clsx from 'clsx'

export function Label({ className, children, ...props }) {
  return (
    <label className={clsx('mb-1.5 block text-xs font-medium text-gray-600', className)} {...props}>
      {children}
    </label>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-gray-800',
        'placeholder:text-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full rounded-md border border-surface-border bg-white px-3 py-2 text-sm text-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
