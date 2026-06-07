"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Gavel, AlertCircle } from "lucide-react"
import { formatCurrency, calculateMinBid, calculateMaxBid } from "@/lib/mock-data"

interface BidInputProps {
  currentBid: number
  basePrice: number
  currency?: string
  onSubmitBid?: (amount: number) => void
  disabled?: boolean
}

export function BidInput({ 
  currentBid, 
  basePrice, 
  currency = 'USD',
  onSubmitBid,
  disabled = false
}: BidInputProps) {
  const minBid = calculateMinBid(currentBid, basePrice)
  const maxBid = calculateMaxBid(currentBid, basePrice)
  
  const [bidAmount, setBidAmount] = useState(minBid)
  const [error, setError] = useState<string | null>(null)
  
  const incrementStep = Math.ceil((maxBid - minBid) / 10)
  
  const handleIncrement = () => {
    const newAmount = Math.min(bidAmount + incrementStep, maxBid)
    setBidAmount(newAmount)
    setError(null)
  }
  
  const handleDecrement = () => {
    const newAmount = Math.max(bidAmount - incrementStep, minBid)
    setBidAmount(newAmount)
    setError(null)
  }
  
  const handleSubmit = () => {
    if (bidAmount < minBid) {
      setError(`La puja minima es ${formatCurrency(minBid, currency)}`)
      return
    }
    if (bidAmount > maxBid) {
      setError(`La puja maxima es ${formatCurrency(maxBid, currency)}`)
      return
    }
    onSubmitBid?.(bidAmount)
  }
  
  const presetAmounts = [
    minBid,
    Math.ceil(minBid + (maxBid - minBid) * 0.33),
    Math.ceil(minBid + (maxBid - minBid) * 0.66),
    maxBid
  ]
  
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">Rango permitido:</span>
        <span className="text-xs font-mono text-muted-foreground">
          {formatCurrency(minBid, currency)} - {formatCurrency(maxBid, currency)}
        </span>
      </div>
      
      {/* Amount Selector */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={handleDecrement}
          disabled={disabled || bidAmount <= minBid}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
            bidAmount <= minBid 
              ? "bg-muted text-muted-foreground border-border" 
              : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
          )}
        >
          <Minus className="w-5 h-5" />
        </button>
        
        <div className="flex-1 text-center">
          <div className="font-mono text-3xl font-bold text-foreground">
            {formatCurrency(bidAmount, currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +{((bidAmount - currentBid) / currentBid * 100).toFixed(1)}% sobre oferta actual
          </p>
        </div>
        
        <button
          onClick={handleIncrement}
          disabled={disabled || bidAmount >= maxBid}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors",
            bidAmount >= maxBid 
              ? "bg-muted text-muted-foreground border-border" 
              : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {presetAmounts.map((amount, index) => (
          <button
            key={index}
            onClick={() => {
              setBidAmount(amount)
              setError(null)
            }}
            disabled={disabled}
            className={cn(
              "py-2 px-1 rounded-lg text-xs font-semibold transition-colors",
              bidAmount === amount
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {index === 0 ? 'Min' : index === 3 ? 'Max' : formatCurrency(amount, currency).replace('USD', '').trim()}
          </button>
        ))}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-xs text-destructive">{error}</span>
        </div>
      )}
      
      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full h-14 text-lg font-bold gap-2"
        size="lg"
      >
        <Gavel className="w-5 h-5" />
        Pujar {formatCurrency(bidAmount, currency)}
      </Button>
      
      <p className="text-[10px] text-center text-muted-foreground mt-2">
        Al pujar, aceptas los terminos y condiciones de SubastApp
      </p>
    </div>
  )
}
