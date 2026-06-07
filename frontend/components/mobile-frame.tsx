"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MobileFrameProps {
  children: ReactNode
  className?: string
  showNotch?: boolean
}

export function MobileFrame({ children, className, showNotch = true }: MobileFrameProps) {
  return (
    <div className={cn("flex items-center justify-center min-h-screen bg-muted p-4", className)}>
      <div className="relative w-[390px] h-[844px] bg-background rounded-[55px] shadow-2xl overflow-hidden border-[12px] border-foreground/90">
        {/* Dynamic Island / Notch */}
        {showNotch && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-foreground rounded-full z-50 flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-foreground/50" />
          </div>
        )}
        
        {/* Screen Content */}
        <div className="h-full w-full overflow-hidden bg-background">
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-foreground/30 rounded-full" />
      </div>
    </div>
  )
}

interface MobileScreenProps {
  children: ReactNode
  className?: string
  safeAreaTop?: boolean
  safeAreaBottom?: boolean
}

export function MobileScreen({ 
  children, 
  className, 
  safeAreaTop = true, 
  safeAreaBottom = true 
}: MobileScreenProps) {
  return (
    <div 
      className={cn(
        "h-full w-full flex flex-col overflow-auto",
        safeAreaTop && "pt-[60px]",
        safeAreaBottom && "pb-[90px]",
        className
      )}
    >
      {children}
    </div>
  )
}
