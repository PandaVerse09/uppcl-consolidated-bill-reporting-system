export function dateOnly(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
export const titleCase = (value = '') => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
export const personName = (person) => person?.name || person?.email || '-'

export function submissionRow(item) {
  return {
    ...item,
    date: dateOnly(item.date),
    amount: item.totalAmount,
    uploadedByName: personName(item.uploadedBy),
    reviewedByName: personName(item.reviewedBy),
    rejectionReason: item.status === 'rejected' ? item.reviewComment || '-' : '-',
    statusLabel: titleCase(item.status),
  }
}

export function reportRows(reports) {
  return reports.flatMap((report) => report.divisions.map((division) => ({
    id: `${dateOnly(report.date)}:${division.division}`,
    reportId: report.id,
    date: dateOnly(report.date),
    division: division.division,
    bankId: division.bankAmount,
    gateway: division.gatewayAmount,
    billing: division.billingAmount,
    total: division.total,
    status: 'Published',
  })))
}
