import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getRoleName(role: string): string {
  const roles: Record<string, string> = {
    PROPRIETARIO: 'Proprietário',
    GESTOR: 'Gestor',
    ANFITRIAO: 'Anfitrião',
    HOSPEDE: 'Hóspede',
    PRESTADOR: 'Prestador',
  }
  return roles[role] ?? role
}

export function getRoleDashboard(role: string): string {
  const dashboards: Record<string, string> = {
    ADMINISTRADOR: '/pt-BR/admin/dashboard',
    PROPRIETARIO: '/pt-BR/proprietario/dashboard',
    GESTOR: '/pt-BR/gestor/dashboard',
    ANFITRIAO: '/pt-BR/anfitriao/dashboard',
    HOSPEDE: '/pt-BR/hospede/boas-vindas',
    PRESTADOR: '/pt-BR/prestador/tarefas',
  }
  return dashboards[role] ?? '/pt-BR/gestor/dashboard'
}
