import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  fullPage?: boolean
}

export function LoadingSpinner({ className, size = 'md', fullPage }: LoadingSpinnerProps) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50">
        <LoadingSpinner size={size} />
      </div>
    )
  }

  return (
    <svg
      className={cn('animate-spin text-accent', sizeMap[size], className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
