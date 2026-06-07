import { cn } from "@/lib/utils"
import { Crown, Star, Award, Shield, Circle } from "lucide-react"
import type { UserCategory } from "@/lib/mock-data"

interface CategoryBadgeProps {
  category: UserCategory
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const categoryStyles: Record<UserCategory, { 
  label: string
  bg: string
  text: string
  border: string
  icon: typeof Crown
}> = {
  comun: {
    label: 'Comun',
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    icon: Circle
  },
  especial: {
    label: 'Especial',
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    icon: Star
  },
  plata: {
    label: 'Plata',
    bg: 'bg-gradient-to-r from-slate-200 to-slate-300',
    text: 'text-slate-700',
    border: 'border-slate-300',
    icon: Shield
  },
  oro: {
    label: 'Oro',
    bg: 'bg-gradient-to-r from-amber-200 to-yellow-300',
    text: 'text-amber-800',
    border: 'border-amber-300',
    icon: Award
  },
  platino: {
    label: 'Platino',
    bg: 'bg-gradient-to-r from-slate-100 via-white to-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200 shadow-sm',
    icon: Crown
  }
}

const sizeStyles = {
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-[10px]',
    icon: 'w-3 h-3',
    gap: 'gap-1'
  },
  md: {
    padding: 'px-3 py-1',
    text: 'text-xs',
    icon: 'w-3.5 h-3.5',
    gap: 'gap-1.5'
  },
  lg: {
    padding: 'px-4 py-1.5',
    text: 'text-sm',
    icon: 'w-4 h-4',
    gap: 'gap-2'
  }
}

export function CategoryBadge({ 
  category, 
  size = 'md', 
  showLabel = true,
  className 
}: CategoryBadgeProps) {
  const style = categoryStyles[category]
  const sizeStyle = sizeStyles[size]
  const Icon = style.icon
  
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        style.bg,
        style.text,
        style.border,
        sizeStyle.padding,
        sizeStyle.text,
        sizeStyle.gap,
        className
      )}
    >
      <Icon className={sizeStyle.icon} />
      {showLabel && style.label}
    </span>
  )
}
