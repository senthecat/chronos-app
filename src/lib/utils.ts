import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const CATEGORY_COLORS: Record<string, string> = {
  work: '#6366f1',
  personal: '#10b981',
  health: '#f59e0b',
  focus: '#8b5cf6',
  social: '#ec4899',
}
