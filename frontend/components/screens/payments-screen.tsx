"use client"

import { MobileScreen } from "@/components/mobile-frame"
import { PaymentMethodCard } from "@/components/payment-method-card"
import { paymentMethods } from "@/lib/mock-data"
import { ArrowLeft, Plus, CreditCard, Building2, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentsScreenProps {
  onBack: () => void
}

export function PaymentsScreen({ onBack }: PaymentsScreenProps) {
  const addOptions = [
    { icon: CreditCard, label: 'Tarjeta de Credito', description: 'Visa, Mastercard, Amex' },
    { icon: Building2, label: 'Cuenta Bancaria', description: 'Transferencia directa' },
    { icon: FileCheck, label: 'Cheque Certificado', description: 'Para montos elevados' },
  ]
  
  return (
    <MobileScreen safeAreaTop={false} safeAreaBottom={false}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <div className="px-4 pt-14 pb-4 bg-background border-b border-border">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-bold text-lg text-foreground">Medios de Pago</h1>
              <p className="text-xs text-muted-foreground">{paymentMethods.length} metodos registrados</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto px-4 py-4">
          {/* Registered Methods */}
          <div className="space-y-4 mb-6">
            {paymentMethods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
          </div>
          
          {/* Add New Section */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-foreground mb-4">Agregar nuevo metodo</h3>
            <div className="space-y-3">
              {addOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.label}
                    className="w-full flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Info Box */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <h4 className="font-semibold text-foreground text-sm mb-2">Informacion importante</h4>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                Debes tener al menos un medio de pago verificado para participar en subastas.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                Los cheques certificados solo estan disponibles para usuarios categoria Oro y Platino.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                La verificacion de cuentas bancarias puede demorar hasta 48 horas.
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-background">
          <Button className="w-full h-12 text-base font-semibold gap-2">
            <Plus className="w-5 h-5" />
            Agregar Metodo de Pago
          </Button>
        </div>
      </div>
    </MobileScreen>
  )
}
