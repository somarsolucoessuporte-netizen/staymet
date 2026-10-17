import { BrandMark } from '@/components/ui/BrandMark'
import { cn } from '@/lib/utils'

/** Logomarca oficial no topo das telas de auth */
export function AuthBrand({ className }: { className?: string }) {
  return <BrandMark width={200} className={cn('mb-7', className)} />
}
