"use client"

import { cn } from "@/lib/utils"
import { Clock, Users, Calendar, Play, CheckCircle } from "lucide-react"
import { CategoryBadge } from "./category-badge"
import type { Auction } from "@/lib/mock-data"
import { formatDate } from "@/lib/mock-data"

interface AuctionCardProps {
  auction: Auction
  variant?: 'default' | 'compact' | 'featured'
  onClick?: () => void
}

export function AuctionCard({ auction, variant = 'default', onClick }: AuctionCardProps) {
  const statusConfig = {
    live: {
      label: 'EN VIVO',
      bg: 'bg-red-500',
      text: 'text-white',
      icon: Play,
      pulse: true
    },
    upcoming: {
      label: 'PROXIMA',
      bg: 'bg-primary',
      text: 'text-primary-foreground',
      icon: Calendar,
      pulse: false
    },
    ended: {
      label: 'FINALIZADA',
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      icon: CheckCircle,
      pulse: false
    }
  }
  
  const status = statusConfig[auction.status]
  const StatusIcon = status.icon
  
  if (variant === 'compact') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-all w-full text-left"
      >
        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <StatusIcon className="w-6 h-6 text-primary/50" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-foreground">{auction.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{auction.itemCount} articulos</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1",
              status.bg, status.text
            )}>
              {status.pulse && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
              {status.label}
            </span>
            <CategoryBadge category={auction.category} size="sm" showLabel={false} />
          </div>
        </div>
      </button>
    )
  }
  
  if (variant === 'featured') {
    return (
      <button
        onClick={onClick}
        className="relative w-full h-[200px] rounded-2xl overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        
        {/* Status Badge */}
        <div className={cn(
          "absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
          status.bg, status.text
        )}>
          {status.pulse && <span className="w-2 h-2 bg-current rounded-full animate-pulse" />}
          <StatusIcon className="w-3.5 h-3.5" />
          {status.label}
        </div>
        
        <CategoryBadge 
          category={auction.category} 
          size="sm" 
          className="absolute top-3 right-3" 
        />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-bold text-lg leading-tight text-balance">{auction.title}</h3>
          <p className="text-sm text-white/70 mt-1 line-clamp-1">{auction.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(auction.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {auction.itemCount} piezas
            </span>
          </div>
        </div>
      </button>
    )
  }
  
  // Default variant
  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all text-left"
    >
      {/* Thumbnail */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-muted">
        <div className={cn(
          "absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
          status.bg, status.text
        )}>
          {status.pulse && <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />}
          {status.label}
        </div>
        <CategoryBadge 
          category={auction.category} 
          size="sm" 
          className="absolute top-2 right-2" 
        />
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">{auction.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{auction.description}</p>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(auction.startDate)}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {auction.itemCount} piezas
          </span>
        </div>
      </div>
    </button>
  )
}
