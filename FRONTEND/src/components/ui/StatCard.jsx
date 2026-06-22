import clsx from 'clsx'
import { Card } from './Card'

export function StatCard({ label, value, icon: Icon, tone = 'primary', sub }) {
  const toneClasses = {
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    danger: 'bg-danger-50 text-danger-700',
    neutral: 'bg-gray-100 text-gray-700',
  }

  return (
    <Card className="flex items-center gap-4 px-5 py-4">
      <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-md', toneClasses[tone])}>
        {Icon && <Icon size={20} />}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}
