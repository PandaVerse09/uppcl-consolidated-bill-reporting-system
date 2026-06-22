import clsx from 'clsx'

const VARIANTS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-success-50 text-success-700 border-green-200',
  Published: 'bg-success-50 text-success-700 border-green-200',
  Rejected: 'bg-danger-50 text-danger-700 border-red-200',
  Superseded: 'bg-gray-50 text-gray-500 border-gray-200',
  Draft: 'bg-gray-50 text-gray-600 border-gray-200',
  Active: 'bg-success-50 text-success-700 border-green-200',
  Inactive: 'bg-gray-50 text-gray-500 border-gray-200',
}

export function Badge({ status, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANTS[status] || 'bg-gray-50 text-gray-600 border-gray-200',
        className
      )}
    >
      {status}
    </span>
  )
}
