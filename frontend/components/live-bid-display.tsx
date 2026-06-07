"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, User, Clock } from "lucide-react"
import { formatCurrency } from "@/lib/mock-data"
import type { Bid } from "@/lib/mock-data"

interface LiveBidDisplayProps {
  currentBid: number
  basePrice: number
  currency?: string
  leadingUser?: string
  isUserLeading?: boolean
  bids?: Bid[]
  timeRemaining?: number
}

export function LiveBidDisplay({ 
  currentBid, 
  basePrice,
  currency = 'USD',
  leadingUser,
  isUserLeading = false,
  bids = [],
  timeRemaining
}: LiveBidDisplayProps) {
  const [displayBid, setDisplayBid] = useState(currentBid)
  const [isAnimating, setIsAnimating] = useState(false)
  
  useEffect(() => {
    if (currentBid !== displayBid) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setDisplayBid(currentBid)
        setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentBid, displayBid])
  
  const percentageIncrease = ((currentBid - basePrice) / basePrice * 100).toFixed(0)
  
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Main Bid Display */}
      <div className={cn(
        "p-6 text-center transition-colors",
        isUserLeading ? "bg-green-500/10" : "bg-card"
      )}>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
          Oferta Actual
        </p>
        <div className={cn(
          "font-mono text-4xl font-bold transition-all",
          isAnimating && "scale-105",
          isUserLeading ? "text-green-600" : "text-foreground"
        )}>
          {formatCurrency(displayBid, currency)}
        </div>
        
        <div className="flex items-center justify-center gap-3 mt-3">
          <span className="flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            +{percentageIncrease}%
          </span>
          {leadingUser && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {leadingUser}
            </span>
          )}
        </div>
        
        {isUserLeading && (
          <div className="mt-3 px-3 py-1.5 bg-green-500 text-white text-sm font-semibold rounded-full inline-flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Vas ganando
          </div>
        )}
      </div>
      
      {/* Timer */}
      {timeRemaining !== undefined && (
        <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-warning" />
          <span className="font-mono text-sm font-semibold text-warning">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">restantes</span>
        </div>
      )}
      
      {/* Recent Bids */}
      {bids.length > 0 && (
        <div className="border-t border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ultimas Pujas
            </p>
          </div>
          <div className="max-h-[160px] overflow-auto">
            {bids.slice(0, 5).map((bid, index) => (
              <div 
                key={bid.id}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0",
                  index === 0 && "bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {bid.userName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{bid.userName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(bid.timestamp).toLocaleTimeString('es-AR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={cn(
                  "font-mono font-semibold",
                  index === 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {formatCurrency(bid.amount, 'USD')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
