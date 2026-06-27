import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

interface PremiumCardProps {
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  subtitle?: string
  href?: string
  onClick?: () => void
  badge?: string
  badgeColor?: string
  rightElement?: ReactNode
  className?: string
}

export function PremiumCard({
  icon: Icon, iconColor, iconBg, title, subtitle,
  href, onClick, badge, badgeColor = 'bg-blue-50 text-blue-600',
  rightElement, className = '',
}: PremiumCardProps) {
  const content = (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0`}
        style={{ background: iconBg }}
      >
        <Icon size={20} strokeWidth={1.5} color={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-400 text-xs mt-0.5 truncate">{subtitle}</p>}
      </div>
      {rightElement}
    </div>
  )

  if (href) return <Link href={href}>{content}</Link>
  if (onClick) return <button onClick={onClick} className="w-full text-left">{content}</button>
  return content
}
