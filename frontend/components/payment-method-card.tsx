"use client"

import { cn } from "@/lib/utils"
import { CreditCard, Building2, FileCheck, CheckCircle, AlertCircle, MoreVertical } from "lucide-react"
import type { PaymentMethod } from "@/lib/mock-data"

interface PaymentMethodCardProps {
  method: PaymentMethod
  onEdit?: () => void
  onDelete?: () => void
}

export function PaymentMethodCard({ method, onEdit, onDelete }: PaymentMethodCardProps) {
  const typeConfig = {
    credit_card: {
      icon: CreditCard,
      label: 'Tarjeta de Credito',
      gradient: 'from-blue-600 to-blue-800'
    },
    bank_account: {
      icon: Building2,
      label: 'Cuenta Bancaria',
      gradient: 'from-emerald-600 to-emerald-800'
    },
    certified_check: {
      icon: FileCheck,
      label: 'Cheque Certificado',
      gradient: 'from-amber-600 to-amber-800'
    }
  }
  
  const config = typeConfig[method.type]
  const Icon = config.icon
  
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Card Visual */}
      <div className={cn(
        "relative h-[120px] p-4 bg-gradient-to-br text-white",
        config.gradient
      )}>
        {/* Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <circle cx="80" cy="20" r="40" fill="white" />
            <circle cx="90" cy="80" r="30" fill="white" />
          </svg>
        </div>
        
        <div className="relative flex justify-between items-start">
          <Icon className="w-8 h-8 opacity-80" />
          <button className="p-1 hover:bg-white/20 rounded transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-mono text-lg tracking-wider">
            {method.type === 'credit_card' ? `•••• •••• •••• ${method.lastFour}` : `•••• ${method.lastFour}`}
          </p>
          <p className="text-sm opacity-80 mt-1">{method.name}</p>
        </div>
      </div>
      
      {/* Details */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{config.label}</p>
            {method.bank && (
              <p className="text-xs text-muted-foreground">{method.bank}</p>
            )}
            {method.expiryDate && (
              <p className="text-xs text-muted-foreground">Vence: {method.expiryDate}</p>
            )}
          </div>
          
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            method.verified 
              ? "bg-green-500/10 text-green-600"
              : "bg-amber-500/10 text-amber-600"
          )}>
            {method.verified ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Verificado
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Pendiente
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
