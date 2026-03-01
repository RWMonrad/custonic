import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-green-600 bg-green-100'
    case 'expired':
      return 'text-red-600 bg-red-100'
    case 'terminated':
      return 'text-gray-600 bg-gray-100'
    case 'draft':
      return 'text-yellow-600 bg-yellow-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function calculateDaysRemaining(endDate: string | Date): number {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isContractExpiring(endDate: string | Date, daysThreshold = 30): boolean {
  const daysRemaining = calculateDaysRemaining(endDate)
  return daysRemaining > 0 && daysRemaining <= daysThreshold
}
